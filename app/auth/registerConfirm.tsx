import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
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
import { localizedAuthErrorMessage } from '@/utils/apiErrorMessage';

export default function RegisterConfirmScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = getColors(theme);
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
  const keyboardVisibleRef = useRef(false);
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
        if (keyboardVisibleRef.current) {
          Keyboard.dismiss();
          codeInputRef.current?.blur();
          return true;
        }
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
    const show = Keyboard.addListener('keyboardDidShow', (e) => {
      keyboardVisibleRef.current = true;
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      keyboardVisibleRef.current = false;
      setKeyboardHeight(0);
    });
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
        localizedAuthErrorMessage(result.error, t, 'auth.forgotPassword.sendResetCodeFailed'),
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
      showAlert(
        t('common.failed'),
        localizedAuthErrorMessage(result.error, t, 'auth.register.registerFailed'),
      );
    } catch (err) {
      console.error('Registration confirmation error:', err);
      showAlert(t('common.failed'), t('auth.register.registerFailed'));
    } finally {
      setLoadingConfirm(false);
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
        extraScrollHeight={keyboardHeight}
        enableAutomaticScroll
      >
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            {t('auth.confirmationCode.title')}
          </Text>

          <Text style={[styles.subtitle, { color: colors.text.primary }]}>
            {t('auth.register.verifyEmailDescription', { email: pending.email })}
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.text.primary }]}>
              {t('auth.forgotPassword.confirmationCode')}
            </Text>

            <ConfirmationCodeInput
              value={code}
              onChangeText={handleCodeChange}
              hasError={!!errorKey}
              inputRef={codeInputRef}
            />

            {errorKey ? (
              <Text style={[styles.errorText, { color: colors.error }]}>{t(errorKey)}</Text>
            ) : null}
          </View>

          <TouchableOpacity
            onPress={handleConfirm}
            disabled={loadingConfirm}
            activeOpacity={0.85}
            style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: loadingConfirm ? 0.6 : 1 }]}
          >
            {loadingConfirm ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>{t('auth.confirmationCode.confirm')}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleResend}
            disabled={loadingResend || loadingConfirm}
            activeOpacity={0.7}
            style={[
              styles.resendBtn,
              {
                borderColor: colors.border.primary,
                opacity: loadingResend || loadingConfirm ? 0.5 : 1,
              },
            ]}
          >
            {loadingResend ? (
              <ActivityIndicator size="small" color={colors.text.primary} />
            ) : (
              <Text style={[styles.resendText, { color: colors.text.primary }]}>
                {t('auth.confirmationCode.resend')}
              </Text>
            )}
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
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 35,
    lineHeight: 48,
    letterSpacing: 0,
    textAlign: 'center',
    width: '100%',
    marginBottom: 12,
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
  subtitle: {
    fontFamily: 'Roboto-Light',
    fontSize: 17,
    lineHeight: 23,
    letterSpacing: 0,
    textAlign: 'center',
    width: '100%',
    marginBottom: 28,
  },
  fieldGroup: { width: '100%', marginBottom: 8 },
  label: {
    fontFamily: 'Roboto-Light',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0,
    textAlign: 'left',
    alignSelf: 'flex-start',
    marginBottom: 14,
  },
  errorText: {
    fontFamily: 'Roboto-Light',
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  primaryBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  primaryBtnText: {
    color: '#fff',
    fontFamily: 'Roboto-Regular',
    fontSize: 17,
    lineHeight: 23,
    letterSpacing: 0,
    textAlign: 'center',
  },
  resendBtn: {
    width: '100%',
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 9999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resendText: {
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
