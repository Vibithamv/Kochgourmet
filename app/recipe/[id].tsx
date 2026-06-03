import React from 'react';
import { View, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors } from '@/constants/theme';
import RecipeDetailContent from '@/components/RecipeDetailContent';

export default function RecipeDetailScreen() {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.secondary }]}>
      <RecipeDetailContent recipeId={id} onClose={() => router.back()} showHeroImage />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
