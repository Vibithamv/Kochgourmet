import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, BackHandler, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors } from '@/constants/theme';
import { replaceLoginClearingAuthStack } from '@/utils/authNavigation';
import LanguageSelector from '@/components/LanguageSelector';
import AsseteraLogo from '@/components/AsseteraLogo';

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
    <LinearGradient
      colors={
        theme === 'dark' || theme === 'darkGreen'
          ? ['#0D1117', '#14181F', '#1A1F28']
          : [colors.background.secondary, colors.background.primary, colors.background.secondary]
      }
      style={styles.root}
    >
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
          <View style={styles.logo}>
            <AsseteraLogo width="100%" height="100%" />
          </View>
          <View
            style={[
              styles.iconRing,
              { backgroundColor: colors.background.secondary, borderColor: colors.success },
            ]}
          >
            <Check size={40} color={colors.success} strokeWidth={2.5} />
          </View>
          <Text style={[styles.title, { color: colors.text.primary }]}>{t('auth.register.successScreenTitle')}</Text>
          <Text style={[styles.body, { color: colors.text.secondary }]}>{t('auth.register.registerSuccess')}</Text>

          <View style={styles.buttonWrap}>
            <TouchableOpacity onPress={goLogin} activeOpacity={0.85}>
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
              >
                <Text style={[styles.buttonText, { color: colors.text.onPrimary }]}>{t('auth.login.signIn')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
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
    aspectRatio: 243 / 46,
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
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    letterSpacing: -0.4,
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  buttonWrap: {
    width: '100%',
    marginTop: 28,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.2,
  },
  languageContainer: {
    marginTop: 28,
    alignItems: 'center',
    width: '100%',
  },
});
