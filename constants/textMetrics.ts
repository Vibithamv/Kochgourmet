import { Platform, type TextStyle, type ViewStyle } from 'react-native';

/** Comfortable line height for custom fonts (Roboto, Playfair, Inter) — avoids descender clipping. */
export function lh(fontSize: number): number {
  return Math.round(fontSize * 1.35);
}

/** Tighter but still safe for single-line labels in pills / tab bar. */
export function lhTight(fontSize: number): number {
  return Math.round(fontSize * 1.25);
}

/** Disable Android extra font padding that causes uneven vertical clipping. */
export const androidTextFix: TextStyle =
  Platform.OS === 'android' ? { includeFontPadding: false } : {};

/** Recommended line heights keyed by font size (used by bulk style fixes). */
export const LINE_HEIGHT_BY_FONT_SIZE: Record<number, number> = {
  10: 14,
  11: 15,
  12: 16,
  13: 18,
  14: 19,
  15: 20,
  16: 22,
  17: 23,
  18: 24,
  20: 27,
  22: 30,
  24: 32,
  26: 35,
  28: 38,
  32: 43,
  35: 48,
  42: 52,
};

export const PILL_SEARCH_FONT_SIZE = 17;
export const PILL_SEARCH_BAR_HEIGHT = 48;

/** Pill-shaped search row — fixed height avoids Android TextInput vertical clipping. */
export const pillSearchBarStyle: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  borderRadius: 9999,
  paddingHorizontal: 16,
  height: PILL_SEARCH_BAR_HEIGHT,
  gap: 8,
};

/** Single-line pill search input; omit Android lineHeight so glyphs center without top clip. */
export function pillSearchInputStyle(overrides?: TextStyle): TextStyle {
  return {
    flex: 1,
    fontFamily: 'Roboto-Light',
    fontSize: PILL_SEARCH_FONT_SIZE,
    letterSpacing: 0,
    paddingVertical: 0,
    margin: 0,
    ...androidTextFix,
    ...(Platform.OS === 'android'
      ? { textAlignVertical: 'center' }
      : { lineHeight: LINE_HEIGHT_BY_FONT_SIZE[PILL_SEARCH_FONT_SIZE] }),
    ...overrides,
  };
}
