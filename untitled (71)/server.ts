import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client with instructions from gemini-api skill
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === 'MY_GEMINI_API_KEY') {
      console.warn('Warning: GEMINI_API_KEY is not defined or is placeholder. Falling back to static values.');
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Poetic fallbacks for Islamic Wisdom in Simplified Chinese
const fallbackQuotes = [
  {
    content: "寻求知识是每一个男女穆斯林的天职。",
    source: "先知穆罕默德 (愿主福安之) 圣训",
    pinyin: "Xúnqiú zhīshì shì měi yīgè nánnǚ Mùsīlín de tiānzhí."
  },
  {
    content: "最优秀的信士是那些品德最高尚的人。",
    source: "圣训录",
    pinyin: "Zuì yōuxiù de xìnshì shì nàxiē pǐndé zuì gāoshàng de rén."
  },
  {
    content: "大地是清净安宁的殿堂，自然是至真者展现迹象的画卷。",
    source: "古典哲学随笔",
    pinyin: "Dàdì shì qīngjìng ānníng de diàntáng, zìrán shì zhìzhēnzhě zhǎnjiàn jìxiàng de huàjuàn."
  },
  {
    content: "知识如同迷失的驼群，无论它在哪里被发现，行者皆当引为己有。",
    source: "贤哲格言录",
    pinyin: "Zhīshì rútóng míshī de tuóqún, wúlùn tā zài nǎlǐ bèi fāxiàn, xíngzhě jiē dāng yǐn wéi jǐyǒu."
  }
];

import { AdminStore, AdminUser } from './server/adminStore';

// --- API ENDPOINTS ---

// Secure Rate Limiter for all administrative actions
app.use('/api/cms', (req: Request, res: Response, next) => {
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  if (!AdminStore.checkRateLimit(ip)) {
    return res.status(429).json({ error: '请求过于频繁。为防爆破，系统已临时封锁您的IP 3分钟，请稍后再试。' });
  }
  next();
});

// Helper for JWT/Bearer session validation
async function getAuthenticatedUser(req: Request): Promise<AdminUser | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  return await AdminStore.verifySession(token);
}

// Helper: escape inputs to thwart malicious scripts (XSS protection)
function sanitize(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// 1. Health check routing
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// CMS Admins Login Endpoint
app.post('/api/cms/login', async (req: Request, res: Response) => {
  const { username, password, rememberMe } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }

  const cleanUsername = sanitize(username.trim());
  console.log(`[CMS Login API] Login request received for user: "${cleanUsername}"`);
  
  let user;
  try {
    user = await AdminStore.getUserByUsername(cleanUsername);
  } catch (err: any) {
    console.error(`[CMS Login API] Failed to fetch user by username from AdminStore:`, err);
    return res.status(500).json({ error: '系统内部数据库连接错误' });
  }

  if (!user) {
    console.log(`[CMS Login API] User "${cleanUsername}" was NOT found in the database.`);
    AdminStore.writeLog('guest', cleanUsername, 'unknown', 'LOGIN_FAILED', `Attempted login under unknown user: '${cleanUsername}'`);
    return res.status(401).json({ error: '密码错误或该管理员账户不存在' });
  }

  console.log(`[CMS Login API] Found user: "${user.username}" with role: "${user.role}" and status: "${user.status}".`);

  if (user.status !== 'active') {
    AdminStore.writeLog(user.id, user.username, user.email, 'LOGIN_SUSPENDED', `Attempted login on suspended admin account`);
    return res.status(403).json({ error: '该管理员账号已被暂停使用，请联系超级管理员。' });
  }

  // Check bcrypt hash safely across ESM/CJS packaging formats
  let match = false;
  try {
    const bcryptModule = await import('bcryptjs');
    const bcrypt = bcryptModule.default || bcryptModule;
    match = bcrypt.compareSync(password, user.password_hash);
  } catch (err: any) {
    console.error(`[CMS Login API] Bcrypt comparison error:`, err);
    return res.status(500).json({ error: '系统内部密码模块校验故障' });
  }

  if (!match) {
    console.log(`[CMS Login API] Password check FAILED for user: "${cleanUsername}"`);
    AdminStore.writeLog(user.id, user.username, user.email, 'LOGIN_FAILED', `Failed login credentials check`);
    return res.status(401).json({ error: '密码错误或该管理员账户不存在' });
  }

  console.log(`[CMS Login API] Password check passed. Creating token session...`);

  // Create session
  const token = AdminStore.createSession(user.id, !!rememberMe);
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const ua = req.headers['user-agent'] || 'unknown';

  AdminStore.writeLog(user.id, user.username, user.email, 'LOGIN_SUCCESS', `Successfully logged in via Username & Password`, ip, ua);

  // Return session details (password_hash is strictly sealed)
  const userProfile = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    status: user.status,
    permissions: user.permissions,
    created_at: user.created_at,
    updated_at: user.updated_at
  };

  res.json({ token, profile: userProfile });
});

