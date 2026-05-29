import React, { useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { Clock, Star, Heart } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors } from '@/constants/theme';

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
        style={[styles.card, { backgroundColor: colors.background.card }]}
      >
        <Image
          source={{ uri: recipe.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.body}>
          <Text
            style={[styles.title, { color: colors.text.secondary }]}
            numberOfLines={2}
          >
            {recipe.title}
          </Text>
          <View style={styles.meta}>
            <View style={styles.metaItem}>
              <Clock size={13} color={colors.text.tertiary} />
              <Text style={[styles.metaText, { color: colors.text.tertiary }]}>
                {recipe.durationMinutes} Min
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Star size={13} color={colors.text.tertiary} />
              <Text style={[styles.metaText, { color: colors.text.tertiary }]}>
                {recipe.rating}
              </Text>
            </View>
            <TouchableOpacity onPress={onToggleFavourite} hitSlop={8}>
              <Heart
                size={16}
                color={recipe.isFavourite ? colors.primary : colors.text.tertiary}
                fill={recipe.isFavourite ? colors.primary : 'transparent'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  hidden: {
    opacity: 0,
  },
  card: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  image: {
    width: '100%',
    aspectRatio: 4 / 3,
  },
  body: {
    padding: 10,
    gap: 6,
  },
  title: {
    fontSize: 13,
    fontFamily: 'Inter-SemiBold',
    lineHeight: 18,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
});
