import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Share,
  RefreshControl,
  Modal,
  Pressable,
  Platform,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import RenderHTML from 'react-native-render-html';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Clock, Star, Heart, Share2, ChevronDown, Minus, Plus, Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import HeroSteamIcon, { heroSteamOverlayStyle, HERO_STEAM_ICON_OVERHANG } from '@/components/HeroSteamIcon';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors, getTypography } from '@/constants/theme';
import { mobileAppRecipes } from '@/hooks/mobileApp';
import { mapRecipeDetail, getRecipePrepStepSets } from '@/utils/mobileAppMappers';
import type { RecipeDetail as UiRecipeDetail } from '@/utils/mockRecipeDetails';
import { ProjectDetailShimmer, RecipeDetailBodyShimmer } from '@/components/Shimmer';
import {
  getStatusBarStripHeight,
  getHeroStatusBarStripBackground,
  isHeroAtTop,
} from '@/utils/statusBarLayout';
import { useDetailScreenStatusBar } from '@/hooks/useStatusBarStyle';
import { useFavourites } from '@/contexts/FavouritesContext';
import { useRecipeFavorite } from '@/hooks/useRecipeFavorite';
import { MODAL_OVERLAY_FLOATING_ACTIONS_OFFSET } from '@/utils/modalScreenMetrics';

const PREP_STYLE_KEYS = ['normal', 'thermomix', 'airfryer'] as const;
const PREP_STYLE_LABELS: Record<(typeof PREP_STYLE_KEYS)[number], string> = {
  normal: 'Normale Zubereitung',
  thermomix: 'Thermomix',
  airfryer: 'Airfryer',
};

const AMOUNT_REGEX = /^(\d+([.,]\d+)?)/;

export const RECIPE_HERO_IMAGE_HEIGHT = 280;

/** Scale a quantity string proportionally. "80 g" × 1.5 → "120 g". */
function scaleAmount(raw: string, factor: number): string {
  if (!raw || factor === 1) return raw;
  const match = AMOUNT_REGEX.exec(raw);
  if (!match) return raw;
  const num = Number.parseFloat(match[1].replace(',', '.')) * factor;
  const formatted = Number.isInteger(num)
    ? String(num)
    : Number.parseFloat(num.toFixed(1)).toString();
  return raw.replace(match[1], formatted);
}

export interface RecipeDetailContentProps {
  readonly recipeId: string;
  readonly onClose: () => void;
  readonly showHeroImage?: boolean;
  readonly heroImageUriOverride?: string;
  readonly bodyOnlyLoading?: boolean;
  readonly floatingActionsBottom?: number;
  readonly overlayContentPadding?: boolean;
  readonly manageStatusBar?: boolean;
  readonly deferStatusBarToParent?: boolean;
  readonly onScrollOffsetChange?: (offsetY: number) => void;
}

function RecipeDetailScrollLoading({
  heroImageUri,
  overlayContentPadding,
  onScrollOffsetChange,
  bottomSpacer,
}: Readonly<{
  heroImageUri: string;
  overlayContentPadding: boolean;
  onScrollOffsetChange?: (offsetY: number) => void;
  bottomSpacer: number;
}>) {
  const { theme } = useTheme();
  const colors = getColors(theme);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    onScrollOffsetChange?.(event.nativeEvent.contentOffset.y);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background.secondary }}
      showsVerticalScrollIndicator={false}
      onScroll={onScrollOffsetChange ? handleScroll : undefined}
      scrollEventThrottle={16}
    >
      <View style={[styles.heroWrap, { backgroundColor: colors.background.secondary }]}>
        <Image source={{ uri: heroImageUri }} style={styles.heroImage} resizeMode="cover" />
        <View style={heroSteamOverlayStyle.icon}>
          <HeroSteamIcon />
        </View>
      </View>
      <View
        style={[
          styles.content,
          overlayContentPadding ? styles.contentOverlayHandoff : styles.contentDefault,
        ]}
      >
        <RecipeDetailBodyShimmer />
        <View style={{ height: bottomSpacer }} />
      </View>
    </ScrollView>
  );
}

