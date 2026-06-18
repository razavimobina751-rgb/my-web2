import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from '../firebase-applet-config.json';

export interface AdminUser {
  id: string;
  uid: string;
  username: string;
  email: string;
  password_hash: string;
  role: 'super_admin' | 'admin' | 'editor';
  status: 'active' | 'suspended';
  permissions: string[];
  created_at: string;
  updated_at: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  username: string;
  email: string;
  action: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: string;
  rememberMe: boolean;
}

// In-memory collections database for 100% offline fallback compatibility
const inMemoryCollections = new Map<string, Map<string, any>>();

const seedInMemorySuperAdmin = () => {
  const usersMap = new Map<string, any>();

  // 1. Seed custom administrator from environment variables if present
  const adminUsername = process.env.SUPER_ADMIN_USERNAME;
  const adminPassword = process.env.SUPER_ADMIN_PASSWORD;
  const adminEmail = process.env.SUPER_ADMIN_EMAIL;

  if (adminUsername && adminPassword && adminEmail) {
    const cleanUsername = adminUsername.trim();
    const cleanEmail = adminEmail.trim();
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(adminPassword, salt);
    const uid = 'super_admin_env_offline';
    
    usersMap.set(uid, {
      id: uid,
      uid: uid,
      username: cleanUsername,
      email: cleanEmail,
      password_hash: passwordHash,
      role: 'super_admin',
      status: 'active',
      permissions: [
        'full_access',
        'manage_users',
        'manage_videos',
        'upload_videos',
        'upload_posters',
        'create_articles',
        'edit_articles',
        'delete_content',
        'manage_categories'
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    console.log(`[Offline Seed] Seeded configured SUPER_ADMIN from env: "${cleanUsername}"`);
  }

  // 2. Clear backup/fallback default administrator (admin / admin123)
  // We should always seed this to guarantee the user can access no matter what fallback/timeout occurs!
  const hasAdmin = Array.from(usersMap.values()).some((u: any) => u.username.toLowerCase() === 'admin');
  if (!hasAdmin) {
    const salt = bcrypt.genSaltSync(10);
    const fallbackHash = bcrypt.hashSync('admin123', salt);
    const uid = 'super_admin_fallback_offline';
    
    usersMap.set(uid, {
      id: uid,
      uid: uid,
      username: 'admin',
      email: 'admin@mingde.org',
      password_hash: fallbackHash,
      role: 'super_admin',
      status: 'active',
      permissions: [
        'full_access',
        'manage_users',
        'manage_videos',
        'upload_videos',
        'upload_posters',
        'create_articles',
        'edit_articles',
        'delete_content',
        'manage_categories'
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    console.log(`[Offline Seed] Seeded default fallback administrator: "admin" with password "admin123"`);
  }

  inMemoryCollections.set('users', usersMap);
};

const createMockDoc = (collName: string, docId: string) => {
  return {
    id: docId,
    async get() {
      const collMap = inMemoryCollections.get(collName);
      const data = collMap ? collMap.get(docId) : undefined;
      return {
        exists: data !== undefined,
        id: docId,
        data() {
          return data ? JSON.parse(JSON.stringify(data)) : undefined;
        }
      };
    },
    async set(data: any) {
      if (!inMemoryCollections.has(collName)) {
        inMemoryCollections.set(collName, new Map());
      }
      inMemoryCollections.get(collName)!.set(docId, JSON.parse(JSON.stringify(data)));
    },
    async update(updates: any) {
      if (!inMemoryCollections.has(collName)) {
        inMemoryCollections.set(collName, new Map());
      }
      const collMap = inMemoryCollections.get(collName)!;
      const current = collMap.get(docId) || {};
      collMap.set(docId, { ...current, ...JSON.parse(JSON.stringify(updates)) });
    },
    async delete() {
      const collMap = inMemoryCollections.get(collName);
      if (collMap) {
        collMap.delete(docId);
      }
    }
  };
};

const mockDb = {
  collection(collName: string) {
    return {
      doc(id: string) {
        return createMockDoc(collName, id);
      },
      async get() {
        const collMap = inMemoryCollections.get(collName) || new Map();
        const docsList: any[] = [];
        collMap.forEach((val, key) => {
          docsList.push({
            id: key,
            exists: true,
            data() {
              return JSON.parse(JSON.stringify(val));
            }
          });
        });
        return {
          empty: docsList.length === 0,
          docs: docsList,
          forEach(callback: (doc: any) => void) {
            docsList.forEach(callback);
          }
        };
      }
    };
  }
};

// Initialize/retrieve the official Firebase Admin SDK Cloud Firestore Client
let firestoreDbInstance: any = null;
let useOfflineFallback = false;

function getDb(): any {
  if (useOfflineFallback) {
    return mockDb;
  }
  if (!firestoreDbInstance) {
    let serviceAccount: any = null;
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './server/serviceAccount.json';

    try {
      if (credPath) {
        if (credPath.trim().startsWith('{')) {
          // In case the JSON string itself is embedded inside the env var
          serviceAccount = JSON.parse(credPath);
        } else {
          const resolvedPath = path.resolve(process.cwd(), credPath);
          if (fs.existsSync(resolvedPath)) {
            serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
          } else {
            const rawPath = path.join(process.cwd(), credPath);
            if (fs.existsSync(rawPath)) {
              serviceAccount = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
            }
          }
        }
      }
    } catch (e) {
      console.error('[AdminStore] Failed to load Google service account credentials:', e);
    }

    if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      } catch (e) {
        console.error('[AdminStore] Failed to parse FIREBASE_SERVICE_ACCOUNT:', e);
      }
    }

    if (!serviceAccount) {
      console.warn(
        '[AdminStore] Firebase Admin SDK credentials missing. Active/Online database bypass registered. ' +
        'System will fallback to an auto-synchronized in-memory fast datastore.'
      );
      useOfflineFallback = true;
      if (!inMemoryCollections.has('users')) {
        seedInMemorySuperAdmin();
      }
      return mockDb;
    }

    const appName = 'admin-app';
    const credential = cert(serviceAccount);

    const targetProjectId = serviceAccount.project_id || firebaseConfig.projectId;

    let adminApp;
    const existingApps = getApps();
    const matchedApp = existingApps.find(app => app.name === appName);
    if (matchedApp) {
      adminApp = matchedApp;
    } else {
      adminApp = initializeApp({
        credential,
        databaseURL: `https://${targetProjectId}.firebaseio.com`
      }, appName);
    }

    try {
      const dbId = (serviceAccount.project_id && serviceAccount.project_id !== firebaseConfig.projectId)
        ? "(default)"
        : firebaseConfig.firestoreDatabaseId;

      firestoreDbInstance = dbId && dbId !== "(default)"
        ? getFirestore(adminApp, dbId)
        : getFirestore(adminApp);
    } catch (dbInitErr) {
      console.warn('[AdminStore] Failed to connect to Firestore instance via Admin SDK, switching to offline fallback mode:', dbInitErr);
      useOfflineFallback = true;
      if (!inMemoryCollections.has('users')) {
        seedInMemorySuperAdmin();
      }
      return mockDb;
    }
  }
  return firestoreDbInstance;
}

// Transparent API compatibility layer proxy for existing collection calls style
const firestoreDb = {
  collection(path: string) {
    return getDb().collection(path);
  }
};

// In-memory highly concurrent sessions store
const sessionsMap = new Map<string, Session>();

// In-memory rate limiting map (IP -> timestamps)
const rateLimitMap = new Map<string, number[]>();

/**
 * REST API Caller for Firebase Authentication
 */
async function registerInFirebaseAuth(email: string, passwordRaw: string): Promise<string> {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password: passwordRaw,
      returnSecureToken: true
    })
  });

  const data = await response.json();
  if (!response.ok) {
    if (data.error?.message === 'EMAIL_EXISTS') {
      console.log(`[Firebase Auth Sync] Email '${email}' already exists. Bypassing Auth creation.`);
      // Return a deterministic UID based on email prefix
      return 'user_' + Buffer.from(email).toString('hex').substring(0, 16);
    }
    throw new Error(data.error?.message || 'Firebase Authentication registration failed');
  }

  return data.localId; // Return the created user's native Authenticated UID
}

