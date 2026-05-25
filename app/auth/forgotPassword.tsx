import React, { useEffect, useRef, useState } from 'react';
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
import { Eye, EyeOff, Mail, Lock } from 'lucide-react-native';
import ConfirmationCodeInput, { CONFIRMATION_CODE_LENGTH } from '@/components/ConfirmationCodeInput';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import LanguageSelector from '@/components/LanguageSelector';
import { userForgotPassword } from '@/hooks/userForgotPassword';
import { useGlobalAlert } from '@/contexts/AlertContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

type FieldErrors = { [key: string]: string };

function validateEmail(email: string) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
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

function buildResetFieldErrors(password: string, confirmationCode: string, t: TFunction): FieldErrors {
  const next: FieldErrors = {};
  if (!password) next.password = t('auth.forgotPassword.enterNewPassword');
  if (confirmationCode.length < CONFIRMATION_CODE_LENGTH) {
    next.confirmationCode = t('auth.confirmationCode.enterCode');
  }
  return next;
}

// ── Step 1: Email ────────────────────────────────────────────────────────────
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
  const isDark = theme === 'dark' || theme === 'darkGreen';
  return (
    <>
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: colors.text.primary }]}>
          {t('auth.forgotPassword.email')}<Text style={styles.required}> *</Text>
        </Text>
        <View style={[styles.inputRow, { backgroundColor: colors.background.secondary, borderColor: focused ? colors.border.focus : colors.border.primary }, errors.email ? styles.inputRowError : null]}>
          <Mail size={18} color={focused ? colors.border.focus : colors.text.tertiary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: colors.text.primary }]}
            value={email}
            onChangeText={(text) => { setEmail(text); setErrors((p) => ({ ...p, email: '' })); }}
            placeholder={t('auth.forgotPassword.email')}
            placeholderTextColor={colors.text.placeholder}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            returnKeyType="done"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onSubmitEditing={onSubmit}
          />
        </View>
        {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
        {generalError ? <Text style={styles.generalError}>{generalError}</Text> : null}
      </View>

      <TouchableOpacity onPress={onSubmit} disabled={loading} activeOpacity={0.85}>
        <LinearGradient
          colors={loading ? (isDark ? ['#3A4030', '#3A4030'] : [colors.interactive.disabled, colors.interactive.disabled]) : [colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.button}
        >
          {loading
            ? <ActivityIndicator size="small" color={colors.primary} />
            : <Text style={[styles.buttonText, { color: colors.text.onPrimary }]}>{t('auth.forgotPassword.submit')}</Text>}
        </LinearGradient>
      </TouchableOpacity>
    </>
  );
}

// ── Step 2: Reset ────────────────────────────────────────────────────────────
type ResetStepProps = Readonly<{
  t: TFunction;
  email: string;
  password: string;
  setPassword: (v: string) => void;
  confirmationCode: string;
  setConfirmationCode: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  errors: FieldErrors;
  setErrors: React.Dispatch<React.SetStateAction<FieldErrors>>;
  generalError: string;
  loading: boolean;
  onResetPassword: () => void;
  newPasswordRef: React.RefObject<TextInput | null>;
  confirmationCodeRef: React.RefObject<TextInput | null>;
}>;