export default function RecipeDetailContent({
  recipeId,
  onClose,
  showHeroImage = true,
  heroImageUriOverride,
  bodyOnlyLoading = false,
  floatingActionsBottom,
  overlayContentPadding = false,
  manageStatusBar = false,
  deferStatusBarToParent = false,
  onScrollOffsetChange,
}: RecipeDetailContentProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const typography = getTypography(theme);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const statusBarStripHeight = getStatusBarStripHeight(insets.top);
  const actionsBottom =
    floatingActionsBottom ??
    Math.max(insets.bottom, 12) + (overlayContentPadding ? MODAL_OVERLAY_FLOATING_ACTIONS_OFFSET : 90);
  const recipesApi = useMemo(() => mobileAppRecipes(), []);

  const [recipe, setRecipe] = useState<UiRecipeDetail | null>(null);
  const [prepStepSets, setPrepStepSets] = useState(getRecipePrepStepSets({
    uid: 0,
    title: '',
    defaultNumberOfServings: 4,
    ingredients: [],
    nutritions: [],
    categories: [],
    preparationSteps: [],
    thermomixPreparationSteps: [],
    airfryerPreparationSteps: [],
  }));
  const [loading, setLoading] = useState(true);
  const [servings, setServings] = useState(4);
  const [prepStyleKey, setPrepStyleKey] = useState<(typeof PREP_STYLE_KEYS)[number]>('normal');
  const [showPrepDropdown, setShowPrepDropdown] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [isFavourite, setIsFavourite] = useState(false);
  const [rating, setRating] = useState(0);
  const [shortDescription, setShortDescription] = useState('');
  const recipeRef = useRef(recipe);
  recipeRef.current = recipe;

  const loadRecipe = useCallback(async () => {
    if (recipeRef.current === null) {
      setLoading(true);
    }
    const response = await recipesApi.getRecipe(recipeId);
    if (response.success && response.data) {
      const mapped = mapRecipeDetail(response.data);
      setRecipe(mapped);
      setServings(mapped.servings);
      setPrepStepSets(getRecipePrepStepSets(response.data));
      setIsFavourite(response.data.isFavorite ?? false);
      setRating(response.data.rating?.value ?? 0);
      setShortDescription(response.data.shortDescription ?? '');
      setPrepStyleKey('normal');
    }
    setLoading(false);
  }, [recipeId, recipesApi]);

  useEffect(() => {
    void loadRecipe();
  }, [loadRecipe]);

  const ownsStatusBar = manageStatusBar && !deferStatusBarToParent;
  const tracksScroll = ownsStatusBar || deferStatusBarToParent || Boolean(onScrollOffsetChange);
  const heroAtTop = isHeroAtTop(scrollY, showHeroImage, RECIPE_HERO_IMAGE_HEIGHT);
  const statusBarStripBackground = getHeroStatusBarStripBackground(
    colors,
    scrollY,
    showHeroImage,
    RECIPE_HERO_IMAGE_HEIGHT,
  );

  const statusBarConfig = useDetailScreenStatusBar(
    ownsStatusBar,
    theme,
    heroAtTop,
    statusBarStripBackground,
    { forceDarkContentOnAndroid: true },
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = event.nativeEvent.contentOffset.y;
      setScrollY(y);
      onScrollOffsetChange?.(y);
    },
    [onScrollOffsetChange],
  );

  const { setRecipeFavorite } = useFavourites();
  const { toggleFavorite } = useRecipeFavorite();

  const prepStyles = useMemo(
    () =>
      PREP_STYLE_KEYS.filter((key) => prepStepSets[key].length > 0).map((key) => ({
        key,
        label: PREP_STYLE_LABELS[key],
      })),
    [prepStepSets],
  );

  const activePrepStyle = prepStyles.find((style) => style.key === prepStyleKey) ?? prepStyles[0];
  const activeSteps = prepStepSets[activePrepStyle?.key ?? 'normal'] ?? [];

  const handleToggleFavourite = useCallback(() => {
    if (!recipe) return;
    const recipeCard = {
      id: recipeId,
      title: recipe.title,
      imageUrl: recipe.imageUrl,
      durationMinutes: recipe.bakeDurationMinutes,
      rating,
      isFavourite,
    };

    void (async () => {
      const nextFavorite = await toggleFavorite(recipeId, isFavourite);
      if (nextFavorite === null) return;
      setIsFavourite(nextFavorite);
      setRecipeFavorite(recipeCard, nextFavorite);
    })();
  }, [isFavourite, rating, recipe, recipeId, setRecipeFavorite, toggleFavorite]);

  // Scale ingredient amounts when serving count changes
  const scaledSections = useMemo(() => {
    if (!recipe) return [];
    const factor = servings / recipe.servings;
    return recipe.ingredientSections.map((section) => ({
      ...section,
      items: section.items.map((item) => ({
        ...item,
        amount: scaleAmount(item.amount, factor),
      })),
    }));
  }, [recipe, servings]);

  const onShare = async () => {
    if (!recipe) return;
    await Share.share({ message: `Schau dir dieses Rezept an: ${recipe.title}` });
  };

  const onRefresh = () => {
    setRefreshing(true);
    void loadRecipe().finally(() => setRefreshing(false));
  };

  const bottomSpacer = Math.max(insets.bottom, 16) + 180;

  if (loading && !recipe) {
    const loadingShell = (
      <>
        {bodyOnlyLoading && showHeroImage && heroImageUriOverride ? (
          <RecipeDetailScrollLoading
            heroImageUri={heroImageUriOverride}
            overlayContentPadding={overlayContentPadding}
            onScrollOffsetChange={onScrollOffsetChange}
            bottomSpacer={bottomSpacer}
          />
        ) : bodyOnlyLoading ? (
          <View
            style={[
              styles.fill,
              styles.content,
              overlayContentPadding ? styles.contentOverlayHandoff : styles.contentDefault,
              { backgroundColor: colors.background.secondary },
            ]}
          >
            <RecipeDetailBodyShimmer />
          </View>
        ) : (
          <ProjectDetailShimmer />
        )}
        <View style={[styles.floatingActions, { bottom: actionsBottom }]} pointerEvents="box-none">
          <TouchableOpacity
            style={[styles.closeBtn, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={[styles.closeBtnText, { color: colors.text.primary }]}>
              {t('common.close')}
            </Text>
          </TouchableOpacity>
        </View>
      </>
    );

    if (ownsStatusBar) {
      return (
        <View style={[styles.fill, { backgroundColor: colors.background.secondary }]}>
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
          {loadingShell}
        </View>
      );
    }

    return <View style={[styles.fill, { backgroundColor: colors.background.secondary }]}>{loadingShell}</View>;
  }

  if (!recipe) {
    return null;
  }

  const heroImageUri = heroImageUriOverride ?? recipe.imageUrl;

  return (
    <View style={[styles.fill, { backgroundColor: colors.background.secondary }]}>
      {ownsStatusBar && (
        <>
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
        </>
      )}

      <ScrollView
        style={[styles.fill, { backgroundColor: colors.background.secondary }]}
        showsVerticalScrollIndicator={false}
        bounces
        onScroll={tracksScroll ? handleScroll : undefined}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Hero image — full bleed */}
        {showHeroImage && (
          <View style={[styles.heroWrap, { backgroundColor: colors.background.secondary }]}>
            <Image source={{ uri: heroImageUri }} style={styles.heroImage} resizeMode="cover" />
            <View style={heroSteamOverlayStyle.icon}>
              <HeroSteamIcon />
            </View>
          </View>
        )}

        <View
          style={[
            styles.content,
            overlayContentPadding ? styles.contentOverlayHandoff : styles.contentDefault,
          ]}
        >

          {/* Title */}
          <Text style={[styles.title, { color: colors.text.primary }]}>
            {recipe.title}
          </Text>

          {shortDescription ? (
            <Text style={[styles.shortDescription, { color: colors.text.secondary }]}>
              {shortDescription}
            </Text>
          ) : null}

          {/* Meta row */}
          <View style={styles.metaRow}>
            <View style={styles.metaItems}>
              <View style={styles.metaItem}>
                <Clock size={14} color={colors.text.primary} />
                <Text style={[styles.metaText, { color: colors.text.primary }]}>
                  {recipe.bakeDurationMinutes} Min Gesamt
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Clock size={14} color={colors.text.primary} />
                <Text style={[styles.metaText, { color: colors.text.primary }]}>
                  {recipe.prepDurationMinutes} Min Arbeit
                </Text>
              </View>
              {rating > 0 && (
                <View style={styles.metaItem}>
                  <Star size={14} color={colors.text.primary} />
                  <Text style={[styles.metaText, { color: colors.text.primary }]}>
                    {rating.toFixed(1)}
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.metaHeartBtn}
              onPress={handleToggleFavourite}
              hitSlop={8}
            >
              <Heart
                size={16}
                color={isFavourite ? colors.primary : colors.text.primary}
                fill={isFavourite ? colors.primary : 'transparent'}
              />
            </TouchableOpacity>
          </View>

          {/* Nutrition table — borderless rows with dividers between items only */}
          <View style={styles.nutritionTable}>
            <View style={[styles.nutritionRow, styles.nutritionRowDivider, { borderBottomColor: colors.border.primary }]}>
              <Text style={[styles.nutritionLabel, { color: colors.text.primary }]}>
                Nährwerte pro
              </Text>
              <Text style={[styles.nutritionValue, { color: colors.text.primary }]}>
                100 g
              </Text>
            </View>
            {recipe.nutrition.map((n, index) => (
              <View
                key={`${n.label}-${n.value}-${index}`}
                style={[
                  styles.nutritionRow,
                  index < recipe.nutrition.length - 1 && styles.nutritionRowDivider,
                  index < recipe.nutrition.length - 1 && { borderBottomColor: colors.border.primary },
                ]}
              >
                <Text style={[styles.nutritionLabel, { color: colors.text.primary }]}>{n.label}</Text>
                <Text style={[styles.nutritionValue, { color: colors.text.primary }]}>{n.value}</Text>
              </View>
            ))}
          </View>

          {/* Author */}
          {recipe.author.name ? (
            <View style={styles.authorRow}>
              <Image source={{ uri: recipe.author.avatarUrl }} style={styles.authorAvatar} />
              <Text style={[styles.authorName, { color: colors.text.primary }]}>
                {recipe.author.name}
              </Text>
            </View>
          ) : null}

          {/* Zutaten header with +/- servings */}
          <View style={styles.zutatenHeader}>
            <Text style={[styles.zutatenTitle, { color: colors.text.primary }]}>
              Zutaten
            </Text>
            <View style={styles.servingsControl}>
              <TouchableOpacity
                style={[styles.servingsDot, { backgroundColor: colors.primary }]}
                onPress={() => setServings(s => Math.max(1, s - 1))}
                hitSlop={8}
              >
                <Minus size={12} color="#fff" strokeWidth={2.5} />
              </TouchableOpacity>
              <Text style={[styles.servingsText, { color: colors.text.primary }]}>
                {servings} Personen
              </Text>
              <TouchableOpacity
                style={[styles.servingsDot, { backgroundColor: colors.primary }]}
                onPress={() => setServings(s => s + 1)}
                hitSlop={8}
              >
                <Plus size={12} color="#fff" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Preparation style dropdown trigger */}
          {prepStyles.length > 1 ? (
            <TouchableOpacity
              style={[styles.zubereitungSelector, { borderBottomColor: colors.border.primary }]}
              onPress={() => setShowPrepDropdown(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.zubereitungText, { color: colors.text.primary }]}>
                {activePrepStyle?.label ?? PREP_STYLE_LABELS.normal}
              </Text>
              <ChevronDown size={16} color={colors.text.tertiary} />
            </TouchableOpacity>
          ) : null}

          {/* Scaled ingredient sections */}
          {scaledSections.map(section => (
            <View key={section.title} style={styles.ingredientSection}>
              <Text style={[styles.ingredientSectionTitle, { color: colors.text.primary }]}>
                {section.title}
              </Text>
              {section.items.map(item => (
                <View
                  key={`${section.title}-${item.name}`}
                  style={styles.ingredientRow}
                >
                  <Text style={[styles.ingredientAmount, { color: colors.text.primary }]}>
                    {[item.amount, item.unit].filter(Boolean).join(' ')}
                  </Text>
                  <Text style={[styles.ingredientName, { color: colors.text.primary, flex: 1 }]}>
                    {item.name}
                  </Text>
                </View>
              ))}
            </View>
          ))}

          {/* Steps */}
          <Text style={[styles.zutatenTitle, { color: colors.text.primary, marginTop: 20, marginBottom: 16 }]}>
            Zubereitung
          </Text>
          {activeSteps.map((step) => (
            <View key={step.number} style={styles.stepBlock}>
              <Text style={[styles.stepLabel, { color: colors.text.primary }]}>
                Schritt {step.number} / {step.total}
              </Text>
              {step.text.includes('<') ? (
                <RenderHTML
                  contentWidth={width - 48}
                  source={{ html: step.text }}
                  baseStyle={{
                    color: colors.text.primary,
                    fontFamily: 'Roboto-Light',
                    fontSize: 16,
                    lineHeight: 24,
                  }}
                />
              ) : (
                <Text style={[styles.stepText, { color: colors.text.primary }]}>
                  {step.text}
                </Text>
              )}
            </View>
          ))}

          {/* Guten Appetit */}
          <Text style={[styles.appetit, { color: colors.text.primary }]}>
            Guten Appetit 👏
          </Text>

          <View style={{ height: bottomSpacer }} />
        </View>
      </ScrollView>

      {/* Floating action buttons — sit above the floating tab bar */}
      <View style={[styles.floatingActions, { bottom: actionsBottom }]} pointerEvents="box-none">
        <TouchableOpacity
          style={[styles.closeBtn, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}
          onPress={onClose}
          activeOpacity={0.7}
        >
          {/* <X size={16} color={colors.text.primary} /> */}
          <Text style={[styles.closeBtnText, { color: colors.text.primary }]}>
            {t('common.close')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.shareBtn,
            {
              backgroundColor: '#FFFFFF',
              borderColor: colors.border.primary,
            },
          ]}
          onPress={onShare}
          activeOpacity={0.8}
        >
          <Share2 size={16} color="#141414" />
        </TouchableOpacity>
      </View>

      {/* Prep style bottom sheet */}
      <Modal
        visible={showPrepDropdown}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPrepDropdown(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowPrepDropdown(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.background.card }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border.primary }]} />
            <Text style={[styles.sheetTitle, { color: colors.text.primary, fontFamily: typography.fontFamily.display }]}>
              Zubereitungsart
            </Text>
            {prepStyles.map((style) => (
              <TouchableOpacity
                key={style.key}
                style={[styles.sheetOption, { borderBottomColor: colors.border.primary }]}
                onPress={() => {
                  setPrepStyleKey(style.key);
                  setShowPrepDropdown(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.sheetOptionText, { color: colors.text.primary }]}>
                  {style.label}
                </Text>
                {prepStyleKey === style.key && <Check size={18} color={colors.primary} />}
              </TouchableOpacity>
            ))}
            <View style={{ height: Math.max(insets.bottom, 16) }} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  statusBarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
  },
  heroWrap: {
    position: 'relative',
    width: '100%',
    paddingBottom: HERO_STEAM_ICON_OVERHANG,
  },
  heroImage: { width: '100%', height: RECIPE_HERO_IMAGE_HEIGHT },
  content: { paddingHorizontal: 20 },
  contentDefault: { paddingTop: 20 },
  contentOverlayHandoff: { paddingTop: 10 },

  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 35,
    lineHeight: 48,
    letterSpacing: 0,
    marginBottom: 12,
  },
  shortDescription: {
    fontFamily: 'Roboto-Light',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metaItems: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    flex: 1,
    flexShrink: 1,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaHeartBtn: {
    marginLeft: 12,
    flexShrink: 0,
  },
  metaText: {
    fontFamily: 'Roboto-Light',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0,
  },

  nutritionTable: { marginBottom: 20 },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  nutritionRowDivider: { borderBottomWidth: 1 },
  nutritionLabel: {
    fontFamily: 'Roboto-Light',
    fontSize: 16,
    lineHeight: 30,
    letterSpacing: 0,
  },
  nutritionValue: {
    fontFamily: 'Roboto-Light',
    fontSize: 16,
    lineHeight: 30,
    letterSpacing: 0,
    textAlign: 'right',
  },

  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 50 },
  authorAvatar: { width: 36, height: 36, borderRadius: 18 },
  authorName: {
    fontFamily: 'PlayfairDisplay_500Medium',
    fontSize: 20,
    lineHeight: 27,
    letterSpacing: 0,
  },

  floatingActions: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  closeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 38,
    borderRadius: 9999,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  closeBtnText: {
    fontFamily: 'Roboto-Light',
    fontSize: 19,
    lineHeight: 26,
    letterSpacing: 0,
    textAlign: 'center',
  },
  shareBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },

  zutatenHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  zutatenTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 30,
    lineHeight: 42,
    letterSpacing: 0,
  },
  servingsControl: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  servingsDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  servingsText: {
    fontFamily: 'Roboto-Light',
    fontSize: 17,
    lineHeight: 23,
    letterSpacing: 0,
  },

  zubereitungSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  zubereitungText: {
    fontFamily: 'Roboto-Light',
    fontSize: 17,
    lineHeight: 23,
    letterSpacing: 0,
  },

  ingredientSection: { marginBottom: 20 },
  ingredientSectionTitle: {
    fontFamily: 'Roboto-Regular',
    fontSize: 17,
    lineHeight: 23,
    letterSpacing: 0,
    marginBottom: 10,
    marginTop: 10,
  },
  ingredientRow: { flexDirection: 'row', gap: 10, paddingVertical: 10, alignItems: 'flex-start' },
  ingredientAmount: {
    fontFamily: 'Roboto-Light',
    fontSize: 17,
    lineHeight: 23,
    letterSpacing: 0,
    width: 108,
    flexShrink: 0,
  },
  ingredientName: {
    fontFamily: 'Roboto-Light',
    fontSize: 17,
    lineHeight: 23,
    letterSpacing: 0,
  },

  stepBlock: { marginBottom: 24 },
  stepLabel: {
    fontFamily: 'Roboto-Regular',
    fontSize: 17,
    lineHeight: 26,
    letterSpacing: 0,
    marginBottom: 8,
  },
  stepText: {
    fontFamily: 'Roboto-Light',
    fontSize: 17,
    lineHeight: 26,
    letterSpacing: 0,
  },

  appetit: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 35,
    lineHeight: 48,
    letterSpacing: 0,
    marginTop: 20,
  },

  // Bottom sheet
  modalOverlay: { flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 12 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 16, letterSpacing: -0.2, marginBottom: 8 },
  sheetOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  sheetOptionText: { fontSize: 15, fontFamily: 'Inter-Regular' },
});
