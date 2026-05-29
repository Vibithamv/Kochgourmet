import React, { useRef } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors } from '@/constants/theme';
import type { CardLayout } from '@/components/RecipeCard';

export interface ArticleListItem {
  id: string;
  title: string;
  imageUrl: string;
}

interface ArticleCardProps {
  readonly article: ArticleListItem;
  readonly onPress?: () => void;
  readonly onPressWithLayout?: (layout: CardLayout) => void;
  readonly hidden?: boolean;
}

export default function ArticleCard({
  article,
  onPress,
  onPressWithLayout,
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
        <Text style={[styles.title, { color: colors.text.primary }]}>
          {article.title}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {},
  hidden: {
    opacity: 0,
  },
  card: {
    gap: 15,
  },
  image: {
    width: '100%',
    height: 252,
    borderRadius: 15,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    lineHeight: 21,
  },
});
