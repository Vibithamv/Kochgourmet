import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import de from './locales/de.json';
import es from './locales/es.json';

export const LANGUAGE_STORAGE_KEY = 'user-language';

const SUPPORTED_LANGUAGES = ['en', 'de', 'es'] as const;
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const resources = {
  en: { translation: en },
  de: { translation: de },
  es: { translation: es },
};

function normalizeLanguageCode(lng: string | null | undefined): SupportedLanguage | null {
  if (!lng) return null;
  const code = lng.split('-')[0]?.toLowerCase();
  return SUPPORTED_LANGUAGES.includes(code as SupportedLanguage)
    ? (code as SupportedLanguage)
    : null;
}

async function persistLanguage(lng: string): Promise<void> {
  const code = normalizeLanguageCode(lng);
  if (!code) return;
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, code);
  } catch (error) {
    console.log('Error saving language:', error);
  }
}

const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      const savedLanguage = normalizeLanguageCode(await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY));
      callback(savedLanguage ?? 'de');
    } catch (error) {
      console.log('Error detecting language:', error);
      callback('de');
    }
  },
  init: () => {},
  cacheUserLanguage: (lng: string) => {
    void persistLanguage(lng);
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: 'de',
    fallbackLng: 'de',
    supportedLngs: [...SUPPORTED_LANGUAGES],
    debug: __DEV__,
    initImmediate: false,

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: false,
    },

    defaultNS: 'translation',
    ns: ['translation'],
  });

i18n.on('languageChanged', (lng) => {
  void persistLanguage(lng);
});

export default i18n;
