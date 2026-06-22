import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Share,
  Platform,
  ActivityIndicator,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { Share2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors, getTypography } from '@/constants/theme';
import {
  getStatusBarStripHeight,
  getHeroStatusBarStripBackground,
  isHeroAtTop,
} from '@/utils/statusBarLayout';
import { useDetailScreenStatusBar } from '@/hooks/useStatusBarStyle';
import RecipeCard from '@/components/RecipeCard';
import ContentPageHtml from '@/components/ContentPageHtml';
import { useFavourites } from '@/contexts/FavouritesContext';
import { mobileAppMagazine } from '@/hooks/mobileApp';
import {
  magazineHeroImage,
  mapMagazineRelatedRecipe,
} from '@/utils/mobileAppMappers';
import type { MagazinePostDetail } from '@/types/mobileAppApi';

export const MAGAZINE_HERO_IMAGE_HEIGHT = 260;

export interface MagazinDetailContentProps {
  readonly articleId: string;
  readonly onClose: () => void;
  readonly showHeroImage?: boolean;
  readonly floatingActionsBottom?: number;
  readonly overlayContentPadding?: boolean;
  readonly manageStatusBar?: boolean;
  readonly deferStatusBarToParent?: boolean;
  readonly onScrollOffsetChange?: (offsetY: number) => void;
}

