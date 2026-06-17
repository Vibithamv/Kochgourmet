import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, BackHandler, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors } from '@/constants/theme';
import { replaceLoginClearingAuthStack } from '@/utils/authNavigation';

export default function RegisterSuccessScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const insets = useSafeAreaInsets();
  const goLogin = useCallback(() => {
    replaceLoginClearingAuthStack();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        goLogin();
        return true;
      });
      return () => sub.remove();
    }, [goLogin])
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background.primary }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 24),
            paddingBottom: Math.max(insets.bottom, 24) + 16,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.centerBlock}>
          <Image
            source={require('../../assets/images/kochgourmet-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View
            style={[
              styles.iconRing,
              { backgroundColor: colors.background.secondary, borderColor: colors.success },
            ]}
          >
            <Check size={40} color={colors.success} strokeWidth={2.5} />
          </View>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            {t('auth.register.successScreenTitle')}
          </Text>
          <Text style={[styles.body, { color: colors.text.primary }]}>
            {t('auth.register.registerSuccess')}
          </Text>

          <TouchableOpacity
            onPress={goLogin}
            activeOpacity={0.85}
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.primaryBtnText}>{t('auth.login.signIn')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 26,
  },
  centerBlock: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '88%',
    maxWidth: 200,
    height: undefined,
    aspectRatio: 527 / 77,
    marginBottom: 28,
  },
  iconRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 35,
    lineHeight: 48,
    letterSpacing: 0,
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    fontFamily: 'Roboto-Light',
    fontSize: 17,
    lineHeight: 23,
    letterSpacing: 0,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  primaryBtn: {
    width: '100%',
    marginTop: 28,
    paddingVertical: 14,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontFamily: 'Roboto-Regular',
    fontSize: 17,
    lineHeight: 23,
    letterSpacing: 0,
    textAlign: 'center',
  },
});
