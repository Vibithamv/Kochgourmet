import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { X, Share2, Check } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors, getTypography } from '@/constants/theme';
import { getArticleDetail, type ArticleSection } from '@/utils/mockArticleDetails';
import RecipeCard from '@/components/RecipeCard';
import { useFavourites } from '@/contexts/FavouritesContext';

export default function MagazinDetailScreen() {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const typography = getTypography(theme);
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const article = getArticleDetail(id);

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
          <Text key={index} style={[styles.bodyText, { color: colors.text.primary }]}>
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
            <Text style={[styles.quoteText, {
              color: colors.text.primary,
              fontFamily: typography.fontFamily.display,
            }]}>
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
            {(section.items ?? []).map(item => (
              <View key={item} style={styles.listItem}>
                <View style={[styles.listCheck, { backgroundColor: colors.success }]}>
                  <Check size={10} color="#fff" strokeWidth={3} />
                </View>
                <Text style={[styles.listItemText, { color: colors.text.primary }]}>{item}</Text>
              </View>
            ))}
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
    <View style={[styles.screen, { backgroundColor: colors.background.secondary }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero image — full-bleed at the top, behind the status bar */}
        <Image
          source={{ uri: article.heroImageUrl }}
          style={styles.heroImage}
          resizeMode="cover"
        />

        {/* Title + intro */}
        <View style={[styles.header, { paddingTop: 20 }]}>
          <Text style={[styles.title, {
            color: colors.text.primary,
            fontFamily: typography.fontFamily.display,
          }]}>
            {article.title}
          </Text>
          <Text style={[styles.intro, { color: colors.text.secondary }]}>
            {article.intro}
          </Text>
        </View>

        {/* Article sections */}
        <View style={[styles.content, { paddingTop: 8 }]}>
          {article.sections.map((section, index) => renderSection(section, index))}
        </View>

        {/* Related recipes */}
        {relatedRecipes.length > 0 && (
          <View style={styles.relatedSection}>
            <Text style={[styles.relatedTitle, { color: colors.text.primary }]}>
              Passende Rezepte
            </Text>
            <View style={styles.recipeGrid}>
              {relatedRecipes.map((recipe, i) => (
                <View key={recipe.id} style={styles.recipeCard}>
                  <RecipeCard
                    recipe={recipe}
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
      <View
        style={[
          styles.floatingActions,
          { bottom: Math.max(insets.bottom, 12) + 90 },
        ]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={[styles.closeBtn, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <X size={16} color={colors.text.primary} />
          <Text style={[styles.closeBtnText, { color: colors.text.primary }]}>Schließen</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.shareBtn, { backgroundColor: colors.primary }]}
          onPress={onShare}
          activeOpacity={0.8}
        >
          <Share2 size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  // Hero image — full-bleed, no rounding, sits behind the status bar
  heroImage: {
    width: '100%',
    height: 260,
  },
  // Title + intro
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 12,
  },
  title: {
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  intro: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    lineHeight: 24,
  },

  // Floating actions (above the tab bar)
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
  closeBtnText: { fontSize: 14, fontFamily: 'Inter-SemiBold' },
  shareBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },

  // Content sections
  content: {
    paddingHorizontal: 20,
    gap: 16,
  },
  sectionHeading: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    lineHeight: 26,
    marginTop: 8,
  },
  bodyText: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    lineHeight: 26,
  },
  sectionImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },

  // Quote
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
    fontSize: 20,
    lineHeight: 30,
  },
  quoteAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  quoteAvatar: { width: 32, height: 32, borderRadius: 16 },
  quoteAuthorLabel: { fontSize: 11, fontFamily: 'Inter-SemiBold', letterSpacing: 0.5 },

  // List
  listBlock: { gap: 12 },
  listItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  listCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 3,
    flexShrink: 0,
  },
  listItemText: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    lineHeight: 24,
  },

  // Product card
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
  productName: { flex: 1, fontSize: 14, fontFamily: 'Inter-SemiBold' },

  // Related recipes
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
