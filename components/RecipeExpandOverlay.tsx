import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  Image,
  Modal,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Clock, Star, Heart } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors } from '@/constants/theme';
import type { Recipe, CardLayout } from '@/components/RecipeCard';
import { REZEPE_CARD_IMAGE_SIZE } from '@/components/RecipeCard';
import RecipeDetailContent, { RECIPE_HERO_IMAGE_HEIGHT } from '@/components/RecipeDetailContent';
import { normalizeCardLayoutForModal } from '@/utils/normalizeCardLayoutForModal';
import {
  getStatusBarStripHeight,
  getHeroStatusBarStripBackground,
  isHeroAtTop,
} from '@/utils/statusBarLayout';
import { useDetailScreenStatusBar } from '@/hooks/useStatusBarStyle';
import { suppressTabBar, restoreTabBar } from '@/utils/tabBarStore';
import {
  MODAL_ANDROID_BOTTOM_BLEED,
  getOverlayFloatingActionsBottom,
  useModalScreenSize,
} from '@/utils/modalScreenMetrics';

const HERO_HEIGHT = RECIPE_HERO_IMAGE_HEIGHT;
const CARD_RADIUS = 12;
const REZEPE_META_COLOR = '#525252';

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
  const { width: screenW, height: screenH } = useModalScreenSize();
  const statusBarStripHeight = getStatusBarStripHeight(insets.top);
  const shellBottomBleed = Platform.OS === 'android' ? MODAL_ANDROID_BOTTOM_BLEED : 0;
  const floatingActionsBottom = getOverlayFloatingActionsBottom(insets.bottom, shellBottomBleed);

  const progress = useSharedValue(0);
  const isClosing = useSharedValue(0);
  const [detailInteractive, setDetailInteractive] = useState(false);
  const [scrollLayoutReady, setScrollLayoutReady] = useState(false);
  const [closing, setClosing] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  const normalizedLayout = normalizeCardLayoutForModal(sourceLayout);
  const sourceImageHeight =
    normalizedLayout.width * (REZEPE_CARD_IMAGE_SIZE.height / REZEPE_CARD_IMAGE_SIZE.width);

  const heroAtTop = detailInteractive
    ? isHeroAtTop(scrollY, true, HERO_HEIGHT)
    : true;
  const statusBarStripBackground = detailInteractive
    ? getHeroStatusBarStripBackground(colors, scrollY, true, HERO_HEIGHT)
    : 'transparent';

  const statusBarConfig = useDetailScreenStatusBar(
    true,
    theme,
    heroAtTop,
    statusBarStripBackground,
  );

  const heartColor = recipe.isFavourite ? colors.primary : REZEPE_META_COLOR;
  const heartStrokeWidth = recipe.isFavourite ? 1.5 : 0.55;

  const handleClose = useCallback(() => {
    if (closing) return;
    setClosing(true);
    setDetailInteractive(false);
    setScrollLayoutReady(false);
    isClosing.value = 1;
    progress.value = withSpring(0, COLLAPSE_SPRING);
  }, [closing, isClosing, progress]);

  useEffect(() => {
    suppressTabBar();
    return () => restoreTabBar();
  }, []);

  useEffect(() => {
    progress.value = withSpring(1, EXPAND_SPRING);
    const layoutTimer = setTimeout(() => setScrollLayoutReady(true), EXPAND_DETAIL_DELAY_MS - 70);
    const detailTimer = setTimeout(() => setDetailInteractive(true), EXPAND_DETAIL_DELAY_MS);
    return () => {
      clearTimeout(layoutTimer);
      clearTimeout(detailTimer);
    };
  }, [progress]);

  useEffect(() => {
    if (!detailInteractive) {
      setScrollY(0);
    }
  }, [detailInteractive]);

  const handleScrollOffsetChange = useCallback((y: number) => {
    setScrollY(y);
  }, []);

  useEffect(() => {
    if (!closing) return;
    const timer = setTimeout(() => onClose(), COLLAPSE_CLOSE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [closing, onClose]);

  const heroLayoutActive = scrollLayoutReady || detailInteractive || closing;

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 0.55], Extrapolation.CLAMP),
  }));

  const shellStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const initialRight = screenW - normalizedLayout.x - normalizedLayout.width;
    const initialBottom = screenH - normalizedLayout.y - normalizedLayout.height;

    return {
      position: 'absolute',
      top: interpolate(p, [0, 1], [normalizedLayout.y, 0], Extrapolation.CLAMP),
      left: interpolate(p, [0, 1], [normalizedLayout.x, 0], Extrapolation.CLAMP),
      right: interpolate(p, [0, 1], [initialRight, 0], Extrapolation.CLAMP),
      bottom: interpolate(
        p,
        [0, 1],
        [initialBottom, -shellBottomBleed],
        Extrapolation.CLAMP,
      ),
      borderRadius: interpolate(p, [0, 1], [CARD_RADIUS, 0], Extrapolation.CLAMP),
      borderWidth: isClosing.value
        ? interpolate(p, [0, 1], [1, 0], Extrapolation.CLAMP)
        : interpolate(p, [0, 0.85], [1, 0], Extrapolation.CLAMP),
      overflow: 'hidden',
    };
  }, [
    normalizedLayout.height,
    normalizedLayout.width,
    normalizedLayout.x,
    normalizedLayout.y,
    screenH,
    screenW,
    shellBottomBleed,
  ]);

  const imageStyle = useAnimatedStyle(() => ({
    height: interpolate(progress.value, [0, 1], [sourceImageHeight, HERO_HEIGHT], Extrapolation.CLAMP),
    width: '100%',
  }));

  const cardPreviewStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const imageHeight = interpolate(p, [0, 1], [sourceImageHeight, HERO_HEIGHT], Extrapolation.CLAMP);
    const opacity = isClosing.value
      ? 1
      : interpolate(p, [0, 0.7, 0.9], [1, 1, 0], Extrapolation.CLAMP);

    return {
      opacity,
      top: imageHeight,
      left: 0,
      right: 0,
      paddingHorizontal: 10,
      paddingTop: 10,
      gap: 6,
    };
  });

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
      <View style={[styles.root, { minHeight: screenH, width: screenW }]}>
        <StatusBar style={statusBarConfig.expo} />
        <View
          pointerEvents="none"
          style={[
            styles.statusBarOverlay,
            {
              height: statusBarStripHeight,
              backgroundColor: statusBarStripBackground,
            },
          ]}
        />

        <Animated.View
          style={[styles.backdrop, { backgroundColor: colors.background.overlay }, backdropStyle]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <Animated.View
          style={[
            shellStyle,
            {
              backgroundColor: colors.background.primary,
              borderColor: colors.border.primary,
            },
          ]}
        >
          {shellBottomBleed > 0 ? (
            <View
              pointerEvents="none"
              style={[
                styles.shellBottomBleed,
                {
                  height: shellBottomBleed,
                  backgroundColor: colors.background.secondary,
                },
              ]}
            />
          ) : null}
          <Animated.View
            style={[
              imageStyle,
              heroLayoutActive && styles.expandHeroAbsolute,
              detailInteractive && !closing && styles.expandHeroHidden,
            ]}
            pointerEvents="none"
          >
            <Image source={{ uri: recipe.imageUrl }} style={styles.image} resizeMode="cover" />
          </Animated.View>

          {!detailInteractive && (
            <Animated.View style={[styles.cardPreview, cardPreviewStyle]}>
              <Text
                style={[styles.previewTitle, { color: colors.text.primary }]}
                numberOfLines={2}
              >
                {recipe.title}
              </Text>
              <View style={styles.previewMeta}>
                <View style={styles.previewMetaLeft}>
                  <View style={styles.previewMetaItem}>
                    <Clock size={11} color={REZEPE_META_COLOR} />
                    <Text style={styles.previewMetaText}>{recipe.durationMinutes} Min</Text>
                  </View>
                  <View style={styles.previewMetaItem}>
                    <Star size={11} color={REZEPE_META_COLOR} />
                    <Text style={styles.previewMetaText}>{recipe.rating}</Text>
                  </View>
                </View>
                <Heart
                  size={16}
                  color={heartColor}
                  fill={recipe.isFavourite ? colors.primary : 'transparent'}
                  strokeWidth={heartStrokeWidth}
                />
              </View>
            </Animated.View>
          )}

          <View
            style={[
              styles.bodyArea,
              scrollLayoutReady && !closing && styles.bodyAreaExpanded,
              scrollLayoutReady && !detailInteractive && !closing && { paddingTop: HERO_HEIGHT },
            ]}
          >
            {scrollLayoutReady && !closing ? (
              <Animated.View
                style={[
                  detailInteractive ? styles.detailExpanded : detailStyle,
                ]}
                pointerEvents={detailInteractive ? 'auto' : 'none'}
              >
                <RecipeDetailContent
                  recipeId={recipe.id}
                  onClose={handleClose}
                  showHeroImage={detailInteractive}
                  heroImageUriOverride={recipe.imageUrl}
                  bodyOnlyLoading
                  deferStatusBarToParent
                  overlayContentPadding
                  floatingActionsBottom={floatingActionsBottom}
                  onScrollOffsetChange={handleScrollOffsetChange}
                />
              </Animated.View>
            ) : null}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  shellBottomBleed: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -MODAL_ANDROID_BOTTOM_BLEED,
  },
  statusBarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  backdrop: { ...StyleSheet.absoluteFillObject },
  image: { width: '100%', height: '100%' },
  expandHeroAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
  },
  expandHeroHidden: { opacity: 0 },
  bodyArea: { flex: 1, overflow: 'hidden' },
  bodyAreaExpanded: {
    ...StyleSheet.absoluteFillObject,
  },
  detailExpanded: {
    flex: 1,
  },
  cardPreview: {
    position: 'absolute',
    zIndex: 3,
  },
  previewTitle: {
    fontFamily: 'Roboto-Regular',
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: 0,
  },
  previewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  previewMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  previewMetaText: {
    fontFamily: 'Roboto-Light',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
    color: REZEPE_META_COLOR,
    marginTop: 1,
  },
});
