import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  ActivityIndicator,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { replaceLoginClearingAuthStack } from '@/utils/authNavigation';
import { ChevronRight, Mail, X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import LanguageSelector from '@/components/LanguageSelector';
import { userForgotPassword } from '@/hooks/userForgotPassword';
import { useGlobalAlert } from '@/contexts/AlertContext';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import {
  localizedAuthErrorMessage,
  messageFromApiError,
} from '@/utils/apiErrorMessage';

type FieldErrors = { [key: string]: string };

function validateEmail(email: string) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function isUserNotFoundMessage(message: unknown): boolean {
  const raw = typeof message === 'string' ? message : messageFromApiError(message, '');
  return raw === 'User not found.';
}

function buildEmailFieldErrors(email: string, t: TFunction): FieldErrors {
  const next: FieldErrors = {};
  if (!email) {
    next.email = t('auth.forgotPassword.enterEmail');
  } else if (!validateEmail(email)) {
    next.email = t('auth.forgotPassword.enterValidEmail');
  }
  return next;
}

type EmailStepProps = Readonly<{
  t: TFunction;
  email: string;
  setEmail: (v: string) => void;
  errors: FieldErrors;
  setErrors: React.Dispatch<React.SetStateAction<FieldErrors>>;
  generalError: string;
  loading: boolean;
  onSubmit: () => void;
}>;

function EmailStep({ t, email, setEmail, errors, setErrors, generalError, loading, onSubmit }: EmailStepProps) {
  const [focused, setFocused] = useState(false);
  const { theme } = useTheme();
  const colors = getColors(theme);

  const computeBorder = (): string => {
    if (errors.email) return '#EF4444';
    if (focused) return colors.primary;
    return colors.border.primary;
  };
  const borderColor = computeBorder();

  return (
    <>
      <View style={styles.fieldGroup}>
        <TextInput
          style={[
            styles.pillInput,
            styles.fieldInput,
            { backgroundColor: colors.background.card, borderColor, color: colors.text.primary },
          ]}
          value={email}
          onChangeText={(text) => { setEmail(text); setErrors((p) => ({ ...p, email: '' })); }}
          placeholder={t('auth.forgotPassword.email')}
          placeholderTextColor={colors.text.primary}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          returnKeyType="done"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={onSubmit}
        />
        {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
        {generalError ? <Text style={styles.generalError}>{generalError}</Text> : null}
      </View>

      <TouchableOpacity
        onPress={onSubmit}
        disabled={loading}
        activeOpacity={0.85}
        style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: loading ? 0.6 : 1 }]}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.primaryBtnText}>{t('auth.forgotPassword.submit')}</Text>}
      </TouchableOpacity>
    </>
  );
}

type LinkSentStepProps = Readonly<{
  t: TFunction;
  email: string;
  loadingResend: boolean;
  onResend: () => void;
  onSignIn: () => void;
}>;

