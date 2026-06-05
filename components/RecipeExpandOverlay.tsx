import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  Image,
  Modal,
  StyleSheet,
  Dimensions,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Clock, Star } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors } from '@/constants/theme';
import type { Recipe, CardLayout } from '@/components/RecipeCard';
import RecipeDetailContent from '@/components/RecipeDetailContent';
import { normalizeCardLayoutForModal } from '@/utils/normalizeCardLayoutForModal';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const HERO_HEIGHT = 280;
const CARD_RADIUS = 12;

const EXPAND_SPRING = {
  damping: 28,
  stiffness: 95,
  mass: 1.5,
};

const COLLAPSE_SPRING = {
  damping: 30,
  stiffness: 105,
  mass: 1.5,
};

const EXPAND_DETAIL_DELAY_MS = 820;
const COLLAPSE_CLOSE_DELAY_MS = 820;
const TAB_BAR_CLEARANCE = 90;

export interface RecipeExpandOverlayProps {
  readonly recipe: Recipe;
  readonly sourceLayout: CardLayout;
  readonly onClose: () => void;
}

export default function RecipeExpandOverlay({
  recipe,
  sourceLayout,
  onClose,
}: RecipeExpandOverlayProps) {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const insets = useSafeAreaInsets();

  const progress = useSharedValue(0);
  const [detailInteractive, setDetailInteractive] = useState(false);
  const [closing, setClosing] = useState(false);

  const normalizedLayout = normalizeCardLayoutForModal(sourceLayout);
  const sourceImageHeight = normalizedLayout.width * (3 / 4);

  const handleClose = useCallback(() => {
    if (closing) return;
    setClosing(true);
    setDetailInteractive(false);
    progress.value = withSpring(0, COLLAPSE_SPRING);
  }, [closing, progress]);

  useEffect(() => {
    progress.value = withSpring(1, EXPAND_SPRING);
    const timer = setTimeout(() => setDetailInteractive(true), EXPAND_DETAIL_DELAY_MS);
    return () => clearTimeout(timer);
  }, [progress]);

  useEffect(() => {
    if (!closing) return;
    const timer = setTimeout(() => onClose(), COLLAPSE_CLOSE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [closing, onClose]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 0.55], Extrapolation.CLAMP),
  }));

  const shellStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      position: 'absolute',
      left: interpolate(p, [0, 1], [normalizedLayout.x, 0], Extrapolation.CLAMP),
      top: interpolate(p, [0, 1], [normalizedLayout.y, 0], Extrapolation.CLAMP),
      width: interpolate(p, [0, 1], [normalizedLayout.width, SCREEN_W], Extrapolation.CLAMP),
      height: interpolate(p, [0, 1], [normalizedLayout.height, SCREEN_H], Extrapolation.CLAMP),
      borderRadius: interpolate(p, [0, 1], [CARD_RADIUS, 0], Extrapolation.CLAMP),
      overflow: 'hidden',
    };
  });

  const imageStyle = useAnimatedStyle(() => ({
    height: interpolate(progress.value, [0, 1], [sourceImageHeight, HERO_HEIGHT], Extrapolation.CLAMP),
    width: '100%',
  }));

  const cardPreviewStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.7, 0.9], [1, 1, 0], Extrapolation.CLAMP),
  }));

  const detailStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.75, 1], [0, 1], Extrapolation.CLAMP),
    flex: 1,
  }));

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.root}>
        <Animated.View
          style={[styles.backdrop, { backgroundColor: colors.background.overlay }, backdropStyle]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <Animated.View style={[shellStyle, { backgroundColor: colors.background.card }]}>
          <Animated.View style={imageStyle}>
            <Image source={{ uri: recipe.imageUrl }} style={styles.image} resizeMode="cover" />
          </Animated.View>

          <View style={styles.bodyArea}>
            <Animated.View style={[styles.cardPreview, cardPreviewStyle]}>
              <Text
                style={[styles.previewTitle, { color: colors.text.primary }]}
                numberOfLines={2}
              >
                {recipe.title}
              </Text>
              <View style={styles.previewMeta}>
                <View style={styles.metaItem}>
                  <Clock size={13} color={colors.text.tertiary} />
                  <Text style={[styles.previewMetaText, { color: colors.text.tertiary }]}>
                    {recipe.durationMinutes} Min
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Star size={13} color={colors.text.tertiary} />
                  <Text style={[styles.previewMetaText, { color: colors.text.tertiary }]}>
                    {recipe.rating}
                  </Text>
                </View>
              </View>
            </Animated.View>

            <Animated.View
              style={detailStyle}
              pointerEvents={detailInteractive ? 'auto' : 'none'}
            >
              <RecipeDetailContent
                recipeId={recipe.id}
                onClose={handleClose}
                showHeroImage={false}
                floatingActionsBottom={Math.max(insets.bottom, 12) + TAB_BAR_CLEARANCE}
              />
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backdrop: { ...StyleSheet.absoluteFillObject },
  image: { width: '100%', height: '100%' },
  bodyArea: { flex: 1, overflow: 'hidden' },
  cardPreview: { ...StyleSheet.absoluteFillObject, padding: 10, gap: 6 },
  previewTitle: {
    fontFamily: 'Roboto-Regular',
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: 0,
  },
  previewMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  previewMetaText: { fontSize: 12, fontFamily: 'Inter-Regular' },
});
