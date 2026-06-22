import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  Easing,
  ScrollView,
  Image,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors } from '@/constants/theme';
import { RECIPES_PER_PAGE } from '@/constants/recipeListDefaults';
import { REZEPE_CARD_IMAGE_SIZE } from '@/components/RecipeCard';

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useShimmerAnim(): Animated.Value {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  return anim;
}

// ---------------------------------------------------------------------------
// ShimmerBlock — base animated rectangle
// ---------------------------------------------------------------------------

interface ShimmerBlockProps {
  anim: Animated.Value;
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function ShimmerBlock({
  anim,
  width = '100%',
  height = 16,
  borderRadius = 6,
  style,
}: Readonly<ShimmerBlockProps>) {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || theme === 'darkGreen';

  const baseColor = isDark ? '#2A2F38' : '#E8EBEF';
  const highlightColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.75)';

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 500],
  });

  return (
    <View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: baseColor,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          width: 200,
          transform: [{ translateX }],
        }}
      >
        <LinearGradient
          colors={[baseColor, highlightColor, baseColor]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// ProjectCardShimmer
// ---------------------------------------------------------------------------

interface ProjectCardShimmerProps {
  anim: Animated.Value;
}

export function ProjectCardShimmer({ anim }: Readonly<ProjectCardShimmerProps>) {
  const { theme } = useTheme();
  const colors = getColors(theme);

  return (
    <View
      style={{
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border.primary,
      }}
    >
      {/* Image placeholder */}
      <ShimmerBlock anim={anim} width="100%" height={200} borderRadius={0} />

      {/* Content */}
      <View style={{ padding: 16 }}>
        {/* Title */}
        <ShimmerBlock anim={anim} width="65%" height={18} borderRadius={6} style={{ marginBottom: 8 }} />

        {/* Description lines */}
        <ShimmerBlock anim={anim} width="90%" height={12} borderRadius={4} style={{ marginBottom: 4 }} />
        <ShimmerBlock anim={anim} width="75%" height={12} borderRadius={4} style={{ marginBottom: 16 }} />

        {/* Stats row */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 0 }}>
          <ShimmerBlock anim={anim} width={undefined} height={40} borderRadius={8} style={{ flex: 1 }} />
          <ShimmerBlock anim={anim} width={undefined} height={40} borderRadius={8} style={{ flex: 1 }} />
          <ShimmerBlock anim={anim} width={undefined} height={40} borderRadius={8} style={{ flex: 1 }} />
        </View>

        {/* Button */}
        <ShimmerBlock anim={anim} width="100%" height={44} borderRadius={12} style={{ marginTop: 12 }} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// DashboardShimmer
// ---------------------------------------------------------------------------

export function DashboardShimmer() {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const isDark = theme === 'dark' || theme === 'darkGreen';
  const insets = useSafeAreaInsets();
  const anim = useShimmerAnim();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.secondary }}>
      {/* Fake header */}
      <View
        style={{
          paddingTop: Math.max(insets.top, 50),
          paddingHorizontal: 24,
          paddingBottom: 16,
          backgroundColor: colors.background.primary,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.primary,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              width: 48,
              height: 48,
              marginRight: 25,
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'visible',
            }}
          >
            <Image
              source={require('../assets/images/kochgourmet-logo.png')}
              style={{ position: 'absolute', width: 76, height: 76 }}
              resizeMode="contain"
            />
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <ShimmerBlock anim={anim} width="35%" height={10} borderRadius={4} />
            <ShimmerBlock anim={anim} width="50%" height={16} borderRadius={6} />
          </View>
        </View>
      </View>

      {/* Section header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: 24,
          paddingBottom: 12,
        }}
      >
        <ShimmerBlock anim={anim} width="35%" height={20} borderRadius={6} />
        <ShimmerBlock anim={anim} width="12%" height={14} borderRadius={4} />
      </View>

      {/* Project cards */}
      <View style={{ paddingHorizontal: 24, gap: 16 }}>
        <ProjectCardShimmer anim={anim} />
        <ProjectCardShimmer anim={anim} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// RezepteGridShimmer — 2-column recipe grid (Rezepte tab search / filter)
// Pixel-matched to RecipeCard variant="rezepte" + imageSize={REZEPE_CARD_IMAGE_SIZE}.
// ---------------------------------------------------------------------------

const REZEPE_TAB_BAR_HEIGHT = 80;
const REZEPE_GRID_PADDING = 20;
const REZEPE_GRID_GAP = 12;
const REZEPE_TITLE_LINE_HEIGHT = 21;
const REZEPE_TITLE_LINES = 2;
const REZEPE_BODY_PADDING = 10;
const REZEPE_BODY_GAP = 6;
const REZEPE_META_HEIGHT = 16;

function useRezepteCardWidth(): number {
  const { width } = useWindowDimensions();
  return (width - REZEPE_GRID_PADDING * 2 - REZEPE_GRID_GAP) / 2;
}

function rezepteImageHeight(cardWidth: number): number {
  return cardWidth * (REZEPE_CARD_IMAGE_SIZE.height / REZEPE_CARD_IMAGE_SIZE.width);
}

function RezepteCardShimmer({
  anim,
  cardWidth,
}: Readonly<{ anim: Animated.Value; cardWidth: number }>) {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const imageHeight = rezepteImageHeight(cardWidth);

  return (
    <View
      style={{
        width: cardWidth,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border.primary,
        backgroundColor: colors.background.primary,
        overflow: 'hidden',
      }}
    >
      <ShimmerBlock anim={anim} width={cardWidth} height={imageHeight} borderRadius={0} />
      <View style={{ padding: REZEPE_BODY_PADDING, gap: REZEPE_BODY_GAP }}>
        <ShimmerBlock
          anim={anim}
          width={cardWidth - REZEPE_BODY_PADDING * 2}
          height={REZEPE_TITLE_LINE_HEIGHT * REZEPE_TITLE_LINES}
          borderRadius={4}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <ShimmerBlock anim={anim} width={52} height={REZEPE_META_HEIGHT} borderRadius={4} />
            <ShimmerBlock anim={anim} width={36} height={REZEPE_META_HEIGHT} borderRadius={4} />
          </View>
          <ShimmerBlock anim={anim} width={16} height={16} borderRadius={8} />
        </View>
      </View>
    </View>
  );
}

export function RezepteGridShimmer({
  itemCount = RECIPES_PER_PAGE,
}: Readonly<{ itemCount?: number }>) {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const insets = useSafeAreaInsets();
  const anim = useShimmerAnim();
  const cardWidth = useRezepteCardWidth();
  const tabBarPadding = REZEPE_TAB_BAR_HEIGHT + Math.max(insets.bottom, 12) + 16;
  const rowCount = Math.ceil(itemCount / 2);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background.primary }}
      contentContainerStyle={{
        paddingHorizontal: REZEPE_GRID_PADDING,
        gap: REZEPE_GRID_GAP,
        paddingBottom: tabBarPadding,
      }}
      showsVerticalScrollIndicator={false}
    >
      {Array.from({ length: rowCount }, (_, row) => {
        const leftIndex = row * 2;
        const rightIndex = leftIndex + 1;
        return (
          <View key={row} style={{ flexDirection: 'row', gap: REZEPE_GRID_GAP }}>
            <RezepteCardShimmer anim={anim} cardWidth={cardWidth} />
            {rightIndex < itemCount ? <RezepteCardShimmer anim={anim} cardWidth={cardWidth} /> : null}
          </View>
        );
      })}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// ProjectsShimmer
