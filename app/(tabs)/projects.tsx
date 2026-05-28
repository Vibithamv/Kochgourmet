import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors, getTypography } from '@/constants/theme';

interface Article {
  id: string;
  title: string;
  imageUrl: string;
}

const ARTICLES: Article[] = [
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
  const typography = getTypography(theme);
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

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
        {/* Status bar spacer */}
        <View style={{ height: Math.max(insets.top, 50) + 32 }} />

        {/* Title */}
        <Text style={[styles.title, { color: colors.text.primary, fontFamily: typography.fontFamily.display }]}>
          Magazin
        </Text>

        {/* Subtitle */}
        <Text style={[styles.subtitle, { color: colors.text.primary }]}>
          Erweitere dein Kochwissen oder finden Tipps und Tricks rund ums Thema Kochen.
        </Text>

        {/* Search bar */}
        <View style={[styles.searchBar, { backgroundColor: colors.background.secondary }]}>
          <TextInput
            style={[styles.searchInput, { color: colors.text.primary }]}
            placeholder="Suchen"
            placeholderTextColor={colors.text.tertiary}
            value={search}
            onChangeText={setSearch}
          />
          <Search size={18} color={colors.text.tertiary} />
        </View>

        {/* Article list */}
        <View style={styles.articles}>
          {filteredArticles.length === 0 && (
            <Text style={[styles.emptyText, { color: colors.text.tertiary }]}>
              Keine Artikel gefunden.
            </Text>
          )}
          {filteredArticles.map(article => (
            <TouchableOpacity
              key={article.id}
              style={styles.articleCard}
              activeOpacity={0.85}
              onPress={() => router.push(`/magazin/${article.id}`)}
            >
              <Image
                source={{ uri: article.imageUrl }}
                style={[styles.articleImage, { borderRadius: 15 }]}
                resizeMode="cover"
              />
              <Text style={[styles.articleTitle, { color: colors.text.primary }]}>
                {article.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingHorizontal: 26 },
  title: {
    fontSize: 80,
    lineHeight: 107,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 17,
    fontFamily: 'Inter-Regular',
    lineHeight: 23,
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
    fontSize: 17,
    fontFamily: 'Inter-Regular',
  },
  articles: { gap: 35 },
  articleCard: { gap: 15 },
  emptyText: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    paddingVertical: 40,
  },
  articleImage: {
    width: '100%',
    height: 252,
  },
  articleTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    lineHeight: 21,
  },
});
