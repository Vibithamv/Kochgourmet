import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors, Typography, Spacing } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageSelector from '@/components/LanguageSelector';

export default function SettingsScreen() {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.secondary }]}>
      {/* Header */}
      <View style={[styles.header, {
        paddingTop: Math.max(insets.top, 44) + 16,
        backgroundColor: colors.background.primary,
        borderBottomColor: colors.border.primary,
      }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.background.secondary }]}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            {t('account.appSettings')}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 90 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Appearance */}
        <Text style={[styles.sectionLabel, { color: colors.text.tertiary }]}>
          {t('account.theme')}
        </Text>
        <View style={[styles.card, { backgroundColor: colors.background.primary, borderColor: colors.border.primary }]}>
          <View style={[styles.row, { borderBottomColor: colors.border.primary }]}>
            <Text style={[styles.rowLabel, { color: colors.text.primary }]}>
              {t('account.theme')}
            </Text>
            <ThemeToggle />
          </View>
        </View>

        {/* Language */}
        <Text style={[styles.sectionLabel, { color: colors.text.tertiary }]}>
          {t('account.language')}
        </Text>
        <View style={[styles.card, { backgroundColor: colors.background.primary, borderColor: colors.border.primary }]}>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.text.primary }]}>
              {t('account.language')}
            </Text>
            <LanguageSelector />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  headerContent: { flex: 1 },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 24,
    marginBottom: 8,
    marginHorizontal: Spacing.xl,
  },
  card: {
    marginHorizontal: Spacing.xl,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  rowLabel: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
  },
});
