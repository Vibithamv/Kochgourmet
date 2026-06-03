import { Platform, StatusBar } from 'react-native';
import type { CardLayout } from '@/components/RecipeCard';

/** Align measureInWindow coords with Android Modal + statusBarTranslucent. */
export function normalizeCardLayoutForModal(layout: CardLayout): CardLayout {
  if (Platform.OS !== 'android') return layout;
  return {
    ...layout,
    y: layout.y + (StatusBar.currentHeight ?? 0),
  };
}