// ---------------------------------------------------------------------------

export function ProjectsShimmer() {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const insets = useSafeAreaInsets();
  const anim = useShimmerAnim();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.secondary }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 20,
          paddingBottom: insets.bottom + 100,
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <ProjectCardShimmer anim={anim} />
        <ProjectCardShimmer anim={anim} />
        <ProjectCardShimmer anim={anim} />
        <ProjectCardShimmer anim={anim} />
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// MagazinDetailBodyShimmer — article detail below hero (overlay expand)
// ---------------------------------------------------------------------------

export function MagazinDetailBodyShimmer() {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const anim = useShimmerAnim();

  return (
    <View style={{ backgroundColor: colors.background.secondary, gap: 20 }}>
      <ShimmerBlock anim={anim} width="92%" height={48} borderRadius={8} />
      <ShimmerBlock anim={anim} width="100%" height={16} borderRadius={4} />
      <ShimmerBlock anim={anim} width="98%" height={16} borderRadius={4} />
      <ShimmerBlock anim={anim} width="94%" height={16} borderRadius={4} />
      <ShimmerBlock anim={anim} width="88%" height={16} borderRadius={4} />
      <ShimmerBlock anim={anim} width="96%" height={16} borderRadius={4} />
      <ShimmerBlock anim={anim} width="72%" height={16} borderRadius={4} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// MagazinScreenShimmer — matches app/(tabs)/projects magazine list layout
// ---------------------------------------------------------------------------

const MAGAZIN_SCREEN_PADDING = 26;
const MAGAZIN_TAB_BAR_HEIGHT = 90;
const MAGAZIN_ARTICLE_IMAGE_HEIGHT = 252;
const MAGAZIN_ARTICLE_IMAGE_RADIUS = 15;
const MAGAZIN_ARTICLE_ITEM_GAP = 15;
const MAGAZIN_ARTICLE_ITEM_MARGIN = 35;
const MAGAZIN_TITLE_HEIGHT = 80;
const MAGAZIN_SUBTITLE_HEIGHT = 23;
const MAGAZIN_SEARCH_HEIGHT = 48;

interface ArticleCardShimmerProps {
  anim: Animated.Value;
}

function ArticleCardShimmer({ anim }: Readonly<ArticleCardShimmerProps>) {
  return (
    <View style={magazinShimmerStyles.articleItem}>
      <ShimmerBlock
        anim={anim}
        width="100%"
        height={MAGAZIN_ARTICLE_IMAGE_HEIGHT}
        borderRadius={MAGAZIN_ARTICLE_IMAGE_RADIUS}
      />
      <ShimmerBlock anim={anim} width="88%" height={21} borderRadius={4} />
    </View>
  );
}

export function MagazinScreenShimmer() {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const insets = useSafeAreaInsets();
  const anim = useShimmerAnim();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: MAGAZIN_SCREEN_PADDING,
          paddingBottom: MAGAZIN_TAB_BAR_HEIGHT + Math.max(insets.bottom, 12) + 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ height: Math.max(insets.top, 50) + 32 }} />
        <ShimmerBlock
          anim={anim}
          width="52%"
          height={MAGAZIN_TITLE_HEIGHT}
          borderRadius={8}
          style={{ marginBottom: 20 }}
        />
        <ShimmerBlock
          anim={anim}
          width="78%"
          height={MAGAZIN_SUBTITLE_HEIGHT}
          borderRadius={4}
          style={{ marginBottom: 33 }}
        />
        <ShimmerBlock
          anim={anim}
          width="100%"
          height={MAGAZIN_SEARCH_HEIGHT}
          borderRadius={9999}
          style={{ marginBottom: 66 }}
        />
        <ArticleCardShimmer anim={anim} />
        <ArticleCardShimmer anim={anim} />
        <ArticleCardShimmer anim={anim} />
      </ScrollView>
    </View>
  );
}

