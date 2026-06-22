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
  Switch,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { replaceLoginClearingAuthStack } from '@/utils/authNavigation';
import { Check, Eye, EyeOff, X, ChevronRight } from 'lucide-react-native';
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
import {
  formatPasswordRequirementsAlertMessage,
  getUnmetPasswordRequirementCodes,
  isPasswordRequirementsError,
  isPasswordRequirementsMet,
} from '@/utils/passwordValidation';
import {
  getAuthErrorI18nKey,
  localizedAuthErrorMessage,
  messageFromApiError,
} from '@/utils/apiErrorMessage';
import type { TFunction } from 'i18next';

type FieldErrors = { [key: string]: string };

const SIGNUP_PASSWORD_MAX_LENGTH = 20;

function validateEmailFormat(username: string) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(username);
}

type RegisterFormValues = {
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
};

function buildRegisterFieldErrors(values: RegisterFormValues): FieldErrors {
  const next: FieldErrors = {};
  if (!values.firstName) next.firstName = 'auth.register.enterFirstName';
  if (!values.lastName) next.lastName = 'auth.register.enterLastName';
  if (!values.displayName.trim()) next.displayName = 'auth.register.enterDisplayName';
  if (!values.email) next.email = 'auth.register.enterEmail';
  else if (!validateEmailFormat(values.email)) next.email = 'auth.register.enterValidEmail';
  if (!values.password) next.pwField = 'missing_pw';
  if (!values.confirmPassword) next.cpwField = 'missing_cpw';
  else if (values.password !== values.confirmPassword) next.cpwField = 'mismatch_cpw';
  if (!values.acceptTerms) next.acceptTerms = 'auth.register.acceptTermsRequired';
  if (!values.acceptPrivacy) next.acceptPrivacy = 'auth.register.acceptPrivacyRequired';
  return next;
}

type ShowAlertFn = (
  title: string,
  message: string,
  options?: { buttonText?: string; buttonCallback?: () => void; secondaryButtonText?: string }
) => void;

