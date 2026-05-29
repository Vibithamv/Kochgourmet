import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import MagazinDetailContent from '@/components/MagazinDetailContent';

export default function MagazinDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <MagazinDetailContent
      articleId={id}
      onClose={() => router.back()}
    />
  );
}
