import React, { useRef } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors } from '@/constants/theme';
import type { CardLayout } from '@/components/RecipeCard';

/** Magazine list card hero image height (matches ArticleCard styles). */
export const ARTICLE_CARD_IMAGE_HEIGHT = 252;

export interface ArticleListItem {
  id: string;
  title: string;
  imageUrl: string;
}

interface ArticleCardProps {
  readonly article: ArticleListItem;
  readonly onPressWithLayout?: (layout: CardLayout) => void;
  readonly onPress?: () => void;
  readonly hidden?: boolean;
}

export default function ArticleCard({
  article,
  onPressWithLayout,
  onPress,
  hidden = false,
}: ArticleCardProps) {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const cardRef = useRef<View>(null);

  const handlePress = () => {
    if (onPressWithLayout) {
      cardRef.current?.measureInWindow((x, y, width, height) => {
        onPressWithLayout({ x, y, width, height });
      });
      return;
    }
    onPress?.();
  };

  return (
    <View ref={cardRef} collapsable={false} style={[styles.wrapper, hidden && styles.hidden]}>
      <Pressable onPress={handlePress} style={styles.card}>
        <Image
          source={{ uri: article.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
        <Text style={[styles.title, { color: colors.text.primary }]}>{article.title}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 15 },
  hidden: { opacity: 0 },
  card: { gap: 15 },
  image: { width: '100%', height: ARTICLE_CARD_IMAGE_HEIGHT, borderRadius: 15 },
  title: {
    fontFamily: 'Roboto-Regular',
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: 0,
  },
});
