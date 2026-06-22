import type { ThemeMode } from '@/constants/themes';

/** Light splash — white coral, matches app icon background */
export const SPLASH_BG_LIGHT = '#FFF9F0';

/** Dark theme splash background */
export const SPLASH_BG_DARK = '#171311';

/** Dark green theme splash background */
export const SPLASH_BG_DARK_GREEN = '#0F1612';

/** Logical splash icon size in dp/pt — keep in sync with app.json `imageWidth` and generate-splash-screens.js */
export const SPLASH_ICON_SIZE = 200;

export function getSplashBackground(theme: ThemeMode): string {
  switch (theme) {
    case 'dark':
      return SPLASH_BG_DARK;
    case 'darkGreen':
      return SPLASH_BG_DARK_GREEN;
    default:
      return SPLASH_BG_LIGHT;
  }
}
