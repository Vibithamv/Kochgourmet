import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors, Typography } from '@/constants/theme';

function decodeParam(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return '';
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export default function InvestmentSuccessScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ amount?: string; title?: string }>();
  const amountFormatted = decodeParam(params.amount);
  const projectTitle = decodeParam(params.title);
  const primaryBtnTextColor = colors.text.onPrimary;

  const summaryText = useMemo(() => {
    if (amountFormatted && projectTitle) {
      return t('investment.investmentSuccessSummary', {
        amount: amountFormatted,
        property: projectTitle,
      });
    }
    return t('investment.investmentSuccessGeneric');
  }, [amountFormatted, projectTitle, t]);

  const goPortfolio = () => {
    router.replace('/(tabs)/portfolio');
  };

  const stylesMemo = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1 },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 20,
          paddingBottom: 16,
          borderBottomWidth: 1,
        },
        backButton: {
          position: 'absolute',
          left: 20,
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1,
        },
        headerTitleWrap: {
          flex: 1,
          paddingHorizontal: 60,
          alignItems: 'center',
          justifyContent: 'center',
        },
        headerTitle: {
          fontSize: 18,
          fontFamily: Typography.fontFamily.bold,
          letterSpacing: -0.3,
          textAlign: 'center',
        },
        scroll: { flex: 1 },
        scrollContent: {
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 24,
          paddingTop: 32,
          paddingBottom: 32,
        },
        iconWrap: {
          width: 72,
          height: 72,
          borderRadius: 36,
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: 'center',
          marginBottom: 24,
        },
        body: {
          fontSize: 16,
          fontFamily: Typography.fontFamily.regular,
          textAlign: 'center',
          lineHeight: 24,
          marginBottom: 40,
          width: '100%',
          maxWidth: 400,
          alignSelf: 'center',
        },
        cta: {
          paddingVertical: 16,
          paddingHorizontal: 32,
          borderRadius: 12,
          alignItems: 'center',
          alignSelf: 'stretch',
          maxWidth: 400,
          width: '100%',
        },
        ctaText: {
          fontSize: 16,
          fontFamily: Typography.fontFamily.semiBold,
        },
      }),
    []
  );

  return (
    <View style={[stylesMemo.container, { backgroundColor: colors.background.secondary }]}>
      <View
        style={[
          stylesMemo.header,
          {
            paddingTop: Math.max(insets.top, 44) + 16,
            backgroundColor: colors.background.primary,
            borderBottomColor: colors.border.primary,
          },
        ]}
      >
        {/* <TouchableOpacity
          style={[stylesMemo.backButton, { backgroundColor: colors.background.secondary }]}
          onPress={goPortfolio}
          accessibilityRole="button"
          accessibilityLabel={t('projectDetail.viewPortfolio')}
        >
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity> */}
        <View style={stylesMemo.headerTitleWrap}>
          <Text style={[stylesMemo.headerTitle, { color: colors.text.primary }]}>
            {t('investment.investmentSuccessful')}
          </Text>
        </View>
      </View>

      <ScrollView
        style={stylesMemo.scroll}
        contentContainerStyle={stylesMemo.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[stylesMemo.iconWrap, { backgroundColor: `${colors.success}22` }]}>
          <Check size={40} color={colors.success} strokeWidth={2.5} />
        </View>
        <Text style={[stylesMemo.body, { color: colors.text.secondary }]}>{summaryText}</Text>
        <TouchableOpacity
          style={[stylesMemo.cta, { backgroundColor: colors.primary }]}
          onPress={goPortfolio}
          activeOpacity={0.85}
        >
          <Text style={[stylesMemo.ctaText, { color: primaryBtnTextColor }]}>
            {t('projectDetail.viewPortfolio')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
