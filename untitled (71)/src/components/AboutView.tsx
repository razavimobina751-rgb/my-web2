import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useLanguage } from './LanguageContext';
import { Compass, BookOpen, Feather, Send, CheckCircle, Mail, Phone, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AboutView: React.FC = () => {
  const { t, lang } = useLanguage();
  
  // Contact form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('academic');
  const [message, setMessage] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Live Settings State
  const [dbSettings, setDbSettings] = useState<any>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'about_contact'), (docSnap) => {
      if (docSnap.exists()) {
        setDbSettings(docSnap.data());
      }
    }, (err) => {
      console.warn('Failed to fetch site settings, using defaults:', err);
    });
    return () => unsub();
  }, []);

  const getTxt = (key: string, defaultVal: string) => {
    if (!dbSettings) return defaultVal;
    const langKey = `${key}_${lang}`;
    if (dbSettings[langKey] !== undefined && dbSettings[langKey] !== '') {
      return dbSettings[langKey];
    }
    if (key === 'contactEmail' && dbSettings.contactEmail) {
      return dbSettings.contactEmail;
    }
    if (key === 'contactPhone' && dbSettings.contactPhone) {
      return dbSettings.contactPhone;
    }
    return defaultVal;
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      setError(lang === 'zh' ? '请填写所有必填信息字段。' : 'Please fill all required information fields.');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      // Write message persistent to Firestore
      await addDoc(collection(db, 'inquiries'), {
        name,
        email,
        topic,
        message,
        timestamp: new Date().toISOString()
      });
      setSubmitted(true);
      // Reset form fields
      setName('');
      setEmail('');
      setMessage('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'inquiries');
      console.error('Failed to submit contact suggestion:', err);
      setError(lang === 'zh' ? '意见递交出错，请检查服务端连接。' : 'Error submitting letter, please inspect your network.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-16 pb-20">
      
      {/* SECTION 1: INTRODUCTION & MISSION */}
      <section className="text-center space-y-6 pt-6" id="about-intro">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="inline-block w-14 h-14 rounded-full border border-stone-200 flex items-center justify-center bg-white text-[#8A6D1C] mb-2 mx-auto shadow"
        >
          <Compass className="w-6 h-6 text-[#8A6D1C] animate-spin-slow" />
        </motion.div>
        
        <h1 className="font-serif text-3xl sm:text-4xl text-stone-850 tracking-widest font-bold">
          {getTxt('aboutMainTitle', t('aboutMainTitle'))}
        </h1>
        <p className="font-serif text-xs text-[#8A6D1C] tracking-widest uppercase font-semibold">
          {getTxt('aboutSubtitle', t('aboutSubtitle'))}
        </p>

        <div className="w-12 h-[2px] bg-[#8A6D1C] mx-auto my-4" />

        <p className="font-sans text-xs sm:text-sm text-stone-700 leading-relaxed max-w-2xl mx-auto font-light text-justify sm:text-center whitespace-pre-wrap">
          {getTxt('aboutParagraph', t('aboutParagraph'))}
        </p>
      </section>

      {/* SECTION 2: VALUES GRID (BENTO CARD DESIGN) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8" id="about-bento-values">
        
        {/* Bento 1: Academic Rigor */}
        <div className="p-6 rounded-2xl glass-panel border border-stone-200 bg-white space-y-4 shadow-sm hover:border-[#8A6D1C]/20 transition-all duration-300">
          <div className="w-8 h-8 rounded bg-stone-50 text-[#8A6D1C] flex items-center justify-center border border-stone-200 shadow-xs">
            <BookOpen className="w-4 h-4 text-[#8A6D1C]" />
          </div>
          <h3 className="font-serif text-sm sm:text-base text-stone-850 tracking-wide font-bold">
            {getTxt('valueClassicTitle', t('valueClassicTitle'))}
          </h3>
          <p className="text-xs text-stone-600 leading-relaxed font-light">
            {getTxt('valueClassicDesc', t('valueClassicDesc'))}
          </p>
        </div>

        {/* Bento 2: Aesthetic Blend */}
        <div className="p-6 rounded-2xl glass-panel border border-stone-200 bg-white space-y-4 shadow-sm hover:border-emerald-600/20 transition-all duration-300">
          <div className="w-8 h-8 rounded bg-stone-50 text-emerald-700 flex items-center justify-center border border-stone-200 shadow-xs">
            <Feather className="w-4 h-4 text-emerald-700" />
          </div>
          <h3 className="font-serif text-sm sm:text-base text-stone-850 tracking-wide font-bold">
            {getTxt('valueAestheticTitle', t('valueAestheticTitle'))}
          </h3>
          <p className="text-xs text-stone-600 leading-relaxed font-light">
            {getTxt('valueAestheticDesc', t('valueAestheticDesc'))}
          </p>
        </div>

        {/* Bento 3: Cultural Harmony */}
        <div className="p-6 rounded-2xl glass-panel border border-stone-200 bg-white space-y-4 shadow-sm hover:border-[#8A6D1C]/20 transition-all duration-300">
          <div className="w-8 h-8 rounded bg-stone-50 text-[#8A6D1C] flex items-center justify-center border border-stone-200 shadow-xs">
            <Compass className="w-4 h-4 text-[#8A6D1C]" />
          </div>
          <h3 className="font-serif text-sm sm:text-base text-stone-850 tracking-wide font-bold">
            {getTxt('valueInterTitle', t('valueInterTitle'))}
          </h3>
          <p className="text-xs text-stone-600 leading-relaxed font-light">
            {getTxt('valueInterDesc', t('valueInterDesc'))}
          </p>
        </div>

      </section>

      {/* SECTION 3: CONTACT FORM & INQUIRIES */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4 border-t border-stone-200" id="about-contact-section">
        
        {/* Left Column: Direct Info */}
        <div className="space-y-6 text-left">
          <div className="space-y-3">
            <span className="text-[11px] font-serif text-[#8A6D1C] tracking-widest uppercase font-bold">
              {getTxt('contactTitle', t('contactTitle'))}
            </span>
            <h2 className="font-serif text-xl sm:text-2xl text-stone-850 tracking-wide font-bold">
              {getTxt('contactSubtitle', t('contactSubtitle'))}
            </h2>
            <p className="text-xs text-stone-600 leading-relaxed font-light whitespace-pre-wrap">
              {getTxt('contactDesc', t('contactDesc'))}
            </p>
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex items-center space-x-3 text-stone-700">
              <div className="p-2 border rounded-lg border-stone-200 text-[#8A6D1C] bg-white shadow-xs">
                <Mail className="w-4 h-4 text-[#8A6D1C]" />
              </div>
              <span className="text-xs font-mono">{getTxt('contactEmail', 'library@mingde-tianfang.org')}</span>
            </div>

            <div className="flex items-center space-x-3 text-stone-700">
              <div className="p-2 border rounded-lg border-stone-200 text-[#8A6D1C] bg-white shadow-xs">
                <Phone className="w-4 h-4 text-[#8A6D1C]" />
              </div>
              <span className="text-xs font-mono">{getTxt('contactPhone', '+86 (010) 6512-8800')}</span>
            </div>

            <div className="flex items-center space-x-3 text-stone-700">
              <div className="p-2 border rounded-lg border-stone-200 text-emerald-700 bg-white shadow-xs">
                <MapPin className="w-4 h-4 text-emerald-750" />
              </div>
              <span className="text-xs font-sans font-light text-stone-700">
                {getTxt('contactAddress', t('contactAddress'))}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Contact form */}
        <div className="p-6 sm:p-8 glass-panel border border-stone-200 bg-white rounded-3xl shadow-sm" id="contact-form-card">
          <AnimatePresence mode="wait">
            
            {submitted ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="py-12 text-center space-y-4"
              >
                <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto shadow-sm" />
                <h3 className="font-serif text-stone-850 text-base font-bold">{t('formSubmittedTitle')}</h3>
                <p className="text-xs text-stone-600 max-w-sm mx-auto font-light leading-relaxed">
                  {t('formSubmittedDesc')}
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-4 py-2 bg-stone-150 text-stone-800 border border-stone-200 hover:border-gold-brand hover:text-[#8A6D1C] rounded-xl text-xs transition-colors cursor-pointer font-sans font-semibold"
                >
                  {t('btnFormWriteNew')}
                </button>
              </motion.div>
            ) : (
              <motion.form 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onSubmit={handleContactSubmit}
                className="space-y-4 text-left"
              >
                {error && (
                  <div className="p-3 bg-red-100 border border-red-200 text-red-700 text-xs rounded-lg">
                    {error}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-[11px] text-stone-500 tracking-wider font-serif font-bold">
                    {t('formLabelName')}
                  </label>
                  <input
                    type="text"
                    id="contact-name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('formPlaceholderName')}
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 focus:border-[#8A6D1C] rounded-xl text-stone-850 text-xs tracking-wider outline-none transition-all placeholder:text-stone-400 font-sans"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] text-stone-500 tracking-wider font-serif font-bold">
                    {t('formLabelEmail')}
                  </label>
                  <input
                    type="email"
                    id="contact-email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('formPlaceholderEmail')}
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 focus:border-[#8A6D1C] rounded-xl text-stone-850 text-xs tracking-wider outline-none transition-all placeholder:text-stone-400 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] text-stone-500 tracking-wider font-serif font-bold">
                    {t('formLabelTopic')}
                  </label>
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 focus:border-[#8A6D1C] rounded-xl text-stone-850 text-xs tracking-wide outline-none transition-all font-sans cursor-pointer"
                    id="contact-topic"
                  >
                    <option value="academic">{t('formTopic1')}</option>
                    <option value="calligraphy">{t('formTopic2')}</option>
                    <option value="platform">{t('formTopic3')}</option>
                    <option value="other">{t('formTopic4')}</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] text-stone-500 tracking-wider font-serif font-bold">
                    {t('formLabelMessage')}
                  </label>
                  <textarea
                    required
                    rows={4}
                    id="contact-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t('formPlaceholderMessage')}
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 focus:border-[#8A6D1C] rounded-xl text-stone-850 text-xs tracking-wider outline-none transition-all placeholder:text-stone-400 font-sans"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  id="btn-contact-submit"
                  className="flex items-center justify-center space-x-2 w-full py-3 bg-[#8A6D1C] hover:bg-[#725a17] active:scale-95 text-white rounded-xl font-serif font-bold tracking-widest text-xs transition-colors cursor-pointer shadow"
                >
                  {submitting ? (
                    <span>{t('formSubmitting')}</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>{t('btnFormSubmit')}</span>
                    </>
                  )}
                </button>
              </motion.form>
            )}

          </AnimatePresence>
        </div>

      </section>

    </div>
  );
};
