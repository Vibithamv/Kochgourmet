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
import { Eye, EyeOff, X, ChevronRight } from 'lucide-react-native';
import ConfirmationCodeInput, { CONFIRMATION_CODE_LENGTH } from '@/components/ConfirmationCodeInput';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors, getTypography } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import LanguageSelector from '@/components/LanguageSelector';
import { userForgotPassword } from '@/hooks/userForgotPassword';
import { useGlobalAlert } from '@/contexts/AlertContext';
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
            { backgroundColor: colors.background.card, borderColor, color: colors.text.primary },
          ]}
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

  const computePasswordBorder = (): string => {
    if (errors.password) return '#EF4444';
    if (passwordFocused) return colors.primary;
    return colors.border.primary;
  };

  return (
    <>
      {/* Email (read-only) */}
      <View style={styles.fieldGroup}>
        <TextInput
          style={[
            styles.pillInput,
            { backgroundColor: colors.background.card, borderColor: colors.border.primary, color: colors.text.tertiary },
          ]}
          value={email}
          editable={false}
          placeholderTextColor={colors.text.placeholder}
        />
      </View>

      {/* New password */}
      <View style={styles.fieldGroup}>
        <View
          style={[
            styles.pillInputWrap,
            { backgroundColor: colors.background.card, borderColor: computePasswordBorder() },
          ]}
        >
          <TextInput
            ref={newPasswordRef}
            style={[styles.pillInputInline, { color: colors.text.primary }]}
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
          <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
            {showPassword ? <EyeOff size={18} color={colors.text.tertiary} /> : <Eye size={18} color={colors.text.tertiary} />}
          </TouchableOpacity>
        </View>
        {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
      </View>

      {/* Confirmation code */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: colors.text.tertiary }]}>
          {t('auth.forgotPassword.confirmationCode')}
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

      <TouchableOpacity
        onPress={onResetPassword}
        disabled={loading}
        activeOpacity={0.85}
        style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: loading ? 0.6 : 1 }]}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.primaryBtnText}>{t('auth.forgotPassword.resetPassword')}</Text>}
      </TouchableOpacity>
    </>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────
export default function ForgotPassword() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [showResetFields, setShowResetFields] = useState(false);
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
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text.primary, fontFamily: getTypography(theme).fontFamily.display }]}>
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

        <Text style={[styles.subtitle, { color: colors.text.primary }]}>
          {showResetFields
            ? t('auth.forgotPassword.checkEmailCode')
            : 'Gib deine E-Mail-Adresse ein. Wir senden dir einen Bestätigungscode, um dein Passwort zurückzusetzen.'}
        </Text>

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

        {/* Login card with cheese illustration */}
        <TouchableOpacity
          onPress={goLogin}
          activeOpacity={0.85}
          style={[styles.signupCard, { backgroundColor: colors.background.secondary }]}
        >
          <View style={styles.signupCardLeft}>
            <Text style={[styles.signupTitle, { color: colors.text.primary, fontFamily: getTypography(theme).fontFamily.display }]}>
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

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 38,
    lineHeight: 48,
    letterSpacing: -0.5,
    flex: 1,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    lineHeight: 24,
    marginBottom: 28,
  },

  // Fields
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
  pillInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 9999,
    paddingRight: 16,
    minHeight: 48,
  },
  pillInputInline: {
    flex: 1,
    paddingHorizontal: 22,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
  },
  eyeButton: { padding: 6 },
  fieldLabel: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 22,
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

  // Primary button
  primaryBtn: {
    paddingVertical: 14,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
  },

  // Sign-in card with cheese illustration (image overflows slightly at bottom)
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
    fontSize: 24,
    lineHeight: 30,
  },
  signupActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  signupArrow: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signupActionText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
  },
  signupCheese: {
    position: 'absolute',
    right: 12,
    top: 8,
    width: 130,
    height: 200,
  },

  // Language
  languageContainer: {
    marginTop: 56,
    alignItems: 'center',
  },
});
