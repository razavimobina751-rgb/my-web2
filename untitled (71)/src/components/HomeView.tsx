import React, { useEffect, useState } from 'react';
import { collection, limit, query } from 'firebase/firestore';
import { db, safeGetDocs } from '../firebase';
import { VideoContent, ArticleContent, CategoryItem } from '../types';
import { INITIAL_CATEGORIES, INITIAL_VIDEOS, INITIAL_ARTICLES } from '../data/initialData';
import { useLanguage } from './LanguageContext';
import { Play, BookOpen, Compass, Feather, Sparkles, RefreshCw, ChevronRight, Clock, Star, ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';

interface HomeViewProps {
  onSelectVideo: (video: VideoContent) => void;
  onSelectArticle: (article: ArticleContent) => void;
  onChangeTab: (tab: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onSelectVideo, onSelectArticle, onChangeTab }) => {
  const { lang, t } = useLanguage();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [featuredVideo, setFeaturedVideo] = useState<VideoContent | null>(null);
  const [videos, setVideos] = useState<VideoContent[]>([]);
  const [articles, setArticles] = useState<ArticleContent[]>([]);
  
  // Gemini Quote State
  const [quote, setQuote] = useState<{ content: string; source: string; pinyin?: string; contentEn?: string; sourceEn?: string } | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  const fetchQuote = async () => {
    setQuoteLoading(true);
    try {
      const res = await fetch('/api/gemini/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data && data.quote) {
        setQuote(data.quote);
      }
    } catch (e) {
      console.log('Daily Wisdom initialized from core local library cache (offline fallback active).');
      // Fallback wisdom quotes
      const fallbackQuotes = [
        {
          content: '知识，哪怕远在中国，亦当求之。',
          contentEn: 'Seek knowledge, even of it be in China.',
          source: '圣训经典',
          sourceEn: 'Prophetic Maxim'
        },
        {
          content: '穷理格致，所以明天房本体也。',
          contentEn: 'Investigating things and seeking knowledge is the path to unlock the Ultimate Reality.',
          source: '刘智 《天方性理》',
          sourceEn: 'Liu Zhi, "Metaphysics of Heavenly Direction"'
        }
      ];
      const selected = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
      setQuote(selected);
    } finally {
      setQuoteLoading(false);
    }
  };

  const loadData = async () => {
    // Initialize client-side storage cache if not populated yet, or update if outdated
    const CURRENT_CACHE_VERSION = 'v2_silk_road_focus';
    const isCachedVersionDiff = localStorage.getItem('mingde_initialized_version') !== CURRENT_CACHE_VERSION;

    if (!localStorage.getItem('mingde_initialized') || isCachedVersionDiff) {
      localStorage.setItem('mingde_categories', JSON.stringify(INITIAL_CATEGORIES));
      localStorage.setItem('mingde_videos', JSON.stringify(INITIAL_VIDEOS));
      localStorage.setItem('mingde_articles', JSON.stringify(INITIAL_ARTICLES));
      localStorage.setItem('mingde_inquiries', JSON.stringify([]));
      localStorage.setItem('mingde_initialized', 'true');
      localStorage.setItem('mingde_initialized_version', CURRENT_CACHE_VERSION);
    }

    try {
      // Direct high-performance offline reads
      const savedCats = localStorage.getItem('mingde_categories');
      const savedVids = localStorage.getItem('mingde_videos');
      const savedArts = localStorage.getItem('mingde_articles');

      const catsList = savedCats ? JSON.parse(savedCats) : INITIAL_CATEGORIES;
      const vidsList = savedVids ? JSON.parse(savedVids) : INITIAL_VIDEOS;
      const artsList = savedArts ? JSON.parse(savedArts) : INITIAL_ARTICLES;

      catsList.sort((a: any, b: any) => a.displayOrder - b.displayOrder);
      setCategories(catsList);
      setVideos(vidsList);

      const featured = vidsList.find((v: any) => v.isFeatured) || vidsList[0] || null;
      setFeaturedVideo(featured);
      setArticles(artsList);

      // Silently try background cloud cache update without being blocking or prone to crash
      try {
        const catsSnap = await safeGetDocs(collection(db, 'categories'));
        if (!catsSnap.empty) {
          const freshCats = catsSnap.docs.map(d => ({ id: d.id, ...d.data() }) as CategoryItem);
          localStorage.setItem('mingde_categories', JSON.stringify(freshCats));
        }
      } catch (e) {
        console.log('Soft data synchronizer bypassed. Working in 100% self-contained local state.');
      }
    } catch (error) {
      console.warn('Failed to load local storage content cache, playing default static assets:', error);
      setCategories(INITIAL_CATEGORIES);
      setVideos(INITIAL_VIDEOS);
      setFeaturedVideo(INITIAL_VIDEOS.find(v => v.isFeatured) || INITIAL_VIDEOS[0]);
      setArticles(INITIAL_ARTICLES);
    }
  };

  useEffect(() => {
    loadData();
    fetchQuote();
  }, []);

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'BookOpen': return <BookOpen className="w-5 h-5" />;
      case 'Compass': return <Compass className="w-5 h-5" />;
      case 'Feather': return <Feather className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  // Safe localized text resolvers for DB records
  const localizeCategoryName = (cat: CategoryItem) => {
    if (lang === 'zh') return cat.name;
    const translationMap: Record<string, string> = {
      'cat-quran': 'Classic Studies',
      'classic-studies': 'Classic Studies',
      'cat-history': 'History & Culture',
      'history-culture': 'History & Culture',
      'cat-art': 'Classical Art',
      'classical-art': 'Classical Art',
      'cat-lecture': 'Master Seminary',
      'scholarly-lectures': 'Master Seminary'
    };
    return translationMap[cat.id] || translationMap[cat.slug] || cat.name;
  };

  const localizeCategoryDesc = (cat: CategoryItem) => {
    if (lang === 'zh') return cat.description;
    const translationMap: Record<string, string> = {
      'cat-quran': 'Chinese translation, commentary & philosophical explorations of Quranic & canonical studies.',
      'cat-history': 'Historical investigation on the Silk Road and structural civilizational Sino-Islamic dialogues.',
      'cat-art': 'Aesthetic studies of traditional Sini calligraphy, Xuan paper paintings & majestic woodcraft mosques.',
      'cat-lecture': 'Frontline seminars and lectures by high-level religion chairs, philosophy and literature professors.'
    };
    return translationMap[cat.id] || cat.description;
  };

  const getLocalizedVideoData = (vid: VideoContent) => {
    if (lang === 'zh') {
      return { title: vid.title, description: vid.description, author: vid.authorName };
    }
    const map: Record<string, { title: string; description: string; author: string }> = {
      'vid-sino-islamic-symbol': {
        title: 'B civilizational Co-resonance: Dragon & Star-Crescent Synthesis',
        description: 'An extremely creative 4K digital aesthetic short film blending the majestic Chinese dragon-cloud patterns with classic geometric Star & Crescent emblems. Blending fine Chinese ink washes with glittering galactic particle animations, it presents a sacred spiritual resonance.',
        author: 'Acad. Ma Linjie'
      },
      'vid-sini-yin-yang': {
        title: 'Cosmic Dance: Sacred Yin-Yang and Sufi Arabesque Floral Synthesis',
        description: 'An elegant cinematic meditation demonstrating how the Daoist Yin-Yang Taiji fish diagrams flowingly morph into Sufi vegetal arabesques, representing the perpetual rotation of universal energy, peace, and spiritual harmony.',
        author: 'Elder Zhiyi Chen'
      },
      'vid-bronze-censer-qalam': {
        title: 'Melted Spirits: The Xuandian Censer & Flying Sini Islamic Inscription',
        description: 'Witnessing classical bronze smelting art where ancient Chinese bronze censers are engraved with floating "Sini" calligraphic Arabic texts. As precious sandalwood incense smoke rises, watch both visual traditions unite into one silent sanctuary of mindfulness.',
        author: 'Grandmaster Alim Hong'
      },
      'vid-lotus-sini-emblem': {
        title: 'Celestial Blossoms: Confucians Pure Lotus & Radiant Arabesque Rosettes',
        description: 'A masterpiece reconstructing the noble scholar lotus flower with celestial garden rosettes. Each golden lotus petal unfurls to reveal flowing Arabic scriptures sketched by traditional bamboo brushstrokes.',
        author: 'Prof. Habibah Ma'
      }
    };
    return map[vid.id] || { title: vid.title, description: vid.description, author: vid.authorName };
  };

  const getLocalizedArticleData = (art: ArticleContent) => {
    if (lang === 'zh') {
      return { title: art.title, summary: art.summary, author: art.authorName };
    }
    const map: Record<string, { title: string; summary: string; author: string }> = {
      'art-understanding-reason': {
        title: 'Beacon of Inquiry: Epistemology of Celestial Texts & Neo-Confucian Metaphysics',
        summary: 'A comparative exploration on the definition of "Intellect" (Aql) in Islamic golden age studies versus Neo-Confucian teachings on "investigating the nature of things" (Gevu Zhizhi).',
        author: 'Prof. Nabir Pu'
      },
      'art-brick-aesthetics': {
        title: 'Glyphs on Stones: Elegant Brick Carvings of Antique Chinese Mosques',
        summary: 'Analyzing plant medallions such as lotus motifs and auspicious scrollworks on mosque brick screens, exploring the serene lifestyle of ancient faithful assemblies.',
        author: 'Dr. Xuening Ma'
      }
    };
    return map[art.id] || { title: art.title, summary: art.summary, author: art.authorName };
  };

  return (
    <div className="space-y-16 pb-20">
      
      {/* 1. CINEMATIC HERO SECTION */}
      {featuredVideo && (() => {
        const localVid = getLocalizedVideoData(featuredVideo);
        return (
          <section className="relative h-[85vh] w-full overflow-hidden rounded-3xl border border-gold-brand/20 shadow-xl" id="hero-section">
            <div className="absolute inset-0 select-none">
              <img 
                src={featuredVideo.posterUrl} 
                alt={localVid.title}
                className="w-full h-full object-cover scale-105 brightness-[0.45] saturate-[1.1] transition-transform duration-[10s] ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black/20" />
              
              <div className="absolute top-0 bottom-0 left-0 right-0 pointer-events-none opacity-20">
                <div className="absolute w-[6px] h-[6px] bg-gold-brand rounded-full top-[15%] left-[25%] blur-sm animate-pulse" style={{ animationDuration: '6s' }} />
                <div className="absolute w-[4px] h-[4px] bg-green-brand rounded-full top-[60%] left-[80%] blur-sm animate-pulse" style={{ animationDuration: '9s' }} />
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 px-6 sm:px-12 pb-12 sm:pb-16 max-w-4xl space-y-4 z-10">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="flex items-center space-x-2 text-black py-1 px-4 bg-gold-brand border border-white/20 rounded-md text-[10px] sm:text-xs font-serif tracking-[0.25em] w-fit font-bold uppercase shadow-lg shadow-gold-brand/10"
              >
                <Star className="w-3 h-3 fill-black text-black" />
                <span>{t('featuredSpecial')}</span>
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.15 }}
                className="font-serif font-medium tracking-wide text-2xl sm:text-5xl text-white leading-snug drop-shadow-md cursor-pointer hover:text-gold-brand transition-colors"
                onClick={() => onSelectVideo(featuredVideo)}
              >
                {localVid.title}
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="font-sans text-xs sm:text-sm text-stone-200 leading-relaxed max-w-2xl font-light line-clamp-3"
              >
                {localVid.description}
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.45 }}
                className="flex flex-wrap items-center gap-4 pt-4"
              >
                <button 
                  id="hero-play-btn"
                  onClick={() => onSelectVideo(featuredVideo)}
                  className="flex items-center space-x-2 px-8 py-3.5 bg-gold-brand hover:bg-[#c29d2e] active:scale-95 text-black rounded-full font-serif font-bold text-xs sm:text-sm tracking-widest transition-all shadow-xl shadow-gold-brand/20 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-black text-black" />
                  <span>{t('viewDetails')}</span>
                </button>
                
                <div className="flex items-center text-stone-300 text-xs font-mono space-x-4">
                  <span>{t('speakerLabel')}: {localVid.author}</span>
                  <span>•</span>
                  <span>{featuredVideo.views} {t('viewsPostfix')}</span>
                </div>
              </motion.div>
            </div>
          </section>
        );
      })()}

      {/* 2. DAILY GEMINI QUOTE OF WISDOM */}
      <section className="max-w-4xl mx-auto px-4" id="daily-quote-section">
        <div className="glass-panel relative border border-gold-brand/15 rounded-2xl p-6 sm:p-10 text-center space-y-6 overflow-hidden shadow-md">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-brand/5 blur-3xl pointer-events-none rounded-full" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gold-brand/5 blur-3xl pointer-events-none rounded-full" />
          
          <div className="flex items-center justify-between border-b border-stone-250/60 pb-4">
            <div className="flex items-center space-x-2 text-stone-500 font-sans text-xs tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5 text-gold-brand" />
              <span>{t('quoteOfTheDay')}</span>
            </div>
            <button 
              onClick={fetchQuote} 
              disabled={quoteLoading}
              id="refresh-quote-btn"
              className="p-1 text-stone-500 hover:text-amber-700 hover:rotate-180 transition-all duration-500 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${quoteLoading ? 'animate-spin text-gold-brand' : ''}`} />
            </button>
          </div>

          <div className="space-y-3">
            {quoteLoading ? (
              <div className="py-4 space-y-2">
                <div className="h-4 bg-stone-300/35 animate-pulse rounded-full w-2/3 mx-auto" />
                <div className="h-4 bg-stone-300/35 animate-pulse rounded-full w-1/2 mx-auto" />
              </div>
            ) : quote ? (
              <div className="space-y-4">
                <p className="font-serif text-stone-850 text-lg sm:text-2xl leading-relaxed tracking-wider select-text italic">
                  “ {lang === 'zh' ? quote.content : (quote.contentEn || quote.content)} ”
                </p>
                {quote.pinyin && lang === 'zh' && (
                  <p className="text-[10px] font-mono text-stone-500 tracking-wider">
                    {quote.pinyin}
                  </p>
                )}
                <div className="text-right text-[11px] font-sans text-[#8A6D1C] tracking-widest font-semibold">
                  —— {lang === 'zh' ? quote.source : (quote.sourceEn || quote.source)}
                </div>
              </div>
            ) : (
              <p className="text-stone-500 text-sm">Philosophical quote is momentarily reflecting.</p>
            )}
          </div>
        </div>
      </section>

      {/* 3. CORE TAXONOMY CATEGORIES SECTION */}
      <section className="space-y-6" id="categories-section">
        <div className="flex justify-between items-end border-b border-stone-200 pb-4">
          <div>
            <h2 className="font-serif text-lg sm:text-2xl text-[#8A6D1C] tracking-widest font-medium">
              {t('navHome')}
            </h2>
            <p className="text-xs text-stone-600 font-sans mt-1">
              {lang === 'zh' ? '涵盖经典译解、多元艺术交融与中阿历史文化的璀璨结晶' : 'Covering classical studies, artistic integration, and historical Sino-Islamic scholarship gems.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <motion.div
              key={cat.id}
              whileHover={{ y: -5 }}
              className="group p-6 rounded-2xl glass-panel glass-panel-hover cursor-pointer space-y-4 shadow-sm flex flex-col justify-between"
              onClick={() => {
                onChangeTab(cat.type === 'article' ? 'articles' : 'videos');
              }}
            >
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-lg bg-stone-100/80 flex items-center justify-center border border-gold-brand/30 text-gold-brand group-hover:bg-[#8A6D1C]/10 group-hover:text-[#8A6D1C] transition-all">
                  {getCategoryIcon(cat.icon)}
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif text-stone-850 text-sm tracking-wide font-semibold">
                    {localizeCategoryName(cat)}
                  </h3>
                  <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                    {localizeCategoryDesc(cat)}
                  </p>
                </div>
              </div>
              <div className="flex items-center text-[10px] text-[#81600D] font-mono tracking-wider group-hover:pl-0.5 transition-all font-bold uppercase mt-3">
                <span>{lang === 'zh' ? '进入探索' : 'Explore'}</span>
                <ChevronRight className="w-3 h-3 ml-0.5" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 4. MAGAZINE-STYLE FEATURED ARTICLES & POPULAR VIDEOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-4">
        
        {/* Left Column: Featured and Latest Articles */}
        <div className="lg:col-span-2 space-y-6" id="home-articles-container">
          <div className="flex justify-between items-end border-b border-stone-200 pb-3">
            <h3 className="font-serif font-medium text-[#8A6D1C] text-[16px] tracking-widest uppercase flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>{t('recentArticles')}</span>
            </h3>
            <button 
              onClick={() => onChangeTab('articles')}
              className="text-xs text-stone-600 hover:text-gold-brand flex items-center font-sans tracking-wide cursor-pointer font-medium"
            >
              <span>{t('exploreMoreArticles')}</span>
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>

          <div className="space-y-6">
            {articles.map((article) => {
              const localArticle = getLocalizedArticleData(article);
              return (
                <div 
                  key={article.id}
                  id={`article-card-${article.id}`}
                  onClick={() => onSelectArticle(article)}
                  className="group flex flex-col sm:flex-row gap-6 p-4 rounded-2xl glass-panel glass-panel-hover cursor-pointer shadow-sm"
                >
                  <div className="relative w-full sm:w-48 h-32 overflow-hidden rounded-xl select-none shadow-sm flex-shrink-0 bg-stone-100">
                    <img 
                      src={article.coverUrl} 
                      alt={localArticle.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 border border-green-brand/30 text-green-300 rounded text-[9px] font-serif tracking-widest uppercase">
                      {lang === 'zh' ? '文集' : 'Treatise'}
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col justify-between space-y-2">
                    <div className="space-y-1.5">
                      <h4 className="font-serif text-sm sm:text-base text-stone-850 group-hover:text-[#8A6D1C] transition-colors tracking-wide font-semibold">
                        {localArticle.title}
                      </h4>
                      <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                        {localArticle.summary}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-stone-500 font-sans border-t border-stone-100 pt-2">
                      <div className="flex items-center space-x-3">
                        <span>{t('authorLabel')}: {localArticle.author}</span>
                        <span>•</span>
                        <span className="flex items-center"><Clock className="w-3 h-3 mr-1" />{article.readTime} {t('readTimeMinutes')}</span>
                      </div>
                      <span className="text-[#81600D] font-bold flex items-center group-hover:underline text-[10px] uppercase">
                        {lang === 'zh' ? '学术研读' : 'Read'} <ArrowUpRight className="w-3 h-3 ml-0.5 animate-pulse" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Trending / Latest Videos */}
        <div className="space-y-6" id="home-videos-container">
          <div className="flex justify-between items-end border-b border-stone-200 pb-3">
            <h3 className="font-serif font-semibold text-[#8A6D1C] text-[16px] tracking-widest uppercase flex items-center space-x-2">
              <Play className="w-4 h-4 text-gold-brand" />
              <span>{t('latestResources')}</span>
            </h3>
            <button 
              onClick={() => onChangeTab('videos')}
              className="text-xs text-stone-600 hover:text-gold-brand flex items-center font-sans tracking-wide cursor-pointer font-medium"
            >
              <span>{t('exploreMoreClasses')}</span>
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>

          <div className="space-y-6">
            {videos.map((vid) => {
              const localVid = getLocalizedVideoData(vid);
              return (
                <div 
                  key={vid.id}
                  id={`video-card-${vid.id}`}
                  onClick={() => onSelectVideo(vid)}
                  className="group relative rounded-2xl overflow-hidden aspect-video border border-stone-200 cursor-pointer bg-white shadow-sm"
                >
                  <img 
                    src={vid.posterUrl} 
                    alt={localVid.title} 
                    className="w-full h-full object-cover brightness-95 group-hover:brightness-75 transition-all duration-300"
                  />
                  
                  {/* Visual mask */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

                  {/* Hover Play Button */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full border border-gold-brand/40 bg-black/70 items-center justify-center hidden group-hover:flex transition-all">
                    <Play className="w-4 h-4 fill-gold-brand text-gold-brand ml-0.5" />
                  </div>

                  {/* Meta details */}
                  <div className="absolute bottom-3 left-4 right-4 text-left">
                    <span className="inline-block px-2 py-0.5 rounded text-[8px] bg-gold-brand text-black font-serif tracking-widest font-bold uppercase mb-1">
                      {lang === 'zh' ? '课堂' : 'Class'}
                    </span>
                    <p className="font-serif text-white text-xs font-semibold group-hover:text-gold-brand transition-colors line-clamp-1">
                      {localVid.title}
                    </p>
                    <p className="text-[10px] text-white/70 mt-0.5 font-mono">
                      {t('speakerLabel')}: {localVid.author} • {vid.views} {t('viewsPostfix')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