function ResetStep({
  t, email, password, setPassword, confirmationCode, setConfirmationCode,
  showPassword, setShowPassword, errors, setErrors, generalError, loading,
  onResetPassword, newPasswordRef, confirmationCodeRef,
}: ResetStepProps) {
  const [passwordFocused, setPasswordFocused] = useState(false);
  const { theme } = useTheme();
  const colors = getColors(theme);
  const isDark = theme === 'dark' || theme === 'darkGreen';

  const disabledColors = isDark
    ? ['#3A4030', '#3A4030'] as const
    : [colors.interactive.disabled, colors.interactive.disabled] as const;

  return (
    <>
      {/* Email (read-only) */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: colors.text.primary }]}>{t('auth.forgotPassword.email')}</Text>
        <View style={[styles.inputRow, { backgroundColor: colors.background.secondary, borderColor: colors.border.primary }]}>
          <Mail size={18} color={colors.text.tertiary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: colors.text.tertiary }]}
            value={email}
            editable={false}
            placeholderTextColor={colors.text.placeholder}
          />
        </View>
      </View>

      {/* New password */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: colors.text.primary }]}>
          {t('auth.forgotPassword.newPassword')}<Text style={styles.required}> *</Text>
        </Text>
        <View style={[styles.inputRow, { backgroundColor: colors.background.secondary, borderColor: passwordFocused ? colors.border.focus : colors.border.primary }, errors.password ? styles.inputRowError : null]}>
          <Lock size={18} color={passwordFocused ? colors.border.focus : colors.text.tertiary} style={styles.inputIcon} />
          <TextInput
            ref={newPasswordRef}
            style={[styles.input, { color: colors.text.primary }]}
            value={password}
            onChangeText={(text) => { setPassword(text); setErrors((p) => ({ ...p, password: '' })); }}
            placeholder={t('auth.forgotPassword.newPassword')}
            placeholderTextColor={colors.text.placeholder}
            secureTextEntry={!showPassword}
            returnKeyType="next"
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
            onSubmitEditing={() => confirmationCodeRef.current?.focus()}
          />
          <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
            {showPassword ? <EyeOff size={18} color={colors.text.tertiary} /> : <Eye size={18} color={colors.text.tertiary} />}
          </TouchableOpacity>
        </View>
        {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
      </View>

      {/* Confirmation code */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: colors.text.primary }]}>
          {t('auth.forgotPassword.confirmationCode')}<Text style={styles.required}> *</Text>
        </Text>
        <ConfirmationCodeInput
          value={confirmationCode}
          onChangeText={(text) => {
            setConfirmationCode(text);
            setErrors((p) => ({ ...p, confirmationCode: '' }));
          }}
          hasError={!!errors.confirmationCode}
          inputRef={confirmationCodeRef}
        />
        {errors.confirmationCode ? <Text style={styles.errorText}>{errors.confirmationCode}</Text> : null}
        {generalError ? <Text style={styles.generalError}>{generalError}</Text> : null}
      </View>

      <TouchableOpacity onPress={onResetPassword} disabled={loading} activeOpacity={0.85}>
        <LinearGradient
          colors={loading ? disabledColors : [colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.button}
        >
          {loading
            ? <ActivityIndicator size="small" color={colors.primary} />
            : <Text style={[styles.buttonText, { color: colors.text.onPrimary }]}>{t('auth.forgotPassword.resetPassword')}</Text>}
        </LinearGradient>
      </TouchableOpacity>
    </>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────
export default function ForgotPassword() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const isDark = theme === 'dark' || theme === 'darkGreen';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [showResetFields, setShowResetFields] = useState(false);
  const [tenantID, setTenantID] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const resetPassword = userForgotPassword();
  const { showAlert } = useGlobalAlert();
  const newPasswordRef = useRef<TextInput>(null);
  const confirmationCodeRef = useRef<TextInput>(null);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) => setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  useEffect(() => {
    const load = async () => setTenantID((await AsyncStorage.getItem('tenantID')) || '');
    load();
  }, []);

  const onSubmit = async () => {
    const newErrors = buildEmailFieldErrors(email, t);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setGeneralError('');
    setLoading(true);
    try {
      const result = await resetPassword.forgotPassword('FORGOT_PASSWORD', email, '', '');
      if (result.success) {
        if (result.data.data.message === 'User not found.') {
          showAlert(t('common.alert'), t('auth.forgotPassword.emailNotRegistered'), {
            buttonText: 'Signup',
            buttonCallback: () => router.replace('/auth/register'),
            secondaryButtonText: 'Cancel',
          });
          return;
        }
        showAlert(t('common.alert'), t('auth.forgotPassword.checkEmailCode'));
        setShowResetFields(true);
      } else {
        showAlert(t('common.failed'), result.error.error.message || t('auth.forgotPassword.sendResetCodeFailed'));
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      showAlert(t('common.error'), t('auth.forgotPassword.somethingWentWrong') || t('common.errorMessage'));
    } finally {
      setLoading(false);
    }
  };

  const onResetPassword = async () => {
    const newErrors = buildResetFieldErrors(password, confirmationCode, t);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setGeneralError('');
    setLoading(true);
    try {
      const result = await resetPassword.forgotPassword('CONFIRM_FORGOT_PASSWORD', email, password, confirmationCode);
      if (result.success) {
        showAlert(t('common.success'), t('auth.forgotPassword.passwordResetSuccessfully'), {
          buttonText: t('auth.login.signIn') || 'Login',
          buttonCallback: () => replaceLoginClearingAuthStack(),
        });
      } else {
        if (result.error.error.message === 'Password does not meet requirements') {
          showAlert(t('common.failed'), t('profile.validationError'));
          return;
        }
        showAlert(t('common.failed'), result.error.error.message || t('auth.forgotPassword.invalidCodeOrPassword'));
      }
    } catch (err) {
      console.error('Reset password error:', err);
      showAlert(t('common.error'), t('auth.forgotPassword.somethingWentWrong') || t('common.errorMessage'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={isDark ? ['#0D1117', '#14181F', '#1A1F28'] : [colors.background.secondary, colors.background.primary, colors.background.secondary]} style={{ flex: 1 }}>
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        enableOnAndroid={true}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={keyboardHeight}
        enableAutomaticScroll={true}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Image
            source={require('../../assets/images/kochgourmet-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          {/* <Text style={[styles.appName, { color: colors.text.primary }]}>{tenantID || 'OwnItNow'}</Text> */}
          <Text style={[styles.tagline, { color: colors.text.tertiary }]}>{t('auth.forgotPassword.resetPassword')}</Text>
        </View>

        {/* Card */}
        <View style={[styles.card, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}>
          {showResetFields ? (
            <ResetStep
              t={t}
              email={email}
              password={password}
              setPassword={setPassword}
              confirmationCode={confirmationCode}
              setConfirmationCode={setConfirmationCode}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              errors={errors}
              setErrors={setErrors}
              generalError={generalError}
              loading={loading}
              onResetPassword={onResetPassword}
              newPasswordRef={newPasswordRef}
              confirmationCodeRef={confirmationCodeRef}
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
              onSubmit={onSubmit}
            />
          )}

          {/* Divider */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border.primary }]} />
            <Text style={[styles.dividerText, { color: colors.text.secondary }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border.primary }]} />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.text.secondary }]}>{t('auth.forgotPassword.rememberPassword')} </Text>
            <TouchableOpacity onPress={() => replaceLoginClearingAuthStack()}>
              <Text style={[styles.linkText, { color: colors.primary }]}>{t('auth.forgotPassword.loginNow')}</Text>
            </TouchableOpacity>
          </View>

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
    justifyContent: 'center',
    paddingVertical: 24,
    paddingBottom: 40,
  },

  // Hero
  hero: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  logo: {
    width: '88%',
    maxWidth: 200,
    height: undefined,
    aspectRatio: 527 / 77,
    alignSelf: 'center',
    marginBottom: 0,
  },
  appName: {
    fontSize: 26,
    fontFamily: 'Inter-Bold',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 6,
    textAlign: 'center',
  },

  // Card
  card: {
    alignSelf: 'center',
    width: '90%',
    maxWidth: 440,
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
  },

  // Fields
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    marginBottom: 8,
    letterSpacing: 0.1,
  },
  required: {
    color: '#EF4444',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
  },
  inputRowFocused: {
  },
  inputRowError: {
    borderColor: '#EF4444',
  },
  inputIcon: {
    marginLeft: 14,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
  },
  eyeButton: {
    padding: 14,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 5,
  },
  generalError: {
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 8,
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },

  // Button
  button: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.2,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginHorizontal: 12,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  linkText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },

  // Language
  languageContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
});
