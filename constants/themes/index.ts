// Theme system exports
export { LightTheme, LightTheme as Colors } from './light';
export { DarkTheme } from './dark';
export { DarkGreenTheme } from './darkGreen';

import { LightTheme } from './light';
import { DarkTheme } from './dark';
import { DarkGreenTheme } from './darkGreen';

export type ThemeMode = 'light' | 'dark' | 'darkGreen';

// Dynamic theme getter
export const getTheme = (theme: ThemeMode) => {
  switch (theme) {
    case 'dark': return DarkTheme;
    case 'darkGreen': return DarkGreenTheme;
    default: return LightTheme;
  }
};

// Individual token getters for convenience
export const getColors = (theme: ThemeMode) => getTheme(theme);
export const getTypography = (theme: ThemeMode) => getTheme(theme).typography;
export const getSpacing = (theme: ThemeMode) => getTheme(theme).spacing;
export const getBorderRadius = (theme: ThemeMode) => getTheme(theme).borderRadius;
export const getShadows = (theme: ThemeMode) => getTheme(theme).shadows;
export const getLayout = (theme: ThemeMode) => getTheme(theme).layout;

// Legacy exports for backward compatibility
export const Typography = LightTheme.typography;
export const Spacing = LightTheme.spacing;
export const BorderRadius = LightTheme.borderRadius;
export const Shadows = LightTheme.shadows;
export const Layout = LightTheme.layout;

// Complete theme object
export const Theme = {
  light: LightTheme,
  dark: DarkTheme,
  darkGreen: DarkGreenTheme,
} as const;

export type ThemeType = typeof Theme;
export type ColorTheme = typeof LightTheme;