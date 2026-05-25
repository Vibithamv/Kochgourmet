import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThemeMode } from '@/constants/themes';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  isDark: boolean;
  isDarkGreen: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

type ThemeProviderProps = Readonly<{
  children: React.ReactNode;
}>;

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<ThemeMode>('dark');

  const applyTheme = useCallback(async (newTheme: ThemeMode) => {
    setTheme(newTheme);
    try {
      await AsyncStorage.setItem('app-theme', newTheme);
    } catch (error) {
      console.log('Error saving theme:', error);
    }
  }, []);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('app-theme');
        if (savedTheme && ['light', 'dark', 'darkGreen'].includes(savedTheme)) {
          setTheme(savedTheme as ThemeMode);
        }
      } catch (error) {
        console.log('Error loading theme:', error);
      }
    };
    void loadTheme();
  }, []);

  const contextValue = useMemo(
    () => ({
      theme,
      setTheme: (newTheme: ThemeMode) => {
        void applyTheme(newTheme);
      },
      isDark: theme === 'dark',
      isDarkGreen: theme === 'darkGreen',
    }),
    [theme, applyTheme]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};