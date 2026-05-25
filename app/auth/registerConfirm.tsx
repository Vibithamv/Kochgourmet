import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  ActivityIndicator,
  Image,
  BackHandler,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useNavigation } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors } from '@/constants/theme';
import { userRegister } from '@/contexts/user_register';
import { useRegisterPending } from '@/contexts/RegisterPendingContext';
import { useGlobalAlert } from '@/contexts/AlertContext';
import { replaceLoginClearingAuthStack } from '@/utils/authNavigation';
import LanguageSelector from '@/components/LanguageSelector';
import ConfirmationCodeInput, { CONFIRMATION_CODE_LENGTH } from '@/components/ConfirmationCodeInput';

export default function RegisterConfirmScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const isDark = theme === 'dark' || theme === 'darkGreen';
  const primaryBtnTextColor = isDark ? '#0D1117' : '#FFFFFF';
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { pending, setPending } = useRegisterPending();
  const { showAlert } = useGlobalAlert();
  const userRegisterVal = userRegister();

  const [code, setCode] = useState('');
  const [errorKey, setErrorKey] = useState('');
  const [loadingConfirm, setLoadingConfirm] = useState(false);
  const [loadingResend, setLoadingResend] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const codeInputRef = useRef<TextInput>(null);

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
      const tId = setTimeout(() => codeInputRef.current?.focus(), 200);
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        Keyboard.dismiss();
        setPending(null);
        replaceLoginClearingAuthStack();
        return true;
      });
      return () => {
        clearTimeout(tId);
        sub.remove();
      };
    }, [setPending])
  );

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) => setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  if (!pending) {
    return null;
  }

  const handleBack = () => {
    Keyboard.dismiss();
    setPending(null);
    replaceLoginClearingAuthStack();
  };

  const handleCodeChange = (text: string) => {
    setCode(text);
    if (errorKey) setErrorKey('');
  };

  const handleResend = async () => {
    setLoadingResend(true);
    try {
      const result = await userRegisterVal.userRegisterResendOTPApi(pending.email);
      if (result.success) {
        showAlert(t('common.success'), t('auth.forgotPassword.checkEmailCode'));
        return;
      }
      showAlert(
        t('common.failed'),
        result.error.error.message || t('auth.forgotPassword.sendResetCodeFailed')
      );
    } catch (err) {
      console.error('Resend OTP error:', err);
      showAlert(t('common.error'), t('auth.forgotPassword.somethingWentWrong'));
    } finally {
      setLoadingResend(false);
    }
  };

  const handleConfirm = async () => {
    Keyboard.dismiss();
    if (code.length < CONFIRMATION_CODE_LENGTH) {
      setErrorKey('auth.confirmationCode.enterCode');
      return;
    }
    setErrorKey('');
    setLoadingConfirm(true);
    try {
      const result = await userRegisterVal.userRegisterConfirmationApi(
        pending.firstName,
        pending.lastName,
        pending.password,
        pending.email,
        code
      );
      if (result.success) {
        setPending(null);
        router.replace('/auth/registerSuccess');
        return;
      }
      showAlert(t('common.failed'), result.error.error.message);
    } catch (err) {
      console.error('Registration confirmation error:', err);
      showAlert(t('common.failed'), t('auth.register.registerFailed'));
    } finally {
      setLoadingConfirm(false);
    }
  };

  return (
    <LinearGradient
      colors={
        isDark
          ? ['#0D1117', '#14181F', '#1A1F28']
          : [colors.background.secondary, colors.background.primary, colors.background.secondary]
      }
      style={{ flex: 1 }}
    >
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={keyboardHeight}
        enableAutomaticScroll
      >
        <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) }]}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.background.secondary }]}
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel={t('auth.confirmationCode.cancel')}
          >
            <ArrowLeft size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]} numberOfLines={1}>
            {t('auth.confirmationCode.title')}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.hero}>
          <Image
            source={require('../../assets/images/kochgourmet-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.screenTitle, { color: colors.text.primary }]}>{t('auth.confirmationCode.title')}</Text>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            {t('auth.register.verifyEmailDescription', { email: pending.email })}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}>
          <Text style={[styles.label, { color: colors.text.primary }]}>
            {t('auth.forgotPassword.confirmationCode')}
          </Text>

          <ConfirmationCodeInput
            value={code}
            onChangeText={handleCodeChange}
            hasError={!!errorKey}
            inputRef={codeInputRef}
          />

          {errorKey ? <Text style={[styles.errorText, { color: colors.error }]}>{t(errorKey)}</Text> : null}

          <TouchableOpacity onPress={handleConfirm} disabled={loadingConfirm} activeOpacity={0.85} style={styles.primaryBtnWrap}>
            <LinearGradient
              colors={
                loadingConfirm
                  ? isDark
                    ? ['#3A4030', '#3A4030']
                    : [colors.interactive.disabled, colors.interactive.disabled]
                  : [colors.primary, colors.primaryDark]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              {loadingConfirm ? (
                <ActivityIndicator size="small" color={primaryBtnTextColor} />
              ) : (
                <Text style={[styles.buttonText, { color: primaryBtnTextColor }]}>
                  {t('auth.confirmationCode.confirm')}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleResend}
            disabled={loadingResend || loadingConfirm}
            activeOpacity={0.75}
            style={[
              styles.resendButton,
              {
                backgroundColor: colors.background.secondary,
                opacity: loadingResend || loadingConfirm ? 0.5 : 1,
              },
            ]}
          >
            {loadingResend ? (
              <ActivityIndicator size="small" color={colors.text.primary} />
            ) : (
              <Text style={[styles.resendText, { color: colors.text.primary }]}>{t('auth.confirmationCode.resend')}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.languageContainer}>
            <LanguageSelector />
          </View>
        </View>
      </KeyboardAwareScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  headerSpacer: {
    width: 44,
  },
  hero: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  logo: {
    width: '88%',
    maxWidth: 200,
    height: undefined,
    aspectRatio: 527 / 77,
    alignSelf: 'center',
    marginBottom: 10,
  },
  screenTitle: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    marginBottom: 12,
    letterSpacing: 0.1,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 8,
  },
  primaryBtnWrap: {
    marginTop: 20,
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
  resendButton: {
    marginTop: 14,
    minHeight: 50,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resendText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.2,
  },
  languageContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
});
