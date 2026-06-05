import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  RefreshControl,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors } from '@/constants/theme';
import ArticleCard, { type ArticleListItem } from '@/components/ArticleCard';
import ArticleExpandOverlay from '@/components/ArticleExpandOverlay';
import type { CardLayout } from '@/components/RecipeCard';

const ARTICLES: ArticleListItem[] = [
  {
    id: '1',
    title: 'Erfrischende Eistee-Ideen für echten Genuss',
    imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600',
  },
  {
    id: '2',
    title: 'Die ausgewogene Vegane Ernährung',
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600',
  },
  {
    id: '3',
    title: 'Veganer Trend',
    imageUrl: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600',
  },
];

const TAB_BAR_HEIGHT = 90;

export default function MagazinScreen() {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [expandedArticle, setExpandedArticle] = useState<{
    article: ArticleListItem;
    layout: CardLayout;
  } | null>(null);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const filteredArticles = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ARTICLES;
    return ARTICLES.filter(a => a.title.toLowerCase().includes(q));
  }, [search]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 12) + 16 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={{ height: Math.max(insets.top, 50) + 32 }} />

        <Text style={[styles.title, { color: colors.text.primary }]}>
          Magazin
        </Text>

        <Text style={[styles.subtitle, { color: colors.text.primary }]}>
          Erweitere dein Kochwissen oder finden Tipps und Tricks rund ums Thema Kochen.
        </Text>

        <View style={[styles.searchBar, { backgroundColor: colors.background.secondary }]}>
          <TextInput
            style={[styles.searchInput, { color: colors.text.primary }]}
            placeholder="Suchen"
            placeholderTextColor={colors.text.primary}
            value={search}
            onChangeText={setSearch}
          />
          <Search size={18} color={colors.text.tertiary} />
        </View>

        <View style={styles.articles}>
          {filteredArticles.length === 0 && (
            <Text style={[styles.emptyText, { color: colors.text.tertiary }]}>
              Keine Artikel gefunden.
            </Text>
          )}
          {filteredArticles.map(article => (
            <ArticleCard
              key={article.id}
              article={article}
              hidden={expandedArticle?.article.id === article.id}
              onPressWithLayout={(layout) => setExpandedArticle({ article, layout })}
            />
          ))}
        </View>
      </ScrollView>

      {expandedArticle && (
        <ArticleExpandOverlay
          article={expandedArticle.article}
          sourceLayout={expandedArticle.layout}
          onClose={() => setExpandedArticle(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingHorizontal: 26 },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 80,
    lineHeight: 80,
    letterSpacing: 0,
    marginBottom: 20,
  },
  subtitle: {
    fontFamily: 'Roboto-Light',
    fontSize: 17,
    lineHeight: 23,
    letterSpacing: 0,
    marginBottom: 33,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9999,
    paddingHorizontal: 22,
    height: 45,
    gap: 10,
    marginBottom: 66,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Roboto-Light',
    fontSize: 17,
    lineHeight: 17,
    letterSpacing: 0,
  },
  articles: { gap: 35 },
  emptyText: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    paddingVertical: 40,
  },
});
