import React, { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { VideoContent, CategoryItem } from '../types';
import { INITIAL_CATEGORIES, INITIAL_VIDEOS } from '../data/initialData';
import { GenerativeCanvas } from './GenerativeCanvas';
import { useLanguage } from './LanguageContext';
import { Play, Search, Filter, Eye, Share2, Sparkles, ArrowLeft, Check, Tv, RefreshCw, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VideoViewProps {
  selectedVideo: VideoContent | null;
  onSelectVideo: (video: VideoContent | null) => void;
  videoType?: 'short' | 'long';
}

export const VideoView: React.FC<VideoViewProps> = ({ selectedVideo, onSelectVideo, videoType }) => {
  const { lang, t } = useLanguage();
  const [videos, setVideos] = useState<VideoContent[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedQuality, setSelectedQuality] = useState<string>('all');

  // Video Player specific states
  const [activeQuality, setActiveQuality] = useState<string>('');
  const [aiInsights, setAiInsights] = useState<{ summary: string; keywords: string[] } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [playMode, setPlayMode] = useState<'stream' | 'generative'>('stream');
  const [videoError, setVideoError] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const savedCats = localStorage.getItem('mingde_categories');
      const savedVids = localStorage.getItem('mingde_videos');

      const catsList = savedCats ? JSON.parse(savedCats) : INITIAL_CATEGORIES;
      const vidsList = savedVids ? JSON.parse(savedVids) : INITIAL_VIDEOS;

      setCategories(catsList);
      setVideos(vidsList);
    } catch (e) {
      console.warn('Failed to load video library database, falling back to initial data:', e);
      setCategories(INITIAL_CATEGORIES);
      setVideos(INITIAL_VIDEOS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetch AI Insights for active play
  const triggerAiInsights = async (video: VideoContent) => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: video.title,
          content: video.description
        })
      });
      const data = await res.json();
      if (data) {
        setAiInsights({
          summary: data.summary,
          keywords: data.keywords || []
        });
      }
    } catch (e) {
      console.error('AI Insights request failed:', e);
      setAiInsights({
        summary: lang === 'zh' 
          ? '本课核心旨意：探讨中阿两大伟大文明在经典价值、字义翻译、筑物几何学上的精致磨合。揭示了文化和谐包容的主观能动性与极高的精神气节。' 
          : 'Core Insight: Exploring the synthesis of two great civilizations via scripture hermeneutics, calligraphy art, and traditional architectural woodwork, bridging local forms with transcendent monotheism.',
        keywords: lang === 'zh' ? ['经典求知', '以儒诠经', '东方美学'] : ['Hermeneutics', 'Calligraphy', 'Synthesis']
      });
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (selectedVideo) {
      // Default quality
      setActiveQuality(selectedVideo.qualityLevels[0] || '1080P HD');
      setAiInsights(null);
      setPlayMode('stream');
      setVideoError(false);
      
      // Auto-trigger read-through increments locally
      try {
        const savedVids = localStorage.getItem('mingde_videos');
        if (savedVids) {
          const vids = JSON.parse(savedVids);
          const updated = vids.map((v: any) => v.id === selectedVideo.id ? { ...v, views: v.views + 1 } : v);
          localStorage.setItem('mingde_videos', JSON.stringify(updated));
          setVideos(updated);
        }
      } catch (err) {
        console.warn('Silent local view increment log failed', err);
      }

      // Auto-trigger read-through increments in Firestore quietly in background
      const docRef = doc(db, 'videos', selectedVideo.id);
      updateDoc(docRef, { views: selectedVideo.views + 1 }).catch(() => {});
    }
  }, [selectedVideo]);

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/video/${selectedVideo?.slug}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

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
    return translationMap[found.id] || found.slug || found.name;
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

  // Filtering Logic
  const filteredVideos = videos.filter(vid => {
    const local = getLocalizedVideoData(vid);
    const matchesSearch = local.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          local.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          vid.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || vid.category === selectedCategory;
    const matchesQuality = selectedQuality === 'all' || vid.qualityLevels.includes(selectedQuality);

    let matchesType = true;
    if (videoType) {
      const currentType = vid.videoType || 'long';
      matchesType = currentType === videoType;
    }

    return matchesSearch && matchesCategory && matchesQuality && matchesType;
  });

  const getRelatedVideos = () => {
    if (!selectedVideo) return [];
    return videos.filter(v => v.id !== selectedVideo.id && (v.category === selectedVideo.category || v.authorName === selectedVideo.authorName)).slice(0, 3);
  };

  return (
    <div className="space-y-8 pb-16">
      
      <AnimatePresence mode="wait">
        
        {/* VIEW 1: THEATER DETAIL MODE */}
        {selectedVideo ? (() => {
          const localVid = getLocalizedVideoData(selectedVideo);
          return (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
              id="video-theater"
            >
              {/* Header / Back Action */}
              <div className="flex items-center justify-between">
                <button 
                  id="btn-back-to-library"
                  onClick={() => onSelectVideo(null)}
                  className="flex items-center space-x-2 text-stone-500 hover:text-amber-850 font-serif text-xs sm:text-sm tracking-widest cursor-pointer font-bold"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t('backToVideos')}</span>
                </button>

                <div className="px-4 py-1.5 glass-panel rounded-full text-[11px] text-[#81600D] font-serif tracking-widest font-bold">
                  {t('nowPlaying')}：{localVid.title}
                </div>
              </div>

              {/* Main Stage: Widescreen Cinematic Player */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Theater (Left 2 columns) */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Mode switcher tabs */}
                  <div className="flex border-b border-stone-200" id="video-player-mode-tabs">
                    <button
                      id="tab-mode-stream"
                      onClick={() => setPlayMode('stream')}
                      className={`px-4 py-2 text-xs font-serif font-bold tracking-widest cursor-pointer border-b-2 transition-all ${
                        playMode === 'stream'
                          ? 'border-[#8A6D1C] text-gold-brand'
                          : 'border-transparent text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      {lang === 'zh' ? '🎬 影音讲坛' : '🎬 Cinematic Video'}
                    </button>
                    <button
                      id="tab-mode-generative"
                      onClick={() => setPlayMode('generative')}
                      className={`px-4 py-2 text-xs font-serif font-bold tracking-widest cursor-pointer border-b-2 transition-all ${
                        playMode === 'generative'
                          ? 'border-[#8A6D1C] text-gold-brand'
                          : 'border-transparent text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      {lang === 'zh' ? '🎨 实时数字艺术画卷' : '🎨 Live Digital Masterpiece'}
                    </button>
                  </div>

                  <div className="relative rounded-2xl overflow-hidden bg-black border border-stone-200 shadow-xl" style={{ minHeight: '340px' }} id="active-video-theater-box">
                    {playMode === 'stream' ? (
                      <>
                        <video 
                          id="html5-video-player"
                          src={selectedVideo.videoUrl} 
                          poster={selectedVideo.posterUrl}
                          controls 
                          referrerPolicy="no-referrer"
                          onError={() => {
                            console.warn('Media element load warning for:', selectedVideo.title);
                            setVideoError(true);
                          }}
                          className="w-full h-full object-contain absolute inset-0"
                          style={{ height: '100%', minHeight: '340px' }}
                        />
                        {videoError && (
                          <div className="absolute top-4 left-4 right-4 bg-[#8A6D1C]/95 text-stone-50 p-3 rounded-xl shadow-lg text-xs flex items-center justify-between z-10 backdrop-blur-md border border-gold-brand/30">
                            <span>{lang === 'zh' ? '正在为您连线殿堂级影音流媒体通道... 您也可以手动切换至古典数字画布。' : 'Connecting to the high-speed sanctuary media stream... You can also manually view the digital art canvas.'}</span>
                            <button onClick={() => setPlayMode('generative')} className="bg-white hover:bg-stone-50 text-[#8A6D1C] font-bold px-3 py-1 rounded text-[10px] uppercase transition-colors">{lang === 'zh' ? '开启艺术画布' : 'View Art Canvas'}</button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full min-h-[340px]">
                        <GenerativeCanvas videoId={selectedVideo.id} lang={lang} />
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-wide text-stone-850">
                        {localVid.title}
                      </h1>

                      {/* Quality selector */}
                      <div className="flex items-center space-x-2 bg-stone-100/90 border border-stone-250/60 rounded-xl p-1 w-fit">
                        <Layers className="w-3.5 h-3.5 text-amber-700 ml-1.5" />
                        {selectedVideo.qualityLevels.map(lvl => (
                          <button
                            key={lvl}
                            onClick={() => setActiveQuality(lvl)}
                            id={`quality-btn-${lvl.replace(/\s+/g, '')}`}
                            className={`px-3 py-1 rounded-lg text-[10px] font-mono tracking-wider cursor-pointer transition-all ${
                              activeQuality === lvl 
                                ? 'bg-[#8A6D1C] text-white font-bold shadow' 
                                : 'text-stone-500 hover:text-stone-800'
                            }`}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-stone-500 border-b border-stone-200 pb-4">
                      <span className="text-emerald-700 font-serif font-bold">{localizeCategoryName(selectedVideo.category)}</span>
                      <span>•</span>
                      <span>{t('speakerLabel')}：{localVid.author}</span>
                      <span>•</span>
                      <span className="flex items-center"><Eye className="w-3.5 h-3.5 mr-1" />{selectedVideo.views} {t('viewsPostfix')}</span>
                      <span>•</span>
                      <span>{t('updateTimeLabel')}：{selectedVideo.createdAt.split('T')[0]}</span>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xs text-[#81600D] tracking-widest uppercase font-serif font-bold">{t('contentIntro')}</h3>
                      <p className="text-stone-700 text-sm leading-relaxed whitespace-pre-line font-light">
                        {localVid.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      {selectedVideo.tags.map(tag => (
                        <span key={tag} className="px-2.5 py-1 bg-white border border-stone-200 text-stone-600 text-[10px] rounded-lg tracking-wider font-medium shadow-sm">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Control Panel (Right column: Share, Gemini insights & Related content) */}
                <div className="space-y-6">
                  
                  {/* 1. Share Widget */}
                  <div className="p-5 glass-panel rounded-2xl space-y-4 shadow-sm">
                    <h3 className="font-serif text-xs font-bold tracking-widest text-[#8A6D1C] flex items-center space-x-2">
                      <Share2 className="w-4 h-4 text-[#8A6D1C]" />
                      <span>{t('academicShare')}</span>
                    </h3>
                    <div className="space-y-3">
                      <p className="text-[11px] text-stone-600 leading-relaxed font-light">
                        {t('shareTooltip')}
                      </p>
                      <button
                        id="btn-video-share"
                        onClick={handleShare}
                        className="flex items-center justify-center space-x-2 w-full py-2 bg-stone-50 border border-stone-200 hover:border-gold-brand text-stone-700 hover:text-[#8A6D1C] rounded-xl text-xs transition-all cursor-pointer font-sans font-semibold"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{t('btnShareCopied')}</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="w-3.5 h-3.5" />
                            <span>{t('btnShareCopy')}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 2. AI Gemini Insights */}
                  <div className="p-5 glass-panel border border-[#8A6D1C]/25 rounded-2xl space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif text-xs font-bold tracking-widest text-[#8A6D1C] flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <span>{t('aiInsights')}</span>
                      </h3>
                    </div>

                    {!aiInsights ? (
                      <div className="space-y-3">
                        <p className="text-[11px] text-stone-600 leading-relaxed font-light">
                          {t('aiTooltip')}
                        </p>
                        <button
                          id="btn-video-ai-insights"
                          onClick={() => triggerAiInsights(selectedVideo)}
                          disabled={aiLoading}
                          className="flex items-center justify-center space-x-2 w-full py-2 bg-[#8A6D1C] hover:bg-[#725a17] text-white rounded-xl text-xs transition-all cursor-pointer font-serif tracking-widest font-bold shadow"
                        >
                          {aiLoading ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>{t('btnAiGenerating')}</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>{t('btnAiGenerate')}</span>
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3 text-left">
                        <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                          <p className="text-xs text-stone-800 leading-relaxed font-sans font-light">
                            {aiInsights.summary}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {aiInsights.keywords.map(kw => (
                            <span key={kw} className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] border border-emerald-200 rounded font-sans uppercase tracking-wider font-semibold">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 3. Related of Database */}
                  <div className="space-y-3">
                    <h3 className="text-xs text-[#81600D] tracking-widest uppercase font-serif font-bold">{t('relatedVideos')}</h3>
                    <div className="space-y-3">
                      {getRelatedVideos().length > 0 ? (
                        getRelatedVideos().map(rv => {
                          const localRv = getLocalizedVideoData(rv);
                          return (
                            <div
                              key={rv.id}
                              className="flex items-center space-x-3 p-2.5 glass-panel glass-panel-hover rounded-xl cursor-pointer group shadow-sm"
                              onClick={() => onSelectVideo(rv)}
                            >
                              <img src={rv.posterUrl} className="w-16 h-10 object-cover rounded shadow-sm" alt={localRv.title} />
                              <div className="flex-1 space-y-0.5">
                                <h4 className="text-xs font-semibold text-stone-850 line-clamp-1 group-hover:text-[#8A6D1C] transition-colors">
                                  {localRv.title}
                                </h4>
                                <p className="text-[10px] text-stone-500">{t('speakerLabel')}：{localRv.author}</p>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-[11px] text-stone-500">{t('noRelatedVideos')}</p>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </motion.div>
          );
        })() : (
          
          /* VIEW 2: VIDEOS DIRECTORY GRID */
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            {/* Search, Categories Filter Panel */}
            <div className="p-6 glass-panel border border-stone-200 rounded-2xl space-y-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* Search query box */}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    id="video-search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('searchVideosPlaceholder')}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-stone-200 focus:border-[#8A6D1C] rounded-xl text-stone-800 text-xs tracking-wider outline-none transition-all placeholder:text-stone-400"
                  />
                </div>

                {/* Filters */}
                <div className="flex items-center space-x-3 flex-wrap sm:flex-nowrap">
                  
                  {/* Category select block */}
                  <div className="flex items-center space-x-2 bg-white px-3 py-2 border border-stone-200 rounded-xl transition-all hover:border-gold-brand" id="video-cat-filter">
                    <Filter className="w-3.5 h-3.5 text-[#8A6D1C]" />
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="bg-transparent text-stone-700 text-xs tracking-wide outline-none border-none py-1 cursor-pointer pr-1"
                    >
                      <option value="all">{t('allCategories')}</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{lang === 'zh' ? c.name : localizeCategoryName(c.id)}</option>
                      ))}
                    </select>
                  </div>

                  {/* Quality levels dropdown */}
                  <select
                    value={selectedQuality}
                    onChange={(e) => setSelectedQuality(e.target.value)}
                    className="bg-white text-stone-700 text-xs tracking-wide border border-stone-200 px-3 py-2.5 rounded-xl cursor-pointer outline-none focus:border-gold-brand"
                    id="video-quality-filter"
                  >
                    <option value="all">{t('anyQuality')}</option>
                    <option value="4K Ultra">4K</option>
                    <option value="1080P HD">1080P</option>
                    <option value="720P SD">720P</option>
                  </select>

                </div>
              </div>
            </div>

            {/* Videos Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="space-y-3">
                    <div className="aspect-video bg-stone-200 animate-pulse rounded-2xl" />
                    <div className="h-4 bg-stone-200 animate-pulse rounded w-2/3" />
                    <div className="h-3 bg-stone-200 animate-pulse rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : filteredVideos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVideos.map((vid) => {
                  const localVid = getLocalizedVideoData(vid);
                  return (
                    <motion.div
                      key={vid.id}
                      layoutId={`video-container-${vid.id}`}
                      whileHover={{ y: -6 }}
                      className="group rounded-2xl overflow-hidden cursor-pointer flex flex-col justify-between glass-panel glass-panel-hover border border-stone-200 shadow-sm"
                      onClick={() => onSelectVideo(vid)}
                    >
                      {/* Poster with overlays */}
                      <div className="relative aspect-video overflow-hidden border-b border-stone-200 select-none bg-black">
                        <img 
                          src={vid.posterUrl} 
                          alt={localVid.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        />
                        <div className="absolute inset-0 bg-black/10" />
                        
                        {/* Play overlay hover indicator */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                          <div className="w-12 h-12 rounded-full bg-gold-brand flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                            <Play className="w-5 h-5 fill-black text-black ml-0.5" />
                          </div>
                        </div>

                        {/* Top labels */}
                        <div className="absolute top-3 left-3 flex space-x-1.5">
                          <span className="px-2 py-0.5 bg-black/70 border border-stone-700 text-[8px] font-mono tracking-widest text-[#F5F5F0] rounded">
                            {vid.qualityLevels[0] || '1080P'}
                          </span>
                          {vid.isFeatured && (
                            <span className="px-2 py-0.5 bg-gold-brand text-[8px] font-serif tracking-widest text-black font-semibold rounded">
                              {t('featuredSpecial')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <span className="text-[10px] text-[#81600D] tracking-widest font-serif font-bold uppercase block">
                            {localizeCategoryName(vid.category)}
                          </span>
                          <h3 className="font-serif text-sm text-stone-850 font-semibold group-hover:text-[#8A6D1C] transition-colors line-clamp-2">
                            {localVid.title}
                          </h3>
                          <p className="text-[11px] text-stone-600 line-clamp-2 leading-relaxed font-light">
                            {localVid.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-stone-500 font-mono border-t border-stone-150 pt-3 mt-1">
                          <span>{t('speakerLabel')}：{localVid.author}</span>
                          <span className="flex items-center"><Play className="w-3 h-3 mr-1" />{vid.views} {t('viewsPostfix')}</span>
                        </div>
                      </div>

                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="py-20 text-center border border-dashed border-stone-300 rounded-3xl">
                <Tv className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <h3 className="text-stone-500 font-serif tracking-widest text-xs font-bold">{t('noVideosFound')}</h3>
                <p className="text-[11px] text-stone-400 mt-1">{t('noVideosFoundSub')}</p>
              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
};