function alertRegisterFailure(
  error: unknown,
  password: string,
  t: TFunction,
  showAlert: ShowAlertFn
): void {
  const message = messageFromApiError(error, '');

  if (getAuthErrorI18nKey(error) === 'auth.register.userAlreadyExists') {
    showAlert(t('common.alert'), t('auth.register.userAlreadyExists'), {
      buttonText: t('auth.register.signIn'),
      buttonCallback: () => replaceLoginClearingAuthStack(),
      secondaryButtonText: t('common.cancel'),
    });
    return;
  }
  if (isPasswordRequirementsError(message)) {
    const unmet = getUnmetPasswordRequirementCodes(password);
    showAlert(
      t('auth.register.passwordRequirementsTitle'),
      unmet.length > 0
        ? formatPasswordRequirementsAlertMessage(unmet, t)
        : t('profile.validationError')
    );
    return;
  }
  showAlert(
    t('common.alert'),
    localizedAuthErrorMessage(error, t, 'auth.register.registerFailed')
  );
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

function RegisterCheckbox({
  checked,
  onToggle,
  colors,
  isDark,
}: Readonly<{
  checked: boolean;
  onToggle: () => void;
  colors: ReturnType<typeof getColors>;
  isDark: boolean;
}>) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      hitSlop={8}
      activeOpacity={0.7}
      style={[
        styles.checkbox,
        { borderColor: colors.border.primary },
        checked && { backgroundColor: colors.primary, borderColor: colors.primary },
      ]}
    >
      {checked ? <Check size={14} color={isDark ? '#0D1117' : '#FFFFFF'} strokeWidth={3} /> : null}
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
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [newsletterDaily, setNewsletterDaily] = useState(false);
  const [newsletterWeekly, setNewsletterWeekly] = useState(false);
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
  const displayNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) => setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const handleRegister = async () => {
    const newErrors = buildRegisterFieldErrors({
      firstName,
      lastName,
      displayName,
      email,
      password,
      confirmPassword,
      acceptTerms,
      acceptPrivacy,
    });
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    if (!isPasswordRequirementsMet(password)) {
      const unmet = getUnmetPasswordRequirementCodes(password);
      showAlert(
        t('auth.register.passwordRequirementsTitle'),
        formatPasswordRequirementsAlertMessage(unmet, t)
      );
      return;
    }

    // With keyboardShouldPersistTaps="handled", tapping Create Account does not blur the
    // active field — keystrokes would keep going to the form behind the OTP dialog.
    Keyboard.dismiss();
    setFocusedField('');

    setGeneralError('');
    setLoading(true);
    const registerResult = await userRegisterVal.userRegisterApi({
      email: email.trim(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      displayName: displayName.trim(),
      acceptTerms,
      acceptPrivacy,
      newsletterDaily,
      newsletterWeekly,
    });
    setLoading(false);
    if (registerResult.success) {
      setPending({ email });
      showAlert(t('common.success'), t('auth.register.verificationEmailSent'));
      requestAnimationFrame(() => {
        router.push('/auth/registerConfirm');
      });
      return;
    }
    
    alertRegisterFailure(registerResult.error, password, t, showAlert);
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
          styles.fieldInput,
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
          <Text style={[styles.title, { color: colors.text.primary }]}>
            {t('auth.register.title')}
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
            placeholderTextColor: colors.text.primary,
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
            placeholderTextColor: colors.text.primary,
            autoComplete: 'name',
            returnKeyType: 'next',
            onFocus: () => setFocusedField('lastName'),
            onBlur: () => setFocusedField(''),
            onSubmitEditing: () => displayNameRef.current?.focus(),
          })}
          <RegisterFieldError messageKey={errors.lastName} t={t} />
        </View>

        {/* Display name */}
        <View style={styles.fieldGroup}>
          {renderPillInput({
            ref: displayNameRef as React.Ref<TextInput>,
            fieldKey: 'displayName',
            hasError: !!errors.displayName,
            value: displayName,
            onChangeText: (text) => {
              setDisplayName(text.replace(/\s/g, ''));
              setErrors({ ...errors, displayName: '' });
            },
            placeholder: t('auth.register.displayName'),
            placeholderTextColor: colors.text.primary,
            autoCapitalize: 'none',
            autoComplete: 'username',
            returnKeyType: 'next',
            onFocus: () => setFocusedField('displayName'),
            onBlur: () => setFocusedField(''),
            onSubmitEditing: () => emailRef.current?.focus(),
          })}
          <RegisterFieldError messageKey={errors.displayName} t={t} />
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
            placeholderTextColor: colors.text.primary,
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
              style={[styles.pillInputInline, styles.fieldInput, { color: colors.text.primary }]}
              value={password}
              onChangeText={(text) => { setPassword(text); setErrors({ ...errors, pwField: '' }); }}
              placeholder={t('auth.register.password')}
              placeholderTextColor={colors.text.primary}
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
              style={[styles.pillInputInline, styles.fieldInput, { color: colors.text.primary }]}
              value={confirmPassword}
              onChangeText={(text) => { setConfirmPassword(text); setErrors({ ...errors, cpwField: '' }); }}
              placeholder={t('auth.register.confirmPassword')}
              placeholderTextColor={colors.text.primary}
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

        {/* Newsletter */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
            {t('auth.register.newsletterSection')}
          </Text>
          <Text style={[styles.sectionDesc, { color: colors.text.secondary }]}>
            {t('auth.register.newsletterDesc')}
          </Text>
          <View style={styles.toggleRow}>
            <View style={styles.toggleSwitchWrap}>
              <View style={styles.toggleSwitchScale}>
                <Switch
                  value={newsletterWeekly}
                  onValueChange={setNewsletterWeekly}
                  trackColor={{ false: colors.border.primary, true: colors.primary }}
                  ios_backgroundColor={colors.border.primary}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
            <Text style={[styles.toggleLabel, { color: colors.text.primary }]}>
              {t('profile.profileScreen.weeklyNewsletter')}
            </Text>
          </View>
          <View style={styles.toggleRow}>
            <View style={styles.toggleSwitchWrap}>
              <View style={styles.toggleSwitchScale}>
                <Switch
                  value={newsletterDaily}
                  onValueChange={setNewsletterDaily}
                  trackColor={{ false: colors.border.primary, true: colors.primary }}
                  ios_backgroundColor={colors.border.primary}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
            <Text style={[styles.toggleLabel, { color: colors.text.primary }]}>
              {t('profile.profileScreen.dailyNewsletter')}
            </Text>
          </View>
        </View>

        {/* Terms & privacy */}
        <View style={styles.consentSection}>
          <View style={styles.checkboxRow}>
            <RegisterCheckbox
              checked={acceptTerms}
              onToggle={() => {
                setAcceptTerms((prev) => !prev);
                setErrors({ ...errors, acceptTerms: '' });
              }}
              colors={colors}
              isDark={isDark}
            />
            <Text style={[styles.checkboxLabel, { color: colors.text.primary }]}>
              {t('auth.register.acceptTermsPrefix')}{' '}
              <Text
                style={[styles.checkboxLink, { color: colors.primary }]}
                onPress={() => router.push('/account/impressum')}
              >
                {t('auth.register.termsLink')}
              </Text>
            </Text>
          </View>
          <RegisterFieldError messageKey={errors.acceptTerms} t={t} />

          <View style={[styles.checkboxRow, styles.checkboxRowSpaced]}>
            <RegisterCheckbox
              checked={acceptPrivacy}
              onToggle={() => {
                setAcceptPrivacy((prev) => !prev);
                setErrors({ ...errors, acceptPrivacy: '' });
              }}
              colors={colors}
              isDark={isDark}
            />
            <Text style={[styles.checkboxLabel, { color: colors.text.primary }]}>
              {t('auth.register.acceptPrivacyPrefix')}{' '}
              <Text
                style={[styles.checkboxLink, { color: colors.primary }]}
                onPress={() => router.push('/account/datenschutz')}
              >
                {t('auth.register.privacyLink')}
              </Text>
            </Text>
          </View>
          <RegisterFieldError messageKey={errors.acceptPrivacy} t={t} />
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
            <Text style={[styles.signupTitle, { color: colors.text.primary }]}>
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
  fieldInput: {
    fontFamily: 'Roboto-Light',
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0,
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

  section: { marginTop: 8, marginBottom: 6 },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 4,
  },
  sectionDesc: {
    fontFamily: 'Roboto-Light',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  toggleSwitchWrap: {
    width: 52,
    marginRight: 12,
  },
  toggleSwitchScale: {
    transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }],
    alignSelf: 'flex-start',
  },
  toggleLabel: {
    flex: 1,
    fontFamily: 'Roboto-Light',
    fontSize: 15,
    lineHeight: 21,
  },
  consentSection: { marginTop: 8, marginBottom: 4 },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkboxRowSpaced: { marginTop: 12 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxLabel: {
    flex: 1,
    fontFamily: 'Roboto-Light',
    fontSize: 14,
    lineHeight: 20,
  },
  checkboxLink: {
    fontFamily: 'Inter-Medium',
    textDecorationLine: 'underline',
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
    fontFamily: 'Roboto-Regular',
    fontSize: 17,
    lineHeight: 23,
    letterSpacing: 0,
    textAlign: 'center',
  },

  // Sign-in card with cheese illustration (image overflows slightly at bottom)
  signupCard: {
    marginTop: 28,
    marginBottom: 30,
    borderRadius: 16,
    paddingVertical: 44,
    paddingLeft: 16,
    paddingRight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'visible',
  },
  signupCardLeft: { flex: 1, gap: 14, maxWidth: '78%', zIndex: 1 },
  signupTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 20,
    lineHeight: 28,
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
    right: 1,
    top: 8,
    width: 130,
    height: 200,
    zIndex: 0,
  },

  // Language
  languageContainer: {
    marginTop: 56,
    alignItems: 'center',
  },
});
