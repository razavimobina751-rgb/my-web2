import React, { createContext, useContext, useState } from 'react';
import { Language, TRANSLATIONS } from '../data/translations';

interface LanguageContextProps {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: keyof typeof TRANSLATIONS['zh']) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    return (localStorage.getItem('mingde_lang') as Language) || 'zh';
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('mingde_lang', newLang);
  };

  const t = (key: keyof typeof TRANSLATIONS['zh']): string => {
    const textDict = TRANSLATIONS[lang] || TRANSLATIONS['zh'];
    return textDict[key] || TRANSLATIONS['zh'][key] || String(key);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
