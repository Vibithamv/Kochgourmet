import { useEffect, useLayoutEffect } from 'react';
import { Platform, StatusBar as RNStatusBar } from 'react-native';
import { setStatusBarStyle } from 'expo-status-bar';
import type { ThemeMode } from '@/constants/themes';
import {
  getDetailScreenStatusBarConfig,
  getRootStatusBarConfig,
  type ExpoStatusBarStyle,
  type StatusBarIconStyle,
} from '@/utils/statusBarLayout';
import { restoreRootStatusBar, suppressRootStatusBar } from '@/utils/statusBarStore';

type StatusBarOptions = {
  readonly resetStyle?: StatusBarIconStyle;
};

function toExpoStyle(style: StatusBarIconStyle): ExpoStatusBarStyle {
  return style === 'light-content' ? 'light' : 'dark';
}

function applyStatusBarIconStyle(style: StatusBarIconStyle, animated: boolean) {
  if (Platform.OS === 'android') {
    setStatusBarStyle(toExpoStyle(style), animated);
    return;
  }
  RNStatusBar.setBarStyle(style, animated);
}

/** Sync status bar icon style; overrides root ThemedStatusBar while active. */
export function useStatusBarStyle(
  enabled: boolean,
  style: StatusBarIconStyle,
  options?: StatusBarOptions,
) {
  const resetStyle = options?.resetStyle ?? 'dark-content';

  useLayoutEffect(() => {
    if (!enabled) return;
    applyStatusBarIconStyle(style, true);
  }, [enabled, style]);

  useEffect(() => {
    if (!enabled) return;

    return () => {
      applyStatusBarIconStyle(resetStyle, true);
    };
  }, [enabled, resetStyle]);
}

export function useDetailScreenStatusBar(
  enabled: boolean,
  theme: ThemeMode,
  heroAtTop: boolean,
  _stripBackground: string,
) {
  const config = getDetailScreenStatusBarConfig(theme, heroAtTop);
  const resetConfig = getRootStatusBarConfig(theme);

  useEffect(() => {
    if (!enabled) return;
    suppressRootStatusBar();
    return () => restoreRootStatusBar();
  }, [enabled]);

  useStatusBarStyle(enabled, config.native, {
    resetStyle: resetConfig.native,
  });

  return config;
}
export function useRootStatusBar(theme: ThemeMode) {
  const config = getRootStatusBarConfig(theme);

  useEffect(() => {
    applyStatusBarIconStyle(config.native, true);
  }, [config.native]);

  return config;
}

