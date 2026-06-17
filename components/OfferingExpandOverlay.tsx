import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  Image,
  Modal,
  StyleSheet,
  Dimensions,
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
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors } from '@/constants/theme';
import type { CardLayout } from '@/components/RecipeCard';
import OfferingDetailContent, {
  PROJECT_DETAIL_HERO_HEIGHT,
} from '@/components/OfferingDetailContent';
import { normalizeCardLayoutForModal } from '@/utils/normalizeCardLayoutForModal';
import {
  getStatusBarStripHeight,
  getHeroStatusBarStripBackground,
  isHeroAtTop,
} from '@/utils/statusBarLayout';
import { useDetailScreenStatusBar } from '@/hooks/useStatusBarStyle';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const BONUS_CARD_HEIGHT = 470;
const CARD_RADIUS = 20;
const TAB_BAR_CLEARANCE = 90;

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

const EXPAND_LAYOUT_DELAY_MS = 820;
const COLLAPSE_CLOSE_DELAY_MS = 820;

export interface BonusOfferingPreview {
  id: string;
  title: string;
  imageUrl: string;
  durationLabel: string;
  priceLabel: string;
}

export interface OfferingExpandOverlayProps {
  readonly offering: BonusOfferingPreview;
  readonly sourceLayout: CardLayout;
  readonly onClose: () => void;
}

export default function OfferingExpandOverlay({
  offering,
  sourceLayout,
  onClose,
}: OfferingExpandOverlayProps) {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const insets = useSafeAreaInsets();
  const statusBarStripHeight = getStatusBarStripHeight(insets.top);

  const progress = useSharedValue(0);
  const [scrollLayoutReady, setScrollLayoutReady] = useState(false);
  const [detailInteractive, setDetailInteractive] = useState(false);
  const [closing, setClosing] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  const normalizedLayout = normalizeCardLayoutForModal(sourceLayout);
  const fallbackImage =
    'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800';
  const imageUri = offering.imageUrl || fallbackImage;

  const heroAtTop = detailInteractive
    ? isHeroAtTop(scrollY, true, PROJECT_DETAIL_HERO_HEIGHT)
    : true;
  const statusBarStripBackground = detailInteractive
    ? getHeroStatusBarStripBackground(colors, scrollY, true, PROJECT_DETAIL_HERO_HEIGHT)
    : 'transparent';

  const statusBarConfig = useDetailScreenStatusBar(
    true,
    theme,
    heroAtTop,
    statusBarStripBackground,
  );

  const handleClose = useCallback(() => {
    if (closing) return;
    setClosing(true);
    setDetailInteractive(false);
    setScrollLayoutReady(false);
    progress.value = withSpring(0, COLLAPSE_SPRING);
  }, [closing, progress]);

  useEffect(() => {
    progress.value = withSpring(1, EXPAND_SPRING);
    const layoutTimer = setTimeout(() => setScrollLayoutReady(true), EXPAND_LAYOUT_DELAY_MS - 70);
    const detailTimer = setTimeout(() => setDetailInteractive(true), EXPAND_LAYOUT_DELAY_MS);
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
    height: interpolate(
      progress.value,
      [0, 1],
      [BONUS_CARD_HEIGHT, PROJECT_DETAIL_HERO_HEIGHT],
      Extrapolation.CLAMP,
    ),
    width: '100%',
  }));

  const cardPreviewStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.65, 0.85], [1, 1, 0], Extrapolation.CLAMP),
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
        <StatusBar
          style={statusBarConfig.expo}
          {...(Platform.OS === 'android'
            ? { backgroundColor: statusBarStripBackground }
            : {})}
        />
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

        <Animated.View style={[shellStyle, { backgroundColor: colors.background.primary }]}>
          <Animated.View
            style={[
              imageStyle,
              (scrollLayoutReady || detailInteractive) && styles.expandHeroAbsolute,
              detailInteractive && styles.expandHeroHidden,
            ]}
            pointerEvents="none"
          >
            <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
            {detailInteractive ? null : (
              <Animated.View style={[styles.cardPreview, cardPreviewStyle]}>
                <Text style={styles.previewTitle} numberOfLines={2}>
                  {offering.title}
                </Text>
                <View style={styles.previewBadges}>
                  <View style={styles.previewBadge}>
                    <Text style={styles.previewBadgeText}>{offering.durationLabel}</Text>
                  </View>
                  <View style={styles.previewBadge}>
                    <Text style={styles.previewBadgeText}>{offering.priceLabel}</Text>
                  </View>
                </View>
              </Animated.View>
            )}
          </Animated.View>

          <View
            style={[
              styles.bodyArea,
              scrollLayoutReady && styles.bodyAreaExpanded,
              scrollLayoutReady && !detailInteractive && { paddingTop: PROJECT_DETAIL_HERO_HEIGHT },
            ]}
          >
            <OfferingDetailContent
              offeringId={offering.id}
              onClose={handleClose}
              showHeroImage={detailInteractive}
              heroImageUriOverride={imageUri}
              bodyOnlyLoading
              onScrollOffsetChange={handleScrollOffsetChange}
              floatingActionsBottom={Math.max(insets.bottom, 12) + TAB_BAR_CLEARANCE}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
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
  bodyArea: {
    flex: 1,
    overflow: 'hidden',
    opacity: 0,
  },
  bodyAreaExpanded: {
    ...StyleSheet.absoluteFillObject,
    opacity: 1,
  },
  cardPreview: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  previewTitle: {
    fontFamily: 'Roboto-Regular',
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: 0,
    color: '#FFFFFF',
  },
  previewBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  previewBadge: {
    backgroundColor: 'rgba(255, 249, 240, 0.92)',
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  previewBadgeText: {
    color: '#141414',
    fontFamily: 'Roboto-Light',
    fontSize: 15,
    lineHeight: 18,
    letterSpacing: 0,
  },
});