const magazinShimmerStyles = StyleSheet.create({
  articleItem: {
    gap: MAGAZIN_ARTICLE_ITEM_GAP,
    marginBottom: MAGAZIN_ARTICLE_ITEM_MARGIN,
  },
});

// ---------------------------------------------------------------------------
// BonusScreenShimmer — matches app/(tabs)/offerings community card layout
// ---------------------------------------------------------------------------

const BONUS_CARD_HEIGHT = 470;
const BONUS_CARD_GAP = 16;
const BONUS_SCREEN_PADDING = 26;
const BONUS_TAB_BAR_HEIGHT = 90;

interface CommunityBonusCardShimmerProps {
  anim: Animated.Value;
}

export function CommunityBonusCardShimmer({ anim }: Readonly<CommunityBonusCardShimmerProps>) {
  return (
    <View style={bonusShimmerStyles.card}>
      <ShimmerBlock anim={anim} width="100%" height={BONUS_CARD_HEIGHT} borderRadius={20} />

      <View style={bonusShimmerStyles.titleOverlay}>
        <ShimmerBlock anim={anim} width="72%" height={22} borderRadius={6} />
        <ShimmerBlock anim={anim} width="48%" height={22} borderRadius={6} style={{ marginTop: 4 }} />
      </View>

      <View style={bonusShimmerStyles.badgesOverlay}>
        <ShimmerBlock anim={anim} width={118} height={34} borderRadius={9999} />
        <ShimmerBlock anim={anim} width={76} height={34} borderRadius={9999} />
      </View>
    </View>
  );
}

export function BonusScreenShimmer() {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const insets = useSafeAreaInsets();
  const anim = useShimmerAnim();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: BONUS_SCREEN_PADDING,
          paddingBottom: BONUS_TAB_BAR_HEIGHT + Math.max(insets.bottom, 12) + 16,
          gap: BONUS_CARD_GAP,
        }}
        showsVerticalScrollIndicator={false}
      >
        <CommunityBonusCardShimmer anim={anim} />
        <CommunityBonusCardShimmer anim={anim} />
        <CommunityBonusCardShimmer anim={anim} />
      </ScrollView>
    </View>
  );
}

const bonusShimmerStyles = StyleSheet.create({
  card: {
    width: '100%',
    height: BONUS_CARD_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  titleOverlay: {
    position: 'absolute',
    top: 18,
    left: 18,
    right: 18,
  },
  badgesOverlay: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});

// ---------------------------------------------------------------------------
// PortfolioChartShimmer
// ---------------------------------------------------------------------------

interface PortfolioChartShimmerProps {
  anim: Animated.Value;
}

export function PortfolioChartShimmer({ anim }: Readonly<PortfolioChartShimmerProps>) {
  return (
    <ShimmerBlock anim={anim} width="100%" height={200} borderRadius={12} />
  );
}

// ---------------------------------------------------------------------------
// PortfolioInvestmentRowShimmer
// ---------------------------------------------------------------------------

interface PortfolioInvestmentRowShimmerProps {
  anim: Animated.Value;
}

export function PortfolioInvestmentRowShimmer({ anim }: Readonly<PortfolioInvestmentRowShimmerProps>) {
  const { theme } = useTheme();
  const colors = getColors(theme);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        backgroundColor: colors.background.card,
      }}
    >
      {/* Circle avatar */}
      <ShimmerBlock anim={anim} width={48} height={48} borderRadius={24} style={{ marginRight: 12 }} />

      {/* Text lines */}
      <View style={{ flex: 1, gap: 6 }}>
        <ShimmerBlock anim={anim} width="50%" height={14} borderRadius={4} />
        <ShimmerBlock anim={anim} width="30%" height={10} borderRadius={4} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// CommunityOfferingExpandShimmer — full-screen overlay detail while loading
