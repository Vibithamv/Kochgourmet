import { Platform, StatusBar } from 'react-native';
import type { ThemeMode } from '@/constants/themes';

const IOS_STATUS_STRIP_MAX = 50;
export const STATUS_BAR_HERO_SCROLL_THRESHOLD = 12;

export type StatusBarIconStyle = 'light-content' | 'dark-content';
export type ExpoStatusBarStyle = 'light' | 'dark';

/** White icons on dark/forest themes; light theme uses hero scroll or dark icons on light surfaces. */
export function getDetailScreenStatusBarConfig(
  theme: ThemeMode,
  heroAtTop: boolean,
): { native: StatusBarIconStyle; expo: ExpoStatusBarStyle } {
  const isDark = theme === 'dark' || theme === 'darkGreen';
  if (isDark) {
    return { native: 'light-content', expo: 'light' };
  }
  if (heroAtTop) {
    return { native: 'light-content', expo: 'light' };
  }
  return { native: 'dark-content', expo: 'dark' };
}

export function getRootStatusBarConfig(theme: ThemeMode): {
  native: StatusBarIconStyle;
  expo: ExpoStatusBarStyle;
} {
  return getDetailScreenStatusBarConfig(theme, false);
}

export function getStatusBarStripHeight(safeAreaTop: number): number {
  if (Platform.OS === 'android') {
    return StatusBar.currentHeight ?? safeAreaTop;
  }
  return Math.min(safeAreaTop, IOS_STATUS_STRIP_MAX);
}

export function isHeroAtTop(
  scrollY: number,
  showHeroImage: boolean,
  heroHeight: number,
): boolean {
  return showHeroImage && scrollY < heroHeight - STATUS_BAR_HERO_SCROLL_THRESHOLD;
}

/** @deprecated Use isHeroAtTop */
export const isRecipeHeroAtTop = isHeroAtTop;

/** Transparent over hero; solid surface once scrolled past the hero image. */
export function getHeroStatusBarStripBackground(
  colors: { background: { primary: string } },
  scrollY: number,
  showHeroImage: boolean,
  heroHeight: number,
): string {
  return isHeroAtTop(scrollY, showHeroImage, heroHeight)
    ? 'transparent'
    : colors.background.primary;
}

/** @deprecated Use getHeroStatusBarStripBackground */
export const getRecipeStatusBarStripBackground = getHeroStatusBarStripBackground;