// Fetch Active Session Profile
app.get('/api/cms/session', async (req: Request, res: Response) => {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: '会话已过期，请重新登录' });
  }

  res.json({
    profile: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      permissions: user.permissions,
      created_at: user.created_at,
      updated_at: user.updated_at
    }
  });
});

// Perform Session Logout
app.post('/api/cms/logout', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const user = await AdminStore.verifySession(token);
    if (user) {
      AdminStore.writeLog(user.id, user.username, user.email, 'LOGOUT_SUCCESS', 'Successfully logged out and destroyed credentials session');
    }
    AdminStore.destroySession(token);
  }
  res.json({ success: true });
});

// Admin list management (Requires Super Admin or Admin role)
app.get('/api/cms/users', async (req: Request, res: Response) => {
  const operator = await getAuthenticatedUser(req);
  if (!operator) return res.status(401).json({ error: 'Unauthorized credentials' });
  if (operator.role !== 'super_admin' && operator.role !== 'admin') {
    return res.status(403).json({ error: '无权查看书院成员名册' });
  }

  const rawUsers = await AdminStore.getUsers();
  const users = rawUsers.map(u => ({
    id: u.id,
    username: u.username,
    email: u.email,
    role: u.role,
    status: u.status,
    permissions: u.permissions,
    created_at: u.created_at,
    updated_at: u.updated_at
  }));

  res.json({ users });
});

// Create New Admin account (Requires Super Admin role)
app.post('/api/cms/users', async (req: Request, res: Response) => {
  const operator = await getAuthenticatedUser(req);
  if (!operator) return res.status(401).json({ error: 'Unauthorized credentials' });
  if (operator.role !== 'super_admin') {
    return res.status(403).json({ error: '权限不足：只有超级管理员能设立新的各部及各门书院理事官。' });
  }

  const { username, email, passwordRaw, role: targetRole, permissions } = req.body;
  if (!username || !email || !passwordRaw || !targetRole) {
    return res.status(400).json({ error: '所有表格必须填写完整' });
  }

  try {
    const newUser = await AdminStore.createUser(operator, {
      username: sanitize(username),
      email: sanitize(email),
      passwordRaw: passwordRaw,
      role: targetRole,
      permissions: permissions || []
    });

    res.json({
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        permissions: newUser.permissions,
        created_at: newUser.created_at,
        updated_at: newUser.updated_at
      }
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || '账户创建失败' });
  }
});

// Edit Admin account (Requires Super Admin role)
app.put('/api/cms/users/:id', async (req: Request, res: Response) => {
  const operator = await getAuthenticatedUser(req);
  if (!operator) return res.status(401).json({ error: 'Unauthorized credentials' });
  if (operator.role !== 'super_admin') {
    return res.status(403).json({ error: '权限不足：仅超级管理员可以编辑 and 更改书院理事名册！' });
  }

  const { email, role: targetRole, status, permissions } = req.body;
  try {
    const updatedUser = await AdminStore.updateUser(operator, req.params.id, {
      email: email ? sanitize(email) : undefined,
      role: targetRole,
      status,
      permissions
    });

    res.json({
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
        permissions: updatedUser.permissions,
        created_at: updatedUser.created_at,
        updated_at: updatedUser.updated_at
      }
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message || '修改失败' });
  }
});

// Delete Admin account (Requires Super Admin role)
app.delete('/api/cms/users/:id', async (req: Request, res: Response) => {
  const operator = await getAuthenticatedUser(req);
  if (!operator) return res.status(401).json({ error: 'Unauthorized credentials' });
  if (operator.role !== 'super_admin') {
    return res.status(403).json({ error: '权限不足：仅超级管理员可以罢免或抹销书院理事成员！' });
  }

  try {
    await AdminStore.deleteUser(operator, req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message || '注销学衔失败' });
  }
});

