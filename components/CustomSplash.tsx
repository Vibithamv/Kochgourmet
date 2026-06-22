import React from 'react';
import { ActivityIndicator, Image, Modal, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { getSplashBackground, SPLASH_ICON_SIZE } from '@/constants/splash';
import { getColors } from '@/constants/theme';

type CustomSplashProps = Readonly<{
  visible: boolean;
}>;

export default function CustomSplash({ visible }: CustomSplashProps) {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const { t } = useTranslation();

  return (
    <Modal animationType="none" transparent={false} visible={visible}>
      <View style={[styles.root, { backgroundColor: getSplashBackground(theme) }]}>
        <Image
          source={require('../assets/images/kochgourmet-splash-icon.png')}
          style={[styles.logo, { width: SPLASH_ICON_SIZE, height: SPLASH_ICON_SIZE }]}
          resizeMode="contain"
        />
        <Text style={[styles.caption, { color: colors.text.secondary, fontFamily: 'Inter-Medium' }]}>
          {t('common.loading')}
        </Text>
        <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logo: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  caption: {
    fontSize: 14,
    letterSpacing: 0.2,
    marginBottom: 20,
  },
  spinner: {
    marginTop: 4,
  },
});
