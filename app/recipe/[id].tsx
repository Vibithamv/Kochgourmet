import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import RecipeDetailContent from '@/components/RecipeDetailContent';

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <RecipeDetailContent
      recipeId={id}
      onClose={() => router.back()}
    />
  );
}
