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

/** Design size for Rezepte grid card images */
export const REZEPE_CARD_IMAGE_SIZE = { width: 160.96, height: 134.12 } as const;

const REZEPE_META_COLOR = '#525252';

interface RecipeCardProps {
  readonly recipe: Recipe;
  readonly onPress?: () => void;
  readonly onPressWithLayout?: (layout: CardLayout) => void;
  readonly onToggleFavourite?: () => void;
  readonly hidden?: boolean;
  /** Rezepte home grid: Roboto typography + #525252 meta */
  readonly variant?: 'default' | 'rezepte';
  /** When set, image uses design width/height ratio at full card width */
  readonly imageSize?: { width: number; height: number };
  readonly showRating?: boolean;
}

export default function RecipeCard({
  recipe,
  onPress,
  onPressWithLayout,
  onToggleFavourite,
  hidden = false,
  variant = 'default',
  imageSize,
  showRating = true,
}: RecipeCardProps) {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const typography = getTypography(theme);
  const cardRef = useRef<View>(null);
  const isRezepte = variant === 'rezepte';
  const metaColor = isRezepte ? REZEPE_META_COLOR : colors.text.tertiary;
  const heartColor = recipe.isFavourite ? colors.primary : metaColor;
  const heartStrokeWidth = isRezepte && !recipe.isFavourite ? 0.55 : 1.5;

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
        <Image
          source={{ uri: recipe.imageUrl }}
          style={[
            styles.image,
            imageSize
              ? { width: '100%', aspectRatio: imageSize.width / imageSize.height }
              : styles.imageDefault,
          ]}
          resizeMode="cover"
        />
        <View style={styles.body}>
          <Text
            style={[
              isRezepte ? styles.titleRezepte : styles.titleDefault,
              { color: colors.text.primary },
              !isRezepte && { fontFamily: typography.fontFamily.medium },
            ]}
            numberOfLines={2}
          >
            {recipe.title}
          </Text>
          <View style={styles.meta}>
            <View style={styles.metaLeft}>
              <View style={styles.metaItem}>
                <Clock size={11} color={metaColor} />
                <Text
                  style={[
                    isRezepte ? styles.metaTextRezepte : styles.metaTextDefault,
                    !isRezepte && { fontFamily: typography.fontFamily.regular },
                  ]}
                >
                  {recipe.durationMinutes} Min
                </Text>
              </View>
              {showRating && (
                <View style={styles.metaItem}>
                  <Star size={11} color={metaColor} />
                  <Text
                    style={[
                      isRezepte ? styles.metaTextRezepte : styles.metaTextDefault,
                      !isRezepte && { fontFamily: typography.fontFamily.regular },
                    ]}
                  >
                    {recipe.rating}
                  </Text>
                </View>
              )}
            </View>
            <Pressable onPress={onToggleFavourite} hitSlop={8} style={styles.favouriteBtn}>
              <Heart
                size={16}
                color={heartColor}
                fill={recipe.isFavourite ? colors.primary : 'transparent'}
                strokeWidth={heartStrokeWidth}
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
  image: { width: '100%' },
  imageDefault: { aspectRatio: 4 / 3 },
  body: { padding: 10, gap: 6 },
  titleRezepte: {
    fontFamily: 'Roboto-Regular',
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: 0,
  },
  titleDefault: {
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  favouriteBtn: { marginLeft: 8 },
  metaTextRezepte: {
    fontFamily: 'Roboto-Light',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
    color: REZEPE_META_COLOR,
    marginTop: 1,
  },
  metaTextDefault: {
    fontSize: 12,
    lineHeight: 16,
  },
});
