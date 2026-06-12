import React from 'react';
import { View, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors } from '@/constants/theme';
import MagazinDetailContent from '@/components/MagazinDetailContent';

export default function MagazinDetailScreen() {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.secondary }]}>
      <MagazinDetailContent articleId={id} onClose={() => router.back()} showHeroImage manageStatusBar />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
