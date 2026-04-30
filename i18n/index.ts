import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translation files
import en from './locales/en.json';
import de from './locales/de.json';
import es from './locales/es.json';

const resources = {
  en: { translation: en },
  de: { translation: de },
  es: { translation: es },
};

// Custom language detector for React Native
const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      // Only use AsyncStorage in client-side environment
      if (globalThis.window !== undefined) {
        // Try to get saved language from AsyncStorage
        const savedLanguage = await AsyncStorage.getItem('user-language');
        if (savedLanguage) {
          callback(savedLanguage);
          return;
        }
      }
      
      // Fallback when no saved preference (system locale detection can be added later)
      const systemLanguage = 'de';
      callback(systemLanguage);
    } catch (error) {
      console.log('Error detecting language:', error);
      callback('de');
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      // Only use AsyncStorage in client-side environment
      if (globalThis.window !== undefined) {
        await AsyncStorage.setItem('user-language', lng);
      }
    } catch (error) {
      console.log('Error saving language:', error);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: 'de',
    fallbackLng: ['de', 'en'],
    debug: __DEV__,
    
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    react: {
      useSuspense: false, // Important for React Native
    },
    
    // Namespace configuration
    defaultNS: 'translation',
    ns: ['translation'],
  });

export default i18n;