// Reset Password of an Admin (Requires Super Admin role)
app.post('/api/cms/users/:id/reset-password', async (req: Request, res: Response) => {
  const operator = await getAuthenticatedUser(req);
  if (!operator) return res.status(401).json({ error: 'Unauthorized credentials' });
  if (operator.role !== 'super_admin') {
    return res.status(403).json({ error: '权限不足：只有超级管理员能重置其它人等的密码印信。' });
  }

  const { passwordRaw } = req.body;
  if (!passwordRaw) {
    return res.status(400).json({ error: '新密码不能为空' });
  }

  try {
    await AdminStore.resetUserPassword(operator, req.params.id, passwordRaw);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message || '重置失败' });
  }
});

// Fetch Activity Logs List (Requires Super Admin or Admin role)
app.get('/api/cms/logs', async (req: Request, res: Response) => {
  const operator = await getAuthenticatedUser(req);
  if (!operator) return res.status(401).json({ error: 'Unauthorized credentials' });
  if (operator.role !== 'super_admin' && operator.role !== 'admin') {
    return res.status(403).json({ error: '无权查看书院系统审计日志' });
  }

  try {
    const logs = await AdminStore.getLogs(operator);
    res.json({ logs });
  } catch (error: any) {
    res.status(400).json({ error: error.message || '获取日志失败' });
  }
});

// 2. Gemini-driven Daily Quote (Premium bilingual/traditional)
app.post('/api/gemini/quote', async (req: Request, res: Response) => {
  const ai = getAiClient();
  if (!ai) {
    // Return a random beautiful fallback
    const idx = Math.floor(Math.random() * fallbackQuotes.length);
    return res.json({ quote: fallbackQuotes[idx], isFallback: true });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: 'Generate a short, elegant, premium Islamic wisdom quote in Simplified Chinese with poetic depth. Include its source (e.g. Quran chapter or Sahih Hadith, or traditional philosopher). Return JSON format: { "content": "Simplified Chinese translation of the wisdom", "source": "Poetic source name in Chinese" }',
      config: {
        responseMimeType: 'application/json',
      }
    });

    const resultText = response.text?.trim() || '';
    const parsed = JSON.parse(resultText);
    res.json({ quote: parsed, isFallback: false });
  } catch (err) {
    console.log('Daily Wisdom loaded from premium offline cache.');
    const idx = Math.floor(Math.random() * fallbackQuotes.length);
    res.json({ quote: fallbackQuotes[idx], isFallback: true });
  }
});

// 3. Gemini-driven Article Summary / AI Video Insights
app.post('/api/gemini/summarize', async (req: Request, res: Response) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  const ai = getAiClient();
  if (!ai) {
    return res.json({
      summary: `【AI 摘要预览】本文探讨了《${title}》中的深层哲学理念。在传统东方美学与伊斯兰学术智慧的交融中，展现出人类道德修养、心灵宁静以及理智求索的核心价值。`,
      keywords: ['学术智慧', '美学交融', '道德修养', '传统价值'],
      isFallback: true
    });
  }

  try {
    const prompt = `Title: ${title}\nContent: ${content}\n\nSummarize the text above into a highly readable and premium Chinese cultural paragraph (maximum 150 characters) and extract 4 relevant scholarly keywords. Return JSON format: { "summary": "your paragraph", "keywords": ["kw1", "kw2", "kw3", "kw4"] }`;
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text?.trim() || '';
    const parsed = JSON.parse(text);
    res.json({ ...parsed, isFallback: false });
  } catch (err) {
    console.log('Gemini summarizer loaded offline fallback summary content.');
    res.json({
      summary: `本文探讨了《${title}》中古典文化理念及其当代人文意义。通过多视角的研读，提炼出对于人本德行与科学探究的多维启发。`,
      keywords: ['德行启发', '人文价值', '文化研读', '学术传承'],
      isFallback: true
    });
  }
});

// --- VITE AND STATIC ASSETS INTEGRATION ---

async function initServer() {
  // Initialize default administrators from Firestore or env
  await AdminStore.initialize();

  if (process.env.NODE_ENV !== 'production') {
    // Development Mode: Use Vite Middleware Mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite development middleware mounted successfully.');
  } else {
    // Production Mode: Serve standard built static assets from /dist
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Production static file serving enabled for:', distPath);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

initServer().catch((err) => {
  console.error('Failed to launch application server:', err);
});
