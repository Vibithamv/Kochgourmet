import React, { useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
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
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { replaceLoginClearingAuthStack } from '@/utils/authNavigation';
import { Eye, EyeOff, X, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors, getTypography } from '@/constants/theme';
import { userRegister } from '@/contexts/user_register';
import { useRegisterPending } from '@/contexts/RegisterPendingContext';
import { useGlobalAlert } from '@/contexts/AlertContext';
import LanguageSelector from '@/components/LanguageSelector';
import {
  registerPasswordFieldErrorI18nKey,
  type RegisterPasswordFieldErrorCode,
} from '@/app/auth/registerPasswordFieldErrors';
import type { TFunction } from 'i18next';

type FieldErrors = { [key: string]: string };

const SIGNUP_PASSWORD_MAX_LENGTH = 20;

function validateEmailFormat(username: string) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(username);
}

function buildRegisterFieldErrors(
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  confirmPassword: string
): FieldErrors {
  const next: FieldErrors = {};
  if (!firstName) next.firstName = 'auth.register.enterFirstName';
  if (!lastName) next.lastName = 'auth.register.enterLastName';
  if (!email) next.email = 'auth.register.enterEmail';
  else if (!validateEmailFormat(email)) next.email = 'auth.register.enterValidEmail';
  if (!password) next.pwField = 'missing_pw';
  if (!confirmPassword) next.cpwField = 'missing_cpw';
  else if (password !== confirmPassword) next.cpwField = 'mismatch_cpw';
  return next;
}

type ShowAlertFn = (
  title: string,
  message: string,
  options?: { buttonText?: string; buttonCallback?: () => void; secondaryButtonText?: string }
) => void;

function alertRegisterFailure(message: string, t: TFunction, showAlert: ShowAlertFn): void {
  if (message === 'User already exists') {
    showAlert(t('common.alert'), t('auth.register.userAlreadyExists'), {
      buttonText: 'Login',
      buttonCallback: () => replaceLoginClearingAuthStack(),
      secondaryButtonText: 'Cancel',
    });
    return;
  }
  showAlert(t('common.alert'), message || t('auth.register.registerFailed'));
}

// ── Field helpers ────────────────────────────────────────────────────────────
function RegisterFieldError({ messageKey, t }: Readonly<{ messageKey?: string; t: TFunction }>) {
  if (!messageKey) return null;
  return <Text style={styles.errorText}>{t(messageKey)}</Text>;
}

function RegisterPwFieldError({ code, t }: Readonly<{ code?: string; t: TFunction }>) {
  if (!code) return null;
  return (
    <Text style={styles.errorText}>
      {t(registerPasswordFieldErrorI18nKey[code as RegisterPasswordFieldErrorCode])}
    </Text>
  );
}

function PasswordToggle({ visible, onToggle }: Readonly<{ visible: boolean; onToggle: () => void }>) {
  return (
    <TouchableOpacity style={styles.eyeButton} onPress={onToggle}>
      {visible ? <EyeOff size={18} color="#636B78" /> : <Eye size={18} color="#636B78" />}
    </TouchableOpacity>
  );
}