// ---------------------------------------------------------------------------

const COMMUNITY_EXPAND_HERO_HEIGHT = 320;
const COMMUNITY_EXPAND_HERO_RADIUS = 24;

interface CommunityOfferingExpandShimmerProps {
  readonly heroHeight?: number;
  readonly floatingActionsBottom?: number;
}

export function CommunityOfferingExpandShimmer({
  heroHeight = COMMUNITY_EXPAND_HERO_HEIGHT,
  floatingActionsBottom = 90,
}: Readonly<CommunityOfferingExpandShimmerProps>) {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const { height: windowHeight } = useWindowDimensions();
  const anim = useShimmerAnim();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <ShimmerBlock
        anim={anim}
        width="100%"
        height={heroHeight}
        borderRadius={0}
        style={{
          borderBottomLeftRadius: COMMUNITY_EXPAND_HERO_RADIUS,
          borderBottomRightRadius: COMMUNITY_EXPAND_HERO_RADIUS,
        }}
      />

      <View
        style={{
          flex: 1,
          minHeight: windowHeight - heroHeight - floatingActionsBottom - 72,
          marginTop: -COMMUNITY_EXPAND_HERO_RADIUS,
          borderTopLeftRadius: COMMUNITY_EXPAND_HERO_RADIUS,
          borderTopRightRadius: COMMUNITY_EXPAND_HERO_RADIUS,
          backgroundColor: colors.background.primary,
          paddingHorizontal: COMMUNITY_DETAIL_PADDING,
          paddingTop: 24,
          gap: 20,
        }}
      >
        <ShimmerBlock anim={anim} width="75%" height={48} borderRadius={8} />

        <View style={{ gap: 16, paddingVertical: 4 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <ShimmerBlock anim={anim} width="40%" height={23} borderRadius={6} />
            <ShimmerBlock anim={anim} width="22%" height={23} borderRadius={6} />
          </View>
          <ShimmerBlock anim={anim} width="100%" height={44} borderRadius={9999} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <ShimmerBlock anim={anim} width={32} height={32} borderRadius={16} />
            <ShimmerBlock
              anim={anim}
              width={undefined}
              height={6}
              borderRadius={3}
              style={{ flex: 1, marginHorizontal: 12 }}
            />
            <ShimmerBlock anim={anim} width={32} height={32} borderRadius={16} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <ShimmerBlock anim={anim} width={28} height={23} borderRadius={4} />
            <ShimmerBlock anim={anim} width={28} height={23} borderRadius={4} />
            <ShimmerBlock anim={anim} width={28} height={23} borderRadius={4} />
          </View>
        </View>

        <ShimmerBlock anim={anim} width="100%" height={52} borderRadius={16} />

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <ShimmerBlock anim={anim} width={undefined} height={36} borderRadius={9999} style={{ flex: 1 }} />
          <ShimmerBlock anim={anim} width={undefined} height={36} borderRadius={9999} style={{ flex: 1 }} />
        </View>

        <ShimmerBlock anim={anim} width="100%" height={14} borderRadius={4} />
        <ShimmerBlock anim={anim} width="92%" height={14} borderRadius={4} />
        <ShimmerBlock anim={anim} width="85%" height={14} borderRadius={4} />

        <View style={{ gap: 12, paddingTop: 8 }}>
          <ShimmerBlock anim={anim} width="38%" height={28} borderRadius={6} />
          <ShimmerBlock anim={anim} width="100%" height={72} borderRadius={12} />
          <ShimmerBlock anim={anim} width="100%" height={72} borderRadius={12} />
        </View>
      </View>

      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: floatingActionsBottom,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          paddingHorizontal: COMMUNITY_DETAIL_PADDING,
        }}
        pointerEvents="none"
      >
        <ShimmerBlock anim={anim} width={undefined} height={45} borderRadius={9999} style={{ flex: 1 }} />
        <ShimmerBlock anim={anim} width={undefined} height={45} borderRadius={9999} style={{ flex: 1 }} />
        <ShimmerBlock anim={anim} width={44} height={44} borderRadius={22} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// ProjectDetailCommunityBodyShimmer — sheet content only (hero shown separately)
// ---------------------------------------------------------------------------

const COMMUNITY_DETAIL_PADDING = 26;

export function ProjectDetailCommunityBodyShimmer() {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const anim = useShimmerAnim();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <View
        style={{
          paddingHorizontal: COMMUNITY_DETAIL_PADDING,
          paddingTop: 24,
          gap: 20,
        }}
      >
        <ShimmerBlock anim={anim} width="75%" height={42} borderRadius={8} />

        <View style={{ gap: 16, paddingVertical: 4 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <ShimmerBlock anim={anim} width="40%" height={23} borderRadius={6} />
            <ShimmerBlock anim={anim} width="22%" height={23} borderRadius={6} />
          </View>
          <ShimmerBlock anim={anim} width="100%" height={44} borderRadius={9999} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <ShimmerBlock anim={anim} width={32} height={32} borderRadius={16} />
            <ShimmerBlock anim={anim} width="55%" height={6} borderRadius={3} style={{ flex: 1, marginHorizontal: 12 }} />
            <ShimmerBlock anim={anim} width={32} height={32} borderRadius={16} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <ShimmerBlock anim={anim} width={28} height={23} borderRadius={4} />
            <ShimmerBlock anim={anim} width={28} height={23} borderRadius={4} />
            <ShimmerBlock anim={anim} width={28} height={23} borderRadius={4} />
          </View>
        </View>

        <ShimmerBlock anim={anim} width="100%" height={52} borderRadius={16} />

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <ShimmerBlock anim={anim} width={undefined} height={36} borderRadius={9999} style={{ flex: 1 }} />
          <ShimmerBlock anim={anim} width={undefined} height={36} borderRadius={9999} style={{ flex: 1 }} />
        </View>

        <ShimmerBlock anim={anim} width="100%" height={14} borderRadius={4} />
        <ShimmerBlock anim={anim} width="92%" height={14} borderRadius={4} />
        <ShimmerBlock anim={anim} width="85%" height={14} borderRadius={4} />
        <ShimmerBlock anim={anim} width="100%" height={48} borderRadius={9999} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// RecipeDetailBodyShimmer — detail content below hero (hero shown separately)
// ---------------------------------------------------------------------------

const RECIPE_DETAIL_BODY_GAP = 20;

export function RecipeDetailBodyShimmer() {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const anim = useShimmerAnim();

  return (
    <View style={{ backgroundColor: colors.background.secondary, gap: RECIPE_DETAIL_BODY_GAP }}>
        <ShimmerBlock anim={anim} width="85%" height={48} borderRadius={8} />
        <ShimmerBlock anim={anim} width="100%" height={16} borderRadius={4} />
        <ShimmerBlock anim={anim} width="72%" height={16} borderRadius={4} />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', gap: 12, flex: 1 }}>
            <ShimmerBlock anim={anim} width={100} height={20} borderRadius={4} />
            <ShimmerBlock anim={anim} width={90} height={20} borderRadius={4} />
          </View>
          <ShimmerBlock anim={anim} width={16} height={16} borderRadius={8} />
        </View>

        <View style={{ gap: 8 }}>
          {[0, 1, 2, 3, 4].map((row) => (
            <View key={row} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <ShimmerBlock anim={anim} width="40%" height={30} borderRadius={4} />
              <ShimmerBlock anim={anim} width="18%" height={30} borderRadius={4} />
            </View>
          ))}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <ShimmerBlock anim={anim} width={36} height={36} borderRadius={18} />
          <ShimmerBlock anim={anim} width="45%" height={27} borderRadius={6} />
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <ShimmerBlock anim={anim} width="35%" height={32} borderRadius={6} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <ShimmerBlock anim={anim} width={28} height={28} borderRadius={14} />
            <ShimmerBlock anim={anim} width={36} height={28} borderRadius={6} />
            <ShimmerBlock anim={anim} width={28} height={28} borderRadius={14} />
          </View>
        </View>

        <View style={{ gap: 10 }}>
          <ShimmerBlock anim={anim} width="30%" height={22} borderRadius={4} />
          {[0, 1, 2, 3].map((row) => (
            <View key={row} style={{ flexDirection: 'row', gap: 12 }}>
              <ShimmerBlock anim={anim} width={56} height={20} borderRadius={4} />
              <ShimmerBlock anim={anim} width="55%" height={20} borderRadius={4} style={{ flex: 1 }} />
            </View>
          ))}
        </View>

        <ShimmerBlock anim={anim} width="40%" height={32} borderRadius={6} />
        <ShimmerBlock anim={anim} width="100%" height={16} borderRadius={4} />
        <ShimmerBlock anim={anim} width="95%" height={16} borderRadius={4} />
        <ShimmerBlock anim={anim} width="88%" height={16} borderRadius={4} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// ProjectDetailShimmer
// ---------------------------------------------------------------------------

export function ProjectDetailShimmer() {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const insets = useSafeAreaInsets();
  const anim = useShimmerAnim();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.secondary }}>
      {/* Fake header bar */}
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingBottom: 16,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.background.primary,
          height: insets.top + 16 + 60,
        }}
      >
        <ShimmerBlock anim={anim} width={40} height={40} borderRadius={20} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <ShimmerBlock anim={anim} width="40%" height={16} borderRadius={6} />
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Hero image */}
      <ShimmerBlock anim={anim} width="100%" height={280} borderRadius={0} />

      {/* Content */}
      <ScrollView
        contentContainerStyle={{
          padding: 24,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Badge + title row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <ShimmerBlock anim={anim} width={60} height={24} borderRadius={8} />
          <ShimmerBlock anim={anim} width="55%" height={22} borderRadius={6} />
        </View>

        {/* Description lines */}
        <ShimmerBlock anim={anim} width="90%" height={14} borderRadius={4} style={{ marginBottom: 8 }} />
        <ShimmerBlock anim={anim} width="85%" height={14} borderRadius={4} style={{ marginBottom: 8 }} />
        <ShimmerBlock anim={anim} width="60%" height={14} borderRadius={4} style={{ marginBottom: 24 }} />

        {/* Stats grid 2×2 */}
        <View style={{ gap: 12, marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <ShimmerBlock anim={anim} width={undefined} height={80} borderRadius={12} style={{ flex: 1 }} />
            <ShimmerBlock anim={anim} width={undefined} height={80} borderRadius={12} style={{ flex: 1 }} />
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <ShimmerBlock anim={anim} width={undefined} height={80} borderRadius={12} style={{ flex: 1 }} />
            <ShimmerBlock anim={anim} width={undefined} height={80} borderRadius={12} style={{ flex: 1 }} />
          </View>
        </View>

        {/* Section rows: label + value */}
        {[0, 1].map((i) => (
          <View
            key={i}
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}
          >
            <ShimmerBlock anim={anim} width="30%" height={14} borderRadius={4} />
            <ShimmerBlock anim={anim} width="45%" height={14} borderRadius={4} />
          </View>
        ))}

        {/* Button */}
        <ShimmerBlock anim={anim} width="100%" height={52} borderRadius={14} style={{ marginTop: 20 }} />
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// InvestmentShimmer
// ---------------------------------------------------------------------------

export function InvestmentShimmer() {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const insets = useSafeAreaInsets();
  const anim = useShimmerAnim();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.secondary }}>
      {/* Fake header bar */}
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingBottom: 16,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.background.primary,
          height: insets.top + 16 + 56,
        }}
      >
        <ShimmerBlock anim={anim} width={40} height={40} borderRadius={20} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <ShimmerBlock anim={anim} width="40%" height={16} borderRadius={6} />
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Step indicator bar */}
      <View
        style={{
          paddingHorizontal: 24,
          paddingVertical: 16,
          gap: 8,
          backgroundColor: colors.background.primary,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.primary,
        }}
      >
        <ShimmerBlock anim={anim} width="30%" height={12} borderRadius={4} />
        <ShimmerBlock anim={anim} width="100%" height={6} borderRadius={3} />
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={{
          padding: 24,
          paddingBottom: insets.bottom + 40,
          alignItems: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header icon */}
        <ShimmerBlock anim={anim} width={64} height={64} borderRadius={32} />

        {/* Title */}
        <ShimmerBlock anim={anim} width="70%" height={20} borderRadius={6} style={{ marginTop: 16 }} />

        {/* Subtitle */}
        <ShimmerBlock anim={anim} width="50%" height={14} borderRadius={4} style={{ marginTop: 8, marginBottom: 24 }} />

        {/* Detail card */}
        <View
          style={{
            width: '100%',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border.primary,
            padding: 20,
            marginBottom: 24,
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: i < 3 ? 16 : 0,
              }}
            >
              <ShimmerBlock anim={anim} width="35%" height={14} borderRadius={4} />
              <ShimmerBlock anim={anim} width="30%" height={14} borderRadius={4} />
            </View>
          ))}
        </View>

        {/* Form: 2 input groups */}
        {[0, 1].map((i) => (
          <View key={i} style={{ width: '100%', marginBottom: 16 }}>
            <ShimmerBlock anim={anim} width="25%" height={12} borderRadius={4} style={{ marginBottom: 8 }} />
            <ShimmerBlock anim={anim} width="100%" height={56} borderRadius={12} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// PortfolioOverviewShimmer
// ---------------------------------------------------------------------------

interface PortfolioOverviewShimmerProps {
  anim: Animated.Value;
}

export function PortfolioOverviewShimmer({ anim }: Readonly<PortfolioOverviewShimmerProps>) {
  const { theme } = useTheme();
  const colors = getColors(theme);

  return (
    <View
      style={{
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border.primary,
        backgroundColor: colors.background.card,
        padding: 16,
      }}
    >
      {/* Icon + label row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <ShimmerBlock anim={anim} width={20} height={20} borderRadius={4} />
        <ShimmerBlock anim={anim} width="40%" height={12} borderRadius={4} />
      </View>
      {/* Value */}
      <ShimmerBlock anim={anim} width="55%" height={22} borderRadius={6} style={{ marginBottom: 8 }} />
      {/* Sublabel */}
      <ShimmerBlock anim={anim} width="35%" height={10} borderRadius={4} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// PortfolioTransactionRowShimmer
// ---------------------------------------------------------------------------

interface PortfolioTransactionRowShimmerProps {
  anim: Animated.Value;
}

export function PortfolioTransactionRowShimmer({ anim }: Readonly<PortfolioTransactionRowShimmerProps>) {
  const { theme } = useTheme();
  const colors = getColors(theme);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.primary,
      }}
    >
      {/* Icon circle */}
      <ShimmerBlock anim={anim} width={36} height={36} borderRadius={18} style={{ marginRight: 12 }} />

      {/* Description + date */}
      <View style={{ flex: 1, gap: 6 }}>
        <ShimmerBlock anim={anim} width="55%" height={13} borderRadius={4} />
        <ShimmerBlock anim={anim} width="30%" height={10} borderRadius={4} />
      </View>

      {/* Amount + status */}
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <ShimmerBlock anim={anim} width={70} height={13} borderRadius={4} />
        <ShimmerBlock anim={anim} width={50} height={10} borderRadius={4} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// AccountInfoShimmer
// ---------------------------------------------------------------------------

interface AccountInfoFieldShimmerProps {
  anim: Animated.Value;
  borderColor: string;
  backgroundColor: string;
  labelWidth: string;
  valueWidth: string;
}

function AccountInfoFieldShimmer({ anim, borderColor, backgroundColor, labelWidth, valueWidth }: Readonly<AccountInfoFieldShimmerProps>) {
  return (
    <View
      style={{
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor,
        backgroundColor,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <ShimmerBlock anim={anim} width={32} height={32} borderRadius={16} />
        <ShimmerBlock anim={anim} width={labelWidth as any} height={11} borderRadius={4} />
      </View>
      <ShimmerBlock anim={anim} width={valueWidth as any} height={16} borderRadius={5} />
    </View>
  );
}

export function AccountInfoShimmer() {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const insets = useSafeAreaInsets();
  const anim = useShimmerAnim();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.secondary }}>
      {/* Fake header */}
      <View
        style={{
          paddingTop: Math.max(insets.top, 44) + 16,
          paddingBottom: 16,
          paddingHorizontal: 20,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.background.primary,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.primary,
        }}
      >
        <ShimmerBlock anim={anim} width={40} height={40} borderRadius={20} style={{ marginRight: 12 }} />
        <View style={{ flex: 1, alignItems: 'center', gap: 6 }}>
          <ShimmerBlock anim={anim} width="40%" height={16} borderRadius={6} />
          <ShimmerBlock anim={anim} width="55%" height={11} borderRadius={4} />
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Personal info section */}
      <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
        <ShimmerBlock anim={anim} width="45%" height={18} borderRadius={6} style={{ marginBottom: 16 }} />
        <AccountInfoFieldShimmer anim={anim} borderColor={colors.border.primary} backgroundColor={colors.background.card} labelWidth="30%" valueWidth="55%" />
        <AccountInfoFieldShimmer anim={anim} borderColor={colors.border.primary} backgroundColor={colors.background.card} labelWidth="35%" valueWidth="45%" />
        <AccountInfoFieldShimmer anim={anim} borderColor={colors.border.primary} backgroundColor={colors.background.card} labelWidth="25%" valueWidth="75%" />
        <AccountInfoFieldShimmer anim={anim} borderColor={colors.border.primary} backgroundColor={colors.background.card} labelWidth="30%" valueWidth="40%" />
      </View>

      {/* KYC section */}
      <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
        <ShimmerBlock anim={anim} width="50%" height={18} borderRadius={6} style={{ marginBottom: 16 }} />
        <View
          style={{
            borderRadius: 16,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.border.primary,
            backgroundColor: colors.background.card,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <ShimmerBlock anim={anim} width={48} height={48} borderRadius={24} />
            <View style={{ flex: 1, gap: 8 }}>
              <ShimmerBlock anim={anim} width="55%" height={14} borderRadius={5} />
              <ShimmerBlock anim={anim} width="80%" height={11} borderRadius={4} />
            </View>
          </View>
          <ShimmerBlock anim={anim} width="100%" height={11} borderRadius={4} style={{ marginBottom: 6 }} />
          <ShimmerBlock anim={anim} width="85%" height={11} borderRadius={4} />
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// WalletsShimmer
// ---------------------------------------------------------------------------

export function WalletsShimmer() {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const insets = useSafeAreaInsets();
  const anim = useShimmerAnim();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.secondary }}>
      {/* Fake header bar */}
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingBottom: 16,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.background.primary,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.primary,
          height: insets.top + 16 + 56,
        }}
      >
        <ShimmerBlock anim={anim} width={40} height={40} borderRadius={20} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <ShimmerBlock anim={anim} width="40%" height={16} borderRadius={6} />
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* 4 wallet item rows */}
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={{
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border.primary,
              padding: 16,
              marginBottom: 12,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            {/* Icon circle */}
            <ShimmerBlock anim={anim} width={40} height={40} borderRadius={20} style={{ marginRight: 12 }} />

            {/* Right content */}
            <View style={{ flex: 1, gap: 6 }}>
              <ShimmerBlock anim={anim} width="35%" height={12} borderRadius={4} />
              <ShimmerBlock anim={anim} width="70%" height={14} borderRadius={4} />
            </View>

            {/* Copy icon circle */}
            <ShimmerBlock anim={anim} width={20} height={20} borderRadius={10} style={{ marginLeft: 8 }} />
          </View>
        ))}

        {/* Add button */}
        <ShimmerBlock anim={anim} width="100%" height={52} borderRadius={12} style={{ marginTop: 8 }} />
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// ProfileScreenShimmer — matches app/account/profile.tsx layout
// ---------------------------------------------------------------------------

function ProfilePillShimmer({
  anim,
  width = '100%',
  style,
}: Readonly<{ anim: Animated.Value; width?: number | string; style?: object }>) {
  return (
    <ShimmerBlock
      anim={anim}
      width={width}
      height={48}
      borderRadius={9999}
      style={style}
    />
  );
}

function ProfileSectionTitleShimmer({
  anim,
  width,
  style,
}: Readonly<{ anim: Animated.Value; width: string; style?: object }>) {
  return (
    <ShimmerBlock
      anim={anim}
      width={width}
      height={17}
      borderRadius={5}
      style={style}
    />
  );
}

function ProfileToggleRowShimmer({ anim }: Readonly<{ anim: Animated.Value }>) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 6 }}>
      <ShimmerBlock anim={anim} width={51} height={31} borderRadius={16} />
      <ShimmerBlock anim={anim} width="62%" height={17} borderRadius={5} />
    </View>
  );
}

