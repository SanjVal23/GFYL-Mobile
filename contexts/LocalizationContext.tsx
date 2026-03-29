import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translateText } from '../services/translationService';

const STORAGE_KEY_PREFIX = 'translations:';

interface LocalizationContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string, fallback: string) => string;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export const LocalizationProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguage] = useState('English');
  const [translations, setTranslations] = useState<Record<string, Record<string, string>>>({});
  const pending = useRef<Set<string>>(new Set());

  useEffect(() => {
    const loadLanguage = async () => {
      const storedLang = await AsyncStorage.getItem('currentLanguage');
      if (storedLang) {
        setLanguage(storedLang);
      }
    };
    loadLanguage();
  }, []);

  useEffect(() => {
    const loadTranslations = async () => {
      if (language === 'English') return;
      const stored = await AsyncStorage.getItem(`${STORAGE_KEY_PREFIX}${language}`);
      if (stored) {
        setTranslations(prev => ({ ...prev, [language]: JSON.parse(stored) }));
      }
    };
    loadTranslations();
  }, [language]);

  useEffect(() => {
    AsyncStorage.setItem('currentLanguage', language);
  }, [language]);

  const persistTranslations = useCallback(async (lang: string, map: Record<string, string>) => {
    await AsyncStorage.setItem(`${STORAGE_KEY_PREFIX}${lang}`, JSON.stringify(map));
  }, []);

  const t = useCallback(
    (key: string, fallback: string) => {
      if (language === 'English') return fallback;
      const langMap = translations[language] || {};
      if (langMap[key]) return langMap[key];

      if (!pending.current.has(key)) {
        pending.current.add(key);
        translateText(fallback, language)
          .then((translated) => {
            setTranslations(prev => {
              const nextMap = { ...(prev[language] || {}), [key]: translated };
              const next = { ...prev, [language]: nextMap };
              persistTranslations(language, nextMap);
              return next;
            });
          })
          .finally(() => {
            pending.current.delete(key);
          });
      }

      return fallback;
    },
    [language, translations, persistTranslations]
  );

  const value = useMemo(() => ({ language, setLanguage, t }), [language, t]);

  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>;
};

export const useLocalization = () => {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used within LocalizationProvider');
  }
  return context;
};
