import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { useRootStatusBar } from '@/hooks/useStatusBarStyle';

export function ThemedStatusBar() {
  const { theme } = useTheme();
  const config = useRootStatusBar(theme);

  return <StatusBar style={config.expo} />;
}
