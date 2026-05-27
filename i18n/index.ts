import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import de from './locales/de.json';
import es from './locales/es.json';

export const USER_LANGUAGE_STORAGE_KEY = 'user-language';

const SUPPORTED_LANGUAGES = ['en', 'de', 'es'] as const;
const DEFAULT_LANGUAGE = 'de';

const resources = {
  en: { translation: en },
  de: { translation: de },
  es: { translation: es },
};

function normalizeLanguageCode(lng: string | null | undefined): string | null {
  if (!lng) return null;
  const base = lng.split('-')[0]?.toLowerCase();
  if (base && (SUPPORTED_LANGUAGES as readonly string[]).includes(base)) {
    return base;
  }
  return null;
}

export async function getStoredUserLanguage(): Promise<string | null> {
  try {
    const saved = await AsyncStorage.getItem(USER_LANGUAGE_STORAGE_KEY);
    return normalizeLanguageCode(saved);
  } catch (error) {
    console.log('Error reading saved language:', error);
    return null;
  }
}

export async function persistUserLanguage(lng: string): Promise<void> {
  const normalized = normalizeLanguageCode(lng) ?? DEFAULT_LANGUAGE;
  try {
    await AsyncStorage.setItem(USER_LANGUAGE_STORAGE_KEY, normalized);
  } catch (error) {
    console.log('Error saving language:', error);
  }
}

const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      const savedLanguage = await getStoredUserLanguage();
      if (savedLanguage) {
        callback(savedLanguage);
        return;
      }
      callback(DEFAULT_LANGUAGE);
    } catch (error) {
      console.log('Error detecting language:', error);
      callback(DEFAULT_LANGUAGE);
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    await persistUserLanguage(lng);
  },
};

void i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: [...SUPPORTED_LANGUAGES],
    debug: __DEV__,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
    defaultNS: 'translation',
    ns: ['translation'],
  });

export default i18n;
