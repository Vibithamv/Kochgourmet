import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  RefreshControl,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors } from '@/constants/theme';
import { pillSearchBarStyle, pillSearchInputStyle } from '@/constants/textMetrics';
import ArticleCard, { type ArticleListItem } from '@/components/ArticleCard';
import ArticleExpandOverlay from '@/components/ArticleExpandOverlay';
import { MagazinScreenShimmer } from '@/components/Shimmer';
import type { CardLayout } from '@/components/RecipeCard';
import { mobileAppMagazine } from '@/hooks/mobileApp';
import { mapMagazineListItems } from '@/utils/mobileAppMappers';

const TAB_BAR_HEIGHT = 90;
const ARTICLES_PER_PAGE = 20;

export default function MagazinScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const insets = useSafeAreaInsets();
  const magazineApi = useMemo(() => mobileAppMagazine(), []);
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [expandedArticle, setExpandedArticle] = useState<{
    article: ArticleListItem;
    layout: CardLayout;
  } | null>(null);

  const openArticleDetail = useCallback((article: ArticleListItem, layout: CardLayout) => {
    setExpandedArticle({ article, layout });
  }, []);

  const closeArticleDetail = useCallback(() => {
    setExpandedArticle(null);
  }, []);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const articlesRef = useRef(articles);
  articlesRef.current = articles;

  const loadArticles = useCallback(
    async (
      options: {
        page?: number;
        append?: boolean;
        search?: string;
        silent?: boolean;
      } = {},
    ) => {
      const nextPage = options.page ?? 1;
      const append = options.append ?? false;
      const searchTerm = options.search ?? search;
      const silent = options.silent ?? false;

      if (append) {
        setLoadingMore(true);
      } else if (nextPage === 1 && !silent && articlesRef.current.length === 0) {
        setLoading(true);
      }

      try {
        const response = await magazineApi.listPosts({
          page: nextPage,
          itemsPerPage: ARTICLES_PER_PAGE,
          ...(searchTerm.trim() ? { search: searchTerm.trim() } : {}),
        });
        if (response.success && response.data) {
          const members = mapMagazineListItems(response.data['hydra:member'] ?? []);
          setArticles((prev) => (append ? [...prev, ...members] : members));
          setPage(nextPage);
          setHasMore(Boolean(response.data['hydra:view']?.['hydra:next']));
        } else if (!append) {
          setArticles([]);
          setHasMore(false);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [magazineApi, search],
  );

  const loadArticlesRef = useRef(loadArticles);
  loadArticlesRef.current = loadArticles;

  useFocusEffect(
    useCallback(() => {
      void loadArticlesRef.current({ page: 1, silent: articlesRef.current.length > 0 });
      return () => {
        setSearch('');
        setExpandedArticle(null);
        if (searchDebounceRef.current) {
          clearTimeout(searchDebounceRef.current);
        }
      };
    }, []),
  );

  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      void loadArticlesRef.current({ page: 1, search, silent: true });
    }, 350);
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [search]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadArticles({ page: 1, search, silent: true });
  }, [loadArticles, search]);

  const onLoadMore = useCallback(() => {
    if (loadingMore || !hasMore || loading) return;
    void loadArticles({ page: page + 1, append: true, search, silent: true });
  }, [loadingMore, hasMore, loading, loadArticles, page, search]);

  if (loading && articles.length === 0) {
    return <MagazinScreenShimmer />;
  }

  const listHeader = (
    <>
      <View style={{ height: Math.max(insets.top, 50) + 32 }} />
      <Text
        style={[styles.title, { color: colors.text.primary }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.72}
      >
        {t('common.tabs.magazin')}
      </Text>
      <Text style={[styles.subtitle, { color: colors.text.primary }]}>
        {t('magazinScreen.subtitle')}
      </Text>
      <View style={[pillSearchBarStyle, { backgroundColor: colors.background.secondary, marginBottom: 66 }]}>
        <TextInput
          style={pillSearchInputStyle({ color: colors.text.primary })}
          placeholder={t('magazinScreen.searchPlaceholder')}
          placeholderTextColor={colors.text.primary}
          value={search}
          onChangeText={setSearch}
        />
        <Search size={18} color={colors.text.tertiary} />
      </View>
    </>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <FlatList
        data={articles}
        keyExtractor={(item) => item.id}
        extraData={expandedArticle?.article.id}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 12) + 16 },
        ]}
        showsVerticalScrollIndicator={false}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.text.tertiary }]}>
            {t('magazinScreen.emptyArticles')}
          </Text>
        }
        ListFooterComponent={
          loadingMore ? (
            <Text style={[styles.loadMoreText, { color: colors.text.tertiary }]}>
              {t('common.loading')}
            </Text>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.articleItem}>
            <ArticleCard
              article={item}
              hidden={expandedArticle?.article.id === item.id}
              onPressWithLayout={(layout) => openArticleDetail(item, layout)}
            />
          </View>
        )}
      />

      {expandedArticle && (
        <ArticleExpandOverlay
          article={expandedArticle.article}
          sourceLayout={expandedArticle.layout}
          onClose={closeArticleDetail}
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
    lineHeight: 108,
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
  articleItem: { marginBottom: 35 },
  emptyText: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    paddingVertical: 40,
  },
  loadMoreText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    paddingVertical: 16,
  },
});