async function resetPasswordInFirebaseAuth(uid: string, passwordRaw: string): Promise<void> {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${firebaseConfig.apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      localId: uid,
      password: passwordRaw,
      returnSecureToken: true
    })
  });

  if (!response.ok) {
    const data = await response.json();
    console.error(`[Firebase Auth Sync] Failed to update password inside Firebase Auth for UID '${uid}':`, data.error?.message);
  } else {
    console.log(`[Firebase Auth Sync] Password updated successfully in Firebase Auth for UID: '${uid}'`);
  }
}

export class AdminStore {
  // Rate limiter check: max 15 requests per 3 minutes
  static checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const timeframe = 3 * 60 * 1000; // 3 minutes
    const limit = 15;

    let hits = rateLimitMap.get(ip) || [];
    hits = hits.filter(t => now - t < timeframe);
    hits.push(now);
    rateLimitMap.set(ip, hits);

    return hits.length <= limit;
  }

  // Initial setup: bootstrap default Super Admin if none exists in Firestore
  static async initialize() {
    try {
      const adminUsername = process.env.SUPER_ADMIN_USERNAME;
      const adminPassword = process.env.SUPER_ADMIN_PASSWORD;
      const adminEmail = process.env.SUPER_ADMIN_EMAIL;

      console.log(`[AdminStore.initialize] Invoked. Raw SUPER_ADMIN_USERNAME: "${adminUsername}", Raw SUPER_ADMIN_EMAIL: "${adminEmail}", Password present: ${!!adminPassword}`);

      // If they are explicitly missing from environment, fallback to offline in-memory database right away
      let isFallbackRoute = !adminUsername || !adminPassword || !adminEmail;

      if (!isFallbackRoute) {
        // Pre-flight check: see if we can query the Firestore DB within 2000ms
        try {
          console.log('[AdminStore.initialize] Probing online Firestore Cloud connection...');
          const activeDb = getDb();
          if (activeDb === mockDb) {
            isFallbackRoute = true;
          } else {
            const probePromise = activeDb.collection('users').limit(1).get();
            const timeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Firestore connection timeout')), 2000)
            );
            await Promise.race([probePromise, timeoutPromise]);
            console.log('[AdminStore.initialize] Firestore connection verified successfully! Online database mode is active.');
          }
        } catch (probeErr: any) {
          console.warn('[AdminStore.initialize] Firestore connection probe failed or timed out:', probeErr.message || probeErr);
          console.warn('[AdminStore.initialize] Falling back to self-contained, high-performance in-memory datastore.');
          isFallbackRoute = true;
        }
      }

      if (isFallbackRoute) {
        useOfflineFallback = true;
        console.warn('[System Config] SUPER_ADMIN environment variables are missing OR Firestore connection failed.');
        console.log('[System Config] Offline/In-Memory fallback triggered automatically. Seeding default super admin:');
        console.log(' 👉 Username: admin');
        console.log(' 👉 Password: admin123');
        console.log(' 👉 Email: admin@mingde.org');
        if (!inMemoryCollections.has('users')) {
          seedInMemorySuperAdmin();
        }
        return;
      }

      // If we are here, we are online and connection is successful
      const cleanUsername = adminUsername!.trim();
      const cleanEmail = adminEmail!.trim();

      const usersColl = firestoreDb.collection('users');
      const snapshot = await usersColl.get();
      
      let existingDoc: any = null;
      let existingData: AdminUser | null = null;

      snapshot.forEach(doc => {
        const data = doc.data() as AdminUser;
        if (
          (data.username && data.username.toLowerCase() === cleanUsername.toLowerCase()) ||
          (data.email && data.email.toLowerCase() === cleanEmail.toLowerCase())
        ) {
          existingDoc = doc;
          existingData = {
            ...data,
            id: doc.id
          };
        }
      });

      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(adminPassword!, salt);

      if (existingDoc && existingData) {
        console.log(`[System Init] Super Admin '${cleanUsername}' already exists. Syncing/updating password credentials from .env...`);
        
        await usersColl.doc(existingDoc.id).update({
          username: cleanUsername,
          email: cleanEmail,
          password_hash: passwordHash,
          role: 'super_admin',
          status: 'active',
          updated_at: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        // Sync with Firebase Auth REST as well
        try {
          const uidToUpdate = existingData.uid || existingDoc.id;
          await resetPasswordInFirebaseAuth(uidToUpdate, adminPassword!);
        } catch (authErr) {
          console.warn('[System Init] Firebase Auth password sync warning:', authErr);
        }

        console.log('[System Init] Credentials synchronized successfully. You can now log in.');
      } else {
        console.log(`[System Init] No Super Admin matching '${cleanUsername}' detected. Initializing auto-creation...`);
        console.log(`[System Init] Seeding Super Admin for: [${cleanUsername}] with email [${cleanEmail}]...`);

        let uid = 'super_admin_seed_' + crypto.randomBytes(4).toString('hex');
        try {
          // Register in Firebase Auth via REST API
          const authUid = await registerInFirebaseAuth(cleanEmail, adminPassword!);
          if (authUid) {
            uid = authUid;
          }
        } catch (authErr) {
          console.error('[System Init] Firebase Auth seeding error (Profile will still be created in Firestore):', authErr);
        }

        const superAdminUser: AdminUser = {
          id: uid,
          uid: uid,
          username: cleanUsername,
          email: cleanEmail,
          password_hash: passwordHash,
          role: 'super_admin',
          status: 'active',
          permissions: [
            'full_access',
            'manage_users',
            'manage_videos',
            'upload_videos',
            'upload_posters',
            'create_articles',
            'edit_articles',
            'delete_content',
            'manage_categories'
          ],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Write document to Firestore '/users/{uid}'
        await usersColl.doc(uid).set(superAdminUser);

        // Audit Log registration
        await this.writeLogInternal('system', 'system', 'system@mingde.org', 'INITIAL_BOOTSTRAP', `Security Admin Vault Initialized. Created production-ready superadmin user: ${cleanUsername}`);
        
        console.log('--- DB SYSTEM INITIATED SUCCESSFULLY ---');
        console.log(`Username: ${cleanUsername}`);
        console.log('----------------------------------------');
      }
    } catch (err: any) {
      console.error('[System Init] Unexpected exception during database check/setup:', err);
      console.warn('[System Init] Demoting to offline/in-memory fallback due to pre-flight startup error.');
      useOfflineFallback = true;
      if (!inMemoryCollections.has('users')) {
        seedInMemorySuperAdmin();
      }
    }
  }

  // Users Management
  static async getUsers(): Promise<AdminUser[]> {
    try {
      const snapshot = await firestoreDb.collection('users').get();
      const users: AdminUser[] = [];
      snapshot.forEach(doc => {
        const data = doc.data() as AdminUser;
        users.push({
          ...data,
          id: doc.id,
          uid: data.uid || doc.id,
          created_at: data.created_at || data.createdAt || new Date().toISOString(),
          updated_at: data.updated_at || data.updatedAt || new Date().toISOString()
        });
      });
      return users;
    } catch (err) {
      console.error('[AdminStore] Error reading users from cloud Firestore:', err);
      return [];
    }
  }

  static async getUserById(id: string): Promise<AdminUser | undefined> {
    try {
      const docRef = firestoreDb.collection('users').doc(id);
      const docSnap = await docRef.get();
      if (docSnap.exists) {
        const data = docSnap.data() as AdminUser;
        return {
          ...data,
          id: docSnap.id,
          uid: data.uid || docSnap.id,
          created_at: data.created_at || data.createdAt || new Date().toISOString(),
          updated_at: data.updated_at || data.updatedAt || new Date().toISOString()
        };
      }
    } catch (err) {
      console.error(`[AdminStore] Error retrieving user profile ${id}:`, err);
    }
    return undefined;
  }

  static async getUserByUsername(username: string): Promise<AdminUser | undefined> {
    try {
      const cleanUsername = username.trim().toLowerCase();
      console.log(`[AdminStore.getUserByUsername] Fetching users collection snapshot...`);
      const querySnap = await firestoreDb.collection('users').get();
      console.log(`[AdminStore.getUserByUsername] Got users. Total documents found:`, querySnap.docs ? querySnap.docs.length : 0);
      let found: AdminUser | undefined = undefined;
      querySnap.forEach(doc => {
        const data = doc.data() as AdminUser;
        console.log(`[AdminStore.getUserByUsername] Checking user document ID: "${doc.id}", Username in doc: "${data.username}"`);
        if (data.username && data.username.toLowerCase() === cleanUsername) {
          found = {
            ...data,
            id: doc.id,
            uid: data.uid || doc.id,
            created_at: data.created_at || data.createdAt || new Date().toISOString(),
            updated_at: data.updated_at || data.updatedAt || new Date().toISOString()
          };
        }
      });
      return found;
    } catch (err) {
      console.error(`[AdminStore] Error querying username ${username}:`, err);
    }
    return undefined;
  }

  static async getUserByEmail(email: string): Promise<AdminUser | undefined> {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const querySnap = await firestoreDb.collection('users').get();
      let found: AdminUser | undefined = undefined;
      querySnap.forEach(doc => {
        const data = doc.data() as AdminUser;
        if (data.email && data.email.toLowerCase() === cleanEmail) {
          found = {
            ...data,
            id: doc.id,
            uid: data.uid || doc.id,
            created_at: data.created_at || data.createdAt || new Date().toISOString(),
            updated_at: data.updated_at || data.updatedAt || new Date().toISOString()
          };
        }
      });
      return found;
    } catch (err) {
      console.error(`[AdminStore] Error querying email ${email}:`, err);
    }
    return undefined;
  }

  static async createUser(operator: AdminUser, data: { username: string; email: string; passwordRaw: string; role: 'super_admin' | 'admin' | 'editor'; permissions: string[] }): Promise<AdminUser> {
    if (operator.role !== 'super_admin') {
      throw new Error('Unauthorized: Only Super Admin can create accounts');
    }

    const cleanUsername = data.username.trim();
    const cleanEmail = data.email.trim();

    const existingUser = await this.getUserByUsername(cleanUsername);
    if (existingUser) {
      throw new Error('Username already exists');
    }
    const existingByEmail = await this.getUserByEmail(cleanEmail);
    if (existingByEmail) {
      throw new Error('Email already registered');
    }

    console.log(`[AdminStore] Spawning new admin user: '${cleanUsername}'...`);

    let uid = 'usr_' + crypto.randomBytes(8).toString('hex');
    try {
      const authUid = await registerInFirebaseAuth(cleanEmail, data.passwordRaw);
      if (authUid) {
        uid = authUid;
      }
    } catch (authErr: any) {
      console.warn('[AdminStore] Firebase Auth signup failed. Creating Firestore Profile anyway, fallback generated UID:', authErr.message || authErr);
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(data.passwordRaw, salt);

    const newUser: AdminUser = {
      id: uid,
      uid: uid,
      username: cleanUsername,
      email: cleanEmail,
      password_hash: passwordHash,
      role: data.role,
      status: 'active',
      permissions: data.permissions || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await firestoreDb.collection('users').doc(uid).set(newUser);

    await this.writeLogInternal(
      operator.id,
      operator.username,
      operator.email,
      'ADMIN_CREATED',
      `Created new admin user: '${cleanUsername}' with role '${data.role}'`
    );

    return newUser;
  }

  static async updateUser(operator: AdminUser, userId: string, data: { email?: string; role?: 'super_admin' | 'admin' | 'editor'; status?: 'active' | 'suspended'; permissions?: string[] }): Promise<AdminUser> {
    if (operator.role !== 'super_admin' && operator.id !== userId) {
      throw new Error('Unauthorized');
    }

    const userRef = firestoreDb.collection('users').doc(userId);
    const docSnap = await userRef.get();
    if (!docSnap.exists) {
      throw new Error('User not found');
    }

    const targetUser = docSnap.data() as AdminUser;
    const updates: any = {};

    if (data.email) {
      targetUser.email = data.email.trim();
      updates.email = data.email.trim();
    }
    
    if (operator.role === 'super_admin') {
      if (data.role) {
        if (operator.id === userId && data.role !== 'super_admin') {
          const allUsers = await this.getUsers();
          const superCount = allUsers.filter(u => u.role === 'super_admin').length;
          if (superCount <= 1) {
            throw new Error('Cannot change role: You are the sole Super Admin of the Circle');
          }
        }
        targetUser.role = data.role;
        updates.role = data.role;
      }
      if (data.status) {
        if (operator.id === userId && data.status === 'suspended') {
          throw new Error('Cannot suspend your own account');
        }
        targetUser.status = data.status;
        updates.status = data.status;
      }
      if (data.permissions) {
        targetUser.permissions = data.permissions;
        updates.permissions = data.permissions;
      }
    }

    targetUser.updated_at = new Date().toISOString();
    targetUser.updatedAt = new Date().toISOString();
    updates.updated_at = targetUser.updated_at;
    updates.updatedAt = targetUser.updatedAt;

    await userRef.update(updates);

    await this.writeLogInternal(
      operator.id,
      operator.username,
      operator.email,
      'ADMIN_UPDATED',
      `Updated admin user '${targetUser.username}' profile/rights`
    );

    return {
      ...targetUser,
      id: userId,
      uid: targetUser.uid || userId
    };
  }

  static async deleteUser(operator: AdminUser, userId: string): Promise<void> {
    if (operator.role !== 'super_admin') {
      throw new Error('Unauthorized: Only Super Admin can delete accounts');
    }
    if (operator.id === userId) {
      throw new Error('Cannot delete your own account');
    }

    const userRef = firestoreDb.collection('users').doc(userId);
    const docSnap = await userRef.get();
    if (!docSnap.exists) {
      throw new Error('User not found');
    }

    const targetUser = docSnap.data() as AdminUser;
    await userRef.delete();

    // Invalidate session values
    for (const [token, session] of sessionsMap.entries()) {
      if (session.userId === userId) {
        sessionsMap.delete(token);
      }
    }

    await this.writeLogInternal(
      operator.id,
      operator.username,
      operator.email,
      'ADMIN_DELETED',
      `Permanently deleted administrator account: '${targetUser.username}' (${targetUser.email})`
    );
  }

  static async resetUserPassword(operator: AdminUser, userId: string, passwordRaw: string): Promise<void> {
    if (operator.role !== 'super_admin') {
      throw new Error('Unauthorized: Only Super Admin can reset user passwords');
    }

    const userRef = firestoreDb.collection('users').doc(userId);
    const docSnap = await userRef.get();
    if (!docSnap.exists) {
      throw new Error('User not found');
    }

    const targetUser = docSnap.data() as AdminUser;
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(passwordRaw, salt);

    // Update in Firebase Auth REST
    const uidToUpdate = targetUser.uid || userId;
    try {
      await resetPasswordInFirebaseAuth(uidToUpdate, passwordRaw);
    } catch (authErr) {
      console.error(`[AdminStore] Password update failed in Firebase Auth for user ${targetUser.username}:`, authErr);
    }

    // Update inside Firestore users collection
    await userRef.update({
      password_hash: passwordHash,
      updated_at: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    await this.writeLogInternal(
      operator.id,
      operator.username,
      operator.email,
      'ADMIN_PASSWORD_RESET',
      `Super Admin reset password for '${targetUser.username}'`
    );
  }

  // Session Token management
  static createSession(userId: string, rememberMe: boolean): string {
    const token = crypto.randomBytes(32).toString('hex');
    const lifespan = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000; // 30 days or 2 hours
    const expiresAt = new Date(Date.now() + lifespan).toISOString();

    sessionsMap.set(token, {
      id: token,
      userId,
      expiresAt,
      rememberMe
    });

    return token;
  }

  static async verifySession(token: string): Promise<AdminUser | null> {
    const session = sessionsMap.get(token);
    if (!session) return null;

    if (new Date(session.expiresAt).getTime() < Date.now()) {
      sessionsMap.delete(token);
      return null;
    }

    const userProfile = await this.getUserById(session.userId);
    if (!userProfile || userProfile.status !== 'active') return null;

    return userProfile;
  }

  static destroySession(token: string): void {
    sessionsMap.delete(token);
  }

  // Logs Access
  static async getLogs(operator: AdminUser): Promise<ActivityLog[]> {
    if (operator.role !== 'super_admin' && operator.role !== 'admin') {
      throw new Error('Unauthorized to view audit logs');
    }

    try {
      const snapshot = await firestoreDb.collection('activity_logs').get();
      const logs: any[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        logs.push({
          ...data,
          id: doc.id,
          timestamp: data.timestamp || new Date().toISOString()
        });
      });

      // Sort chronological descending
      return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (err) {
      console.error('[AdminStore] Error reading logs from Firestore:', err);
      return [];
    }
  }

  static writeLog(userId: string, username: string, email: string, action: string, details: string, ip?: string, ua?: string): void {
    this.writeLogInternal(userId, username, email, action, details, ip, ua).catch(err => {
      console.error('[AdminStore] Failed background write to security audit logs:', err);
    });
  }

  private static async writeLogInternal(userId: string, username: string, email: string, action: string, details: string, ip?: string, ua?: string): Promise<void> {
    try {
      const logId = 'log_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
      const logData = {
        id: logId,
        userId: userId,
        userEmail: email,
        userName: username,
        username: username, // field pairing compatibility
        email: email,       // field pairing compatibility
        action: action,
        details: details,
        timestamp: new Date().toISOString(),
        ipAddress: ip || '127.0.0.1',
        userAgent: ua || 'unknown'
      };

      await firestoreDb.collection('activity_logs').doc(logId).set(logData);
    } catch (err) {
      console.warn('[AdminStore] Log entry skipped (Firestore transaction issue):', err);
    }
  }
}