export default function MagazinDetailContent({
  articleId,
  onClose,
  showHeroImage = true,
  floatingActionsBottom,
  overlayContentPadding = false,
  manageStatusBar = false,
  deferStatusBarToParent = false,
  onScrollOffsetChange,
}: MagazinDetailContentProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const typography = getTypography(theme);
  const insets = useSafeAreaInsets();
  const magazineApi = useMemo(() => mobileAppMagazine(), []);
  const statusBarStripHeight = getStatusBarStripHeight(insets.top);
  const actionsBottom = floatingActionsBottom ?? Math.max(insets.bottom, 12) + 90;

  const [article, setArticle] = useState<MagazinePostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [scrollY, setScrollY] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const load = async () => {
        setLoading(true);
        const response = await magazineApi.getPost(articleId);
        if (!active) return;
        if (response.success && response.data) {
          setArticle(response.data);
        } else {
          setArticle(null);
        }
        setLoading(false);
      };
      void load();
      return () => {
        active = false;
      };
    }, [articleId, magazineApi]),
  );

  const ownsStatusBar = manageStatusBar && !deferStatusBarToParent;
  const tracksScroll = ownsStatusBar || deferStatusBarToParent || Boolean(onScrollOffsetChange);
  const heroAtTop = isHeroAtTop(scrollY, showHeroImage, MAGAZINE_HERO_IMAGE_HEIGHT);
  const statusBarStripBackground = getHeroStatusBarStripBackground(
    colors,
    scrollY,
    showHeroImage,
    MAGAZINE_HERO_IMAGE_HEIGHT,
  );

  const statusBarConfig = useDetailScreenStatusBar(
    ownsStatusBar,
    theme,
    heroAtTop,
    statusBarStripBackground,
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = event.nativeEvent.contentOffset.y;
      setScrollY(y);
      onScrollOffsetChange?.(y);
    },
    [onScrollOffsetChange],
  );

  const { favourites, toggleFavourite } = useFavourites();
  const relatedRecipes = useMemo(() => {
    if (!article?.relatedRecipes?.length) return [];
    return article.relatedRecipes.map((recipe, index) => {
      const mapped = mapMagazineRelatedRecipe(recipe, index);
      const favourite = favourites.find((item) => item.id === mapped.id);
      return favourite ? { ...mapped, isFavourite: favourite.isFavourite } : mapped;
    });
  }, [article?.relatedRecipes, favourites]);

  const onShare = async () => {
    if (!article) return;
    await Share.share({ message: article.title });
  };

  if (loading) {
    return (
      <View style={[styles.fill, styles.centered, { backgroundColor: colors.background.secondary }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!article) {
    return (
      <View style={[styles.fill, styles.centered, { backgroundColor: colors.background.secondary }]}>
        <Text style={[styles.bodyContent, { color: colors.text.tertiary }]}>
          {t('magazinScreen.emptyArticles')}
        </Text>
        <TouchableOpacity onPress={onClose} style={styles.retryBtn}>
          <Text style={{ color: colors.primary }}>{t('common.close')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const heroImageUrl = magazineHeroImage(article);

  return (
    <View style={[styles.fill, { backgroundColor: colors.background.secondary }]}>
      {ownsStatusBar && (
        <>
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
        </>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={[styles.fill, { backgroundColor: colors.background.secondary }]}
        onScroll={tracksScroll ? handleScroll : undefined}
        scrollEventThrottle={16}
        bounces
      >
        {showHeroImage && (
          <Image
            source={{ uri: heroImageUrl }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        )}

        <View
          style={[
            styles.content,
            overlayContentPadding ? styles.contentOverlayHandoff : styles.contentDefault,
          ]}
        >
          <Text style={[styles.title, { color: colors.text.primary }]}>
            {article.title}
          </Text>
          <ContentPageHtml html={article.text} horizontalPadding={40} />
        </View>

        {article.products && article.products.length > 0 ? (
          <View style={styles.productsSection}>
            {article.products.map((product) => (
              <View
                key={product.name}
                style={[
                  styles.productCard,
                  { backgroundColor: colors.background.card, borderColor: colors.border.primary },
                ]}
              >
                {product.imageUrl ? (
                  <Image
                    source={{ uri: product.imageUrl }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                ) : null}
                <Text style={[styles.productName, { color: colors.text.primary }]}>
                  {product.name}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {relatedRecipes.length > 0 && (
          <View style={styles.relatedSection}>
            <Text style={[styles.relatedTitle, { color: colors.text.primary }]}>
              {t('magazinScreen.relatedRecipes')}
            </Text>
            <View style={styles.recipeGrid}>
              {relatedRecipes.map((recipe) => (
                <View key={recipe.id} style={styles.recipeCard}>
                  <RecipeCard
                    recipe={recipe}
                    variant="rezepte"
                    onPress={() => router.push(`/recipe/${recipe.id}`)}
                    onToggleFavourite={() => toggleFavourite(recipe.id, recipe)}
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: Math.max(insets.bottom, 16) + 180 }} />
      </ScrollView>

      <View style={[styles.floatingActions, { bottom: actionsBottom }]} pointerEvents="box-none">
        <TouchableOpacity
          style={[styles.closeBtn, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <Text style={[styles.closeBtnText, { color: colors.text.primary, fontFamily: typography.fontFamily.regular }]}>
            {t('common.close')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.shareBtn,
            {
              backgroundColor: colors.background.card,
              borderColor: colors.border.primary,
            },
          ]}
          onPress={onShare}
          activeOpacity={0.8}
        >
          <Share2 size={16} color={colors.text.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  retryBtn: { paddingVertical: 8, paddingHorizontal: 16 },
  statusBarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
  },
  heroImage: {
    width: '100%',
    height: MAGAZINE_HERO_IMAGE_HEIGHT,
  },
  content: {
    paddingHorizontal: 20,
    gap: 20,
  },
  contentDefault: { paddingTop: 20 },
  contentOverlayHandoff: { paddingTop: 10 },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 35,
    lineHeight: 48,
    letterSpacing: 0,
    marginTop: 20,
    marginBottom: 4,
  },
  bodyContent: {
    fontFamily: 'Roboto-Light',
    fontSize: 17,
    lineHeight: 26,
    letterSpacing: 0,
    textAlign: 'center',
  },
  productsSection: {
    paddingHorizontal: 20,
    gap: 12,
    marginTop: 8,
  },
  floatingActions: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 20,
  },
  closeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 9999,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  closeBtnText: { fontSize: 14, letterSpacing: 0.1 },
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
  productCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 12,
  },
  productImage: { width: 64, height: 64, borderRadius: 8 },
  productName: {
    flex: 1,
    fontFamily: 'Roboto-Regular',
    fontSize: 17,
    lineHeight: 30,
    letterSpacing: 0,
  },
  relatedSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 16,
  },
  relatedTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    letterSpacing: -0.3,
  },
  recipeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  recipeCard: {
    width: '47.5%',
  },
});
