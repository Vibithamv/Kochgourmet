import React, { useRef } from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { Clock, Star, Heart } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors, getTypography } from '@/constants/theme';

export interface Recipe {
  id: string;
  title: string;
  imageUrl: string;
  durationMinutes: number;
  rating: number;
  isFavourite?: boolean;
}

export interface CardLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface RecipeCardProps {
  readonly recipe: Recipe;
  readonly onPress?: () => void;
  readonly onPressWithLayout?: (layout: CardLayout) => void;
  readonly onToggleFavourite?: () => void;
  readonly hidden?: boolean;
}

export default function RecipeCard({
  recipe,
  onPress,
  onPressWithLayout,
  onToggleFavourite,
  hidden = false,
}: RecipeCardProps) {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const typography = getTypography(theme);
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
      <Pressable
        onPress={handlePress}
        style={[
          styles.card,
          {
            backgroundColor: colors.background.primary,
            borderColor: colors.border.primary,
          },
        ]}
      >
        <Image source={{ uri: recipe.imageUrl }} style={styles.image} resizeMode="cover" />
        <View style={styles.body}>
          <Text
            style={[styles.title, { color: colors.text.primary, fontFamily: typography.fontFamily.medium }]}
            numberOfLines={2}
          >
            {recipe.title}
          </Text>
          <View style={styles.meta}>
            <View style={styles.metaLeft}>
              <View style={styles.metaItem}>
                <Clock size={13} color={colors.text.tertiary} />
                <Text style={[styles.metaText, { color: colors.text.tertiary, fontFamily: typography.fontFamily.regular }]}>
                  {recipe.durationMinutes} Min
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Star size={13} color={colors.text.tertiary} />
                <Text style={[styles.metaText, { color: colors.text.tertiary, fontFamily: typography.fontFamily.regular }]}>
                  {recipe.rating}
                </Text>
              </View>
            </View>
            <Pressable onPress={onToggleFavourite} hitSlop={8} style={styles.favouriteBtn}>
              <Heart
                size={16}
                color={recipe.isFavourite ? colors.primary : colors.text.tertiary}
                fill={recipe.isFavourite ? colors.primary : 'transparent'}
              />
            </Pressable>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  hidden: { opacity: 0 },
  card: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  image: { width: '100%', aspectRatio: 4 / 3 },
  body: { padding: 10, gap: 6 },
  title: { fontSize: 14, lineHeight: 20, letterSpacing: -0.1 },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  favouriteBtn: { marginLeft: 8 },
  metaText: { fontSize: 12, lineHeight: 16 },
});