function LinkSentStep({ t, email, loadingResend, onResend, onSignIn }: LinkSentStepProps) {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const isDark = theme === 'dark' || theme === 'darkGreen';

  return (
    <View style={styles.linkSentContent}>
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: colors.background.secondary, borderColor: colors.border.primary },
        ]}
      >
        <Mail size={32} color={colors.primary} strokeWidth={1.75} />
      </View>

      <Text style={[styles.linkSentTitle, { color: colors.text.primary }]}>
        {t('auth.forgotPassword.checkEmailTitle')}
      </Text>

      <Text style={[styles.linkSentBody, { color: colors.text.primary }]}>
        {t('auth.forgotPassword.resetLinkSent')}
      </Text>

      <Text style={[styles.emailHighlight, { color: colors.text.secondary }]}>
        {email}
      </Text>

      <Text style={[styles.linkSentFooter, { color: colors.text.tertiary }]}>
        {t('auth.register.verificationEmailFooter')}
      </Text>

      <TouchableOpacity
        onPress={onResend}
        disabled={loadingResend}
        activeOpacity={0.85}
        style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: loadingResend ? 0.6 : 1 }]}
      >
        {loadingResend ? (
          <ActivityIndicator color={isDark ? '#0D1117' : '#FFFFFF'} />
        ) : (
          <Text style={[styles.primaryBtnText, { color: isDark ? '#0D1117' : '#FFFFFF' }]}>
            {t('auth.forgotPassword.resendEmail')}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onSignIn}
        activeOpacity={0.7}
        style={[styles.secondaryBtn, { borderColor: colors.border.primary }]}
      >
        <Text style={[styles.secondaryBtnText, { color: colors.text.primary }]}>
          {t('auth.login.signIn')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ForgotPassword() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingResend, setLoadingResend] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [showLinkSent, setShowLinkSent] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const resetPassword = userForgotPassword();
  const { showAlert } = useGlobalAlert();

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) => setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const sendResetLink = async (options?: { isResend?: boolean }) => {
    const newErrors = buildEmailFieldErrors(email, t);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setGeneralError('');
    if (options?.isResend) {
      setLoadingResend(true);
    } else {
      setLoading(true);
    }

    try {
      const result = await resetPassword.forgotPassword(email);
      const showUserNotFoundAlert = () => {
        showAlert(t('common.alert'), t('auth.errors.userNotFound'), {
          buttonText: t('auth.login.signUp'),
          buttonCallback: () => router.replace('/auth/register'),
          secondaryButtonText: t('common.cancel'),
        });
      };

      if (result.success) {
        if (options?.isResend) {
          showAlert(t('common.success'), t('auth.forgotPassword.resetLinkResent'));
        } else {
          showAlert(t('common.success'), t('auth.forgotPassword.resetLinkSent'));
          setShowLinkSent(true);
        }
      } else if (result.status === 404 || isUserNotFoundMessage(result.error)) {
        showUserNotFoundAlert();
      } else {
        showAlert(
          t('common.failed'),
          localizedAuthErrorMessage(result.error, t, 'auth.forgotPassword.sendResetCodeFailed'),
        );
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      showAlert(t('common.error'), t('auth.forgotPassword.somethingWentWrong'));
    } finally {
      setLoading(false);
      setLoadingResend(false);
    }
  };

  const onClose = () => {
    if (router.canGoBack()) router.back();
    else replaceLoginClearingAuthStack();
  };

  const goLogin = () => replaceLoginClearingAuthStack();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={keyboardHeight}
        enableAutomaticScroll
      >
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            {t('auth.forgotPassword.resetPassword')}
          </Text>
          <TouchableOpacity
            style={[styles.closeBtn, { borderColor: colors.border.primary }]}
            onPress={onClose}
            hitSlop={8}
            activeOpacity={0.7}
          >
            <X size={18} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        {!showLinkSent ? (
          <Text style={[styles.subtitle, { color: colors.text.primary }]}>
            {t('auth.forgotPassword.enterEmailSubtitle')}
          </Text>
        ) : null}

        {showLinkSent ? (
          <LinkSentStep
            t={t}
            email={email}
            loadingResend={loadingResend}
            onResend={() => sendResetLink({ isResend: true })}
            onSignIn={goLogin}
          />
        ) : (
          <EmailStep
            t={t}
            email={email}
            setEmail={setEmail}
            errors={errors}
            setErrors={setErrors}
            generalError={generalError}
            loading={loading}
            onSubmit={() => sendResetLink()}
          />
        )}

        {!showLinkSent ? (
          <TouchableOpacity
            onPress={goLogin}
            activeOpacity={0.85}
            style={[styles.signupCard, { backgroundColor: colors.background.secondary }]}
          >
            <View style={styles.signupCardLeft}>
              <Text style={[styles.signupTitle, { color: colors.text.primary }]}>
                {t('auth.forgotPassword.rememberPassword')}
              </Text>
              <View style={styles.signupActionRow}>
                <View style={[styles.signupArrow, { backgroundColor: colors.primary }]}>
                  <ChevronRight size={14} color="#fff" strokeWidth={3} />
                </View>
                <Text style={[styles.signupActionText, { color: colors.text.primary }]}>
                  {t('auth.forgotPassword.loginNow')}
                </Text>
              </View>
            </View>
            <Image
              source={require('../../assets/images/chese.png')}
              style={styles.signupCheese}
              resizeMode="contain"
            />
          </TouchableOpacity>
        ) : null}

        <View style={styles.languageContainer}>
          <LanguageSelector />
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 90,
    paddingHorizontal: 26,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 35,
    lineHeight: 48,
    letterSpacing: 0,
    flex: 1,
    paddingRight: 12,
  },
  closeBtn: {
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
    marginTop: 20,
    marginBottom: 28,
  },
  fieldGroup: { marginBottom: 14 },
  pillInput: {
    borderWidth: 1,
    borderRadius: 9999,
    paddingHorizontal: 22,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    minHeight: 48,
  },
  fieldInput: {
    fontFamily: 'Roboto-Light',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 5,
    marginLeft: 22,
  },
  generalError: {
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 8,
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },
  primaryBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryBtnText: {
    color: '#fff',
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
  linkSentContent: {
    width: '100%',
    alignItems: 'center',
    marginTop: 12,
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
  linkSentTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 28,
    lineHeight: 36,
    textAlign: 'center',
    marginBottom: 16,
  },
  linkSentBody: {
    fontFamily: 'Roboto-Light',
    fontSize: 17,
    lineHeight: 23,
    textAlign: 'center',
    marginBottom: 12,
  },
  emailHighlight: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  linkSentFooter: {
    fontFamily: 'Roboto-Light',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  signupCard: {
    marginTop: 28,
    marginBottom: 30,
    borderRadius: 16,
    paddingVertical: 44,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'visible',
  },
  signupCardLeft: { flex: 1, gap: 14, paddingRight: 120 },
  signupTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
    lineHeight: 30,
    letterSpacing: 0,
  },
  signupActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  signupArrow: {
    width: 16,
    height: 16,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signupActionText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0,
  },
  signupCheese: {
    position: 'absolute',
    right: 12,
    top: 8,
    width: 130,
    height: 200,
  },
  languageContainer: {
    marginTop: 56,
    alignItems: 'center',
  },
});
