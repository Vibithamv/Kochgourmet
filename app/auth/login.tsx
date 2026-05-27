import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '@/components/LanguageSelector';
import AsseteraLogo from '@/components/AsseteraLogo';
import { useGlobalAlert } from '@/contexts/AlertContext';
import {
  loadStoredPlatformSignInOptions,
  persistPlatformSignInOptionsFromValidateResponse,
  type PlatformSignInOptions,
} from '@/constants/platformSignInOptions';
import { persistPlatformKeyProviderFromValidateResponse } from '@/constants/platformKeyProvider';
import { platformValidation } from '@/hooks/platformValidation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { whitelistManagement } from '@/hooks/whitelistManagement';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import {
  loginPasswordFieldErrorI18nKey,
  type LoginPasswordFieldErrorCode,
} from '@/app/auth/loginPasswordFieldErrors';
import { logFcmTokenOnSuccessfulLogin } from '@/utils/logFcmToken';
import NetworkService from '@/services/NetworkService';
import { API_HEADER_CONFIG } from '@/config/apiHeaderConfig';
import { GOOGLE_OAUTH_REDIRECT_URI } from '@/app/auth/googleOAuthConfig';
import {
  OAUTH_UI_PROVIDER_PENDING_KEY,
  parseOAuthCallbackUrl,
} from '@/app/auth/oauthDeepLinkUtils';
import * as Linking from 'expo-linking';
import {
  navigateAfterLoginSuccess,
  type LoginSuccessPayload,
} from '@/app/auth/authNavigation';
import { userManagement } from '@/hooks/userManagement';

WebBrowser.maybeCompleteAuthSession();

type OAuthUiProvider = 'google' | 'facebook';

/** Same OAuth return can be reported via Linking and openAuthSessionAsync — only deliver once per browser session. */
function makeOAuthCallbackDeliverer(provider: OAuthUiProvider) {
  let delivered = false;
  return (url: string): boolean => {
    if (delivered) return false;
    const oauth = parseOAuthCallbackUrl(url);
    if (oauth?.kind !== 'code') return false;
    delivered = true;
    router.replace({
      pathname: '/auth/login',
      params: { googleOAuthCode: oauth.code, oauthUiProvider: provider },
    });
    return true;
  };
}

function createTrackedOAuthDeliverer(provider: OAuthUiProvider) {
  let oauthReturnDelivered = false;
  const inner = makeOAuthCallbackDeliverer(provider);
  const deliverOAuthReturn = (url: string) => {
    const ok = inner(url);
    if (ok) oauthReturnDelivered = true;
    return ok;
  };
  return {
    deliverOAuthReturn,
    wasOAuthReturnDelivered: () => oauthReturnDelivered,
  };
}

/** Blocks concurrent duplicate exchanges for the same code (e.g. double navigation / Strict Mode). */
const oauthCodeExchangeInFlight = new Set<string>();

type FieldErrors = { [key: string]: string };

type SocialSignupUrlApiBody = {
  data: { url: string; auth_type: string };
  meta?: { message?: string };
};

function messageFromApiError(error: unknown, fallback: string): string {
  if (error && typeof error === 'object') {
    const e = error as Record<string, unknown>;
    const nested = e.error as Record<string, unknown> | undefined;
    if (nested && typeof nested.message === 'string') return nested.message;
    if (typeof e.message === 'string') return e.message;
  }
  if (typeof error === 'string') return error;
  return fallback;
}

function validateEmailFormat(email: string) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function buildLoginFieldErrors(email: string, password: string): FieldErrors {
  const next: FieldErrors = {};
  if (!email) {
    next.email = 'auth.login.enterEmail';
  } else if (!validateEmailFormat(email)) {
    next.email = 'auth.login.enterValidEmail';
  }
  if (!password) {
    next.pwField = 'missing_pw';
  }
  return next;
}

