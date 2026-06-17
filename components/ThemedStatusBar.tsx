import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { useRootStatusBar } from '@/hooks/useStatusBarStyle';
import { useRootStatusBarSuppressed } from '@/utils/statusBarStore';

export function ThemedStatusBar() {
  const { theme } = useTheme();
  const config = useRootStatusBar(theme);
  const suppressed = useRootStatusBarSuppressed();

  if (suppressed) return null;

  return <StatusBar style={config.expo} />;
}
