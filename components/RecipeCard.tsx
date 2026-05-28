import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
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

interface RecipeCardProps {
  readonly recipe: Recipe;
  readonly onPress: () => void;
  readonly onToggleFavourite?: () => void;
}

export default function RecipeCard({ recipe, onPress, onToggleFavourite }: RecipeCardProps) {
  const { theme } = useTheme();
  const colors = getColors(theme);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
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
            <Clock size={13} color="#525252" />
            <Text style={[styles.metaText, { color: '#525252' }]}>
              {recipe.durationMinutes} Min
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Star size={13} color="#525252" />
            <Text style={[styles.metaText, { color: '#525252' }]}>
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
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
