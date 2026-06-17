import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors } from '@/constants/theme';
import { INVESTMENT_CONTENT_PADDING } from '@/components/InvestmentCommunityUI';

const CLAP_ILLUSTRATION = require('../../assets/images/investment-success-image.png');
const ILLUSTRATION_SOURCE = Image.resolveAssetSource(CLAP_ILLUSTRATION);
const ILLUSTRATION_ASPECT_RATIO =
  ILLUSTRATION_SOURCE.width / ILLUSTRATION_SOURCE.height;
const ILLUSTRATION_MAX_WIDTH = 340;

export default function InvestmentSuccessScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const isDark = theme === 'dark' || theme === 'darkGreen';
  const buttonTextColor = isDark ? '#0D1117' : '#FFFFFF';
  const contentWidth = screenWidth - INVESTMENT_CONTENT_PADDING * 2;
  const illustrationWidth = Math.min(contentWidth, ILLUSTRATION_MAX_WIDTH);
  const illustrationHeight = illustrationWidth / ILLUSTRATION_ASPECT_RATIO;

  const goBackToOverview = () => {
    router.replace('/(tabs)/offerings');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: Math.max(insets.top, 16) + 24,
          paddingHorizontal: INVESTMENT_CONTENT_PADDING,
          paddingBottom: Math.max(insets.bottom, 16) + 32,
        }}
      >
        <View style={styles.illustrationWrap}>
          <Image
            source={CLAP_ILLUSTRATION}
            style={{
              width: illustrationWidth,
              height: illustrationHeight,
            }}
            resizeMode="contain"
          />
        </View>

        <Text style={[styles.title, { color: colors.text.primary }]}>
          {t('investment.thankYouTitle')}
        </Text>

        <Text style={[styles.body, { color: colors.text.primary }]}>
          {t('investment.thankYouMessage')}
        </Text>

        <TouchableOpacity
          style={[styles.cta, { backgroundColor: colors.primary }]}
          onPress={goBackToOverview}
          activeOpacity={0.85}
        >
          <Text style={[styles.ctaText, { color: buttonTextColor }]}>
            {t('investment.backToOverview')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  illustrationWrap: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 35,
    lineHeight: 42,
    letterSpacing: 0,
    marginBottom: 16,
  },
  body: {
    fontFamily: 'Roboto-Light',
    fontSize: 17,
    lineHeight: 23,
    letterSpacing: 0,
    marginBottom: 32,
  },
  cta: {
    alignSelf: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 9999,
    minHeight: 45,
    justifyContent: 'center',
  },
  ctaText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: 0,
  },
});
