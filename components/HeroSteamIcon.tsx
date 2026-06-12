import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

const HERO_STEAM_WAVY = require('../assets/images/hero-steam-wavy.png');

/** Asset is 1024×682 — wider than the legacy SVG icon. */
const HERO_STEAM_ASPECT = 1024 / 682;

interface HeroSteamIconProps {
  readonly size?: number;
}

/** Default rendered width of the steam icon. */
export const HERO_STEAM_ICON_SIZE = 60;
/** Default rendered height derived from asset aspect ratio. */
export const HERO_STEAM_RENDERED_HEIGHT = Math.round(HERO_STEAM_ICON_SIZE / HERO_STEAM_ASPECT);
export const HERO_STEAM_ICON_OVERHANG = HERO_STEAM_RENDERED_HEIGHT / 2;

/** Wavy steam graphic for recipe hero images. */
export default function HeroSteamIcon({ size = HERO_STEAM_ICON_SIZE }: HeroSteamIconProps) {
  const width = size;
  const height = size / HERO_STEAM_ASPECT;

  return (
    <View pointerEvents="none">
      <Image
        source={HERO_STEAM_WAVY}
        style={{ width, height }}
        resizeMode="contain"
      />
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
