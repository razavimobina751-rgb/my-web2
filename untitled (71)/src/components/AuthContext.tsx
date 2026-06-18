import React, { createContext, useContext, useEffect, useState } from 'react';

export type UserRole = 'super_admin' | 'admin' | 'editor' | 'viewer';

export interface CMSUserProfile {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  status: 'active' | 'suspended';
  permissions: string[];
  created_at: string;
  updated_at?: string;
}

interface AuthContextType {
  user: CMSUserProfile | null;
  role: UserRole;
  permissions: string[];
  loading: boolean;
  loginError: string | null;
  login: (username: string, password: string, rememberMe: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
  
  // Admin-specific operations proxy
  getUsersList: () => Promise<CMSUserProfile[]>;
  createAdminUser: (data: { username: string; email: string; passwordRaw: string; role: UserRole; permissions: string[] }) => Promise<CMSUserProfile>;
  updateAdminUser: (id: string, data: { email?: string; role?: UserRole; status?: 'active' | 'suspended'; permissions?: string[] }) => Promise<CMSUserProfile>;
  deleteAdminUser: (id: string) => Promise<boolean>;
  resetAdminPassword: (id: string, passwordRaw: string) => Promise<boolean>;
  getSystemLogs: () => Promise<any[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<CMSUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Helper inside client to fetch authorization headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('cms_session_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  // Validate session on first load
  useEffect(() => {
    const validateSession = async () => {
      const token = localStorage.getItem('cms_session_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/cms/session', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.profile);
        } else {
          // Token is dead, wipe local storage session
          localStorage.removeItem('cms_session_token');
          setUser(null);
        }
      } catch (err) {
        console.error('Core CMS session network validation failure:', err);
      } finally {
        setLoading(false);
      }
    };

    validateSession();
  }, []);

  const login = async (username: string, password: string, rememberMe: boolean): Promise<boolean> => {
    setLoginError(null);
    try {
      const res = await fetch('/api/cms/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, rememberMe })
      });

      const data = await res.json();

      if (!res.ok) {
        setLoginError(data.error || '登录失败，请检查您的凭据');
        return false;
      }

      // Store session token local to client
      localStorage.setItem('cms_session_token', data.token);
      setUser(data.profile);
      return true;
    } catch (err) {
      setLoginError('无法访问书院服务器。请检查您的网络连接。');
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/cms/logout', {
        method: 'POST',
        headers: getAuthHeaders()
      });
    } catch (err) {
      console.warn('Logging out offline cleanup:', err);
    } finally {
      localStorage.removeItem('cms_session_token');
      setUser(null);
    }
  };

  // Admin and management client proxies
  const getUsersList = async (): Promise<CMSUserProfile[]> => {
    const res = await fetch('/api/cms/users', { headers: getAuthHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '无法加载书院理事名册');
    return data.users;
  };

  const createAdminUser = async (data: { username: string; email: string; passwordRaw: string; role: UserRole; permissions: string[] }) => {
    const res = await fetch('/api/cms/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data)
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || '创建账户失败');
    return resData.user;
  };

  const updateAdminUser = async (id: string, data: { email?: string; role?: UserRole; status?: 'active' | 'suspended'; permissions?: string[] }) => {
    const res = await fetch(`/api/cms/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data)
    });
    const resData = await res.json();
    if (!res.ok) throw new Error(resData.error || '修改理事权职失败');
    
    // If updating self, dynamically update self state immediately
    if (user && id === user.id) {
      setUser(prev => prev ? { ...prev, ...resData.user } : null);
    }
    return resData.user;
  };

  const deleteAdminUser = async (id: string) => {
    const res = await fetch(`/api/cms/users/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '罢免账户失败');
    return true;
  };

  const resetAdminPassword = async (id: string, passwordRaw: string) => {
    const res = await fetch(`/api/cms/users/${id}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ passwordRaw })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '修改印信密码失败');
    return true;
  };

  const getSystemLogs = async () => {
    const res = await fetch('/api/cms/logs', { headers: getAuthHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '无法加载系统日志');
    return data.logs;
  };

  const activeRole = user ? user.role : 'viewer';
  const activePermissions = user ? user.permissions : [];

  return (
    <AuthContext.Provider value={{
      user,
      role: activeRole,
      permissions: activePermissions,
      loading,
      loginError,
      login,
      logout,
      getUsersList,
      createAdminUser,
      updateAdminUser,
      deleteAdminUser,
      resetAdminPassword,
      getSystemLogs
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be called within an AuthProvider subtree.');
  }
  return context;
};