export function ProfileScreenShimmer() {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const insets = useSafeAreaInsets();
  const anim = useShimmerAnim();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background.primary }}
      contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 90 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingHorizontal: 26, paddingTop: Math.max(insets.top, 44) + 12, paddingBottom: 4 }}>
        <ShimmerBlock anim={anim} width={40} height={40} borderRadius={20} />
      </View>

      <View style={{ alignItems: 'center', marginTop: 8, paddingTop: 30, paddingBottom: 4 }}>
        <ShimmerBlock anim={anim} width={160} height={160} borderRadius={80} />
        <ShimmerBlock
          anim={anim}
          width={160}
          height={35}
          borderRadius={8}
          style={{ marginTop: 28, marginBottom: 10 }}
        />
      </View>

      <View style={{ paddingHorizontal: 26, paddingTop: 12, gap: 12 }}>
        <ProfilePillShimmer anim={anim} />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <ProfilePillShimmer anim={anim} />
          </View>
          <View style={{ flex: 1 }}>
            <ProfilePillShimmer anim={anim} />
          </View>
        </View>
        <ProfilePillShimmer anim={anim} />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <ProfilePillShimmer anim={anim} width={118} />
          <View style={{ flex: 1 }}>
            <ProfilePillShimmer anim={anim} />
          </View>
        </View>
        <ProfilePillShimmer anim={anim} />
        <ProfilePillShimmer anim={anim} />
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 20, marginBottom: 20 }}>
          <View style={{ flex: 1 }}>
            <ShimmerBlock anim={anim} width="100%" height={48} borderRadius={9999} />
          </View>
          <View style={{ flex: 1 }}>
            <ShimmerBlock anim={anim} width="100%" height={48} borderRadius={9999} />
          </View>
        </View>
      </View>

      <View style={{ paddingHorizontal: 26, paddingTop: 28, gap: 12 }}>
        <ProfileSectionTitleShimmer anim={anim} width="38%" />
        <ShimmerBlock anim={anim} width="92%" height={15} borderRadius={4} style={{ marginBottom: 4 }} />
        <ShimmerBlock anim={anim} width="78%" height={15} borderRadius={4} style={{ marginBottom: 4 }} />
        <ProfileToggleRowShimmer anim={anim} />
        <ProfileToggleRowShimmer anim={anim} />
      </View>

      <View style={{ paddingHorizontal: 26, paddingTop: 50, gap: 12 }}>
        <ProfileSectionTitleShimmer anim={anim} width="42%" />
        <ShimmerBlock anim={anim} width="88%" height={15} borderRadius={4} style={{ marginBottom: 4 }} />
        <ShimmerBlock anim={anim} width="72%" height={15} borderRadius={4} style={{ marginBottom: 4 }} />
        <ProfilePillShimmer anim={anim} />
        <ProfilePillShimmer anim={anim} />
        <ProfilePillShimmer anim={anim} />
        <ProfilePillShimmer anim={anim} />
        <ProfilePillShimmer anim={anim} />
      </View>

      <View style={{ paddingHorizontal: 26, paddingTop: 50, gap: 12 }}>
        <ProfileSectionTitleShimmer anim={anim} width="48%" />
        <ShimmerBlock anim={anim} width="90%" height={15} borderRadius={4} style={{ marginBottom: 4 }} />
        <ShimmerBlock anim={anim} width="65%" height={15} borderRadius={4} style={{ marginBottom: 4 }} />
        <ShimmerBlock anim={anim} width="100%" height={48} borderRadius={9999} style={{ marginTop: 4 }} />
      </View>
    </ScrollView>
  );
}
