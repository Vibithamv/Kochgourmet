import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Share,
  Platform,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Share2 } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors, getTypography } from '@/constants/theme';
import { getArticleDetail, type ArticleSection } from '@/utils/mockArticleDetails';
import {
  getStatusBarStripHeight,
  getHeroStatusBarStripBackground,
  isHeroAtTop,
} from '@/utils/statusBarLayout';
import { useDetailScreenStatusBar } from '@/hooks/useStatusBarStyle';
import RecipeCard from '@/components/RecipeCard';
import { useFavourites } from '@/contexts/FavouritesContext';

/** First word capitalized for list-style paragraphs; remainder unchanged. */
function splitLeadingWord(text: string): { readonly first: string; readonly rest: string } {
  const trimmed = text.trim();
  const space = trimmed.indexOf(' ');
  if (space === -1) {
    const word = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    return { first: word, rest: '' };
  }
  const raw = trimmed.slice(0, space);
  const first = raw.charAt(0).toUpperCase() + raw.slice(1);
  return { first, rest: trimmed.slice(space) };
}

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
  const { theme } = useTheme();
  const colors = getColors(theme);
  const typography = getTypography(theme);
  const insets = useSafeAreaInsets();
  const statusBarStripHeight = getStatusBarStripHeight(insets.top);
  const actionsBottom = floatingActionsBottom ?? Math.max(insets.bottom, 12) + 90;
  const article = getArticleDetail(articleId);

  const [scrollY, setScrollY] = useState(0);

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

  const { recipes, toggleFavourite } = useFavourites();
  const relatedRecipes = article.relatedRecipeIds
    .map(rid => recipes.find(r => r.id === rid))
    .filter((r): r is NonNullable<typeof r> => r !== undefined);

  const onShare = async () => {
    await Share.share({ message: `Lies diesen Artikel: ${article.title}` });
  };

  const renderSection = (section: ArticleSection, index: number) => {
    switch (section.type) {
      case 'heading':
        return (
          <Text key={index} style={[styles.sectionHeading, { color: colors.text.primary }]}>
            {section.content}
          </Text>
        );

      case 'text':
        return (
          <Text key={index} style={[styles.bodyContent, { color: colors.text.primary }]}>
            {section.content}
          </Text>
        );

      case 'image':
        return (
          <Image
            key={index}
            source={{ uri: section.imageUrl }}
            style={styles.sectionImage}
            resizeMode="cover"
          />
        );

      case 'quote':
        return (
          <View key={index} style={[styles.quoteBlock, { backgroundColor: colors.background.secondary }]}>
            <Text style={[styles.quoteMarks, { color: colors.primary }]}>"</Text>
            <Text style={[styles.quoteText, { color: colors.text.primary }]}>
              {section.content}
            </Text>
            <View style={styles.quoteAuthor}>
              {section.quoteAuthorAvatar ? (
                <Image source={{ uri: section.quoteAuthorAvatar }} style={styles.quoteAvatar} />
              ) : null}
              <Text style={[styles.quoteAuthorLabel, { color: colors.text.tertiary }]}>
                {section.quoteAuthorLabel}
              </Text>
            </View>
          </View>
        );

      case 'list':
        return (
          <View key={index} style={styles.listBlock}>
            {(section.items ?? []).map(item => {
              const { first, rest } = splitLeadingWord(item);
              return (
                <View key={item} style={styles.listItem}>
                  <Text style={[styles.listBullet, { color: colors.text.primary }]}>•</Text>
                  <Text style={[styles.bodyContent, styles.listItemText, { color: colors.text.primary }]}>
                    <Text style={styles.listItemLead}>{first}</Text>
                    {rest}
                  </Text>
                </View>
              );
            })}
          </View>
        );

      case 'product':
        return (
          <View key={index} style={[styles.productCard, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}>
            {section.productImage ? (
              <Image source={{ uri: section.productImage }} style={styles.productImage} resizeMode="cover" />
            ) : null}
            <Text style={[styles.productName, { color: colors.text.primary }]}>
              {section.productName}
            </Text>
          </View>
        );

      default:
        return null;
    }
  };

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
            source={{ uri: article.heroImageUrl }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        )}

        {/* Title, intro + article sections */}
        <View
          style={[
            styles.content,
            overlayContentPadding ? styles.contentOverlayHandoff : styles.contentDefault,
          ]}
        >
          <Text style={[styles.title, { color: colors.text.primary }]}>
            {article.title}
          </Text>
          <Text style={[styles.bodyContent, { color: colors.text.primary }]}>
            {article.intro}
          </Text>
          {article.sections.map((section, index) => renderSection(section, index))}
        </View>

        {/* Related recipes */}
        {relatedRecipes.length > 0 && (
          <View style={styles.relatedSection}>
            <Text style={[styles.relatedTitle, { color: colors.text.primary }]}>
              Passende Rezepte
            </Text>
            <View style={styles.recipeGrid}>
              {relatedRecipes.map(recipe => (
                <View key={recipe.id} style={styles.recipeCard}>
                  <RecipeCard
                    recipe={recipe}
                    variant="rezepte"
                    onPress={() => router.push(`/recipe/${recipe.id}`)}
                    onToggleFavourite={() => toggleFavourite(recipe.id)}
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: Math.max(insets.bottom, 16) + 180 }} />
      </ScrollView>

      {/* Floating action buttons — sit above the floating tab bar */}
      <View style={[styles.floatingActions, { bottom: actionsBottom }]} pointerEvents="box-none">
        <TouchableOpacity
          style={[styles.closeBtn, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <Text style={[styles.closeBtnText, { color: colors.text.primary, fontFamily: typography.fontFamily.regular }]}>
            Schließen
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
    lineHeight: 35,
    letterSpacing: 0,
    marginTop: 20,
    marginBottom: 4,
  },
  bodyContent: {
    fontFamily: 'Roboto-Light',
    fontSize: 17,
    lineHeight: 26,
    letterSpacing: 0,
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

  sectionHeading: {
    fontFamily: 'Roboto-Regular',
    fontSize: 22,
    lineHeight: 27,
    letterSpacing: 0,
    marginTop: 12,
    marginBottom: 4,
  },
  sectionImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },

  quoteBlock: {
    borderRadius: 16,
    padding: 20,
    gap: 12,
    marginVertical: 8,
  },
  quoteMarks: {
    fontSize: 48,
    fontFamily: 'Inter-Bold',
    lineHeight: 40,
    marginBottom: -8,
  },
  quoteText: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 35,
    lineHeight: 45,
    letterSpacing: 0,
  },
  quoteAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  quoteAvatar: { width: 32, height: 32, borderRadius: 16 },
  quoteAuthorLabel: {
    fontFamily: 'Roboto-Regular',
    fontSize: 15,
    lineHeight: 15,
    letterSpacing: 0,
    textTransform: 'uppercase',
  },

  listBlock: { gap: 12 },
  listItem: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  listBullet: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Inter-Regular',
  },
  listItemText: {
    flex: 1,
  },
  listItemLead: {
    fontFamily: 'Roboto-Regular',
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
