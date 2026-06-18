import React, { useEffect, useState } from 'react';
import { useAuth, CMSUserProfile, UserRole } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { VideoContent, ArticleContent, CategoryItem } from '../types';
import { INITIAL_CATEGORIES, INITIAL_VIDEOS, INITIAL_ARTICLES } from '../data/initialData';
import { 
  Shield, Users, Tv, BookOpen, Layers, Activity, Plus, Trash2, 
  Edit, Save, FileText, CheckCircle2, ChevronRight, BarChart3, 
  AlertCircle, ShieldCheck, ShieldAlert, Key, Ban, UserCheck, RefreshCw,
  Printer, Download, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TRANSLATIONS } from '../data/translations';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

export const AdminDashboard: React.FC = () => {
  const { lang } = useLanguage();
  const ln = (zh: string, en: string) => (lang === 'en' ? en : zh);

  const { 
    user, role, permissions, 
    getUsersList, createAdminUser, updateAdminUser, deleteAdminUser, resetAdminPassword, getSystemLogs 
  } = useAuth();

  // Active navigation sub-tab in dashboard
  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'admin-mgmt' | 'videos' | 'articles' | 'categories' | 'logs' | 'settings'>('analytics');

  // Local state mirrored collections
  const [usersList, setUsersList] = useState<CMSUserProfile[]>([]);
  const [videosList, setVideosList] = useState<VideoContent[]>([]);
  const [articlesList, setArticlesList] = useState<ArticleContent[]>([]);
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // FORM STATES: Create/Edit Administrator User
  const [showAddForm, setShowAddForm] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPasswordRaw, setAdminPasswordRaw] = useState('');
  const [adminRole, setAdminRole] = useState<UserRole>('editor');
  const [adminPermissions, setAdminPermissions] = useState<string[]>([]);
  const [adminStatus, setAdminStatus] = useState<'active' | 'suspended'>('active');

  // FORM STATES: Password Reset modal for admin
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [newPasswordRaw, setNewPasswordRaw] = useState('');

  // FORM STATES: New Video
  const [vTitle, setVTitle] = useState('');
  const [vDesc, setVDesc] = useState('');
  const [vUrl, setVUrl] = useState('');
  const [vPoster, setVPoster] = useState('');
  const [vCat, setVCat] = useState('');
  const [vAuthor, setVAuthor] = useState('');
  const [vTags, setVTags] = useState('');
  const [vFeatured, setVFeatured] = useState(false);
  const [vType, setVType] = useState<'short' | 'long'>('long');
  const [vDuration, setVDuration] = useState<number>(600);
  const [vQualities] = useState<string[]>(['1080P HD', '720P SD']);

  // FORM STATES: New Article
  const [aTitle, setATitle] = useState('');
  const [aContent, setAContent] = useState('');
  const [aSummary, setASummary] = useState('');
  const [aCover, setACover] = useState('');
  const [aCat, setACat] = useState('');
  const [aDraft, setADraft] = useState(false);
  const [aFeatured, setAFeatured] = useState(false);
  const [aAuthor, setAAuthor] = useState('');

  // FORM STATES: New Category
  const [cName, setCName] = useState('');
  const [cSlug, setCSlug] = useState('');
  const [cDesc, setCDesc] = useState('');
  const [cType, setCType] = useState<'video' | 'article' | 'both'>('both');
  const [cOrder, setCOrder] = useState(1);
  const [cIcon, setCIcon] = useState('BookOpen');

  // FORM STATES: Site Settings
  const [aboutMainTitleZh, setAboutMainTitleZh] = useState('');
  const [aboutMainTitleEn, setAboutMainTitleEn] = useState('');
  const [aboutSubtitleZh, setAboutSubtitleZh] = useState('');
  const [aboutSubtitleEn, setAboutSubtitleEn] = useState('');
  const [aboutParagraphZh, setAboutParagraphZh] = useState('');
  const [aboutParagraphEn, setAboutParagraphEn] = useState('');

  const [valueClassicTitleZh, setValueClassicTitleZh] = useState('');
  const [valueClassicTitleEn, setValueClassicTitleEn] = useState('');
  const [valueClassicDescZh, setValueClassicDescZh] = useState('');
  const [valueClassicDescEn, setValueClassicDescEn] = useState('');

  const [valueAestheticTitleZh, setValueAestheticTitleZh] = useState('');
  const [valueAestheticTitleEn, setValueAestheticTitleEn] = useState('');
  const [valueAestheticDescZh, setValueAestheticDescZh] = useState('');
  const [valueAestheticDescEn, setValueAestheticDescEn] = useState('');

  const [valueInterTitleZh, setValueInterTitleZh] = useState('');
  const [valueInterTitleEn, setValueInterTitleEn] = useState('');
  const [valueInterDescZh, setValueInterDescZh] = useState('');
  const [valueInterDescEn, setValueInterDescEn] = useState('');

  const [contactTitleZh, setContactTitleZh] = useState('');
  const [contactTitleEn, setContactTitleEn] = useState('');
  const [contactSubtitleZh, setContactSubtitleZh] = useState('');
  const [contactSubtitleEn, setContactSubtitleEn] = useState('');
  const [contactDescZh, setContactDescZh] = useState('');
  const [contactDescEn, setContactDescEn] = useState('');
  const [contactAddressZh, setContactAddressZh] = useState('');
  const [contactAddressEn, setContactAddressEn] = useState('');

  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const [savingSettings, setSavingSettings] = useState(false);

  // Load existing settings on mount
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'about_contact'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAboutMainTitleZh(data.aboutMainTitle_zh || '');
        setAboutMainTitleEn(data.aboutMainTitle_en || '');
        setAboutSubtitleZh(data.aboutSubtitle_zh || '');
        setAboutSubtitleEn(data.aboutSubtitle_en || '');
        setAboutParagraphZh(data.aboutParagraph_zh || '');
        setAboutParagraphEn(data.aboutParagraph_en || '');

        setValueClassicTitleZh(data.valueClassicTitle_zh || '');
        setValueClassicTitleEn(data.valueClassicTitle_en || '');
        setValueClassicDescZh(data.valueClassicDesc_zh || '');
        setValueClassicDescEn(data.valueClassicDesc_en || '');

        setValueAestheticTitleZh(data.valueAestheticTitle_zh || '');
        setValueAestheticTitleEn(data.valueAestheticTitle_en || '');
        setValueAestheticDescZh(data.valueAestheticDesc_zh || '');
        setValueAestheticDescEn(data.valueAestheticDesc_en || '');

        setValueInterTitleZh(data.valueInterTitle_zh || '');
        setValueInterTitleEn(data.valueInterTitle_en || '');
        setValueInterDescZh(data.valueInterDesc_zh || '');
        setValueInterDescEn(data.valueInterDesc_en || '');

        setContactTitleZh(data.contactTitle_zh || '');
        setContactTitleEn(data.contactTitle_en || '');
        setContactSubtitleZh(data.contactSubtitle_zh || '');
        setContactSubtitleEn(data.contactSubtitle_en || '');
        setContactDescZh(data.contactDesc_zh || '');
        setContactDescEn(data.contactDesc_en || '');
        setContactAddressZh(data.contactAddress_zh || '');
        setContactAddressEn(data.contactAddress_en || '');

        setContactEmail(data.contactEmail || '');
        setContactPhone(data.contactPhone || '');
      } else {
        // Fallback pre-population to prevent blank forms on first run
        setAboutMainTitleZh(TRANSLATIONS.zh.aboutMainTitle);
        setAboutMainTitleEn(TRANSLATIONS.en.aboutMainTitle);
        setAboutSubtitleZh(TRANSLATIONS.zh.aboutSubtitle);
        setAboutSubtitleEn(TRANSLATIONS.en.aboutSubtitle);
        setAboutParagraphZh(TRANSLATIONS.zh.aboutParagraph);
        setAboutParagraphEn(TRANSLATIONS.en.aboutParagraph);

        setValueClassicTitleZh(TRANSLATIONS.zh.valueClassicTitle);
        setValueClassicTitleEn(TRANSLATIONS.en.valueClassicTitle);
        setValueClassicDescZh(TRANSLATIONS.zh.valueClassicDesc);
        setValueClassicDescEn(TRANSLATIONS.en.valueClassicDesc);

        setValueAestheticTitleZh(TRANSLATIONS.zh.valueAestheticTitle);
        setValueAestheticTitleEn(TRANSLATIONS.en.valueAestheticTitle);
        setValueAestheticDescZh(TRANSLATIONS.zh.valueAestheticDesc);
        setValueAestheticDescEn(TRANSLATIONS.en.valueAestheticDesc);

        setValueInterTitleZh(TRANSLATIONS.zh.valueInterTitle);
        setValueInterTitleEn(TRANSLATIONS.en.valueInterTitle);
        setValueInterDescZh(TRANSLATIONS.zh.valueInterDesc);
        setValueInterDescEn(TRANSLATIONS.en.valueInterDesc);

        setContactTitleZh(TRANSLATIONS.zh.contactTitle);
        setContactTitleEn(TRANSLATIONS.en.contactTitle);
        setContactSubtitleZh(TRANSLATIONS.zh.contactSubtitle);
        setContactSubtitleEn(TRANSLATIONS.en.contactSubtitle);
        setContactDescZh(TRANSLATIONS.zh.contactDesc);
        setContactDescEn(TRANSLATIONS.en.contactDesc);
        setContactAddressZh(TRANSLATIONS.zh.contactAddress);
        setContactAddressEn(TRANSLATIONS.en.contactAddress);

        setContactEmail('library@mingde-tianfang.org');
        setContactPhone('+86 (010) 6512-8800');
      }
    }, (err) => {
      console.error('Failed to listen to site settings:', err);
    });
    return () => unsub();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    setSavingSettings(true);

    try {
      await setDoc(doc(db, 'settings', 'about_contact'), {
        id: 'about_contact',
        aboutMainTitle_zh: aboutMainTitleZh,
        aboutMainTitle_en: aboutMainTitleEn,
        aboutSubtitle_zh: aboutSubtitleZh,
        aboutSubtitle_en: aboutSubtitleEn,
        aboutParagraph_zh: aboutParagraphZh,
        aboutParagraph_en: aboutParagraphEn,

        valueClassicTitle_zh: valueClassicTitleZh,
        valueClassicTitle_en: valueClassicTitleEn,
        valueClassicDesc_zh: valueClassicDescZh,
        valueClassicDesc_en: valueClassicDescEn,

        valueAestheticTitle_zh: valueAestheticTitleZh,
        valueAestheticTitle_en: valueAestheticTitleEn,
        valueAestheticDesc_zh: valueAestheticDescZh,
        valueAestheticDesc_en: valueAestheticDescEn,

        valueInterTitle_zh: valueInterTitleZh,
        valueInterTitle_en: valueInterTitleEn,
        valueInterDesc_zh: valueInterDescZh,
        valueInterDesc_en: valueInterDescEn,

        contactTitle_zh: contactTitleZh,
        contactTitle_en: contactTitleEn,
        contactSubtitle_zh: contactSubtitleZh,
        contactSubtitle_en: contactSubtitleEn,
        contactDesc_zh: contactDescZh,
        contactDesc_en: contactDescEn,
        contactAddress_zh: contactAddressZh,
        contactAddress_en: contactAddressEn,

        contactEmail,
        contactPhone,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.username || 'Admin'
      });

      setSuccessMsg(ln('书院介绍、馆务联系及价值观等基本面配置已成功保存！', 'General configuration files successfully synchronized to cloud databases!'));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/about_contact');
      console.error('Failed to sync settings:', err);
      setErrorMsg(ln('同步配置发生错误，请复核权限或网络。', 'Error updating configuration, please check connectivity or permissions.'));
    } finally {
      setSavingSettings(false);
    }
  };

  // Guard routing based on permissions & roles
  const hasPermission = (permissionKey: string) => {
    if (role === 'super_admin') return true;
    return permissions.includes(permissionKey);
  };

  const exportToCSV = () => {
    try {
      if (role !== 'super_admin') {
        setErrorMsg('特权错误：仅限最高理事 Super Admin 导出此安全审计报告。');
        return;
      }
      if (activityLogs.length === 0) {
        setErrorMsg('无可供导出的治安审计日志。');
        return;
      }
      
      const headers = ['Timestamp', 'Action', 'Details', 'Operator Username', 'Operator Email', 'IP Address'];
      const csvContent = [
        headers.join(','),
        ...activityLogs.map((log) => [
          `"${(log.timestamp || '').replace(/"/g, '""')}"`,
          `"${(log.action || '').replace(/"/g, '""')}"`,
          `"${(log.details || '').replace(/"/g, '""')}"`,
          `"${(log.username || '').replace(/"/g, '""')}"`,
          `"${(log.email || '').replace(/"/g, '""')}"`,
          `"${(log.ipAddress || '').replace(/"/g, '""')}"`
        ].join(','))
      ].join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `shuyuan_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setSuccessMsg('书院治安审计日志成功导出为 CSV 格式');
    } catch (err: any) {
      setErrorMsg('CSV 导出失败: ' + err.message);
    }
  };

  const exportToPDF = () => {
    try {
      if (role !== 'super_admin') {
        setErrorMsg('特权错误：仅限最高理事 Super Admin 导出此安全审计报告。');
        return;
      }
      if (activityLogs.length === 0) {
        setErrorMsg('无可供打印或导出的治安审计日志。');
        return;
      }

      const printArea = document.createElement('div');
      printArea.id = 'print-area';
      printArea.className = 'font-serif p-8 text-stone-900 bg-white';
      
      const styleTag = document.createElement('style');
      styleTag.innerHTML = `
        @media print {
          body > *:not(#print-area) {
            display: none !important;
          }
          #print-area {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
          }
        }
      `;
      
      const tableRows = activityLogs.map((log) => {
        const formattedTime = log.timestamp ? log.timestamp.replace('T', ' ').substring(0, 19) : 'N/A';
        return `
          <tr style="border-bottom: 1px solid #e7e5e4;">
            <td style="padding: 10px 8px; font-family: monospace; font-size: 10px; color: #4b5563;">${formattedTime}</td>
            <td style="padding: 10px 8px;">
              <span style="display: inline-block; padding: 2px 6px; font-family: monospace; font-size: 9px; font-weight: bold; border-radius: 4px; border: 1px solid #d1d5db; background-color: #f3f4f6; color: #374151;">
                ${log.action}
              </span>
            </td>
            <td style="padding: 10px 8px; font-size: 11px; font-weight: bold; color: #1c1917;">${log.details}</td>
            <td style="padding: 10px 8px; font-size: 11px; color: #44403c;">@${log.username} (${log.email})</td>
            <td style="padding: 10px 8px; font-family: monospace; font-size: 10px; color: #78716c;">${log.ipAddress || 'Internal'}</td>
          </tr>
        `;
      }).join('');

      printArea.innerHTML = `
        <div style="font-family: Georgia, serif; margin-bottom: 30px; border-bottom: 3px double #8A6D1C; padding-bottom: 15px;">
          <h1 style="font-size: 26px; font-weight: bold; color: #1c1917; margin: 0; font-family: Georgia, serif;">格物致理学堂 • 治安大宗</h1>
          <h2 style="font-size: 13px; font-weight: normal; color: #8A6D1C; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 2px; font-family: sans-serif;">书院教政治安审计大典报告 • SECURITY AUDIT REPORT</h2>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 11px; color: #44403c; background-color: #fafaf9; border: 1px solid #e7e5e4; padding: 15px; border-radius: 8px; font-family: sans-serif;">
          <div>
            <p style="margin: 0 0 5px 0;"><strong>报告监修主事 (Supervised By):</strong> ${user?.username} (${user?.email})</p>
            <p style="margin: 0;"><strong>理学执行级别:</strong> 最高级超级管理员 (Super Administrator Privileges)</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0 0 5px 0;"><strong>编制刻印时间:</strong> ${new Date().toLocaleString()}</p>
            <p style="margin: 0;"><strong>安全纪律审计项数:</strong> ${activityLogs.length} 项日志记录</p>
          </div>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-family: sans-serif;">
          <thead>
            <tr style="border-bottom: 2px solid #8A6D1C; font-size: 11px; font-weight: bold; color: #1c1917; background-color: #f5f5f4;">
              <th style="padding: 10px 8px;">时间戳 Timestamp</th>
              <th style="padding: 10px 8px;">动作类型 Action</th>
              <th style="padding: 10px 8px;">审计明细 Details</th>
              <th style="padding: 10px 8px;">经办理事 Operator</th>
              <th style="padding: 10px 8px;">终端 IP</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows || '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #a8a29e;">暂无流转审计日志。</td></tr>'}
          </tbody>
        </table>
        
        <div style="margin-top: 60px; border-top: 1px dashed #d6d3d1; padding-top: 20px; font-size: 10px; color: #a8a29e; text-align: center; font-family: sans-serif;">
          此卷由格物致理学堂教政治安审计大典直接授信生成。所有活动一经记档已签章保全。
        </div>
      `;

      document.body.appendChild(printArea);
      document.body.appendChild(styleTag);
      
      window.print();
      
      document.body.removeChild(printArea);
      document.body.removeChild(styleTag);
      setSuccessMsg('书院治安审计日志成功调用印制/PDF 生成机制');
    } catch (err: any) {
      setErrorMsg('PDF/打印导出失败: ' + err.message);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // 1. Core items (videos & articles) loaded from localStorage with default fallbacks
      const savedCats = localStorage.getItem('mingde_categories');
      const savedVids = localStorage.getItem('mingde_videos');
      const savedArts = localStorage.getItem('mingde_articles');

      const activeCategories = savedCats ? JSON.parse(savedCats) : INITIAL_CATEGORIES;
      activeCategories.sort((a: any, b: any) => (a.displayOrder || 0) - (b.displayOrder || 0));
      setCategoriesList(activeCategories);

      const activeVideos = savedVids ? JSON.parse(savedVids) : INITIAL_VIDEOS;
      setVideosList(activeVideos);

      const activeArticles = savedArts ? JSON.parse(savedArts) : INITIAL_ARTICLES;
      setArticlesList(activeArticles);

      // Default the select category menus
      if (activeCategories.length > 0) {
        setVCat(activeCategories[0].id);
        setACat(activeCategories[0].id);
      }

      // 2. CMS-specific directories (Users roster and activity audit logs) via useAuth backend proxies
      if (role === 'super_admin' || role === 'admin') {
        try {
          const fetchedUsers = await getUsersList();
          setUsersList(fetchedUsers);
        } catch (e: any) {
          console.warn('Silent fallback if backend auth listing rejected:', e);
        }

        try {
          const fetchedLogs = await getSystemLogs();
          setActivityLogs(fetchedLogs);
        } catch (e: any) {
          console.warn('Silent fallback if backend logs listing rejected:', e);
        }
      }

    } catch (err: any) {
      console.error('Core admin metrics gathering failed:', err);
      setErrorMsg('同步书院数据资产失败，请检查登录会话。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [role]);

  // Alert dismiss auto-close timers
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  // UTILITY Slug Generator
  const generateSlug = (text: string) => {
    return text
      .trim()
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  // ROLES DEFINED PERMISSIONS DEFAULT AUTO SETTLE
  const updateDefaultPermissionsForRole = (selectedRole: UserRole) => {
    if (selectedRole === 'super_admin') {
      setAdminPermissions([
        'full_access',
        'manage_users',
        'manage_videos',
        'upload_videos',
        'upload_posters',
        'create_articles',
        'edit_articles',
        'delete_content',
        'manage_categories'
      ]);
    } else if (selectedRole === 'admin') {
      setAdminPermissions([
        'manage_videos',
        'upload_videos',
        'upload_posters',
        'create_articles',
        'edit_articles',
        'delete_content',
        'manage_categories'
      ]);
    } else {
      // Editor default
      setAdminPermissions([
        'create_articles',
        'edit_articles',
        'manage_videos', // allows creating/editing articles & videos
        'upload_videos'
      ]);
    }
  };

  // --- ADMINISTRATORS MANAGEMENT ACTIONS ---
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role !== 'super_admin') {
      setErrorMsg('权限不足：只有超级管理员能聘任及设立理事！');
      return;
    }
    if (!adminUsername || !adminEmail || !adminPasswordRaw) {
      setErrorMsg('请填写新任理事的用户名、保全邮箱及印信密码。');
      return;
    }

    try {
      setLoading(true);
      await createAdminUser({
        username: adminUsername,
        email: adminEmail,
        passwordRaw: adminPasswordRaw,
        role: adminRole,
        permissions: adminPermissions
      });

      setSuccessMsg(`新任理事招徕完成！已聘请 [${adminUsername}] 为书院学长官衔。`);
      
      // Cleanup inputs
      setAdminUsername('');
      setAdminEmail('');
      setAdminPasswordRaw('');
      setShowAddForm(false);
      
      // Reload lists
      const fetchedUsers = await getUsersList();
      setUsersList(fetchedUsers);
      const fetchedLogs = await getSystemLogs();
      setActivityLogs(fetchedLogs);
    } catch (err: any) {
      setErrorMsg(err.message || '聘任失败，请检查重名或重复邮箱。');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAdminFlags = async (targetUser: CMSUserProfile) => {
    if (role !== 'super_admin') return;

    try {
      setLoading(true);
      await updateAdminUser(targetUser.id, {
        role: adminRole,
        status: adminStatus,
        permissions: adminPermissions
      });

      setSuccessMsg(`已更新管理员: '${targetUser.username}' 的理学阁特权名柬和会话权限。`);
      setEditUserId(null);

      // Reload lists
      const fetchedUsers = await getUsersList();
      setUsersList(fetchedUsers);
      const fetchedLogs = await getSystemLogs();
      setActivityLogs(fetchedLogs);
    } catch (err: any) {
      setErrorMsg(err.message || '更新配置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdminAction = async (targetUserId: string) => {
    if (role !== 'super_admin') return;
    if (user && user.id === targetUserId) {
      setErrorMsg('安全报警：您不可罢免您自己！');
      return;
    }

    if (!window.confirm('警告：此操作不可挽回。您确定要罢免并抹去该理事的安全凭据和理事权限吗？')) {
      return;
    }

    try {
      setLoading(true);
      await deleteAdminUser(targetUserId);
      setSuccessMsg('该管理员已被永久注销，安全会话已撤回。');

      // Reload lists
      const fetchedUsers = await getUsersList();
      setUsersList(fetchedUsers);
      const fetchedLogs = await getSystemLogs();
      setActivityLogs(fetchedLogs);
    } catch (err: any) {
      setErrorMsg(err.message || '注销失败');
    } finally {
      setLoading(false);
    }
  };

  const handleResetAdminPasswordAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUserId || !newPasswordRaw) return;

    try {
      setLoading(true);
      await resetAdminPassword(resettingUserId, newPasswordRaw);
      setSuccessMsg('该理事密码印信重铸成功！');
      setResettingUserId(null);
      setNewPasswordRaw('');

      const fetchedLogs = await getSystemLogs();
      setActivityLogs(fetchedLogs);
    } catch (err: any) {
      setErrorMsg(err.message || '重设密码失败');
    } finally {
      setLoading(false);
    }
  };

  const togglePermissionCheckbox = (permission: string) => {
    if (adminPermissions.includes(permission)) {
      setAdminPermissions(prev => prev.filter(p => p !== permission));
    } else {
      setAdminPermissions(prev => [...prev, permission]);
    }
  };

  const handleEditClick = (tu: CMSUserProfile) => {
    setEditUserId(tu.id);
    setAdminRole(tu.role);
    setAdminStatus(tu.status);
    setAdminPermissions(tu.permissions);
  };

  // --- CONTENT WORKFLOW CRUD ACTIONS ---

  // 1. Publish Video
  const handleCreateVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPermission('manage_videos')) {
      setErrorMsg('权限不足：无法发表或编撰视频课堂。');
      return;
    }
    if (!vTitle || !vUrl || !vPoster || !vCat) {
      setErrorMsg('请填写所需的讲课主题、影视源 MP4 以及封面底图 URL。');
      return;
    }

    const vidId = 'vid-' + Date.now();
    const cleanTags = vTags ? vTags.split(',').map(t => t.trim()) : ['理学精研'];

    const newVideo: VideoContent = {
      id: vidId,
      slug: generateSlug(vTitle),
      title: vTitle,
      description: vDesc || '此精品学术视频课程纲要尚在校订中。',
      videoUrl: vUrl,
      posterUrl: vPoster,
      category: vCat,
      views: 0,
      isFeatured: vFeatured,
      qualityLevels: vQualities,
      createdAt: new Date().toISOString(),
      authorName: vAuthor || '书院特聘学者',
      videoType: vType,
      duration: Number(vDuration) || 600,
      tags: cleanTags
    };

    const updated = [newVideo, ...videosList];
    setVideosList(updated);
    localStorage.setItem('mingde_videos', JSON.stringify(updated));

    setSuccessMsg(`经典课堂「${vTitle}」已刻盘归档，发布至学界学堂！`);
    
    // Clear form inputs
    setVTitle('');
    setVDesc('');
    setVUrl('');
    setVPoster('');
    setVAuthor('');
    setVTags('');
    setVFeatured(false);
    setVType('long');
    setVDuration(600);
  };

  // 2. Publish Article
  const handleCreateArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPermission('create_articles')) {
      setErrorMsg('权限不足：无法撰写学术文章大作。');
      return;
    }
    if (!aTitle || !aContent) {
      setErrorMsg('文章标题及修辞段落大意必须填写完整。');
      return;
    }

    const artId = 'art-' + Date.now();
    const calculatedReadTime = Math.max(1, Math.ceil(aContent.length / 500));

    const newArticle: ArticleContent = {
      id: artId,
      slug: generateSlug(aTitle),
      title: aTitle,
      summary: aSummary || '文章正文校雠中。',
      content: aContent,
      coverUrl: aCover || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80',
      category: aCat,
      readTime: calculatedReadTime,
      views: 0,
      createdAt: new Date().toISOString(),
      draft: aDraft,
      authorName: aAuthor || '书院特聘研究员',
      authorRole: '书院学士官',
      isFeatured: aFeatured
    };

    const updated = [newArticle, ...articlesList];
    setArticlesList(updated);
    localStorage.setItem('mingde_articles', JSON.stringify(updated));

    setSuccessMsg(`学术考证雄文「${aTitle}」已核定刊印！`);
    
    // Clear form inputs
    setATitle('');
    setAContent('');
    setASummary('');
    setACover('');
    setAAuthor('');
    setADraft(false);
    setAFeatured(false);
  };

  // 3. Publish Category Items
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPermission('manage_categories')) {
      setErrorMsg('权限不足：只有管理员可设立新的经典研学分类栏。');
      return;
    }
    if (!cName || !cSlug) {
      setErrorMsg('专栏名称及 URL Slug 索引标识符不可为空。');
      return;
    }

    const newCat: CategoryItem = {
      id: cSlug.trim().toLowerCase(),
      name: cName,
      slug: cSlug.trim().toLowerCase(),
      description: cDesc || '古典书院特设学问分支。',
      type: cType,
      displayOrder: cOrder,
      icon: cIcon
    };

    const updated = [...categoriesList, newCat];
    updated.sort((a, b) => a.displayOrder - b.displayOrder);
    setCategoriesList(updated);
    localStorage.setItem('mingde_categories', JSON.stringify(updated));

    setSuccessMsg(`书院学科阁楼栏目「${cName}」已编目开设！`);

    // Clear form
    setCName('');
    setCSlug('');
    setCDesc('');
    setCType('both');
    setCOrder(1);
  };

  // 4. Global Remove elements
  const handleDeleteContent = (id: string, type: 'videos' | 'articles' | 'categories') => {
    if (!hasPermission('delete_content')) {
      setErrorMsg('操作拦截：您的理事席位权限不支持注销/下架殿藏内容。');
      return;
    }

    if (!window.confirm('确定要将该项资源从书院殿堂中作罢下架吗？此举会清除本地配置缓存。')) {
      return;
    }

    if (type === 'videos') {
      const filtered = videosList.filter(v => v.id !== id);
      setVideosList(filtered);
      localStorage.setItem('mingde_videos', JSON.stringify(filtered));
      setSuccessMsg('视频课程已被注销。');
    } else if (type === 'articles') {
      const filtered = articlesList.filter(a => a.id !== id);
      setArticlesList(filtered);
      localStorage.setItem('mingde_articles', JSON.stringify(filtered));
      setSuccessMsg('论丛文章已被下架。');
    } else if (type === 'categories') {
      const filtered = categoriesList.filter(c => c.id !== id);
      setCategoriesList(filtered);
      localStorage.setItem('mingde_categories', JSON.stringify(filtered));
      setSuccessMsg('学科分类门类已被撤销。');
    }
  };

  const getSubTabBadge = (subTabKey: typeof activeSubTab) => {
    return activeSubTab === subTabKey 
      ? 'bg-[#8A6D1C] text-white border-[#8A6D1C] font-semibold' 
      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50';
  };

  return (
    <div className="max-w-7xl mx-auto py-4 px-2 space-y-6 text-stone-800" id="admin-main-scaffold">
      
      {/* CMS Dashboard Banner */}
      <div className="bg-white border border-[#DECD9D] rounded-2xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gold-brand/5 rounded-full blur-2xl pointer-events-none" />
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="p-1 px-2.5 bg-gold-brand/12 border border-gold-brand/40 text-stone-850 font-serif font-bold text-xs rounded-full flex items-center gap-1 uppercase select-none">
              <ShieldCheck className="w-3.5 h-3.5 text-[#8A6D1C]" />
              {role === 'super_admin' ? '总纲执掌超级管理员' : (role === 'admin' ? '书院大理事学长' : '格物校勘编辑器')}
            </span>
            {user && (
              <span className="text-xs text-stone-500 font-mono">@{user.username}</span>
            )}
          </div>
          <h1 className="font-serif font-extrabold text-2xl tracking-wide text-stone-900 pt-1">
            明德天方 • 书院学术大殿 (CMS Center)
          </h1>
          <p className="text-xs text-stone-600 leading-relaxed font-light">
            奉诏在此撰定经典著作，开设论丛目纲，修编学友弟子及各治理事阁下之理事特权。
          </p>
        </div>

        <button 
          onClick={loadData}
          className="flex items-center space-x-1.5 px-4 py-2 border border-stone-200 hover:border-gold-brand hover:bg-stone-50 duration-200 text-xs rounded-lg bg-stone-50/50 cursor-pointer text-stone-700 font-mono font-bold"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>同步并刷新</span>
        </button>
      </div>

      {/* Persistent Notification Toasts */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-start space-x-2 bg-emerald-50 border border-emerald-250 text-emerald-800 p-4 rounded-xl text-xs font-serif shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </motion.div>
        )}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-start space-x-2 bg-rose-50 border border-rose-250 text-rose-800 p-4 rounded-xl text-xs font-serif shadow-sm"
          >
            <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Side-Navigation Responsive Workspace Layout */}
      <div className="flex flex-col lg:flex-row gap-8" id="admin-panel-workspace-container">
        
        {/* Left Side Navigation Bar */}
        <aside className="w-full lg:w-72 shrink-0 space-y-6">
          <div className="bg-white border border-[#DECD9D]/80 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="border-b border-stone-100 pb-3">
              <h3 className="font-serif font-bold text-xs tracking-wider text-[#8A6D1C] uppercase flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                {ln('理学执掌阁事务 (Admin Tasks)', 'Sanctuary Actions (Admin Tasks)')}
              </h3>
            </div>
            
            <nav className="flex flex-col space-y-2" id="sidebar-navigation">
              <button 
                onClick={() => setActiveSubTab('analytics')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-xs font-serif transition-colors duration-200 cursor-pointer text-left group ${
                  activeSubTab === 'analytics'
                    ? 'bg-[#8A6D1C] text-white border-[#8A6D1C] font-semibold' 
                    : 'bg-white text-stone-700 border-stone-200 hover:border-[#8A6D1C] hover:bg-stone-50'
                }`}
              >
                <BarChart3 className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                <div>
                  <div className="font-bold">{ln('平台盘卷大势', 'Platform Metrics')}</div>
                  <div className={`text-[9px] font-sans ${activeSubTab === 'analytics' ? 'text-amber-100' : 'text-stone-400'}`}>KPI Dashboard</div>
                </div>
              </button>

              {(role === 'super_admin' || role === 'admin') && (
                <button 
                  onClick={() => setActiveSubTab('admin-mgmt')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-xs font-serif transition-colors duration-200 cursor-pointer text-left group ${
                    activeSubTab === 'admin-mgmt'
                      ? 'bg-[#8A6D1C] text-white border-[#8A6D1C] font-semibold' 
                      : 'bg-white text-stone-700 border-stone-200 hover:border-[#8A6D1C] hover:bg-stone-50'
                  }`}
                  id="tab-admin-mgmt"
                >
                  <Users className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                  <div>
                    <div className="font-bold">{ln('理事特权阁', 'Elderly Registry')}</div>
                    <div className={`text-[9px] font-sans ${activeSubTab === 'admin-mgmt' ? 'text-amber-100' : 'text-stone-400'}`}>Admin Directory</div>
                  </div>
                </button>
              )}

              <button 
                disabled={!hasPermission('manage_videos')}
                onClick={() => setActiveSubTab('videos')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-xs font-serif transition-colors duration-200 cursor-pointer text-left group disabled:opacity-40 disabled:cursor-not-allowed ${
                  activeSubTab === 'videos'
                    ? 'bg-[#8A6D1C] text-white border-[#8A6D1C] font-semibold' 
                    : 'bg-white text-stone-700 border-stone-200 hover:border-[#8A6D1C] hover:bg-stone-50'
                }`}
              >
                <Tv className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                <div>
                  <div className="font-bold">{ln('新刻视频录播', 'Lecture Registrar')}</div>
                  <div className={`text-[9px] font-sans ${activeSubTab === 'videos' ? 'text-amber-100' : 'text-stone-400'}`}>Syllabus Assets</div>
                </div>
              </button>

              <button 
                disabled={!hasPermission('create_articles')}
                onClick={() => setActiveSubTab('articles')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-xs font-serif transition-colors duration-200 cursor-pointer text-left group disabled:opacity-40 disabled:cursor-not-allowed ${
                  activeSubTab === 'articles'
                    ? 'bg-[#8A6D1C] text-white border-[#8A6D1C] font-semibold' 
                    : 'bg-white text-stone-700 border-stone-200 hover:border-[#8A6D1C] hover:bg-stone-50'
                }`}
              >
                <BookOpen className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                <div>
                  <div className="font-bold">{ln('刊修学术大作', 'Epistle Publisher')}</div>
                  <div className={`text-[9px] font-sans ${activeSubTab === 'articles' ? 'text-amber-100' : 'text-stone-400'}`}>Epistles & Papers</div>
                </div>
              </button>

              <button 
                disabled={!hasPermission('manage_categories')}
                onClick={() => setActiveSubTab('categories')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-xs font-serif transition-colors duration-200 cursor-pointer text-left group disabled:opacity-40 disabled:cursor-not-allowed ${
                  activeSubTab === 'categories'
                    ? 'bg-[#8A6D1C] text-white border-[#8A6D1C] font-semibold' 
                    : 'bg-white text-stone-700 border-stone-200 hover:border-[#8A6D1C] hover:bg-stone-50'
                }`}
              >
                <Layers className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                <div>
                  <div className="font-bold">{ln('新置经典分类', 'Column Directory')}</div>
                  <div className={`text-[9px] font-sans ${activeSubTab === 'categories' ? 'text-amber-100' : 'text-stone-400'}`}>Columns (学科)</div>
                </div>
              </button>

              {(role === 'super_admin' || role === 'admin') && (
                <button 
                  onClick={() => setActiveSubTab('logs')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-xs font-serif transition-colors duration-200 cursor-pointer text-left group ${
                    activeSubTab === 'logs'
                      ? 'bg-[#8A6D1C] text-white border-[#8A6D1C] font-semibold' 
                      : 'bg-white text-stone-700 border-stone-200 hover:border-[#8A6D1C] hover:bg-stone-50'
                  }`}
                >
                  <Activity className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                  <div>
                    <div className="font-bold">{ln('安全审计日志', 'Security Audit Logs')}</div>
                    <div className={`text-[9px] font-sans ${activeSubTab === 'logs' ? 'text-amber-100' : 'text-stone-400'}`}>Audit Trails</div>
                  </div>
                </button>
              )}

              {(role === 'super_admin' || role === 'admin' || role === 'editor') && (
                <button 
                  onClick={() => setActiveSubTab('settings')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-xs font-serif transition-colors duration-200 cursor-pointer text-left group ${
                    activeSubTab === 'settings'
                      ? 'bg-[#8A6D1C] text-white border-[#8A6D1C] font-semibold' 
                      : 'bg-white text-stone-700 border-stone-200 hover:border-[#8A6D1C] hover:bg-stone-50'
                  }`}
                  id="tab-settings"
                >
                  <Settings className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                  <div>
                    <div className="font-bold">{ln('书院介绍配置', 'Circle Settings')}</div>
                    <div className={`text-[9px] font-sans ${activeSubTab === 'settings' ? 'text-amber-100' : 'text-stone-400'}`}>About & Contact</div>
                  </div>
                </button>
              )}
            </nav>
          </div>

          {/* Resident Board Session Profile */}
          {user && (
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-3 font-serif">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-[#8A6D1C]/15 border border-[#8A6D1C]/35 flex items-center justify-center font-bold text-xs text-[#8A6D1C]">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="text-left text-xs">
                  <div className="font-bold text-stone-900 truncate max-w-[150px]">{user.username}</div>
                  <div className="text-[10px] text-stone-500 font-mono font-light truncate max-w-[150px]">{user.email}</div>
                </div>
              </div>
              <div className="text-[10px] text-stone-500 leading-tight border-t border-stone-200/50 pt-2 text-left font-light">
                {ln('当前会话已建立。此设备受大殿最高级审计守护。', 'Session active. This device is protected by top-grade library security audits.')}
              </div>
            </div>
          )}
        </aside>

        {/* Right Side Adaptive Workspace Area */}
        <div className="flex-grow min-w-0">
          {loading && <div className="py-16 text-center text-xs font-serif text-[#81600D]">{ln('大殿藏卷正在高速编排同步中...', 'Synchronizing scholarly assets...')}</div>}

          {!loading && (
            <div className="pt-0">

              {/* TAB 1: ANALYTICS INDEX */}
              {activeSubTab === 'analytics' && (
                <div className="space-y-8" id="view-analytics">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { title: ln('播发经典课典', 'Lectures Published'), val: videosList.length, label: ln('视界高保真藏影', 'High-Res Videos') },
                      { title: ln('名家学术卷集', 'Scholarly Epistles'), val: articlesList.length, label: ln('核定撰刊之汉合论文', 'Approved Scholarly Papers') },
                      { title: ln('学问分类科目', 'Column Directory'), val: categoriesList.length, label: ln('西域及儒回各学科树', 'Thematic Columns List') },
                      { title: ln('平台理事注册量', 'Elders Registered'), val: usersList.length || 1, label: ln('理学阁特权理事人数', 'Authorized Controllers') }
                    ].map((k, i) => (
                      <div key={i} className="p-6 bg-white border border-stone-200 rounded-xl space-y-1 text-left relative shadow-sm">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-stone-500 font-mono">{k.title}</div>
                        <div className="text-3xl font-serif font-extrabold text-[#8A6D1C]">{k.val}</div>
                        <div className="text-[10px] text-stone-400 font-sans">{k.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Lists of Content Quick Editor */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Videos catalog */}
                    <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
                      <h3 className="font-serif text-xs tracking-widest font-bold text-stone-800 uppercase flex items-center gap-1.5 border-b border-stone-100 pb-3">
                        <Tv className="w-4 h-4 text-[#8A6D1C]" />
                        {ln('视频课程资源清册', 'Lecture Video Registry')} ({videosList.length} {ln('件', 'items')})
                      </h3>
                      <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
                        {videosList.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-[#DECD9D]/80 rounded-xl px-4 bg-[#FAF8F5]/30" id="empty-videos-placeholder">
                            <div className="p-3 bg-[#8A6D1C]/10 rounded-full text-[#8A6D1C] mb-3">
                              <Tv className="w-5 h-5" />
                            </div>
                            <h4 className="font-serif font-bold text-xs text-stone-850">{ln('研影大典空空如也 (No Class Videos Available)', 'Syllabus Vault Empty')}</h4>
                            <p className="text-[10px] text-stone-500 font-sans max-w-xs mt-1.5 leading-relaxed font-light">
                              {ln('大殿下暂未录入任何学术影视课程资源。学长及理事官可前往发布新刻录像。', 'No lecture video recordings registered yet in this session. Elders can publish new items in the next tabs.')}
                            </p>
                            {hasPermission('manage_videos') && (
                              <button
                                onClick={() => setActiveSubTab('videos')}
                                className="mt-4 flex items-center space-x-1 px-3 py-1.5 bg-[#8A6D1C] hover:bg-[#725816] text-[#FAF8F5] text-[10px] font-bold font-serif rounded-lg cursor-pointer transition-all duration-150 shadow-sm"
                                id="btn-cta-add-video"
                              >
                                <Plus className="w-3 h-3 text-[#FAF8F5]" />
                                <span>{ln('登归录像大典', 'Register Video Lecture')}</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          videosList.map((v) => (
                            <div key={v.id} className="flex items-center justify-between text-xs py-3.5 border-b border-stone-100/70 font-sans hover:bg-stone-50/50 px-2 rounded duration-150">
                              <div className="truncate max-w-[280px]">
                                <span className="font-semibold text-stone-850 block truncate">{v.title}</span>
                                <span className="text-[10px] text-stone-400">{ln('主讲', 'Speaker')}: {v.authorName} • {v.qualityLevels[0]}</span>
                              </div>
                              <div className="flex items-center space-x-2 shrink-0">
                                <span className="text-[10px] px-1.5 py-0.5 bg-stone-100 border rounded text-stone-500 font-mono">{v.views} {ln('播放', 'plays')}</span>
                                <button
                                  hidden={!hasPermission('delete_content')}
                                  onClick={() => handleDeleteContent(v.id, 'videos')}
                                  className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded duration-150 cursor-pointer"
                                  id={`del-vid-${v.id}`}
                                  title={ln('注销', 'Delete')}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Articles catalog */}
                    <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
                      <h3 className="font-serif text-xs tracking-widest font-bold text-stone-800 uppercase flex items-center gap-1.5 border-b border-stone-100 pb-3">
                        <BookOpen className="w-4 h-4 text-[#8A6D1C]" />
                        {ln('刊典学术论文清册', 'Epistles & Papers Catalog')} ({articlesList.length} {ln('件', 'items')})
                      </h3>
                      <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
                        {articlesList.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-[#DECD9D]/80 rounded-xl px-4 bg-[#FAF8F5]/30" id="empty-articles-placeholder">
                            <div className="p-3 bg-[#8A6D1C]/10 rounded-full text-[#8A6D1C] mb-3">
                              <BookOpen className="w-5 h-5" />
                            </div>
                            <h4 className="font-serif font-bold text-xs text-stone-850">{ln('学术撰刊暂未开编 (No Articles Compiled)', 'No Epistles Compiled Yet')}</h4>
                            <p className="text-[10px] text-stone-500 font-sans max-w-xs mt-1.5 leading-relaxed font-light">
                              {ln('此世修学馆内尚未刻印任何学术刊典大作。各位硕儒掌院可开编撰写论文献辞。', 'No scholarly papers compiled yet in this library. Authorized Resident Scribes can open the writer suite.')}
                            </p>
                            {hasPermission('create_articles') && (
                              <button
                                onClick={() => setActiveSubTab('articles')}
                                className="mt-4 flex items-center space-x-1 px-3 py-1.5 bg-[#8A6D1C] hover:bg-[#725816] text-[#FAF8F5] text-[10px] font-bold font-serif rounded-lg cursor-pointer transition-all duration-150 shadow-sm"
                                id="btn-cta-add-article"
                              >
                                <Plus className="w-3 h-3 text-[#FAF8F5]" />
                                <span>{ln('刊制新章文献', 'Compose Paper')}</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          articlesList.map((a) => (
                            <div key={a.id} className="flex items-center justify-between text-xs py-3.5 border-b border-stone-100/70 font-sans hover:bg-stone-50/50 px-2 rounded duration-150">
                              <div className="truncate max-w-[280px]">
                                <span className="font-semibold text-stone-850 block truncate flex items-center gap-1.5 font-serif">
                                  {a.title}
                                  {a.draft && <span className="bg-amber-100 border border-amber-300 text-amber-800 font-mono text-[9px] px-1 rounded">{ln('草稿', 'Draft')}</span>}
                                </span>
                                <span className="text-[10px] text-stone-400">{ln('著者', 'Author')}: {a.authorName} • {a.readTime} {ln('分钟', 'mins')}</span>
                              </div>
                              <div className="flex items-center space-x-2 shrink-0">
                                <span className="text-[10px] px-1.5 py-0.5 bg-stone-100 border rounded text-stone-500 font-mono">{a.views} {ln('阅览', 'views')}</span>
                                <button
                                  hidden={!hasPermission('delete_content')}
                                  onClick={() => handleDeleteContent(a.id, 'articles')}
                                  className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded duration-150 cursor-pointer"
                                  id={`del-art-${a.id}`}
                                  title={ln('编删', 'Delete')}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 2: ROSTER ADMINISTRATOR MANAGEMENT */}
              {activeSubTab === 'admin-mgmt' && (role === 'super_admin' || role === 'admin') && (
                <div className="space-y-6 text-left" id="view-admin-management">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
                        <Users className="w-5 h-5 text-[#8A6D1C]" />
                        {ln('书院理事特权治理所 (CMS Administration)', 'CMS Admin Directory & Registry')}
                      </h3>
                      <p className="text-xs text-stone-500 leading-relaxed max-w-2xl font-light">
                        {ln('理学阁管理员名录专版。超级管理员拥有增订、任命、暂缓、注销其它学友和掌理事席位的终极至高特权。', 'Authorized Registry list of library administrators. Super Admin has final authority to register, edit, suspend or revoke controllers.')}
                      </p>
                    </div>

                {role === 'super_admin' && (
                  <button
                    onClick={() => {
                      updateDefaultPermissionsForRole('editor');
                      setAdminRole('editor');
                      setAdminUsername('');
                      setAdminEmail('');
                      setAdminPasswordRaw('');
                      setEditUserId(null);
                      setShowAddForm(!showAddForm);
                    }}
                    className="flex items-center space-x-1.5 px-4  py-2 bg-[#8A6D1C] hover:bg-[#725816] text-[#FAF8F5] text-xs font-serif font-bold rounded-lg cursor-pointer transition-colors shadow-sm"
                    id="btn-add-admin-panel"
                  >
                    <Plus className="w-3.5 h-3.5 text-yellow-350" />
                    <span>{ln('聘用新讲席理事', 'Hire New Controller')}</span>
                  </button>
                )}
              </div>

              {/* Add Admin Form Block */}
              {showAddForm && role === 'super_admin' && (
                <div className="p-6 border border-[#DECD9D] bg-gold-brand/5 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-gold-brand/20 pb-3">
                    <h4 className="font-serif font-bold text-xs tracking-widest text-[#81600D] uppercase">
                      ✍️ {ln('撰定新理事学席资格证书 (Hire New Administrator)', 'Hire New Scholarly Controller')}
                    </h4>
                    <button onClick={() => setShowAddForm(false)} className="text-stone-500 text-xs">{ln('取消', 'Cancel')}</button>
                  </div>

                  <form onSubmit={handleCreateAdmin} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">{ln('用户名 (登入识别，不可含空格)', 'Username (No spaces allowed)')}</label>
                        <input
                          type="text"
                          required
                          value={adminUsername}
                          onChange={(e) => setAdminUsername(e.target.value.replace(/\s+/g, ''))}
                          placeholder="e.g. adminger"
                          className="block w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded focus:outline-none focus:border-[#8A6D1C]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">{ln('保全恢复邮箱 (Password recovery email)', 'Recovery Email (Password recovery)')}</label>
                        <input
                          type="email"
                          required
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          placeholder="e.g. recovery@domain.com"
                          className="block w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded focus:outline-none focus:border-[#8A6D1C]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">{ln('初始印信密码 (At least 6 characters)', 'Initial Vault Key / Password (min 6 chars)')}</label>
                        <input
                          type="password"
                          required
                          value={adminPasswordRaw}
                          onChange={(e) => setAdminPasswordRaw(e.target.value)}
                          placeholder="Password"
                          className="block w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded focus:outline-none focus:border-[#8A6D1C]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">{ln('理事衔派级别 (Role)', 'Assigned Scribe Role')}</label>
                        <select
                          value={adminRole}
                          onChange={(e) => {
                            const newR = e.target.value as UserRole;
                            setAdminRole(newR);
                            updateDefaultPermissionsForRole(newR);
                          }}
                          className="block w-full px-3 py-1.5 text-xs bg-white border border-stone-200 rounded cursor-pointer text-stone-950"
                        >
                          <option value="super_admin">{ln('总监督超级理事 (Super Admin)', 'Super Administrator (Super Admin)')}</option>
                          <option value="admin">{ln('书院学长高级理事 (Admin)', 'Senior Elder (Admin)')}</option>
                          <option value="editor">{ln('格物校勘撰校理事 (Editor)', 'Scribe Editor (Content Editor)')}</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-xs font-extrabold text-[#81600D] font-serif tracking-wide">
                        🔐 {ln('理务精授微权委凭 (Granular Permissions List)', 'Granular Permissions Commission Certificate')}
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white/70 border p-3.5 rounded-xl text-stone-700 select-none">
                        {[
                          { key: 'full_access', desc: ln('总纲全御 (Full Access)', 'Full Authority (Full Access)') },
                          { key: 'manage_users', desc: ln('裁任名册 (Manage Admins)', 'Manage Scribes (Manage Admins)') },
                          { key: 'manage_videos', desc: ln('理播课纲 (Manage Videos)', 'Manage Lectures (Manage Videos)') },
                          { key: 'upload_videos', desc: ln('上传影视 (Upload Videos)', 'Upload Video Files') },
                          { key: 'upload_posters', desc: ln('录挂封面 (Upload Posters)', 'Upload Posters (Covers)') },
                          { key: 'create_articles', desc: ln('撰拟文章 (Create Articles)', 'Compose Epistles (Create Articles)') },
                          { key: 'edit_articles', desc: ln('润饰校典 (Edit Articles)', 'Edit Epistles (Edit Articles)') },
                          { key: 'delete_content', desc: ln('注销藏影 (Delete Content)', 'Revoke Content (Delete Content)') },
                          { key: 'manage_categories', desc: ln('分门别栏 (Manage Columns)', 'Manage Columns (Thematic Categories)') }
                        ].map((perm) => (
                          <label key={perm.key} className="flex items-center space-x-1.5 text-[11px] font-sans hover:text-[#8A6D1C] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={adminPermissions.includes(perm.key)}
                              onChange={() => togglePermissionCheckbox(perm.key)}
                              className="rounded text-[#8A6D1C] focus:ring-[#8A6D1C] w-3.5 h-3.5"
                            />
                            <span>{perm.desc}</span>
                          </label>
                        ))}
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2 bg-[#8A6D1C] hover:bg-[#725816] text-[#FAF8F5] text-xs font-bold rounded-lg cursor-pointer"
                      >
                        ✍️ {ln('签发理事圣谕委派证书', 'Commission & Save Scribe')}
                      </button>
                    </div>
                  </form>
                </div>
              )}


              {/* Password resetting modal/box */}
              {resettingUserId && (
                <div className="p-5 border border-amber-400 bg-amber-50/40 rounded-xl space-y-3 max-w-md">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs text-amber-800 font-bold font-serif flex items-center gap-1">
                      <Key className="w-3.5 h-3.5 text-amber-700" />
                      重设理事密符印信 (Super Admin Bypass Reset)
                    </h4>
                    <button onClick={() => setResettingUserId(null)} className="text-stone-500 text-xs">取消</button>
                  </div>
                  <form onSubmit={handleResetAdminPasswordAction} className="flex gap-2">
                    <input
                      type="password"
                      required
                      value={newPasswordRaw}
                      onChange={(e) => setNewPasswordRaw(e.target.value)}
                      placeholder="至少6位密码文本"
                      className="px-3 py-1.5 text-xs border bg-white rounded focus:outline-none w-full"
                    />
                    <button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white px-3 text-xs rounded font-bold shrink-0">
                      改印密匙
                    </button>
                  </form>
                </div>
              )}

              {/* Users Roster Listing Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {usersList.length === 0 ? (
                  <div className="col-span-full flex flex-col items-center justify-center py-16 text-center border border-dashed border-[#DECD9D] rounded-2xl bg-white p-8 shadow-sm" id="empty-users-placeholder">
                    <div className="p-4 bg-amber-50 rounded-full text-[#8A6D1C] mb-4">
                      <Users className="w-7 h-7" />
                    </div>
                    <h4 className="font-serif font-bold text-sm text-stone-900">理学阁名册理事尚空 (No Administrators Registered)</h4>
                    <p className="text-xs text-stone-500 font-sans max-w-sm mt-2 leading-relaxed font-light">
                      名册中暂无任何特权主管或格物理事。超级管理员可任命新理事、授予差异化细分理务。
                    </p>
                    {role === 'super_admin' && (
                      <button
                        onClick={() => {
                          updateDefaultPermissionsForRole('editor');
                          setAdminRole('editor');
                          setAdminUsername('');
                          setAdminEmail('');
                          setAdminPasswordRaw('');
                          setEditUserId(null);
                          setShowAddForm(true);
                        }}
                        className="mt-6 flex items-center space-x-1.5 px-5 py-2.5 bg-[#8A6D1C] hover:bg-[#725816] text-[#FAF8F5] text-xs font-serif font-bold rounded-lg cursor-pointer transition-all duration-150 shadow-sm"
                        id="btn-cta-add-admin"
                      >
                        <Plus className="w-4 h-4 text-[#FAF8F5]" />
                        <span>聘任首位理事成员</span>
                      </button>
                    )}
                  </div>
                ) : (
                  usersList.map((ul) => {
                  const isEditing = editUserId === ul.id;
                  const isSelf = user && user.id === ul.id;

                  return (
                    <div 
                      key={ul.id} 
                      className={`p-5 rounded-2xl bg-white border transition-colors relative duration-200 shadow-sm ${
                        ul.status === 'suspended' ? 'border-rose-200 bg-rose-50/20' : 'border-stone-200'
                      }`}
                    >
                      {/* Top Row info */}
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-serif font-bold text-sm text-stone-900">{ul.username}</span>
                            {isSelf && (
                              <span className="text-[9px] bg-stone-100 border text-stone-600 px-1 rounded font-mono">
                                自己 (You)
                              </span>
                            )}
                            <span className={`w-2 h-2 rounded-full ${ul.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`} />
                          </div>
                          <div className="text-xs text-stone-500 font-mono select-all font-light">{ul.email}</div>
                        </div>

                        {/* Badges */}
                        <div className="text-right flex flex-col items-end gap-1 select-none">
                          <span className={`text-[9px] font-serif border px-1.5 py-0.5 rounded ${
                            ul.role === 'super_admin' ? 'bg-yellow-15 text-yellow-800 border-yellow-300 bg-yellow-50' : 
                            (ul.role === 'admin' ? 'bg-emerald-50 text-emerald-800 border-emerald-250' : 'bg-stone-50 border')
                          }`}>
                            {ul.role === 'super_admin' ? '总纲超级管理员' : (ul.role === 'admin' ? '书院大理事学长' : '撰校格心编辑')}
                          </span>
                        </div>
                      </div>

                      {/* Display Custom Perms lists */}
                      <div className="mt-3.5 select-none">
                        <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                          委任理学掌管微权：
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {ul.permissions && ul.permissions.length > 0 ? (
                            ul.permissions.map((p) => (
                              <span key={p} className="text-[9px] font-mono px-1.5 py-0.5 bg-stone-100/80 rounded border text-stone-600 scale-95 origin-left">
                                {p}
                              </span>
                            ))
                          ) : (
                            <span className="text-[9px] text-stone-400 font-light">暂未授予具体微权</span>
                          )}
                        </div>
                      </div>

                      {/* Editor options */}
                      {isEditing && (
                        <div className="mt-4 pt-3.5 border-t space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] uppercase font-bold text-stone-500">席位职位 (Role)</label>
                              <select
                                value={adminRole}
                                onChange={(e) => setAdminRole(e.target.value as UserRole)}
                                className="block w-full py-1 px-2 border bg-white rounded text-xs mt-0.5 cursor-pointer"
                              >
                                <option value="super_admin">超级管理员</option>
                                <option value="admin">书院高级理事学长</option>
                                <option value="editor">格物校勘编辑</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] uppercase font-bold text-stone-500">理事资格状态 (Status)</label>
                              <select
                                value={adminStatus}
                                onChange={(e) => setAdminStatus(e.target.value as 'active' | 'suspended')}
                                className="block w-full py-1 px-2 border bg-white rounded text-xs mt-0.5 cursor-pointer"
                              >
                                <option value="active">活跃有效 (Active)</option>
                                <option value="suspended">暂缓理事 (Suspended)</option>
                              </select>
                            </div>
                          </div>

                          {/* Perm list change */}
                          <div>
                            <label className="text-[10px] uppercase font-bold text-stone-500">重新委任掌管微权：</label>
                            <div className="grid grid-cols-2 gap-1 bg-stone-50/50 border p-2 rounded text-[10px] mt-1">
                              {['manage_users', 'manage_videos', 'upload_videos', 'create_articles', 'edit_articles', 'delete_content', 'manage_categories'].map(pk => (
                                <label key={pk} className="flex items-center space-x-1 hover:text-[#8A6D1C] cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={adminPermissions.includes(pk)}
                                    onChange={() => {
                                      if (adminPermissions.includes(pk)) {
                                        setAdminPermissions(prev => prev.filter(p => p !== pk));
                                      } else {
                                        setAdminPermissions(prev => [...prev, pk]);
                                      }
                                    }}
                                    className="scale-90"
                                  />
                                  <span>{pk}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          <div className="flex gap-2 justify-end pt-1">
                            <button onClick={() => setEditUserId(null)} className="px-3 py-1 bg-stone-100 rounded text-stone-500 text-xs">取消</button>
                            <button onClick={() => handleUpdateAdminFlags(ul)} className="px-3 py-1 bg-[#8A6D1C] hover:bg-[#725816] text-white rounded text-xs font-bold">
                              保存理事敕书
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Controls Buttons row (Super Admin only over others) */}
                      {role === 'super_admin' && !isEditing && (
                        <div className="flex items-center justify-end space-x-2 mt-4 pt-3 border-t border-stone-100/70 select-none">
                          <button
                            onClick={() => handleEditClick(ul)}
                            className="inline-flex items-center space-x-1 text-xs text-stone-600 hover:text-[#8A6D1C] bg-stone-50 hover:bg-[#8A6D1C]/5 p-1 px-2 rounded border"
                            title="配置各级权限"
                          >
                            <Edit className="w-3 h-3 text-stone-500" />
                            <span>改置</span>
                          </button>

                          <button
                            onClick={() => setResettingUserId(ul.id)}
                            className="inline-flex items-center space-x-1 text-xs text-stone-600 hover:text-amber-700 bg-stone-50 hover:bg-amber-50 p-1 px-2 rounded border"
                            title="重设密码"
                          >
                            <Key className="w-3 h-3 text-stone-500" />
                            <span>更印密</span>
                          </button>

                          {!isSelf && (
                            <button
                              onClick={() => handleDeleteAdminAction(ul.id)}
                              className="inline-flex items-center space-x-1 text-xs text-stone-400 hover:text-rose-600 bg-stone-50 hover:bg-rose-50 p-1 px-2 rounded border border-transparent hover:border-rose-100"
                              title="罢免理事席位"
                            >
                              <Trash2 className="w-3 h-3 text-stone-400" />
                              <span>注销</span>
                            </button>
                          )}
                        </div>
                      )}

                    </div>
                  );
                }))}
              </div>

            </div>
          )}

          {/* TAB 3: CREATE & UPLOAD VIDEO CLASSES */}
          {activeSubTab === 'videos' && hasPermission('manage_videos') && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 text-left" id="view-add-videos">
              <div className="lg:col-span-3 p-6 bg-white border border-stone-200 rounded-2xl space-y-6">
                <div>
                  <h3 className="font-serif font-bold text-lg text-stone-900">录印发布新的视频课堂 (Syllabus Archive)</h3>
                  <p className="text-xs text-stone-500 font-light mt-0.5">登记影视及研学视频专栏目录大意、讲师学者学者大名与播放参数。</p>
                </div>

                <form onSubmit={handleCreateVideo} className="space-y-4 font-sans">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700">课程讲题/名字 (Title)</label>
                      <input
                        type="text"
                        required
                        value={vTitle}
                        onChange={(e) => setVTitle(e.target.value)}
                        placeholder="如：《明末正教：刘智之微子墨笔考》"
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded focus:border-[#8A6D1C] focus:outline-none text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700">属类专栏 (Thematic Column)</label>
                      <select
                        value={vCat}
                        onChange={(e) => setVCat(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded text-xs select-none focus:outline-none cursor-pointer"
                      >
                        {categoriesList.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700">HTML5 视频直链地址 (MP4 file source link address)</label>
                    <input
                      type="text"
                      required
                      value={vUrl}
                      onChange={(e) => setVUrl(e.target.value)}
                      placeholder="https://www.w3schools.com/html/movie.mp4"
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded focus:border-[#8A6D1C] focus:outline-none text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700">流影封面图 (Highres Poster Image URL)</label>
                    <input
                      type="text"
                      required
                      value={vPoster}
                      onChange={(e) => setVPoster(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded focus:border-[#8A6D1C] focus:outline-none text-xs font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700">主讲师资学者名称 (Scholar / Author)</label>
                      <input
                        type="text"
                        value={vAuthor}
                        onChange={(e) => setVAuthor(e.target.value)}
                        placeholder="如：马正德 教授"
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded focus:border-[#8A6D1C] focus:outline-none text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700">检索标签Tags (以英文半角逗号分隔)</label>
                      <input
                        type="text"
                        value={vTags}
                        onChange={(e) => setVTags(e.target.value)}
                        placeholder="西域经典, 中土墨痕"
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded focus:border-[#8A6D1C] focus:outline-none text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700">视频分类选项 (Video Type)</label>
                      <select
                        value={vType}
                        onChange={(e) => setVType(e.target.value as 'short' | 'long')}
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded text-xs select-none focus:outline-none cursor-pointer"
                      >
                        <option value="long">🎬 精品影音讲坛 (Long Lecture)</option>
                        <option value="short">🎥 短视频画卷 (Short Video)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700">视频播放时长 (Duration in Seconds)</label>
                      <input
                        type="number"
                        required
                        value={vDuration}
                        onChange={(e) => setVDuration(Number(e.target.value))}
                        placeholder="以秒为单位，如 15 代指 15秒"
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded focus:border-[#8A6D1C] focus:outline-none text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700">论说概要简介 (Syllabus Description)</label>
                    <textarea
                      rows={3}
                      value={vDesc}
                      onChange={(e) => setVDesc(e.target.value)}
                      placeholder="撰写本精品录课的核心思想，融会学术思绪..."
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded focus:border-[#8A6D1C] focus:outline-none text-xs"
                    />
                  </div>

                  <div className="flex items-center space-x-6 border-t border-stone-100 pt-4">
                    <label className="flex items-center space-x-2 text-xs text-stone-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={vFeatured}
                        onChange={(e) => setVFeatured(e.target.checked)}
                        className="rounded text-[#8A6D1C]"
                      />
                      <span>设为学堂首页推荐要课 (Featured)</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="flex items-center justify-center space-x-2 px-6 py-2.5 bg-[#8A6D1C] hover:bg-[#725816] text-[#FAF8F5] rounded-xl font-serif font-bold tracking-wider text-xs transition-colors shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-yellow-350" />
                    <span>登归书院大典影库</span>
                  </button>
                </form>
              </div>

              {/* Side Tip rail */}
              <div className="p-6 bg-[#FAF8F5] border border-[#DECD9D] rounded-2xl text-left space-y-4 h-fit">
                <h4 className="font-serif font-bold text-xs tracking-widest text-[#8A6D1C] flex items-center gap-1.5 uppercase">
                  <ShieldCheck className="w-4 h-4" />
                  学术视频配发安全法度
                </h4>
                <p className="text-[11px] text-stone-600 leading-relaxed font-serif font-light">
                  - 课名大雅、录制端雅，禁止发布无学术研究考证价值之泛俗题材。<br />
                  - 视频及 Poster URL 必须是有效的 HTTPS 加密通道，保障在各级浏览器下均不触发安全报错或混合资源告警。
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: CREATE ARTICLES - HIGH GRADE TYPOGRAPHY */}
          {activeSubTab === 'articles' && hasPermission('create_articles') && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 text-left" id="view-add-articles">
              <div className="lg:col-span-3 p-6 bg-white border border-stone-200 rounded-2xl space-y-6">
                <div>
                  <h3 className="font-serif font-bold text-lg text-stone-900">撰书刊典学术新说大作 (Compose Epistles)</h3>
                  <p className="text-xs text-stone-500 font-light mt-0.5">宣纸级论著编辑器，采用心意格修、古典句窦修饰、并支持大典草校及首条头版特色推荐。</p>
                </div>

                <form onSubmit={handleCreateArticle} className="space-y-4 font-sans text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700">文章名卷标题 (Title)</label>
                      <input
                        type="text"
                        required
                        value={aTitle}
                        onChange={(e) => setATitle(e.target.value)}
                        placeholder="如：《清代刘智书院典礼修学思想析要》"
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded focus:border-[#8A6D1C] focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700">选择论丛分类目 (Category Column)</label>
                      <select
                        value={aCat}
                        onChange={(e) => setACat(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded focus:outline-none cursor-pointer select-none"
                      >
                        {categoriesList.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700">著者姓名 (Scholar name)</label>
                      <input
                        type="text"
                        value={aAuthor}
                        onChange={(e) => setAAuthor(e.target.value)}
                        placeholder="e.g. 刘书贤 副研究员"
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded focus:border-[#8A6D1C]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700">论作底纸封面照片 (Cover Photo URL)</label>
                      <input
                        type="text"
                        value={aCover}
                        onChange={(e) => setACover(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded focus:border-[#8A6D1C] font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700">文章考证心要大意 (Summary / Abstract)</label>
                    <input
                      type="text"
                      value={aSummary}
                      onChange={(e) => setASummary(e.target.value)}
                      placeholder="一两句凝练该考证文章要点的核心思潮陈述。"
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded focus:border-[#8A6D1C]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700">文章文卷篇幅正文的内容 (Article Body Content - 支持 Markdown)</label>
                    <textarea
                      rows={12}
                      required
                      value={aContent}
                      onChange={(e) => setAContent(e.target.value)}
                      placeholder="使用正统 Markdown 规范。建议利用 &gt; 引用古籍，用 ## 心意开题分段陈理，体现理学阁特有的东方崇高学术品味。"
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded focus:border-[#8A6D1C] font-mono leading-relaxed"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-6 border-t border-stone-100 pt-4 select-none">
                    <label className="flex items-center space-x-2 text-xs text-stone-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={aDraft}
                        onChange={(e) => setADraft(e.target.checked)}
                        className="rounded text-[#8A6D1C]"
                      />
                      <span>暂保留为草校稿 (Draft - 暂不发往前端展示)</span>
                    </label>

                    <label className="flex items-center space-x-2 text-xs text-stone-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={aFeatured}
                        onChange={(e) => setAFeatured(e.target.checked)}
                        className="rounded text-[#8A6D1C]"
                      />
                      <span>设为明日头版首推高显文献</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="flex items-center justify-center space-x-2 px-6 py-2.5 bg-[#8A6D1C] hover:bg-[#725816] text-[#FAF8F5] rounded-xl font-serif font-bold tracking-wider text-xs transition-colors shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-yellow-350" />
                    <span>刊刻发表论文大作</span>
                  </button>
                </form>
              </div>

              {/* Sidebar editing tips */}
              <div className="p-6 bg-[#FAF8F5] border border-[#DECD9D] rounded-2xl text-left space-y-4 h-fit">
                <h4 className="font-serif font-bold text-xs tracking-widest text-[#8A6D1C] flex items-center gap-1.5 uppercase">
                  <FileText className="w-4 h-4" />
                  儒雅排版指南
                </h4>
                <p className="text-[11px] text-stone-600 leading-relaxed font-serif font-light">
                  - 建议每一页论述字数宜在 800-4000 字之间，最易在显示屏端获得清澈静谧的最佳研阅精神沉浸。<br />
                  - 文章首尾用一两句经典的先哲语录，引导读者在修德治学中顿悟求知。
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: CREATE CATEGORIES Setup */}
          {activeSubTab === 'categories' && hasPermission('manage_categories') && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left" id="view-add-categories">
              <div className="lg:col-span-2 p-6 bg-white border border-stone-200 rounded-2xl space-y-6">
                <div>
                  <h3 className="font-serif font-bold text-lg text-stone-900">开设学术研学分类新门类 (Thematic Columns)</h3>
                  <p className="text-xs text-stone-500 font-light mt-0.5">构建统一宏大的中华汉合典籍经典学科门目别录。</p>
                </div>

                <form onSubmit={handleCreateCategory} className="space-y-4 font-sans text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700">专栏名称 (Column Name)</label>
                      <input
                        type="text"
                        required
                        value={cName}
                        onChange={(e) => setCName(e.target.value)}
                        placeholder="如：《中拉美学古典雕刻》"
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded focus:border-[#8A6D1C]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700">唯一拼音 Slug 标识 (Url Identifier - 必须小写无中文)</label>
                      <input
                        type="text"
                        required
                        value={cSlug}
                        onChange={(e) => setCSlug(e.target.value)}
                        placeholder="e.g. sino-arabic-carving"
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded focus:border-[#8A6D1C] font-mono text-stone-950"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700">分类宗要陈述 (Description)</label>
                    <input
                      type="text"
                      value={cDesc}
                      onChange={(e) => setCDesc(e.target.value)}
                      placeholder="旨在融贯整理清真砖雕、传统宣笔阿拉伯文书法印集等美学专栏。"
                      className="w-full px-3 py-2 bg-white border border-stone-300 rounded focus:border-[#8A6D1C]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700">应用范畴选型 (Type bounds)</label>
                      <select
                        value={cType}
                        onChange={(e) => setCType(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded cursor-pointer select-none focus:outline-none"
                      >
                        <option value="both">视频影库与论文论丛共通 (Both)</option>
                        <option value="video">仅作为视频分类 (Videos Only)</option>
                        <option value="article">仅作为学术文章分类 (Articles Only)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700">展示展示排序权重 (Order Weight)</label>
                      <input
                        type="number"
                        value={cOrder}
                        onChange={(e) => setCOrder(Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded focus:border-[#8A6D1C]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-stone-700">宣章绑定 ICON 样式</label>
                      <select
                        value={cIcon}
                        onChange={(e) => setCIcon(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded cursor-pointer select-none focus:outline-none"
                      >
                        <option value="BookOpen">法页书函 BookOpen</option>
                        <option value="Compass">丝绸指南 Compass</option>
                        <option value="Feather">宣砚行书 Feather</option>
                        <option value="Mic">泰和讲演 Mic</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="flex items-center justify-center space-x-2 px-6 py-2.5 bg-[#8A6D1C] hover:bg-[#725816] text-[#FAF8F5] rounded-xl font-serif font-bold tracking-wider text-xs transition-colors shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-yellow-350" />
                    <span>设立归档此分类专栏</span>
                  </button>
                </form>
              </div>

              {/* Current Categories display List */}
              <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4">
                <h3 className="font-serif text-xs tracking-widest font-bold text-stone-800 uppercase flex items-center justify-between border-b pb-3 select-none">
                  <span>书院已设专栏门类</span>
                  <span className="text-[10px] bg-stone-100 px-1.5 py-0.5 rounded text-stone-500 font-mono font-normal">
                    {categoriesList.length}
                  </span>
                </h3>
                <div className="space-y-2">
                  {categoriesList.map(c => (
                    <div key={c.id} className="flex justify-between items-center text-xs p-3.5 bg-stone-100/50 border border-stone-200/60 rounded-xl hover:bg-stone-100 duration-150">
                      <div>
                        <span className="text-stone-900 font-serif font-bold">{c.name}</span>
                        <div className="text-[10px] text-stone-400 mt-0.5 font-mono font-light">
                          Id/Slug: {c.slug} | 权重: {c.displayOrder}
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteContent(c.id, 'categories')}
                        className="text-rose-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 duration-200 cursor-pointer"
                        id={`del-cat-${c.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: AUDIT ACTION LOGS */}
          {activeSubTab === 'logs' && (role === 'super_admin' || role === 'admin') && (
            <div className="bg-white border border-stone-200 rounded-2xl p-6 text-left space-y-6" id="view-activity-logs">
              <div>
                <h3 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-amber-500 animate-pulse" />
                  书院教政治安审计大典 (Security Audit logs)
                </h3>
                <p className="text-xs text-stone-500 mt-0.5 leading-relaxed font-light">
                  本卷严格记录书院全体理事在学堂管理、修改圣典著作卷册、重新更动或授任高级理事权限以及登入安全性的实时事务。
                </p>
              </div>

              {role === 'super_admin' && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-amber-50/40 border border-[#DECD9D]/60 rounded-2xl" id="superadmin-export-panel">
                  <div className="space-y-1">
                    <p className="text-xs font-serif font-bold text-[#8A6D1C] flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" />
                      最高理事安全审计导出特权 (Super Admin Audit Export)
                    </p>
                    <p className="text-[10px] text-stone-500 font-sans leading-relaxed">
                      您可将本次审查名册大典内的所有活动安全日志一键刻印下载、以便离线封存。
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={exportToCSV}
                      className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#DECD9D] hover:bg-stone-50 text-stone-700 text-xs font-serif font-bold rounded-xl cursor-pointer transition-colors"
                      id="btn-export-csv"
                      title="导出为 CSV 表格善本"
                    >
                      <Download className="w-3.5 h-3.5 text-[#8A6D1C]" />
                      <span>导出 CSV 件</span>
                    </button>
                    <button
                      onClick={exportToPDF}
                      className="flex items-center gap-1.5 px-3 py-2 bg-[#8A6D1C] hover:bg-[#725816] text-[#FAF8F5] text-xs font-serif font-bold rounded-xl cursor-pointer transition-colors shadow-sm"
                      id="btn-export-pdf"
                      title="印制 PDF 安全报告善本"
                    >
                      <Printer className="w-3.5 h-3.5 text-[#FAF8F5]" />
                      <span>印制 PDF 书卷</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                {activityLogs.length === 0 ? (
                  <p className="text-xs font-serif text-stone-400 py-10 text-center">暂无录入的安全治理日志痕迹。</p>
                ) : (
                  activityLogs.map((log) => (
                    <div 
                      key={log.id} 
                      className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-[11px] hover:bg-stone-50 duration-150 ${
                        log.action === 'LOGIN_FAILED' || log.action === 'LOGIN_SUSPENDED'
                          ? 'bg-rose-50/20 border-rose-100 text-rose-900' 
                          : 'bg-stone-50/40 border-stone-100'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 border rounded text-[9px] font-bold ${
                            log.action === 'LOGIN_SUCCESS' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 
                            (log.action.includes('FAILED') ? 'bg-rose-50 text-rose-700 border-rose-300' : 'bg-stone-100 text-stone-700')
                          }`}>
                            {log.action}
                          </span>
                          <span className="text-stone-800 font-bold font-serif text-xs">{log.details}</span>
                        </div>
                        <div className="text-[10px] text-stone-500 leading-relaxed">
                          理务监修官：<span className="font-bold text-[#81600D]">@{log.username}</span> ({log.email}) 
                          {log.ipAddress && ` • 终端IP: ${log.ipAddress}`}
                        </div>
                      </div>

                      <span className="text-[10px] text-stone-400 shrink-0 select-none text-right font-light">
                        {log.timestamp ? log.timestamp.replace('T', ' ').substring(0, 19) : ''}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 7: SITE SETTINGS */}
          {activeSubTab === 'settings' && (role === 'super_admin' || role === 'admin' || role === 'editor') && (
            <div className="bg-white border border-stone-200 rounded-2xl p-6 md:p-8 text-left space-y-8" id="view-site-settings">
              <div>
                <h3 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-[#8A6D1C] rotate-45" />
                  书院多语言基本信息设置 (Circle Platform Settings)
                </h3>
                <p className="text-xs text-stone-500 mt-0.5 leading-relaxed font-light">
                  您可在此处决定书院「关于我们」及「联系我们」页面的所有常驻文字，保存之后用户端将会实时更新。
                </p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-8 font-sans">
                
                {/* PART 1: INTRO SECTION */}
                <div className="space-y-4 border-l-2 border-[#8A6D1C] pl-4">
                  <h4 className="font-serif text-sm font-bold text-[#8A6D1C]">1. 书院名鉴及引言 (About Section Intro)</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-stone-600">主标题 (中文)</label>
                      <input 
                        type="text"
                        value={aboutMainTitleZh}
                        onChange={(e) => setAboutMainTitleZh(e.target.value)}
                        className="w-full text-xs p-3 border border-stone-200 rounded-xl focus:border-[#8A6D1C] focus:ring-1 focus:ring-[#8A6D1C] outline-none"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-stone-600">Main Title (English)</label>
                      <input 
                        type="text"
                        value={aboutMainTitleEn}
                        onChange={(e) => setAboutMainTitleEn(e.target.value)}
                        className="w-full text-xs p-3 border border-stone-200 rounded-xl focus:border-[#8A6D1C] focus:ring-1 focus:ring-[#8A6D1C] outline-none font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-stone-600">副标语 (中文)</label>
                      <input 
                        type="text"
                        value={aboutSubtitleZh}
                        onChange={(e) => setAboutSubtitleZh(e.target.value)}
                        className="w-full text-xs p-3 border border-stone-200 rounded-xl focus:border-[#8A6D1C] focus:ring-1 focus:ring-[#8A6D1C] outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-stone-600">Sub-Title (English)</label>
                      <input 
                        type="text"
                        value={aboutSubtitleEn}
                        onChange={(e) => setAboutSubtitleEn(e.target.value)}
                        className="w-full text-xs p-3 border border-stone-200 rounded-xl focus:border-[#8A6D1C] focus:ring-1 focus:ring-[#8A6D1C] outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-stone-600">主引言大段落 (中文)</label>
                      <textarea 
                        rows={5}
                        value={aboutParagraphZh}
                        onChange={(e) => setAboutParagraphZh(e.target.value)}
                        className="w-full text-xs p-3 border border-stone-200 rounded-xl focus:border-[#8A6D1C] focus:ring-1 focus:ring-[#8A6D1C] outline-none leading-relaxed"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-stone-600">Main Paragraph (English)</label>
                      <textarea 
                        rows={5}
                        value={aboutParagraphEn}
                        onChange={(e) => setAboutParagraphEn(e.target.value)}
                        className="w-full text-xs p-3 border border-stone-200 rounded-xl focus:border-[#8A6D1C] focus:ring-1 focus:ring-[#8A6D1C] outline-none font-mono leading-relaxed"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* PART 2: CORE VALUES */}
                <div className="space-y-4 border-l-2 border-emerald-600 pl-4">
                  <h4 className="font-serif text-sm font-bold text-emerald-800">2. 书院宗门三大价值观 (Core Values Grid)</h4>
                  
                  {/* Value 1 */}
                  <div className="p-4 bg-stone-50 rounded-2xl space-y-3 border border-stone-100">
                    <span className="text-[10px] uppercase font-bold text-stone-500 font-mono">Tenet 1: Academic Focus</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] text-stone-600">价值观一名称 (中文)</label>
                        <input 
                          type="text"
                          value={valueClassicTitleZh}
                          onChange={(e) => setValueClassicTitleZh(e.target.value)}
                          className="w-full text-xs p-2.5 bg-white border border-stone-250 rounded-lg outline-none"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-stone-600">Tenet 1 Title (English)</label>
                        <input 
                          type="text"
                          value={valueClassicTitleEn}
                          onChange={(e) => setValueClassicTitleEn(e.target.value)}
                          className="w-full text-xs p-2.5 bg-white border border-stone-250 rounded-lg outline-none font-mono"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] text-stone-600">价值观一释义 (中文)</label>
                        <textarea 
                          rows={2}
                          value={valueClassicDescZh}
                          onChange={(e) => setValueClassicDescZh(e.target.value)}
                          className="w-full text-xs p-2.5 bg-white border border-stone-250 rounded-lg outline-none"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-stone-600">Tenet 1 Description (English)</label>
                        <textarea 
                          rows={2}
                          value={valueClassicDescEn}
                          onChange={(e) => setValueClassicDescEn(e.target.value)}
                          className="w-full text-xs p-2.5 bg-white border border-stone-250 rounded-lg outline-none font-mono"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Value 2 */}
                  <div className="p-4 bg-stone-50 rounded-2xl space-y-3 border border-stone-100">
                    <span className="text-[10px] uppercase font-bold text-stone-500 font-mono">Tenet 2: Aesthetics</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] text-stone-600">价值观二名称 (中文)</label>
                        <input 
                          type="text"
                          value={valueAestheticTitleZh}
                          onChange={(e) => setValueAestheticTitleZh(e.target.value)}
                          className="w-full text-xs p-2.5 bg-white border border-stone-250 rounded-lg outline-none"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-stone-600">Tenet 2 Title (English)</label>
                        <input 
                          type="text"
                          value={valueAestheticTitleEn}
                          onChange={(e) => setValueAestheticTitleEn(e.target.value)}
                          className="w-full text-xs p-2.5 bg-white border border-stone-250 rounded-lg outline-none font-mono"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] text-stone-600">价值观二释义 (中文)</label>
                        <textarea 
                          rows={2}
                          value={valueAestheticDescZh}
                          onChange={(e) => setValueAestheticDescZh(e.target.value)}
                          className="w-full text-xs p-2.5 bg-white border border-stone-250 rounded-lg outline-none"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-stone-600">Tenet 2 Description (English)</label>
                        <textarea 
                          rows={2}
                          value={valueAestheticDescEn}
                          onChange={(e) => setValueAestheticDescEn(e.target.value)}
                          className="w-full text-xs p-2.5 bg-white border border-stone-250 rounded-lg outline-none font-mono"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Value 3 */}
                  <div className="p-4 bg-stone-50 rounded-2xl space-y-3 border border-stone-100">
                    <span className="text-[10px] uppercase font-bold text-stone-500 font-mono">Tenet 3: Harmony</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] text-stone-600">价值观三名称 (中文)</label>
                        <input 
                          type="text"
                          value={valueInterTitleZh}
                          onChange={(e) => setValueInterTitleZh(e.target.value)}
                          className="w-full text-xs p-2.5 bg-white border border-stone-250 rounded-lg outline-none"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-stone-600">Tenet 3 Title (English)</label>
                        <input 
                          type="text"
                          value={valueInterTitleEn}
                          onChange={(e) => setValueInterTitleEn(e.target.value)}
                          className="w-full text-xs p-2.5 bg-white border border-stone-250 rounded-lg outline-none font-mono"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] text-stone-600">价值观三释义 (中文)</label>
                        <textarea 
                          rows={2}
                          value={valueInterDescZh}
                          onChange={(e) => setValueInterDescZh(e.target.value)}
                          className="w-full text-xs p-2.5 bg-white border border-stone-250 rounded-lg outline-none"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-stone-600">Tenet 3 Description (English)</label>
                        <textarea 
                          rows={2}
                          value={valueInterDescEn}
                          onChange={(e) => setValueInterDescEn(e.target.value)}
                          className="w-full text-xs p-2.5 bg-white border border-stone-250 rounded-lg outline-none font-mono"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* PART 3: CONTACT INFORMATION */}
                <div className="space-y-4 border-l-2 border-stone-400 pl-4">
                  <h4 className="font-serif text-sm font-bold text-stone-700">3. 联系方式 & 馆务咨询 (Contact info configuration)</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-stone-600">联系栏目副标题 (中文)</label>
                      <input 
                        type="text"
                        value={contactTitleZh}
                        onChange={(e) => setContactTitleZh(e.target.value)}
                        className="w-full text-xs p-3 border border-stone-200 rounded-xl outline-none"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-stone-600">Contact Tag Section (English)</label>
                      <input 
                        type="text"
                        value={contactTitleEn}
                        onChange={(e) => setContactTitleEn(e.target.value)}
                        className="w-full text-xs p-3 border border-stone-200 rounded-xl outline-none font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-stone-600">联系栏目大标题 (中文)</label>
                      <input 
                        type="text"
                        value={contactSubtitleZh}
                        onChange={(e) => setContactSubtitleZh(e.target.value)}
                        className="w-full text-xs p-3 border border-stone-200 rounded-xl outline-none"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-stone-600">Contact Section Subtitle (English)</label>
                      <input 
                        type="text"
                        value={contactSubtitleEn}
                        onChange={(e) => setContactSubtitleEn(e.target.value)}
                        className="w-full text-xs p-3 border border-stone-200 rounded-xl outline-none font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-stone-600">联系说明短文 (中文)</label>
                      <textarea 
                        rows={3}
                        value={contactDescZh}
                        onChange={(e) => setContactDescZh(e.target.value)}
                        className="w-full text-xs p-3 border border-stone-200 rounded-xl outline-none"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-stone-600">Contact Section Desc (English)</label>
                      <textarea 
                        rows={3}
                        value={contactDescEn}
                        onChange={(e) => setContactDescEn(e.target.value)}
                        className="w-full text-xs p-3 border border-stone-200 rounded-xl outline-none font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-stone-600">书院实体地址 (中文)</label>
                      <input 
                        type="text"
                        value={contactAddressZh}
                        onChange={(e) => setContactAddressZh(e.target.value)}
                        className="w-full text-xs p-3 border border-stone-200 rounded-xl outline-none"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-stone-600">Physical Address (English)</label>
                      <input 
                        type="text"
                        value={contactAddressEn}
                        onChange={(e) => setContactAddressEn(e.target.value)}
                        className="w-full text-xs p-3 border border-stone-200 rounded-xl outline-none font-mono"
                        required
                      />
                    </div>
                  </div>

                  {/* Phone & Email (Universal) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-stone-600">官方电子邮箱 (Universal Address)</label>
                      <input 
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="w-full text-xs p-3 border border-stone-200 rounded-xl font-mono outline-none"
                        placeholder="library@mingde-tianfang.org"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-stone-600">官方联络电话 (Universal Number)</label>
                      <input 
                        type="text"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="w-full text-xs p-3 border border-stone-200 rounded-xl font-mono outline-none"
                        placeholder="+86 (010) 6512-8800"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-200 flex justify-end">
                  <button 
                    type="submit"
                    disabled={savingSettings}
                    className="flex items-center gap-1.5 px-6 py-3 bg-[#8A6D1C] hover:bg-[#725816] disabled:bg-stone-300 disabled:cursor-not-allowed text-white text-xs font-serif font-bold rounded-xl cursor-pointer transition-colors shadow-sm"
                  >
                    <Save className="w-4 h-4 text-white" />
                    <span>{savingSettings ? ln('同步中...', 'Synchronizing...') : ln('保存书院基本配置', 'Save Circle Settings')}</span>
                  </button>
                </div>

              </form>
            </div>
          )}
            </div>
          )}
        </div> {/* Close flex-grow adaptive workspace */}
      </div> {/* Close admin-panel-workspace-container */}

    </div>
  );
};
