import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { router, useNavigation } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, Mail } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors } from '@/constants/theme';
import { userRegister } from '@/contexts/user_register';
import { useRegisterPending } from '@/contexts/RegisterPendingContext';
import { useGlobalAlert } from '@/contexts/AlertContext';
import { replaceLoginClearingAuthStack } from '@/utils/authNavigation';
import LanguageSelector from '@/components/LanguageSelector';
import { localizedAuthErrorMessage } from '@/utils/apiErrorMessage';

export default function RegisterConfirmScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const isDark = theme === 'dark' || theme === 'darkGreen';
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { pending, setPending } = useRegisterPending();
  const { showAlert } = useGlobalAlert();
  const userRegisterVal = userRegister();

  const [loadingResend, setLoadingResend] = useState(false);

  useLayoutEffect(() => {
    if (!pending) {
      router.replace('/auth/register');
    }
    // Mount only: avoid reacting when `pending` is cleared during swipe-back / replace.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return navigation.addListener('beforeRemove', () => {
      setPending(null);
    });
  }, [navigation, setPending]);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        setPending(null);
        replaceLoginClearingAuthStack();
        return true;
      });
      return () => sub.remove();
    }, [setPending])
  );

  if (!pending) {
    return null;
  }

  const handleBack = () => {
    setPending(null);
    replaceLoginClearingAuthStack();
  };

  const handleResend = async () => {
    setLoadingResend(true);
    try {
      const result = await userRegisterVal.userRegisterResendOTPApi(pending.email);
      if (result.success) {
        showAlert(t('common.success'), t('auth.register.verificationEmailResent'));
        return;
      }
      showAlert(
        t('common.failed'),
        localizedAuthErrorMessage(result.error, t, 'auth.register.resendEmailFailed'),
      );
    } catch (err) {
      console.error('Resend verification email error:', err);
      showAlert(t('common.error'), t('auth.register.resendEmailFailed'));
    } finally {
      setLoadingResend(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.topBar, { top: Math.max(insets.top, 12) + 8 }]}>
        <TouchableOpacity
          style={[styles.backBtn, { borderColor: colors.border.primary }]}
          onPress={handleBack}
          hitSlop={8}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('auth.confirmationCode.cancel')}
        >
          <ArrowLeft size={18} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 12) + 64,
            paddingBottom: Math.max(insets.bottom, 24) + 16,
          },
        ]}
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: colors.background.secondary, borderColor: colors.border.primary },
            ]}
          >
            <Mail size={32} color={colors.primary} strokeWidth={1.75} />
          </View>

          <Text style={[styles.title, { color: colors.text.primary }]}>
            {t('auth.register.verifyEmailTitle')}
          </Text>

          <Text style={[styles.body, { color: colors.text.primary }]}>
            {t('auth.register.verificationEmailSent')}
          </Text>

          <Text style={[styles.emailHighlight, { color: colors.text.secondary }]}>
            {pending.email}
          </Text>

          <Text style={[styles.footer, { color: colors.text.tertiary }]}>
            {t('auth.register.verificationEmailFooter')}
          </Text>

          <TouchableOpacity
            onPress={handleResend}
            disabled={loadingResend}
            activeOpacity={0.85}
            style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: loadingResend ? 0.6 : 1 }]}
          >
            {loadingResend ? (
              <ActivityIndicator color={isDark ? '#0D1117' : '#FFFFFF'} />
            ) : (
              <Text style={[styles.primaryBtnText, { color: isDark ? '#0D1117' : '#FFFFFF' }]}>
                {t('auth.register.resendEmail')}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleBack}
            activeOpacity={0.7}
            style={[styles.secondaryBtn, { borderColor: colors.border.primary }]}
          >
            <Text style={[styles.secondaryBtnText, { color: colors.text.primary }]}>
              {t('auth.register.signIn')}
            </Text>
          </TouchableOpacity>

          <View style={styles.languageContainer}>
            <LanguageSelector />
          </View>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 26,
  },
  topBar: {
    position: 'absolute',
    left: 26,
    zIndex: 10,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    alignItems: 'center',
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
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
    width: '100%',
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  body: {
    fontFamily: 'Roboto-Light',
    fontSize: 17,
    lineHeight: 23,
    letterSpacing: 0,
    textAlign: 'center',
    width: '100%',
    marginBottom: 12,
  },
  emailHighlight: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    width: '100%',
    marginBottom: 20,
  },
  footer: {
    fontFamily: 'Roboto-Light',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
    textAlign: 'center',
    width: '100%',
    marginBottom: 28,
  },
  primaryBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 17,
    lineHeight: 23,
    letterSpacing: 0,
    textAlign: 'center',
  },
  secondaryBtn: {
    width: '100%',
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 9999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontFamily: 'Roboto-Light',
    fontSize: 17,
    lineHeight: 23,
    letterSpacing: 0,
    textAlign: 'center',
  },
  languageContainer: {
    marginTop: 32,
    alignItems: 'center',
    width: '100%',
  },
});
