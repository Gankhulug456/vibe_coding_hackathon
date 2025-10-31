
"use client";

import type { Translations } from '@/types';
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import en from '@/components/i18n/locales/en.json';
import mn from '@/components/i18n/locales/mn.json';

type Language = 'en' | 'mn';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, replacements?: Record<string, string>) => string;
  translations: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const resources: Record<Language, Translations> = {
  en,
  mn,
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('mn');
  const [translations, setTranslations] = useState<Translations>(resources.mn);

  useEffect(() => {
    const storedLang = localStorage.getItem('nomad-intern-lang') as Language | null;
    if (storedLang && (storedLang === 'en' || storedLang === 'mn')) {
      setLanguageState(storedLang);
      setTranslations(resources[storedLang]);
    } else {
      setLanguageState('mn');
      setTranslations(resources.mn);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    setTranslations(resources[lang]);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem('nomad-intern-lang', lang);
    }
  };

  const t = useCallback((key: string, replacements?: Record<string, string>): string => {
      const keys = key.split('.');
      let result: any = translations;
      for (const k of keys) {
        result = result?.[k];
        if (result === undefined) {
          // Fallback to English if translation not found, then to key itself
          let fallbackResult: any = resources.en;
          for (const fk of keys) {
            fallbackResult = fallbackResult?.[fk];
            if (fallbackResult === undefined) return key;
          }
          if (typeof fallbackResult === 'string') {
             result = fallbackResult;
             break;
          }
          return key;
        }
      }
      
      if (typeof result === 'string' && replacements) {
        Object.keys(replacements).forEach(rKey => {
          // Use a RegExp to replace all occurrences of {key}
          const regex = new RegExp(`\\{${rKey}\\}`, 'g');
          result = result.replace(regex, replacements[rKey]);
        });
      }
      
      return typeof result === 'string' ? result : key;
    },
    [translations]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, translations }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
