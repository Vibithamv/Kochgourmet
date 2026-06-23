import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors } from '@/constants/theme';
import ContentPageHtml from '@/components/ContentPageHtml';
import { mobileAppContent } from '@/hooks/mobileApp';

export default function ImpressumScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const insets = useSafeAreaInsets();
  const contentApi = useMemo(() => mobileAppContent(), []);
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const load = async () => {
        setLoading(true);
        setLoadFailed(false);
        const response = await contentApi.getImpressum();
        if (!active) return;
        if (response.success && response.data) {
          setHtml(response.data.content ?? '');
        } else {
          setLoadFailed(true);
          setHtml('');
        }
        setLoading(false);
      };
      void load();
      return () => {
        active = false;
      };
    }, [contentApi]),
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.secondary }]}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 44) + 16 }]}>
        <TouchableOpacity
          style={[styles.backCircle, { borderColor: colors.border.primary, backgroundColor: colors.background.card }]}
          onPress={() => router.back()}
          hitSlop={8}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]} numberOfLines={1}>
          {t('account.legalNotice')}
        </Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom, 16) + 90 }]}
          showsVerticalScrollIndicator={false}
        >
          {loadFailed ? (
            <Text style={[styles.fallback, { color: colors.text.tertiary }]}>
              {t('common.errorMessage')}
            </Text>
          ) : html.trim() ? (
            <ContentPageHtml html={html} />
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerTitle: {
    flex: 1,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.3,
    fontFamily: 'PlayfairDisplay_700Bold',
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  fallback: {
    fontSize: 15,
    fontFamily: 'Roboto-Light',
    lineHeight: 24,
  },
});