// ── Field row with focus state ───────────────────────────────────────────────
function InputRow({
  icon,
  children,
  focused,
  hasError,
  colors,
}: Readonly<{
  icon: React.ReactNode;
  children: React.ReactNode;
  focused: boolean;
  hasError: boolean;
  colors: ReturnType<typeof getColors>;
}>) {
  return (
    <View style={[
      styles.inputRow,
      { backgroundColor: colors.background.secondary, borderColor: focused ? colors.border.focus : colors.border.primary },
      hasError && styles.inputRowError,
    ]}>
      <View style={styles.inputIcon}>{icon}</View>
      {children}
    </View>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────
export default function RegisterScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Focus states
  const [focusedField, setFocusedField] = useState('');

  const userRegisterVal = userRegister();
  const { setPending } = useRegisterPending();
  const { showAlert } = useGlobalAlert();

  const lastNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) => setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const handleRegister = async () => {
    const newErrors = buildRegisterFieldErrors(firstName, lastName, email, password, confirmPassword);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    // With keyboardShouldPersistTaps="handled", tapping Create Account does not blur the
    // active field — keystrokes would keep going to the form behind the OTP dialog.
    Keyboard.dismiss();
    setFocusedField('');

    setGeneralError('');
    setLoading(true);
    const registerResult = await userRegisterVal.userRegisterApi(firstName, lastName, password, email);
    setLoading(false);
    if (registerResult.success) {
      requestAnimationFrame(() => {
        setPending({ firstName, lastName, email, password });
        router.push('/auth/registerConfirm');
      });
      return;
    }
    alertRegisterFailure(registerResult.error.error.message, t, showAlert);
  };

  const onClose = () => {
    if (router.canGoBack()) router.back();
    else replaceLoginClearingAuthStack();
  };

  const goLogin = () => replaceLoginClearingAuthStack();

  const fieldBorder = (key: string, hasError: boolean): string => {
    if (hasError) return '#EF4444';
    if (focusedField === key) return colors.primary;
    return colors.border.primary;
  };

  const renderPillInput = (props: React.ComponentProps<typeof TextInput> & { fieldKey: string; hasError: boolean }) => {
    const { fieldKey, hasError, ...inputProps } = props;
    return (
      <TextInput
        {...inputProps}
        style={[
          styles.pillInput,
          {
            backgroundColor: colors.background.card,
            borderColor: fieldBorder(fieldKey, hasError),
            color: colors.text.primary,
          },
        ]}
      />
    );
  };

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
            Registrieren
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
          {t('auth.register.subtitle')}
        </Text>

        {/* First name */}
        <View style={styles.fieldGroup}>
          {renderPillInput({
            fieldKey: 'firstName',
            hasError: !!errors.firstName,
            value: firstName,
            onChangeText: (text) => { setFirstName(text); setErrors({ ...errors, firstName: '' }); },
            placeholder: t('auth.register.firstName'),
            placeholderTextColor: colors.text.placeholder,
            autoComplete: 'name',
            returnKeyType: 'next',
            onFocus: () => setFocusedField('firstName'),
            onBlur: () => setFocusedField(''),
            onSubmitEditing: () => lastNameRef.current?.focus(),
          })}
          <RegisterFieldError messageKey={errors.firstName} t={t} />
        </View>

        {/* Last name */}
        <View style={styles.fieldGroup}>
          {renderPillInput({
            ref: lastNameRef as any,
            fieldKey: 'lastName',
            hasError: !!errors.lastName,
            value: lastName,
            onChangeText: (text) => { setLastName(text); setErrors({ ...errors, lastName: '' }); },
            placeholder: t('auth.register.lastName'),
            placeholderTextColor: colors.text.placeholder,
            autoComplete: 'name',
            returnKeyType: 'next',
            onFocus: () => setFocusedField('lastName'),
            onBlur: () => setFocusedField(''),
            onSubmitEditing: () => emailRef.current?.focus(),
          })}
          <RegisterFieldError messageKey={errors.lastName} t={t} />
        </View>

        {/* Email */}
        <View style={styles.fieldGroup}>
          {renderPillInput({
            ref: emailRef as any,
            fieldKey: 'email',
            hasError: !!errors.email,
            value: email,
            onChangeText: (text) => { setEmail(text); setErrors({ ...errors, email: '' }); },
            placeholder: t('auth.register.email'),
            placeholderTextColor: colors.text.placeholder,
            keyboardType: 'email-address',
            autoCapitalize: 'none',
            autoComplete: 'email',
            returnKeyType: 'next',
            onFocus: () => setFocusedField('email'),
            onBlur: () => setFocusedField(''),
            onSubmitEditing: () => passwordRef.current?.focus(),
          })}
          <RegisterFieldError messageKey={errors.email} t={t} />
        </View>

        {/* Password */}
        <View style={styles.fieldGroup}>
          <View
            style={[
              styles.pillInputWrap,
              {
                backgroundColor: colors.background.card,
                borderColor: fieldBorder('password', !!errors.pwField),
              },
            ]}
          >
            <TextInput
              ref={passwordRef}
              style={[styles.pillInputInline, { color: colors.text.primary }]}
              value={password}
              onChangeText={(text) => { setPassword(text); setErrors({ ...errors, pwField: '' }); }}
              placeholder={t('auth.register.password')}
              placeholderTextColor={colors.text.placeholder}
              secureTextEntry={!showPassword}
              autoComplete="new-password"
              maxLength={SIGNUP_PASSWORD_MAX_LENGTH}
              returnKeyType="next"
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField('')}
              onSubmitEditing={() => confirmRef.current?.focus()}
            />
            <PasswordToggle visible={showPassword} onToggle={() => setShowPassword(!showPassword)} />
          </View>
          <RegisterPwFieldError code={errors.pwField} t={t} />
        </View>

        {/* Confirm password */}
        <View style={styles.fieldGroup}>
          <View
            style={[
              styles.pillInputWrap,
              {
                backgroundColor: colors.background.card,
                borderColor: fieldBorder('confirm', !!errors.cpwField),
              },
            ]}
          >
            <TextInput
              ref={confirmRef}
              style={[styles.pillInputInline, { color: colors.text.primary }]}
              value={confirmPassword}
              onChangeText={(text) => { setConfirmPassword(text); setErrors({ ...errors, cpwField: '' }); }}
              placeholder={t('auth.register.confirmPassword')}
              placeholderTextColor={colors.text.placeholder}
              secureTextEntry={!showConfirmPassword}
              autoComplete="new-password"
              maxLength={SIGNUP_PASSWORD_MAX_LENGTH}
              returnKeyType="done"
              onFocus={() => setFocusedField('confirm')}
              onBlur={() => setFocusedField('')}
              onSubmitEditing={handleRegister}
            />
            <PasswordToggle visible={showConfirmPassword} onToggle={() => setShowConfirmPassword(!showConfirmPassword)} />
          </View>
          <RegisterPwFieldError code={errors.cpwField} t={t} />
        </View>

        {generalError ? <Text style={styles.generalError}>{t(generalError)}</Text> : null}

        {/* Register button */}
        <TouchableOpacity
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.85}
          style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: loading ? 0.6 : 1 }]}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.primaryBtnText}>{t('auth.register.createAccount')}</Text>}
        </TouchableOpacity>

        {/* Login card with cheese illustration */}
        <TouchableOpacity
          onPress={goLogin}
          activeOpacity={0.85}
          style={[styles.signupCard, { backgroundColor: colors.background.secondary }]}
        >
          <View style={styles.signupCardLeft}>
            <Text style={[styles.signupTitle, { color: colors.text.primary, fontFamily: getTypography(theme).fontFamily.display }]}>
              {t('auth.register.alreadyHaveAccount')}
            </Text>
            <View style={styles.signupActionRow}>
              <View style={[styles.signupArrow, { backgroundColor: colors.primary }]}>
                <ChevronRight size={14} color="#fff" strokeWidth={3} />
              </View>
              <Text style={[styles.signupActionText, { color: colors.text.primary }]}>
                {t('auth.register.signIn')}
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
    fontSize: 44,
    lineHeight: 54,
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
    marginBottom: 12,
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
