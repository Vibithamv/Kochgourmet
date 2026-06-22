import { useMemo } from 'react';
import { Dimensions, Platform, useWindowDimensions } from 'react-native';

/** Extra pixels below the shell on Android to cover OEM nav-bar / inset gaps. */
export const MODAL_ANDROID_BOTTOM_BLEED = 56;

/** Bottom gap for close/share floating actions in expand overlays. */
export const MODAL_OVERLAY_FLOATING_ACTIONS_OFFSET = 52;

export function getOverlayFloatingActionsBottom(
  safeAreaBottom: number,
  shellBottomBleed = 0,
): number {
  return Math.max(safeAreaBottom, 12) + MODAL_OVERLAY_FLOATING_ACTIONS_OFFSET + shellBottomBleed;
}

/** Full display size for expand overlays. Re-read on dimension changes. */
export function getModalScreenSize(): { width: number; height: number } {
  const window = Dimensions.get('window');
  const screen = Dimensions.get('screen');

  if (Platform.OS === 'android') {
    return {
      width: Math.max(window.width, screen.width),
      height: Math.max(window.height, screen.height) + MODAL_ANDROID_BOTTOM_BLEED,
    };
  }

  return { width: window.width, height: window.height };
}

export function useModalScreenSize(): { width: number; height: number } {
  const windowDims = useWindowDimensions();
  return useMemo(
    () => getModalScreenSize(),
    [windowDims.width, windowDims.height],
  );
}
