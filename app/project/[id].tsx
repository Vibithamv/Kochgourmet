import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { getColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import OfferingDetailContent from '@/components/OfferingDetailContent';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const offeringId = Array.isArray(id) ? id[0] : id;

  if (!offeringId) {
    return <View style={[styles.container, { backgroundColor: colors.background.primary }]} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <OfferingDetailContent
        offeringId={offeringId}
        onClose={() => router.back()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
