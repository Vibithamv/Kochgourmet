import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors } from '@/constants/theme';
import AsseteraLogo from '@/components/AsseteraLogo';

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
        <View style={styles.logo}>
          <AsseteraLogo width="100%" height="100%" />
        </View>
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
    aspectRatio: 243 / 46,
    alignSelf: 'center',
    marginBottom: 16,
  },
  caption: {
    fontSize: 14,
    letterSpacing: 0.2,
  },
});
