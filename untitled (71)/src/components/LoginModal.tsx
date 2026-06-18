import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { X, Lock, ShieldCheck, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { lang } = useLanguage();
  const { login, loginError } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!username.trim() || !password) {
      setFormError(lang === 'zh' ? '请填写用户名和密码印信' : 'Please fill in both fields');
      return;
    }

    setIsLoading(true);
    const success = await login(username, password, rememberMe);
    setIsLoading(false);

    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
      />

      {/* Main Glass Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative bg-[#FAF8F5] border border-[#DECD9D] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden p-8 z-10 font-sans"
        id="login-modal-panel"
      >
        {/* Scholar Decorative Corners */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#8A6D1C] rounded-tl-lg pointer-events-none opacity-40" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#8A6D1C] rounded-tr-lg pointer-events-none opacity-40" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#8A6D1C] rounded-bl-lg pointer-events-none opacity-40" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#8A6D1C] rounded-br-lg pointer-events-none opacity-40" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full border border-stone-250 hover:bg-stone-100 text-stone-500 duration-200 cursor-pointer"
          id="btn-close-login"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal App Header */}
        <div className="text-center mb-6 mt-2">
          <div className="mx-auto w-12 h-12 rounded-full border border-gold-brand/40 bg-gold-brand/10 flex items-center justify-center mb-3">
            <Lock className="w-5 h-5 text-[#8A6D1C]" />
          </div>
          <h2 className="font-serif font-bold text-xl tracking-wider text-stone-850">
            {lang === 'zh' ? '理学阁 • 管理员登入' : 'Admin Sanctum Login'}
          </h2>
          <p className="text-[11px] font-serif text-[#81600D] tracking-widest uppercase mt-1">
            MINGDE TIANFANG CMS SECURITY PORTAL
          </p>
        </div>

        {/* Dynamic Form */}
        <form
          onSubmit={handleLogin}
          className="space-y-4"
          id="cms-login-form"
        >
          <div>
            <label className="block text-xs font-serif font-bold tracking-wider text-stone-700 mb-1">
              {lang === 'zh' ? '管理员用户名' : 'Administrator Username'}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400 font-mono text-[10px]">
                @
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={lang === 'zh' ? '请输入您的管理员账号' : 'Your admin account'}
                className="block w-full pl-8 pr-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-[#8A6D1C] focus:ring-1 focus:ring-[#8A6D1C] text-stone-900 duration-150"
                id="login-username-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-serif font-bold tracking-wider text-stone-700 mb-1">
              {lang === 'zh' ? '印信密匙' : 'Pass Key'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={lang === 'zh' ? '输入该席位保全密码' : 'Password credential'}
                className="block w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-[#8A6D1C] focus:ring-1 focus:ring-[#8A6D1C] text-stone-900 duration-150"
                id="login-password-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#8A6D1C]/60 hover:text-[#8A6D1C]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember me Row */}
          <div className="flex items-center justify-between text-xs font-sans text-stone-600">
            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-stone-300 text-[#8A6D1C] focus:ring-[#8A6D1C]"
                id="chk-remember-me"
              />
              <span>{lang === 'zh' ? '记住会话(30日免签)' : 'Remember session'}</span>
            </label>
          </div>

          {/* Dynamic Error Indicator */}
          {(loginError || formError) && (
            <div className="flex items-start space-x-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg p-2.5 text-xs">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{loginError || formError}</span>
            </div>
          )}

          {/* Submit Buttons */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center space-x-2 py-2.5 bg-[#8A6D1C] hover:bg-[#725816] text-[#FAF8F5] rounded-lg font-serif font-bold text-sm tracking-widest shadow-md transition-all active:scale-[0.98]"
            id="btn-login-submit"
          >
            {isLoading ? (
              <span>正在检验符印...</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-yellow-350" />
                <span>{lang === 'zh' ? '研商理学 • 奉召登入' : 'Login to Sanctum'}</span>
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