export default function LoginScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [tenantID, setTenantID] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [showGoogleSignIn, setShowGoogleSignIn] = useState(false);
  const [showFacebookSignIn, setShowFacebookSignIn] = useState(false);
  const { signIn, signInWithGoogleCode } = useAuth();
  const loginParams = useLocalSearchParams<{
    googleOAuthCode?: string | string[];
    oauthUiProvider?: string | string[];
  }>();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const isDark = theme === 'dark' || theme === 'darkGreen';
  const [generalError, setGeneralError] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const { showAlert } = useGlobalAlert();
  const platform = platformValidation();
  const request = whitelistManagement();
  const passwordRef = useRef<TextInput>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const googleOAuthExchangeRef = useRef<string | null>(null);
  const userAccount = userManagement();

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    const loadTenant = async () => {
      setTenantID((await AsyncStorage.getItem('tenantID')) || '');
    };
    loadTenant();
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const applySignInOptions = (opts: PlatformSignInOptions | null | undefined) => {
        if (cancelled) return;
        setShowGoogleSignIn(Boolean(opts?.google));
        setShowFacebookSignIn(Boolean(opts?.facebook));
      };

      void (async () => {
        const result = await platform.validatePlatform();
        if (result.success && result.data) {
          await persistPlatformSignInOptionsFromValidateResponse(result.data);
          await persistPlatformKeyProviderFromValidateResponse(result.data);
          const opts = result.data.data?.data?.sign_in_options;
          applySignInOptions(opts);
          return;
        }
        const cached = await loadStoredPlatformSignInOptions();
        applySignInOptions(cached ?? undefined);
      })();

      return () => {
        cancelled = true;
      };
    }, [])
  );

  const checkVisibilityStatus = async () => {
    const result = await platform.validatePlatform();
    if (result.success && result.data) {
      await AsyncStorage.setItem(
        'offeringID',
        result.data.data.data.selected_offerings[0].id
      );
      if (
        result.data.data.data.visibilityStatus === 'privatesale' ||
        result.data.data.data.visibilityStatus === 'whitelisting'
      ) {
        return false;
      }
      return true;
    }
  };

  const checkStatus = async () => {
    try {
      const offeringID = (await AsyncStorage.getItem('offeringID')) ?? '';
      const accountID = (await AsyncStorage.getItem('AccountID')) ?? '';
      const result = await request.checkWhitelistStatus(accountID, offeringID);
      if (result.success && result.data) {
        if (result.data.data.whitelistRequestData.length > 0) {
          if (result.data.data.whitelistRequestData[0].status === 'APPROVED') {
            return 'APPROVED';
          }
          return 'PENDING';
        }
        return 'REQUEST';
      }
      showAlert(t('common.error'), result.error.error.message || t('common.tryAgain'));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const checkVisibilityRef = useRef(checkVisibilityStatus);
  const checkStatusRef = useRef(checkStatus);
  checkVisibilityRef.current = checkVisibilityStatus;
  checkStatusRef.current = checkStatus;

  useEffect(() => {
    console.log('loginParams.....',
      JSON.stringify(loginParams, null, 2)
    );
    const raw = loginParams.googleOAuthCode;
    const codeFromLogin = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : undefined;
    if (!codeFromLogin || googleOAuthExchangeRef.current === codeFromLogin) return;
    if (oauthCodeExchangeInFlight.has(codeFromLogin)) return;
    oauthCodeExchangeInFlight.add(codeFromLogin);
    googleOAuthExchangeRef.current = codeFromLogin;

    const rawProvider = loginParams.oauthUiProvider;
    let paramProvider: string | undefined;
    if (typeof rawProvider === 'string') paramProvider = rawProvider;
    else if (Array.isArray(rawProvider) && rawProvider.length > 0) paramProvider = rawProvider[0];

    console.log('[Social auth] completing sign-in on login with code:', codeFromLogin);

    let cancelled = false;
    (async () => {
      let uiProvider: OAuthUiProvider = 'google';
      if (paramProvider === 'facebook') uiProvider = 'facebook';
      else if (paramProvider !== 'google') {
        const pending = await AsyncStorage.getItem(OAUTH_UI_PROVIDER_PENDING_KEY);
        if (pending === 'facebook') uiProvider = 'facebook';
      }
      await AsyncStorage.removeItem(OAUTH_UI_PROVIDER_PENDING_KEY);

      if (cancelled) {
        oauthCodeExchangeInFlight.delete(codeFromLogin);
        googleOAuthExchangeRef.current = null;
        return;
      }

      const setExchangeLoading = (on: boolean) => {
        if (uiProvider === 'facebook') setFacebookLoading(on);
        else setGoogleLoading(on);
      };

      setExchangeLoading(true);
      try {
        const response = await signInWithGoogleCode(codeFromLogin, GOOGLE_OAUTH_REDIRECT_URI);
        if (cancelled) return;
        if (!response.success) {
          googleOAuthExchangeRef.current = null;
          showAlert(
            t('common.error'),
            messageFromApiError(response.error, t('common.tryAgain'))
          );
          router.replace('/auth/login');
          return;
        }
        void logFcmTokenOnSuccessfulLogin();
        const result = await userAccount.getUser();
        console.log('result...user...',
          JSON.stringify(result.data.data, null, 2)
        );
        // await userAccount.getUser().then((data) => {
        //   console.log('data.....',
        //     JSON.stringify(data.data.data, null, 2)
        //   );
        // });
        await navigateAfterLoginSuccess(
          result.data.data as LoginSuccessPayload,
          checkVisibilityRef.current,
          checkStatusRef.current
        );
      } catch (error: unknown) {
        if (!cancelled) {
          googleOAuthExchangeRef.current = null;
          const msg = error instanceof Error ? error.message : t('common.tryAgain');
          showAlert(t('common.error'), msg);
          router.replace('/auth/login');
        }
      } finally {
        if (!cancelled) setExchangeLoading(false);
        oauthCodeExchangeInFlight.delete(codeFromLogin);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    loginParams.googleOAuthCode,
    loginParams.oauthUiProvider,
    signInWithGoogleCode,
    showAlert,
    t,
  ]);

  const handleLogin = async () => {
    const newErrors = buildLoginFieldErrors(email, password);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setGeneralError('');
    setLoading(true);
    try {
      const response = await signIn(email, password);
      if (!response.success) {
        showAlert(
          t('auth.errors.loginFailed'),
          response.error.error.message || t('auth.errors.loginFailed')
        );
        return;
      }
      setEmail('');
      setPassword('');
      void logFcmTokenOnSuccessfulLogin();
      await navigateAfterLoginSuccess(
        response.data.data,
        checkVisibilityStatus,
        checkStatus
      );
    } catch (error: any) {
      showAlert(t('auth.errors.loginFailed'), error.message);
    } finally {
      setLoading(false);
    }
  };

  const onForgot = async () => {
    router.replace('/auth/forgotPassword');
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    await AsyncStorage.setItem(OAUTH_UI_PROVIDER_PENDING_KEY, 'google');
    const { deliverOAuthReturn, wasOAuthReturnDelivered } = createTrackedOAuthDeliverer('google');
    let urlSub: ReturnType<typeof Linking.addEventListener> | undefined;
    try {
      urlSub = Linking.addEventListener('url', ({ url }) => {
        if (deliverOAuthReturn(url)) {
          urlSub?.remove();
          urlSub = undefined;
        }
      });

      const response = await NetworkService.post<SocialSignupUrlApiBody>(
        '/signup',
        {
          type: 'SIGNUP',
          auth_type: 'google',
          redirect_uri: GOOGLE_OAUTH_REDIRECT_URI,
        },
        API_HEADER_CONFIG
      );
      console.log('response.....',
        JSON.stringify(response, null, 2)
      );
      if (!response.success || !response.data?.data?.url) {
        await AsyncStorage.removeItem(OAUTH_UI_PROVIDER_PENDING_KEY);
        showAlert(
          t('common.error'),
          messageFromApiError(response.error, t('common.tryAgain'))
        );
        return;
      }
      const authResult = await WebBrowser.openAuthSessionAsync(
        response.data.data.url,
        GOOGLE_OAUTH_REDIRECT_URI
      );
      if (authResult.type === 'success' && authResult.url) {
        deliverOAuthReturn(authResult.url);
      }
    } catch (error: unknown) {
      await AsyncStorage.removeItem(OAUTH_UI_PROVIDER_PENDING_KEY);
      const msg = error instanceof Error ? error.message : t('common.tryAgain');
      showAlert(t('common.error'), msg);
    } finally {
      urlSub?.remove();
      if (!wasOAuthReturnDelivered()) setGoogleLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    setFacebookLoading(true);
    await AsyncStorage.setItem(OAUTH_UI_PROVIDER_PENDING_KEY, 'facebook');
    const { deliverOAuthReturn, wasOAuthReturnDelivered } = createTrackedOAuthDeliverer('facebook');
    let urlSub: ReturnType<typeof Linking.addEventListener> | undefined;
    try {
      urlSub = Linking.addEventListener('url', ({ url }) => {
        if (deliverOAuthReturn(url)) {
          urlSub?.remove();
          urlSub = undefined;
        }
      });

      const response = await NetworkService.post<SocialSignupUrlApiBody>(
        '/signup',
        {
          type: 'SIGNUP',
          auth_type: 'facebook',
          redirect_uri: GOOGLE_OAUTH_REDIRECT_URI,
        },
        API_HEADER_CONFIG
      );
      if (!response.success || !response.data?.data?.url) {
        await AsyncStorage.removeItem(OAUTH_UI_PROVIDER_PENDING_KEY);
        showAlert(
          t('common.error'),
          messageFromApiError(response.error, t('common.tryAgain'))
        );
        return;
      }
      const authResult = await WebBrowser.openAuthSessionAsync(
        response.data.data.url,
        GOOGLE_OAUTH_REDIRECT_URI
      );
      if (authResult.type === 'success' && authResult.url) {
        deliverOAuthReturn(authResult.url);
      }
    } catch (error: unknown) {
      await AsyncStorage.removeItem(OAUTH_UI_PROVIDER_PENDING_KEY);
      const msg = error instanceof Error ? error.message : t('common.tryAgain');
      showAlert(t('common.error'), msg);
    } finally {
      urlSub?.remove();
      if (!wasOAuthReturnDelivered()) setFacebookLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={isDark ? ['#0D1117', '#14181F', '#1A1F28'] : [colors.background.secondary, colors.background.primary, colors.background.secondary]}
      style={{ flex: 1 }}
    >
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        enableOnAndroid={true}
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={keyboardHeight}
        enableAutomaticScroll={true}
      >
        {/* Hero section */}
        <View style={styles.hero}>
          <View style={styles.logo}>
            <AsseteraLogo width="100%" height="100%" />
          </View>

          {/* <Text style={[styles.appName, { color: colors.text.primary }]}>
            {tenantID || t('common.defaultTenantName')}
          </Text> */}
          <Text style={[styles.tagline, { color: colors.text.tertiary }]}>{t('auth.login.title')}</Text>
        </View>

        {/* Form card */}
        <View style={[styles.card, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}>
          {/* Email field */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.text.primary }]}>
              {t('auth.login.email')}
              <Text style={styles.required}> *</Text>
            </Text>
            <View
              style={[
                styles.inputRow,
                { backgroundColor: colors.background.secondary, borderColor: emailFocused ? colors.border.focus : colors.border.primary },
                errors.email ? styles.inputRowError : null,
              ]}
            >
              <Mail size={18} color={emailFocused ? colors.border.focus : colors.text.tertiary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text.primary }]}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors({ ...errors, email: '' });
                }}
                placeholder={t('auth.login.email')}
                placeholderTextColor={colors.text.placeholder}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="next"
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
            </View>
            {errors.email ? (
              <Text style={styles.errorText}>{t(errors.email)}</Text>
            ) : null}
          </View>

          {/* Password field */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.text.primary }]}>
              {t('auth.login.password')}
              <Text style={styles.required}> *</Text>
            </Text>
            <View
              style={[
                styles.inputRow,
                { backgroundColor: colors.background.secondary, borderColor: passwordFocused ? colors.border.focus : colors.border.primary },
                errors.pwField ? styles.inputRowError : null,
              ]}
            >
              <Lock size={18} color={passwordFocused ? colors.border.focus : colors.text.tertiary} style={styles.inputIcon} />
              <TextInput
                ref={passwordRef}
                style={[styles.input, { color: colors.text.primary }]}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.pwField) setErrors({ ...errors, pwField: '' });
                }}
                placeholder={t('auth.login.password')}
                placeholderTextColor={colors.text.placeholder}
                secureTextEntry={!showPassword}
                autoComplete="password"
                returnKeyType="done"
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={18} color={colors.text.placeholder} />
                ) : (
                  <Eye size={18} color={colors.text.placeholder} />
                )}
              </TouchableOpacity>
            </View>
            {errors.pwField ? (
              <Text style={styles.errorText}>
                {t(
                  loginPasswordFieldErrorI18nKey[
                    errors.pwField as LoginPasswordFieldErrorCode
                  ]
                )}
              </Text>
            ) : null}
          </View>

          {/* Forgot password */}
          <TouchableOpacity onPress={onForgot} style={styles.forgotContainer}>
            <Text style={[styles.forgotText, { color: colors.primary }]}>
              {t('auth.login.forgotPassword')}
            </Text>
          </TouchableOpacity>

          {generalError ? (
            <Text style={styles.generalError}>{t(generalError)}</Text>
          ) : null}

          {/* Sign in button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={loading ? (isDark ? ['#3A4030', '#3A4030'] : [colors.interactive.disabled, colors.interactive.disabled]) : [colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.loginButton}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.text.onPrimary} />
              ) : (
                <Text style={[styles.loginButtonText, { color: colors.text.onPrimary }]}>
                  {t('auth.login.signIn')}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {(showGoogleSignIn || showFacebookSignIn) ? (
            <>
              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: colors.border.primary }]} />
                <Text style={[styles.dividerText, { color: colors.text.secondary }]}>{t('auth.login.or')}</Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.border.primary }]} />
              </View>

              {showGoogleSignIn ? (
                <TouchableOpacity
                  onPress={handleGoogleSignIn}
                  disabled={loading || googleLoading || facebookLoading}
                  activeOpacity={0.85}
                  style={[
                    styles.googleButton,
                    {
                      backgroundColor: colors.background.secondary,
                      borderColor: colors.border.primary,
                      opacity: loading || googleLoading || facebookLoading ? 0.65 : 1,
                    },
                  ]}
                >
                  {googleLoading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <>
                      <FontAwesome name="google" size={20} color={colors.text.primary} style={styles.googleIcon} />
                      <Text style={[styles.googleButtonText, { color: colors.text.primary }]}>
                        {t('auth.login.signInWithGoogle')}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : null}

              {showFacebookSignIn ? (
                <TouchableOpacity
                  onPress={handleFacebookSignIn}
                  disabled={loading || googleLoading || facebookLoading}
                  activeOpacity={0.85}
                  style={[
                    styles.googleButton,
                    {
                      backgroundColor: colors.background.secondary,
                      borderColor: colors.border.primary,
                      opacity: loading || googleLoading || facebookLoading ? 0.65 : 1,
                    },
                  ]}
                >
                  {facebookLoading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <>
                      <FontAwesome name="facebook" size={20} color={colors.text.primary} style={styles.googleIcon} />
                      <Text style={[styles.googleButtonText, { color: colors.text.primary }]}>
                        {t('auth.login.signInWithFacebook')}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : null}
            </>
          ) : null}

          {/* Sign up link */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.text.secondary }]}>
              {t('auth.login.noAccount')}{' '}
            </Text>
            <Link href="/auth/register" asChild>
              <TouchableOpacity>
                <Text style={[styles.linkText, { color: colors.primary }]}>{t('auth.login.signUp')}</Text>
              </TouchableOpacity>
            </Link>
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
    paddingTop: 24,
    paddingBottom: 40,
  },

  // Hero
  hero: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  logo: {
    width: '88%',
    maxWidth: 300,
    aspectRatio: 243 / 46,
    alignSelf: 'center',
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
    marginTop: 18,
    textAlign: 'center',
  },

  // Card
  card: {
    alignSelf: 'center',
    width: '92%',
    maxWidth: 400,
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
    textAlign: 'center',
  },

  // Forgot password
  forgotContainer: {
    alignSelf: 'center',
    marginBottom: 24,
    marginTop: 4,
  },
  forgotText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
  },

  generalError: {
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },

  // Button
  loginButton: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.2,
  },

  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  googleIcon: {
    marginRight: 10,
  },
  googleButtonText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.2,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
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
    marginTop: 20,
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
