import React, { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { ArticleContent, CategoryItem } from '../types';
import { INITIAL_CATEGORIES, INITIAL_ARTICLES } from '../data/initialData';
import { useLanguage } from './LanguageContext';
import { BookOpen, Search, Clock, Eye, ArrowLeft, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ArticleViewProps {
  selectedArticle: ArticleContent | null;
  onSelectArticle: (article: ArticleContent | null) => void;
}

export const ArticleView: React.FC<ArticleViewProps> = ({ selectedArticle, onSelectArticle }) => {
  const { lang, t } = useLanguage();
  const [articles, setArticles] = useState<ArticleContent[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [readTimeFilter, setReadTimeFilter] = useState<string>('all');

  // Scroll Progress indicator state
  const [scrollProgress, setScrollProgress] = useState(0);

  const loadData = async () => {
    setLoading(true);
    try {
      const savedCats = localStorage.getItem('mingde_categories');
      const savedArts = localStorage.getItem('mingde_articles');

      const catsList = savedCats ? JSON.parse(savedCats) : INITIAL_CATEGORIES;
      const artsList = savedArts ? JSON.parse(savedArts) : INITIAL_ARTICLES;

      setCategories(catsList);
      setArticles(artsList);
    } catch (e) {
      console.warn('Failed to load academic articles collection, using initial content:', e);
      setCategories(INITIAL_CATEGORIES);
      setArticles(INITIAL_ARTICLES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync scroll height listener for active read
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(progress);
      }
    };

    if (selectedArticle) {
       window.addEventListener('scroll', handleScroll);
       // Auto increment views locally in offline cache
       try {
         const savedArts = localStorage.getItem('mingde_articles');
         if (savedArts) {
           const arts = JSON.parse(savedArts);
           const updated = arts.map((a: any) => a.id === selectedArticle.id ? { ...a, views: a.views + 1 } : a);
           localStorage.setItem('mingde_articles', JSON.stringify(updated));
           setArticles(updated);
         }
       } catch (err) {
         console.warn('Silent local view increment log failed', err);
       }
       // Auto increment views on Firestore quietly in background
       const docRef = doc(db, 'articles', selectedArticle.id);
       updateDoc(docRef, { views: selectedArticle.views + 1 }).catch(() => {});
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, [selectedArticle]);

  // Safe localized text resolvers for DB records
  const localizeCategoryName = (catId: string) => {
    const found = categories.find(c => c.id === catId);
    if (!found) return lang === 'zh' ? '未知专栏' : 'Unknown Column';
    if (lang === 'zh') return found.name;
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
    return translationMap[found.id] || translationMap[found.slug] || found.name;
  };

  const getLocalizedArticleData = (art: ArticleContent) => {
    if (lang === 'zh') {
      return { title: art.title, summary: art.summary, author: art.authorName, authorRole: art.authorRole, content: art.content };
    }
    const map: Record<string, { title: string; summary: string; author: string; authorRole: string; content: string }> = {
      'art-understanding-reason': {
        title: 'Beacon of Inquiry: Epistemology of Celestial Texts & Neo-Confucian Metaphysics',
        summary: 'A comparative exploration on the definition of "Intellect" (Aql) in Islamic golden age studies versus Neo-Confucian teachings on "investigating the nature of things" (Gevu Zhizhi).',
        author: 'Prof. Nabir Pu',
        authorRole: 'Founder of Eastern Civilization Comparative Studies',
        content: `## Introductory: The Sanctity of Demanding Knowledge

In the broad history of civilizations, the drive to acquire knowledge and respect pure reason has always served as the chief catalyst for spiritual progression. Islamic scholarship views finding knowledge as a core obligation:

> "Seek knowledge, even unto China." —— Ancient Proverb

In China's high moral treatises, the opening chapter of the Daxue ("Great Learning") also notes:
*"The ancients who wished to illustrate illustrious virtue throughout the Kingdom first ordered well their states. Wishing to order well their states, they first regulated their families. Wishing to regulate their families, they first cultivated their persons. Wishing to cultivate their persons, they first rectified their hearts. Wishing to rectify their hearts, they first sought to be sincere in their thoughts. Wishing to be sincere in their thoughts, they first extended to the utmost their knowledge. Such extension of knowledge lay in the investigation of things."*

### Chapter 1: Epistemology (Aql) vs. Investigating Nature

In the Golden Age of Islam, Avicenna (Ibn Sina) and Averroes (Ibn Rushd) unified Greek natural science with classical scriptures. They asserted that reason and revelation are not contradictory, but two twin beacons illuminating the singular Truth.

Zhu Xi, the master of Neo-Confucianism, arrived at an analogous formulation: "The things of the world are infinite, and each holds its ultimate reason." Only through contemplation, investigation, and personal praxis is one capable of unlocking worldly wisdom:
1. **Subjective Quest of Reason**: The human spirit (Aql) acts as a high mirror. Once wiped clean of stains, it reflects the true "Principius" (Li) of the cosmos.
2. **Structural Sanctity of Nature**: The cosmos is a silent scripture. Every flower, stone, and celestial orbit represents a sign (Ayah) of ultimate wisdom.

---

### Chapter 2: "Han Kitab" — Historical Scholarship

In the Late Ming and early Qing dynasties, scholarly Muslims residing in mainland China pioneered the "Han Kitab" translations. Living deep in the Confucian cultural ecosystem, they translated monotheistic texts using Neo-Confucian parameters:

* **Liu Jielen (Liu Zhi)** arranged the "Rituals of Celestial Direction", matching absolute metaphysical concepts such as "Substance, Essence, Apparentness" with Neo-Confucian categories.
* **Wang Daiyu** formulated the "True Explanation of Orthodox Religion", erecting an intellectual palace using traditional terms of "Absolute One", "Temporal One", and "Unified Substance".

This legacy, known of old as **Han Kitab**, created an unparalleled precedent in the localized dialogue of spiritual civilizations.

---

### Epilogue: Universal Dialogue in Contemporary Era

Confronted with the high disenchantment of modern technocracy, the deep **spiritual intellect** of ancient scriptures offers a pristine antidote. Re-evaluating these texts in Chinese parameters inspires mutual understanding and absolute harmony inside a multi-civilizational world.`
      },
      'art-brick-aesthetics': {
        title: 'Glyphs on Stones: Elegant Brick Carvings of Antique Chinese Mosques',
        summary: 'Analyzing plant medallions such as lotus motifs and auspicious scrollworks on mosque brick screens, exploring the serene lifestyle of ancient faithful assemblies.',
        author: 'Dr. Xuening Ma',
        authorRole: 'Senior Fellow of Intangible Architectural Heritage',
        content: `## The Native Narrative of Brick Carvings

Historic Sino-Islamic structures across China (such as the Niujie Mosque in Beijing, Xian Great Mosque, and Emin Minaret in Turpan) have, throughout centuries of continuous restorations, incorporated extremely beautiful native Chinese brick masonry ornaments into their visual layout.

### Chapter 1: Geometric Arabesques & Avoiding Animate Sculptures

Classical aesthetics strictly avoid placing physical statuary of animate creatures or divine entities inside prayer halls. This constraint, however, acted as a powerful springboard for Chinese and Arab craftsmen to innovate complex botanical arabesques and geometric matrices:

1. **The Three Friends of Winter (Pine, Bamboo, Plum)**: Commonly found on mosque masonry screens, indicating the faith assembly's endurance in times of severe societal storms and absolute spiritual purity.
2. **The Ausocicious Lotus (Lianhua)**: Interlocking stylized lotus carvings, signifying pristine cleanliness unpolluted by worldly mud.

> "Rising clean from the marsh without a taint; bathing in ripples without being flirtatious." —— This classical ideal of the Confucian Gentleman translates flawlessly to describe the ideal characteristics of a faithful believer.

---

### Chapter 2: Sini Arabesque Calligraphy integration

On northwestern Chinese mosque brick lintels, Arabic golden phrases (such as the Tasmiyah) are carved in fluid brushstrokes that mimic traditional Chinese scrolls, panels, and coupled screens. This localized script allowed local readers to appreciate scriptural wisdom in comfortable calligraphic frames, weaving a sacred garment of Chinese aesthetics over celestial truths.`
      }
    };
    return map[art.id] || { title: art.title, summary: art.summary, author: art.authorName, authorRole: art.authorRole, content: art.content };
  };

  // Filtering articles
  const filteredArticles = articles.filter(art => {
    if (art.draft) return false; // Hide drafts from public view
    const local = getLocalizedArticleData(art);
    
    const matchesSearch = local.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          local.summary.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          local.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || art.category === selectedCategory;
    
    let matchesReadTime = true;
    if (readTimeFilter === 'short') matchesReadTime = art.readTime <= 5;
    if (readTimeFilter === 'medium') matchesReadTime = art.readTime > 5 && art.readTime <= 10;
    if (readTimeFilter === 'long') matchesReadTime = art.readTime > 10;

    return matchesSearch && matchesCategory && matchesReadTime;
  });

  // Custom Scholarly Styled Markdown Rendering Engine
  const renderScholarlyPage = (markdown: string) => {
    const blocks = markdown.split('\n\n');
    return blocks.map((block, idx) => {
      const trimmed = block.trim();
      if (!trimmed) return null;

      // H2 Headings
      if (trimmed.startsWith('## ')) {
        return (
          <h2 key={idx} className="font-serif font-bold text-lg sm:text-2xl text-[#8A6D1C] tracking-widest border-b border-stone-200 pb-2 mt-8 mb-4">
            {trimmed.slice(3)}
          </h2>
        );
      }

      // H3 Headings
      if (trimmed.startsWith('### ')) {
        return (
          <h3 key={idx} className="font-serif text-stone-850 text-base sm:text-lg tracking-widest font-semibold mt-6 mb-3">
            {trimmed.slice(4)}
          </h3>
        );
      }

      // Blockquotes (Traditional green borders)
      if (trimmed.startsWith('> ')) {
        return (
          <blockquote key={idx} className="border-l-4 border-emerald-600 bg-stone-50 p-5 rounded-r-xl font-serif italic text-stone-700 text-sm sm:text-base leading-relaxed tracking-wide my-6">
            {trimmed.slice(2).replace(/\*+/g, '')}
          </blockquote>
        );
      }

      // List Items
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        const items = trimmed.split('\n');
        return (
          <ul key={idx} className="space-y-2 list-none pl-1 my-4">
            {items.map((item, itemIdx) => (
              <li key={itemIdx} className="flex items-start text-xs sm:text-sm text-stone-700 leading-relaxed font-light">
                <span className="w-1.5 h-1.5 bg-[#8A6D1C] rounded-full mt-2 mr-3 flex-shrink-0" />
                <span>{item.slice(2).replace(/\*+/g, '')}</span>
              </li>
            ))}
          </ul>
        );
      }

      // Default Paragraph with inline emphasis conversion (bold, etc.)
      const formatInline = (text: string) => {
        const parts = text.split('**');
        return parts.map((part, pIdx) => {
          if (pIdx % 2 !== 0) {
            return <strong key={pIdx} className="font-bold text-[#8A6D1C]">{part}</strong>;
          }
          return part;
        });
      };

      return (
        <p key={idx} className="font-sans text-xs sm:text-sm text-stone-700 font-light leading-relaxed tracking-wide text-justify my-4">
          {formatInline(trimmed)}
        </p>
      );
    });
  };

  const getFeaturedArticle = () => {
    return articles.find(a => a.isFeatured && !a.draft) || articles[0];
  };

  const featured = getFeaturedArticle();

  return (
    <div className="space-y-8">
      
      {/* 1. SCROLL READING PROGRESS INDICATOR (STICKY BAR AT THE VERY TOP OF SCREEN) */}
      {selectedArticle && (
        <div className="fixed top-0 left-0 w-full h-[3px] bg-stone-200 z-50">
          <div 
            className="h-full bg-gradient-to-r from-emerald-600 to-amber-600 transition-all duration-75"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>
      )}

      <AnimatePresence mode="wait">
        
        {/* VIEW 1: EXPANDED DETAILED READING PAGE */}
        {selectedArticle ? (() => {
          const localArt = getLocalizedArticleData(selectedArticle);
          return (
            <motion.article 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-4xl mx-auto space-y-8 pb-20"
              id="article-reading-dock"
            >
              {/* Nav back row */}
              <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                <button 
                  id="btn-back-to-magazine"
                  onClick={() => onSelectArticle(null)}
                  className="flex items-center space-x-2 text-stone-500 hover:text-amber-800 font-serif text-xs sm:text-sm tracking-widest cursor-pointer font-bold"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t('backToArticles')}</span>
                </button>

                <div className="text-[10px] font-mono text-stone-500 font-semibold uppercase">
                  {t('readingProgress')}：{Math.round(scrollProgress)}%
                </div>
              </div>

              {/* Title / Writer Profile Header */}
              <div className="space-y-4 text-center sm:text-left">
                <span className="inline-block px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-750 rounded text-[9px] font-serif tracking-widest font-bold uppercase">
                  {localizeCategoryName(selectedArticle.category)}
                </span>
                
                <h1 className="font-serif text-2xl sm:text-4xl text-stone-850 tracking-widest leading-snug font-bold">
                  {localArt.title}
                </h1>

                {/* Scholar Biography Frame */}
                <div className="flex flex-col sm:flex-row items-center sm:justify-between py-4 border-y border-stone-200 gap-4">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-full bg-stone-100 border border-gold-brand flex items-center justify-center font-serif text-amber-800 font-bold select-none">
                      {localArt.author.charAt(0)}
                    </div>
                    <div className="text-left">
                      <div className="text-xs sm:text-sm font-serif font-bold text-stone-850">{localArt.author}</div>
                      <div className="text-[10px] sm:text-xs text-stone-550 font-mono">{localArt.authorRole}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-5 text-stone-500 font-mono text-[11px]">
                    <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1" />{t('readTimeLabel')}：{selectedArticle.readTime} {t('readTimeMinutes')}</span>
                    <span className="flex items-center"><Eye className="w-3.5 h-3.5 mr-1" />{t('viewsCountLabel')}：{selectedArticle.views || 0}</span>
                  </div>
                </div>
              </div>

              {/* Splash Banner */}
              <div className="relative aspect-video rounded-2xl overflow-hidden border border-stone-200 shadow-sm bg-stone-100">
                <img 
                  src={selectedArticle.coverUrl} 
                  alt={localArt.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>

              {/* Custom Scholarly Styled Text */}
              <div className="text-left py-4 leading-relaxed font-sans scroll-smooth" id="article-markdown-body">
                {renderScholarlyPage(localArt.content)}
              </div>

              {/* End of article marker */}
              <div className="pt-8 border-t border-stone-200 text-center space-y-3">
                <div className="w-1.5 h-1.5 bg-[#82610F] rounded-full mx-auto shadow-sm" />
                <p className="text-[10px] font-serif text-stone-500 tracking-[0.2em] font-semibold uppercase">
                  {t('articleEndSign')}
                </p>
              </div>

            </motion.article>
          );
        })() : (
          
          /* VIEW 2: THE MAGAZINE LIBRARY BROWSER */
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-12"
          >
            {/* Cinematic Large Featured Banner */}
            {featured && (() => {
              const localFeatured = getLocalizedArticleData(featured);
              return (
                <div 
                  id="article-featured-banner"
                  onClick={() => onSelectArticle(featured)}
                  className="relative min-h-[45vh] glass-panel border border-stone-250/80 rounded-3xl overflow-hidden flex flex-col justify-end p-6 sm:p-10 cursor-pointer group shadow-sm bg-white"
                >
                  <div className="absolute inset-0 select-none">
                    <img 
                      src={featured.coverUrl} 
                      alt={localFeatured.title} 
                      className="w-full h-full object-cover brightness-[0.45] saturate-[1.05] group-hover:scale-105 transition-all duration-[8s]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                  </div>

                  <div className="relative max-w-3xl space-y-3 z-10 text-left">
                    <span className="px-3 py-1 bg-gold-brand text-black rounded text-[9px] tracking-widest font-serif font-bold uppercase w-fit block shadow-sm">
                      {t('featuredArticleBanner')}
                    </span>
                    
                    <h2 className="font-serif text-xl sm:text-3xl text-white group-hover:text-gold-brand transition-colors leading-snug tracking-wide font-medium">
                      {localFeatured.title}
                    </h2>

                    <p className="text-xs sm:text-sm text-stone-200 leading-relaxed max-w-xl line-clamp-2 font-light">
                      {localFeatured.summary}
                    </p>

                    <div className="flex items-center space-x-3 text-[11px] text-stone-300 font-mono pt-2">
                      <span>{t('authorLabel')}：{localFeatured.author}</span>
                      <span>•</span>
                      <span>{t('readTimeLabel')}：{featured.readTime} {t('readTimeMinutes')}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Filter and Advanced Queries */}
            <div className="p-6 glass-panel border border-stone-200 rounded-2xl flex flex-col md:flex-row gap-4 items-center shadow-sm bg-white">
              
              {/* Search */}
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  id="article-search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('searchArticlesPlaceholder')}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-stone-200 focus:border-[#8A6D1C] rounded-xl text-stone-850 text-xs tracking-wider outline-none transition-all placeholder:text-stone-400"
                />
              </div>

              {/* Dropdowns */}
              <div className="flex items-center gap-3 w-full md:w-auto justify-end flex-wrap sm:flex-nowrap">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-white text-stone-700 text-xs tracking-wide border border-stone-200 px-3 py-2.5 rounded-xl cursor-pointer outline-none focus:border-gold-brand"
                  id="article-cat-filter"
                >
                  <option value="all">{t('allCategories')}</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{lang === 'zh' ? c.name : localizeCategoryName(c.id)}</option>
                  ))}
                </select>

                <select
                  value={readTimeFilter}
                  onChange={(e) => setReadTimeFilter(e.target.value)}
                  className="bg-white text-stone-700 text-xs tracking-wide border border-stone-200 px-3 py-2.5 rounded-xl cursor-pointer outline-none focus:border-gold-brand"
                  id="article-time-filter"
                >
                  <option value="all">{t('readTimeAny')}</option>
                  <option value="short">{t('readTimeShort')}</option>
                  <option value="medium">{t('readTimeMedium')}</option>
                  <option value="long">{t('readTimeLong')}</option>
                </select>
              </div>

            </div>

            {/* Articles List */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[1, 2].map(i => (
                  <div key={i} className="flex flex-col gap-4 animate-pulse">
                    <div className="aspect-[16/10] bg-stone-200 rounded-xl" />
                    <div className="space-y-3">
                      <div className="h-5 bg-stone-200 rounded w-1/3" />
                      <div className="h-4 bg-stone-200 rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredArticles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8" id="articles-magazine-grid">
                {filteredArticles.map((art) => {
                  const localArt = getLocalizedArticleData(art);
                  return (
                    <div
                      key={art.id}
                      id={`art-item-${art.id}`}
                      onClick={() => onSelectArticle(art)}
                      className="group flex flex-col text-left space-y-4 p-5 rounded-2xl glass-panel glass-panel-hover border border-stone-200 shadow-sm"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-black shadow-sm select-none">
                        <img 
                          src={art.coverUrl} 
                          alt={localArt.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                        />
                        <div className="absolute top-3 left-3 px-2 py-0.5 bg-black/60 border border-stone-700 rounded text-[9px] font-mono tracking-widest text-[#D4AF37] uppercase">
                          {localizeCategoryName(art.category)}
                        </div>
                      </div>

                      <div className="space-y-2 flex-1 flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <h3 className="font-serif font-semibold text-sm sm:text-base text-stone-850 group-hover:text-[#8A6D1C] transition-colors tracking-wide leading-snug line-clamp-2">
                            {localArt.title}
                          </h3>
                          <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed font-light">
                            {localArt.summary}
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-stone-500 font-mono border-t border-stone-150 pt-3 mt-4">
                          <span>{t('authorLabel')}：{localArt.author}</span>
                          <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1" />{art.readTime} {t('readTimeMinutes')}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-20 text-center border border-dashed border-stone-300 rounded-3xl">
                <Compass className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <h3 className="text-stone-500 font-serif tracking-widest text-xs font-semibold">{t('noArticlesFound')}</h3>
                <p className="text-[11px] text-stone-400 mt-1">{t('noArticlesFoundSub')}</p>
              </div>
            )}

          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
};
