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
import { Eye, EyeOff, User, Mail, Lock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors } from '@/constants/theme';
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
  const isDark = theme === 'dark' || theme === 'darkGreen';
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
          <Text style={[styles.appName, { color: colors.text.primary }]}>{t('auth.register.title')}</Text>
          <Text style={[styles.tagline, { color: colors.text.tertiary }]}>{t('auth.register.subtitle')}</Text>
        </View>

        {/* Card */}
        <View style={[styles.card, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}>

          {/* First name */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.text.primary }]}>{t('auth.register.firstName')}<Text style={styles.required}> *</Text></Text>
            <InputRow icon={<User size={18} color={focusedField === 'firstName' ? colors.border.focus : colors.text.tertiary} />} focused={focusedField === 'firstName'} hasError={!!errors.firstName} colors={colors}>
              <TextInput
                style={[styles.input, { color: colors.text.primary }]}
                value={firstName}
                onChangeText={(text) => { setFirstName(text); setErrors({ ...errors, firstName: '' }); }}
                placeholder={t('auth.register.firstName')}
                placeholderTextColor={colors.text.placeholder}
                autoComplete="name"
                returnKeyType="next"
                onFocus={() => setFocusedField('firstName')}
                onBlur={() => setFocusedField('')}
                onSubmitEditing={() => lastNameRef.current?.focus()}
              />
            </InputRow>
            <RegisterFieldError messageKey={errors.firstName} t={t} />
          </View>

          {/* Last name */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.text.primary }]}>{t('auth.register.lastName')}<Text style={styles.required}> *</Text></Text>
            <InputRow icon={<User size={18} color={focusedField === 'lastName' ? colors.border.focus : colors.text.tertiary} />} focused={focusedField === 'lastName'} hasError={!!errors.lastName} colors={colors}>
              <TextInput
                ref={lastNameRef}
                style={[styles.input, { color: colors.text.primary }]}
                value={lastName}
                onChangeText={(text) => { setLastName(text); setErrors({ ...errors, lastName: '' }); }}
                placeholder={t('auth.register.lastName')}
                placeholderTextColor={colors.text.placeholder}
                autoComplete="name"
                returnKeyType="next"
                onFocus={() => setFocusedField('lastName')}
                onBlur={() => setFocusedField('')}
                onSubmitEditing={() => emailRef.current?.focus()}
              />
            </InputRow>
            <RegisterFieldError messageKey={errors.lastName} t={t} />
          </View>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.text.primary }]}>{t('auth.register.email')}<Text style={styles.required}> *</Text></Text>
            <InputRow icon={<Mail size={18} color={focusedField === 'email' ? colors.border.focus : colors.text.tertiary} />} focused={focusedField === 'email'} hasError={!!errors.email} colors={colors}>
              <TextInput
                ref={emailRef}
                style={[styles.input, { color: colors.text.primary }]}
                value={email}
                onChangeText={(text) => { setEmail(text); setErrors({ ...errors, email: '' }); }}
                placeholder={t('auth.register.email')}
                placeholderTextColor={colors.text.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="next"
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField('')}
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            </InputRow>
            <RegisterFieldError messageKey={errors.email} t={t} />
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.text.primary }]}>{t('auth.register.password')}<Text style={styles.required}> *</Text></Text>
            <InputRow icon={<Lock size={18} color={focusedField === 'password' ? colors.border.focus : colors.text.tertiary} />} focused={focusedField === 'password'} hasError={!!errors.pwField} colors={colors}>
              <TextInput
                ref={passwordRef}
                style={[styles.input, { color: colors.text.primary }]}
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
            </InputRow>
            <RegisterPwFieldError code={errors.pwField} t={t} />
          </View>

          {/* Confirm password */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.text.primary }]}>{t('auth.register.confirmPassword')}<Text style={styles.required}> *</Text></Text>
            <InputRow icon={<Lock size={18} color={focusedField === 'confirm' ? colors.border.focus : colors.text.tertiary} />} focused={focusedField === 'confirm'} hasError={!!errors.cpwField} colors={colors}>
              <TextInput
                ref={confirmRef}
                style={[styles.input, { color: colors.text.primary }]}
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
            </InputRow>
            <RegisterPwFieldError code={errors.cpwField} t={t} />
          </View>

          {generalError ? <Text style={styles.generalError}>{t(generalError)}</Text> : null}

          {/* Register button */}
          <TouchableOpacity onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
            <LinearGradient
              colors={loading ? (isDark ? ['#3A4030', '#3A4030'] : [colors.interactive.disabled, colors.interactive.disabled]) : [colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              {loading
                ? <ActivityIndicator size="small" color={colors.primary} />
                : <Text style={[styles.buttonText, { color: colors.text.onPrimary }]}>{t('auth.register.createAccount')}</Text>}
            </LinearGradient>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border.primary }]} />
            <Text style={[styles.dividerText, { color: colors.text.secondary }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border.primary }]} />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.text.secondary }]}>{t('auth.register.alreadyHaveAccount')} </Text>
            <TouchableOpacity onPress={() => replaceLoginClearingAuthStack()}>
              <Text style={[styles.linkText, { color: colors.primary }]}>{t('auth.register.signIn')}</Text>
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
    paddingBottom: 40,
  },

  // Hero
  hero: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 32,
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
    marginBottom: 12,
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
