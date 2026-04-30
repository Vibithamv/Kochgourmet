import React from 'react';
import { Image, Modal, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
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
      <View style={[styles.root, { backgroundColor: colors.background.primary }]}>
        <Image
          source={require('../assets/images/kochgourmet-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.caption, { color: colors.text.secondary, fontFamily: 'Inter-Medium' }]}>
          {t('common.loading')}
        </Text>
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
    width: '88%',
    maxWidth: 300,
    height: undefined,
    aspectRatio: 527 / 77,
    alignSelf: 'center',
    marginBottom: 16,
  },
  caption: {
    fontSize: 14,
    letterSpacing: 0.2,
  },
});
