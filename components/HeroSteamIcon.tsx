import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface HeroSteamIconProps {
  readonly color: string;
  readonly size?: number;
}

/** Default rendered height of the steam icon (matches `size` prop default). */
export const HERO_STEAM_ICON_SIZE = 44;
export const HERO_STEAM_ICON_OVERHANG = HERO_STEAM_ICON_SIZE / 2;

/** Three wavy vertical steam lines for recipe hero images. */
export default function HeroSteamIcon({ color, size = HERO_STEAM_ICON_SIZE }: HeroSteamIconProps) {
  const width = size * 0.86;
  const height = 40;

  return (
    <View pointerEvents="none">
      <Svg width={width} height={height} viewBox="0 0 40 44">
        <Path
          d="M8 42 C3 38 13 34 6 28 C0 22 12 18 7 12 C2 6 10 3 8 0"
          stroke={color}
          strokeWidth={4}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d="M20 42 C15 38 25 33 18 27 C12 21 24 16 19 10 C14 5 22 2 20 0"
          stroke={color}
          strokeWidth={4}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d="M32 42 C27 38 37 33 30 27 C24 21 36 16 31 10 C26 5 34 2 32 0"
          stroke={color}
          strokeWidth={4}
          fill="none"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

export const heroSteamOverlayStyle = StyleSheet.create({
  icon: {
    position: 'absolute',
    right: 16,
    bottom: 0,
    zIndex: 2,
    elevation: 2,
  },
});
