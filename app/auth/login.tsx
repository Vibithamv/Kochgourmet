import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Keyboard,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Eye, EyeOff, X, ChevronRight } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors, getTypography } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '@/components/LanguageSelector';
import { useGlobalAlert } from '@/contexts/AlertContext';
import {
  loadStoredPlatformSignInOptions,
  persistPlatformSignInOptionsFromValidateResponse,
  type PlatformSignInOptions,
} from '@/constants/platformSignInOptions';
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

  const onClose = () => {
    if (router.canGoBack()) router.back();
  };

  const goRegister = () => router.push('/auth/register');

  // Derive border colors so JSX has no nested ternaries.
  const borderFor = (hasError: boolean, isFocused: boolean): string => {
    if (hasError) return '#EF4444';
    if (isFocused) return colors.primary;
    return colors.border.primary;
  };
  const emailBorder = borderFor(Boolean(errors.email), emailFocused);
  const passwordBorder = borderFor(Boolean(errors.pwField), passwordFocused);

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
        {/* Header row */}
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text.primary, fontFamily: getTypography(theme).fontFamily.display }]}>
            Einloggen
          </Text>
          {router.canGoBack() && (
            <TouchableOpacity
              style={[styles.closeBtn, { borderColor: colors.border.primary }]}
              onPress={onClose}
              hitSlop={8}
              activeOpacity={0.7}
            >
              <X size={18} color={colors.text.primary} />
            </TouchableOpacity>
          )}
        </View>

        <Text style={[styles.subtitle, { color: colors.text.primary }]}>
          Melde dich an, um weitere Features unserer App zu verwenden.
        </Text>

        {/* Email */}
        <View style={styles.fieldGroup}>
          <TextInput
            style={[
              styles.pillInput,
              {
                backgroundColor: colors.background.card,
                borderColor: emailBorder,
                color: colors.text.primary,
              },
            ]}
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
          {errors.email ? (
            <Text style={styles.errorText}>{t(errors.email)}</Text>
          ) : null}
        </View>

        {/* Password */}
        <View style={styles.fieldGroup}>
          <View
            style={[
              styles.pillInputWrap,
              {
                backgroundColor: colors.background.card,
                borderColor: passwordBorder,
              },
            ]}
          >
            <TextInput
              ref={passwordRef}
              style={[styles.pillInputInline, { color: colors.text.primary }]}
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
              hitSlop={8}
            >
              {showPassword
                ? <EyeOff size={18} color={colors.text.tertiary} />
                : <Eye size={18} color={colors.text.tertiary} />}
            </TouchableOpacity>
          </View>
          {errors.pwField ? (
            <Text style={styles.errorText}>
              {t(loginPasswordFieldErrorI18nKey[errors.pwField as LoginPasswordFieldErrorCode])}
            </Text>
          ) : null}
        </View>

        {generalError ? (
          <Text style={styles.generalError}>{t(generalError)}</Text>
        ) : null}

        {/* Sign in button + forgot link on same row */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
            style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: loading ? 0.6 : 1 }]}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryBtnText}>{t('auth.login.signIn')}</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={onForgot} style={styles.forgotLink}>
            <Text style={[styles.forgotText, { color: colors.text.primary }]}>
              {t('auth.login.forgotPassword')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* OAuth options (kept when allowed) */}
        {(showGoogleSignIn || showFacebookSignIn) ? (
          <View style={styles.oauthGroup}>
            {showGoogleSignIn ? (
              <TouchableOpacity
                onPress={handleGoogleSignIn}
                disabled={loading || googleLoading || facebookLoading}
                activeOpacity={0.85}
                style={[
                  styles.oauthBtn,
                  {
                    backgroundColor: colors.background.card,
                    borderColor: colors.border.primary,
                    opacity: loading || googleLoading || facebookLoading ? 0.65 : 1,
                  },
                ]}
              >
                {googleLoading
                  ? <ActivityIndicator size="small" color={colors.primary} />
                  : <>
                      <FontAwesome name="google" size={18} color={colors.text.primary} />
                      <Text style={[styles.oauthText, { color: colors.text.primary }]}>
                        {t('auth.login.signInWithGoogle')}
                      </Text>
                    </>}
              </TouchableOpacity>
            ) : null}
            {showFacebookSignIn ? (
              <TouchableOpacity
                onPress={handleFacebookSignIn}
                disabled={loading || googleLoading || facebookLoading}
                activeOpacity={0.85}
                style={[
                  styles.oauthBtn,
                  {
                    backgroundColor: colors.background.card,
                    borderColor: colors.border.primary,
                    opacity: loading || googleLoading || facebookLoading ? 0.65 : 1,
                  },
                ]}
              >
                {facebookLoading
                  ? <ActivityIndicator size="small" color={colors.primary} />
                  : <>
                      <FontAwesome name="facebook" size={18} color={colors.text.primary} />
                      <Text style={[styles.oauthText, { color: colors.text.primary }]}>
                        {t('auth.login.signInWithFacebook')}
                      </Text>
                    </>}
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {/* Sign up card with cheese illustration */}
        <TouchableOpacity
          onPress={goRegister}
          activeOpacity={0.85}
          style={[styles.signupCard, { backgroundColor: colors.background.secondary }]}
        >
          <View style={styles.signupCardLeft}>
            <Text style={[styles.signupTitle, { color: colors.text.primary, fontFamily: getTypography(theme).fontFamily.display }]}>
              {t('auth.login.noAccount')}
            </Text>
            <View style={styles.signupActionRow}>
              <View style={[styles.signupArrow, { backgroundColor: colors.primary }]}>
                <ChevronRight size={14} color="#fff" strokeWidth={3} />
              </View>
              <Text style={[styles.signupActionText, { color: colors.text.primary }]}>
                {t('auth.login.signUp')}
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
    fontSize: 48,
    lineHeight: 60,
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
    marginBottom: 32,
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

  // Action row (Einloggen + forgot password)
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
  },
  primaryBtn: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
  },
  forgotLink: { flex: 1 },
  forgotText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },

  // OAuth
  oauthGroup: {
    marginTop: 20,
    gap: 10,
  },
  oauthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    borderWidth: 1,
    paddingVertical: 14,
    gap: 10,
  },
  oauthText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
  },

  // Sign-up card with cheese illustration (image overflows slightly at bottom)
  signupCard: {
    marginTop: 28,
    marginBottom: 30, // small breathing room for the dripping cheese overflow
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
    top: 8, // sits inside the top of the card
    width: 130,
    height: 200, // overflows ~30-40px out the bottom only
  },

  // Language
  languageContainer: {
    marginTop: 56,
    alignItems: 'center',
  },
});
