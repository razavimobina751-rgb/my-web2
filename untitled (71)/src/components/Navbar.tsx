import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { Menu, X, Lock, LogOut, User, Sparkles, Languages } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import brandLogo from '../assets/images/tianfang_logo_1781330724875.jpg';
import { LoginModal } from './LoginModal';

interface NavbarProps {
  currentTab: string;
  onChangeTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onChangeTab }) => {
  const { user, role, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // Check URL on load to auto-open login modal if action=reset-password is present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'reset-password' && params.get('token')) {
      setLoginModalOpen(true);
    }
  }, []);

  const getRoleBadge = (userRole: string) => {
    switch (userRole) {
      case 'super_admin':
        return { text: t('roleSuperAdmin'), class: 'bg-gold-brand/15 text-yellow-800 border-gold-brand/30' };
      case 'admin':
        return { text: t('roleAdmin'), class: 'bg-green-brand/12 text-emerald-800 border-green-brand/20' };
      case 'editor':
        return { text: t('roleEditor'), class: 'bg-amber-500/10 text-amber-800 border-amber-500/20' };
      default:
        return { text: t('roleUser'), class: 'bg-stone-100 text-stone-700 border-stone-200' };
    }
  };

  const navItems = [
    { id: 'home', label: t('navHome') },
    { id: 'short-videos', label: t('navShortVideos') },
    { id: 'long-videos', label: t('navLongVideos') },
    { id: 'articles', label: t('navArticles') },
    { id: 'about', label: t('navAbout') },
  ];

  const badge = getRoleBadge(role);

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/75 border-b border-gold-brand/25 transition-all duration-300 shadow-sm" id="main-navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo & Name with Circular High-Resolution Generated luxury crest */}
          <div 
            className="flex items-center space-x-4 cursor-pointer group"
            onClick={() => onChangeTab('home')}
            id="nav-logo"
          >
            <div className="relative w-11 h-11 border border-gold-brand/45 rounded-full flex items-center justify-center p-[1px] bg-white group-hover:border-gold-brand transition-all shadow-md overflow-hidden">
              <img
                src={brandLogo}
                alt="Mingde Tianfang Emblem"
                className="w-full h-full object-cover rounded-full"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className="block font-serif font-medium tracking-widest text-[#8A6D1C] text-md sm:text-lg group-hover:text-gold-brand transition-colors">
                {t('brandTitle')}
              </span>
              <span className="block font-mono text-[9px] tracking-widest text-[#B49A4C] select-none uppercase">
                {t('brandSubtitle')}
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-7">
            {navItems.map((item) => (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => onChangeTab(item.id)}
                className={`relative px-1 py-2 font-sans font-medium text-[13px] tracking-wider transition-colors duration-200 cursor-pointer ${
                  currentTab === item.id 
                    ? 'text-gold-brand font-semibold' 
                    : 'text-stone-700 hover:text-[#8A6D1C]'
                }`}
              >
                {item.label}
                {currentTab === item.id && (
                  <motion.div 
                    layoutId="navbar-indicator"
                    className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#8A6D1C]"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
              </button>
            ))}

            {/* Admin Center (Visible if editor, admin or super_admin) */}
            {(role === 'super_admin' || role === 'admin' || role === 'editor') && (
              <button
                id="nav-tab-admin"
                onClick={() => onChangeTab('admin')}
                className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-full border text-[11px] font-sans font-medium tracking-widest transition-all duration-300 cursor-pointer ${
                  currentTab === 'admin'
                    ? 'bg-gold-brand/20 text-stone-850 border-gold-brand/40 font-semibold'
                    : 'bg-stone-50 text-[#8A6D1C] border-gold-brand/20 hover:bg-gold-brand/10 hover:border-gold-brand/50'
                }`}
              >
                <Lock className="w-3 h-3" />
                <span>{t('navAdmin')}</span>
              </button>
            )}
          </div>

          {/* Controls Container (Bilingual Switcher & Account controls) */}
          <div className="hidden md:flex items-center space-x-4">
            
            {/* Elegant Language Switcher */}
            <button
              onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
              className="flex items-center space-x-1.5 px-3 py-1.5 hover:bg-stone-50 hover:border-gold-brand/40 duration-200 rounded-full border border-stone-200 text-xs transition-all cursor-pointer font-serif select-none bg-stone-50/50 shadow-sm"
              title={lang === 'zh' ? 'Switch to English' : '切换至中文'}
              id="lang-toggle-btn"
            >
              <Languages className="w-3.5 h-3.5 text-[#8A6D1C]" />
              <span className="text-stone-700 font-bold tracking-wider">{lang === 'zh' ? 'EN' : '中文'}</span>
            </button>

            {user ? (
              <div className="flex items-center space-x-3 bg-white border border-stone-200 py-1.5 pl-3 pr-3 rounded-full shadow-sm">
                <div className="flex flex-col items-end">
                  <span className="font-sans text-xs font-semibold text-stone-800">
                    {user.username || t('roleUser')}
                  </span>
                  <span className={`text-[8px] font-mono border px-1 rounded-sm mt-0.5 scale-90 ${badge.class}`}>
                    {badge.text}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-stone-50 border border-gold-brand/35 flex items-center justify-center cursor-pointer shadow-inner">
                  <User className="w-4 h-4 text-stone-600" />
                </div>
                <button 
                  onClick={logout}
                  id="btn-logout"
                  className="p-1 hover:text-rose-600 text-stone-400 transition-colors duration-200 cursor-pointer"
                  title={t('btnLogout')}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="btn-login"
                onClick={() => setLoginModalOpen(true)}
                className="flex items-center space-x-2 px-5 py-2 rounded-full border border-gold-brand/40 bg-white hover:bg-gold-brand/10 text-[#8A6D1C] transition-all duration-300 cursor-pointer text-xs font-sans tracking-widest shadow-md hover:shadow-gold-brand/10 active:scale-95 font-medium"
              >
                <Sparkles className="w-3.5 h-3.5 text-gold-brand" />
                <span>{t('btnJoin')}</span>
              </button>
            )}
          </div>

          {/* Mobile elements */}
          <div className="md:hidden flex items-center space-x-2">
            
            {/* Mobile language switch icon button */}
            <button
              onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
              className="p-2 border border-stone-200/80 rounded-full hover:bg-stone-50 text-stone-700 bg-white shadow-sm flex items-center justify-center cursor-pointer"
              title={lang === 'zh' ? 'Switch to English' : '切换至中文'}
              id="lang-toggle-btn-mobile"
            >
              <Languages className="w-4 h-4 text-[#8A6D1C]" />
            </button>

            {user && (
              <div className="w-8 h-8 rounded-full bg-stone-50 border border-gold-brand/35 flex items-center justify-center cursor-pointer">
                <User className="w-4 h-4 text-stone-600" />
              </div>
            )}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 ml-1 text-stone-700 hover:text-stone-950 transition-colors"
              id="mobile-menu-toggle"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden border-t border-gold-brand/20 bg-white/95 backdrop-blur-xl px-4 pt-2 pb-6 space-y-3 shadow-lg"
          >
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onChangeTab(item.id);
                  setMobileOpen(false);
                }}
                className={`block w-full text-left py-2.5 px-3 rounded-lg font-sans text-sm ${
                  currentTab === item.id
                    ? 'bg-gold-brand/10 text-gold-brand font-semibold'
                    : 'text-stone-700 hover:bg-stone-50 hover:text-stone-900'
                }`}
              >
                {item.label}
              </button>
            ))}

            {(role === 'super_admin' || role === 'admin' || role === 'editor') && (
              <button
                onClick={() => {
                  onChangeTab('admin');
                  setMobileOpen(false);
                }}
                className={`flex items-center space-x-2 w-full text-left py-2.5 px-3 rounded-lg border text-sm ${
                  currentTab === 'admin'
                    ? 'bg-gold-brand/25 text-[#8A6D1C] border-gold-brand/40 font-semibold'
                    : 'bg-stone-50 text-[#8A6D1C] border-gold-brand/10 hover:bg-stone-100'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>{t('navAdmin')}</span>
              </button>
            )}

            {user ? (
              <div className="pt-4 border-t border-stone-200 space-y-3">
                <div className="flex items-center space-x-3 px-3">
                  <div className="flex flex-col">
                    <span className="font-sans text-xs font-semibold text-stone-800">{user.username}</span>
                    <span className="text-[9px] text-stone-500">{user.email}</span>
                  </div>
                  <span className={`text-[8px] border px-1 rounded-sm ${badge.class}`}>{badge.text}</span>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileOpen(false);
                  }}
                  className="flex items-center space-x-2 w-full text-left py-2.5 px-3 text-rose-600 hover:bg-rose-50 rounded-lg text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('btnLogout')}</span>
                </button>
              </div>
            ) : (
              <div className="pt-4 border-t border-stone-250">
                <button
                  onClick={() => {
                    setLoginModalOpen(true);
                    setMobileOpen(false);
                  }}
                  className="flex items-center justify-center space-x-2 w-full py-3 bg-[#8A6D1C] hover:bg-[#725816] text-[#FAF8F5] rounded-full font-sans font-semibold tracking-widest text-sm transition-all"
                >
                  <Sparkles className="w-4 h-4 text-yellow-350" />
                  <span>{t('btnJoin')}</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </nav>
  );
};
