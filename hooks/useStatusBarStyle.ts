import { useEffect } from 'react';
import { Platform, StatusBar as RNStatusBar } from 'react-native';
import type { ThemeMode } from '@/constants/themes';
import {
  getDetailScreenStatusBarConfig,
  getRootStatusBarConfig,
  type StatusBarIconStyle,
} from '@/utils/statusBarLayout';

type StatusBarOptions = {
  readonly androidBackgroundColor?: string;
  readonly resetStyle?: StatusBarIconStyle;
};

/** Sync native status bar icon style; overrides root expo StatusBar while active. */
export function useStatusBarStyle(
  enabled: boolean,
  style: StatusBarIconStyle,
  options?: StatusBarOptions,
) {
  const resetStyle = options?.resetStyle ?? 'dark-content';
  const androidBackgroundColor = options?.androidBackgroundColor;

  useEffect(() => {
    if (!enabled) return;

    RNStatusBar.setBarStyle(style, true);

    if (Platform.OS === 'android' && androidBackgroundColor != null) {
      RNStatusBar.setBackgroundColor(androidBackgroundColor, true);
    }

    return () => {
      RNStatusBar.setBarStyle(resetStyle, true);
      if (Platform.OS === 'android') {
        RNStatusBar.setBackgroundColor('transparent', true);
      }
    };
  }, [enabled, style, resetStyle, androidBackgroundColor]);
}

export function useDetailScreenStatusBar(
  enabled: boolean,
  theme: ThemeMode,
  heroAtTop: boolean,
  stripBackground: string,
) {
  const config = getDetailScreenStatusBarConfig(theme, heroAtTop);
  const resetConfig = getRootStatusBarConfig(theme);
  useStatusBarStyle(enabled, config.native, {
    androidBackgroundColor: stripBackground,
    resetStyle: resetConfig.native,
  });
  return config;
}

export function useRootStatusBar(theme: ThemeMode) {
  const config = getRootStatusBarConfig(theme);
  useEffect(() => {
    RNStatusBar.setBarStyle(config.native, true);
  }, [config.native]);
  return config;
}
