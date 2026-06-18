import React, { useEffect, useState } from 'react';
import { AuthProvider } from './components/AuthContext';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { VideoView } from './components/VideoView';
import { ArticleView } from './components/ArticleView';
import { AboutView } from './components/AboutView';
import { AdminDashboard } from './components/AdminDashboard';
import { checkAndSeedDatabase } from './data/seed';
import { LanguageProvider, useLanguage } from './components/LanguageContext';
import { VideoContent, ArticleContent } from './types';
import { Compass, BookOpen, Heart, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const MainLayout: React.FC = () => {
  const { t } = useLanguage();
  const [currentTab, setCurrentTab] = useState('home');
  const [selectedVideo, setSelectedVideo] = useState<VideoContent | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<ArticleContent | null>(null);
  const [showIntro, setShowIntro] = useState(true);

  // Auto-seed database once on startup
  useEffect(() => {
    checkAndSeedDatabase();
  }, []);

  // Dismiss intro loading screen automatically after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 3100);
    return () => clearTimeout(timer);
  }, []);

  const handleSelectVideo = (video: VideoContent | null) => {
    setSelectedVideo(video);
    if (video) {
      setSelectedArticle(null); // Deselect active reading
      setCurrentTab(video.videoType === 'long' ? 'long-videos' : 'short-videos');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSelectArticle = (article: ArticleContent | null) => {
    setSelectedArticle(article);
    if (article) {
      setSelectedVideo(null); // Deselect active play
      setCurrentTab('articles');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleChangeTab = (tab: string) => {
    setCurrentTab(tab);
    if (tab !== 'short-videos' && tab !== 'long-videos') setSelectedVideo(null);
    if (tab !== 'articles') setSelectedArticle(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* 3s MINIMALIST BRAND INTRO SPLASH */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="fixed inset-0 bg-[#FAF8F5] z-[100] flex flex-col items-center justify-center select-none overflow-hidden"
            id="intro-splash-screen"
          >
            {/* Dynamic Subtle Grid Background */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#8A6D1C 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }} />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#DECD9D]/5 via-transparent to-[#E2ECE5]/5 pointer-events-none" />

            {/* Skip Option */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: 0.5 }}
              whileHover={{ opacity: 1, scale: 1.05 }}
              onClick={() => setShowIntro(false)}
              className="absolute top-6 right-6 px-3 py-1 border border-stone-200 hover:border-stone-400 text-stone-500 hover:text-stone-700 text-[10px] font-sans rounded-full cursor-pointer transition-all duration-150 flex items-center space-x-1"
              id="intro-skip-btn"
            >
              <span>跳过</span>
              <span className="text-[8px] opacity-60">| Skip</span>
            </motion.button>

            {/* Center Animated Logo Emblem */}
            <div className="relative w-36 h-36 flex items-center justify-center mb-6">
              {/* Spinning Dashed Celestial Outer Wheel */}
              <svg className="w-36 h-36 absolute" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="47"
                  stroke="#DECD9D"
                  strokeWidth="0.75"
                  strokeDasharray="4 3"
                  fill="transparent"
                  className="animate-[spin_70s_linear_infinite]"
                />
              </svg>

              {/* Drawing Solid Golden Middle Wheel */}
              <svg className="w-32 h-32 absolute" viewBox="0 0 100 100">
                <motion.circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="#8A6D1C"
                  strokeWidth="1.2"
                  fill="transparent"
                  initial={{ strokeDasharray: "283", strokeDashoffset: "283" }}
                  animate={{ strokeDashoffset: 0 }}
                  transition={{ delay: 0.2, duration: 1.3, ease: "easeInOut" }}
                />
              </svg>

              {/* Inner Decorative Accent Ring */}
              <div className="absolute w-24 h-24 border border-[#DECD9D]/20 rounded-full flex items-center justify-center bg-[#FAF8F5] shadow-inner" />

              {/* Elegant Calligraphic "德" Symbol */}
              <motion.span
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.9, type: 'spring', stiffness: 85 }}
                className="absolute font-serif text-5xl font-extrabold text-[#8A6D1C] select-none"
                style={{ filter: 'drop-shadow(0 1px 1px rgba(138, 109, 28, 0.15))' }}
              >
                德
              </motion.span>
            </div>

            {/* Brand Titles Wrapper */}
            <div className="text-center flex flex-col items-center">
              {/* Primary Ancient Script Style Title */}
              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0, duration: 0.8, ease: 'easeOut' }}
                className="font-serif text-2xl font-bold tracking-[0.3em] pl-[0.3em] text-[#1C1917]"
              >
                明德天方书院
              </motion.h1>

              {/* Secondary Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3, duration: 0.8, ease: 'easeOut' }}
                className="mt-2.5 font-sans text-[9px] tracking-[0.45em] pl-[0.45em] text-[#81600D] font-bold uppercase"
              >
                MINGDE TIANFANG CIRCLE
              </motion.p>

              {/* Decorative Separator Line */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: 64 }}
                transition={{ delay: 1.6, duration: 0.8, ease: "easeInOut" }}
                className="h-[1px] bg-[#DECD9D] mt-5"
              />

              {/* Profound Academic Axiom */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.65 }}
                transition={{ delay: 1.9, duration: 0.8 }}
                className="mt-5 font-serif text-[11px] text-stone-600 tracking-[0.1em] px-4 text-center leading-relaxed font-light"
              >
                “ 求知，即便远在天方 ”
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-[#FAF8F2] text-stone-900 flex flex-col justify-between selection:bg-gold-brand/35 relative font-sans overflow-hidden">
      
      {/* Dynamic Atmospheric Glow Fields - Gentle Amber and Jade Washes for Parchment Feel */}
      <div className="absolute inset-0 opacity-40 pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(circle at 15% 25%, #F0E8D5 0%, transparent 60%), radial-gradient(circle at 85% 75%, #E2ECE5 0%, transparent 60%)' }} />
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-gold-brand/12 to-transparent blur-3xl pointer-events-none rounded-full" />
      <div className="absolute bottom-1/3 left-0 w-96 h-96 bg-gradient-to-tr from-green-brand/10 to-transparent blur-3xl pointer-events-none rounded-full" />

      {/* 1. STICKY HEADER NAVIGATION */}
      <Navbar currentTab={currentTab} onChangeTab={handleChangeTab} />

      {/* 2. DYNAMIC CONTENT WORKSPACE WITH MOTION TRANSITION */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab + (selectedVideo ? `-${selectedVideo.id}` : '') + (selectedArticle ? `-${selectedArticle.id}` : '')}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
          >
            {currentTab === 'home' && (
              <HomeView 
                onSelectVideo={handleSelectVideo} 
                onSelectArticle={handleSelectArticle}
                onChangeTab={handleChangeTab}
              />
            )}

            {currentTab === 'short-videos' && (
              <VideoView 
                selectedVideo={selectedVideo} 
                onSelectVideo={handleSelectVideo} 
                videoType="short"
              />
            )}

            {currentTab === 'long-videos' && (
              <VideoView 
                selectedVideo={selectedVideo} 
                onSelectVideo={handleSelectVideo} 
                videoType="long"
              />
            )}

            {currentTab === 'articles' && (
              <ArticleView 
                selectedArticle={selectedArticle} 
                onSelectArticle={handleSelectArticle} 
              />
            )}

            {currentTab === 'about' && (
              <AboutView />
            )}

            {currentTab === 'admin' && (
              <AdminDashboard />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 3. LUXURY CINEMATIC FOOTER - WITH IVORY PAPER PANEL & STONE BORDER */}
      <footer className="border-t border-stone-200 bg-stone-100/90 backdrop-blur-md py-12 relative z-10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 items-center text-center md:text-left">
          
          <div className="space-y-2">
            <h4 className="font-serif font-bold text-xs tracking-widest text-[#8A6D1C] uppercase flex items-center justify-center md:justify-start">
              <Compass className="w-4 h-4 text-[#8A6D1C] mr-2" />
              {t('brandTitle')}
            </h4>
            <p className="text-[11px] text-stone-600 font-sans max-w-xs mx-auto md:mx-0 leading-relaxed font-light">
              {t('aboutBrief')}
            </p>
          </div>

          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-1.5 h-1.5 bg-[#8A6D1C] rounded-full animate-pulse" />
            <span className="text-[10px] font-mono tracking-widest text-[#81600D] select-none uppercase font-semibold">
              MINGDE TIANFANG • CIVILIZATIONAL DIALOGUES
            </span>
          </div>

          <div className="flex flex-col items-center md:items-end justify-center space-y-1 text-[11px] text-stone-500 font-mono">
            <span>{t('brandTitle')} {t('allRightsReserved')}</span>
            <span className="text-[9px] text-[#81600D] block mt-0.5">{t('schoolMotto')}</span>
          </div>

        </div>
      </footer>

    </div>
    </>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </LanguageProvider>
  );
}
