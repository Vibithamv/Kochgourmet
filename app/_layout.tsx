import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Stack, useRouter, type Router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert, AppState, LogBox, Platform } from 'react-native';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import {
  PlayfairDisplay_500Medium,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import * as SplashScreen from 'expo-splash-screen';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '@/contexts/AuthContext';
import { TenantProvider } from '@/contexts/TenantContext';
import { AlertProvider } from '@/contexts/AlertContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Provider as PaperProvider } from 'react-native-paper';
import { ThirdwebProvider } from "thirdweb/react";

// Import polyfills FIRST for Samsung compatibility
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
// Initialize i18n after polyfills
import '@/i18n/index';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ASYNC_STORAGE_EXIT_RESET_TO_HOME } from '@/constants/navigation';
import * as Linking from 'expo-linking';
import {
  OAUTH_UI_PROVIDER_PENDING_KEY,
  parseOAuthCallbackUrl,
} from '@/app/auth/oauthDeepLinkUtils';
import { platformValidation } from '@/hooks/platformValidation';
import { userManagement } from '@/hooks/userManagement';
import { whitelistManagement } from '@/hooks/whitelistManagement';
import { FcmNotificationBridge } from '@/components/FcmNotificationBridge';
import CustomSplash from '@/components/CustomSplash';
import { persistPlatformSignInOptionsFromValidateResponse } from '@/constants/platformSignInOptions';

void SplashScreen.preventAutoHideAsync();

// Complete error suppression for Samsung devices
LogBox.ignoreAllLogs(true);

// Global error handler for Samsung devices
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const platform = platformValidation();
console.error = (...args) => {
  // Only log in development and filter out known Samsung issues
  if (__DEV__) {
    const message = args.join(' ');
    if (!message.includes('NativeModule') &&
      !message.includes('transform-origin') &&
      !message.includes('onResponder') &&
      !message.includes('onStartShouldSetResponder') &&
      !message.includes('Metro') &&
      !message.includes('Hermes')) {
      originalConsoleError(...args);
    }
  }
};

console.warn = (...args) => {
  // Completely suppress warnings in production
  if (__DEV__) {
    const message = args.join(' ');
    if (!message.includes('NativeModule') &&
      !message.includes('transform-origin') &&
      !message.includes('onResponder') &&
      !message.includes('onStartShouldSetResponder')) {
      originalConsoleWarn(...args);
    }
  }
};

type WhitelistRequestClient = ReturnType<typeof whitelistManagement>;
type UserAccountClient = ReturnType<typeof userManagement>;

async function persistOfferingAndTenantFromPlatform(data: {
  data: { data: { selected_offerings: { id: string }[]; tenant_id: string } };
}) {
  await AsyncStorage.setItem(
    'offeringID',
    data.data.data.selected_offerings[0].id
  );
  await AsyncStorage.setItem('tenantID', data.data.data.tenant_id);
}

async function resolveWhitelistRouteStatus(
  request: WhitelistRequestClient
): Promise<'APPROVED' | 'PENDING' | 'REQUEST' | undefined> {
  const offeringID = (await AsyncStorage.getItem('offeringID')) ?? '';
  const accountID = (await AsyncStorage.getItem('AccountID')) ?? '';
  const result = await request.checkWhitelistStatus(accountID, offeringID);
  if (result.success && result.data) {
    const rows = result.data.data.whitelistRequestData;
    if (rows.length > 0) {
      return rows[0].status === 'APPROVED' ? 'APPROVED' : 'PENDING';
    }
    return 'REQUEST';
  }
  Alert.alert('Error', result.error.message || 'Please try again.');
  return undefined;
}

async function navigateAfterConfirmedKycForSplash(
  visibilityStatus: string,
  router: Router,
  request: WhitelistRequestClient
) {
  if (visibilityStatus === 'privatesale' || visibilityStatus === 'whitelisting') {
    const wl = await resolveWhitelistRouteStatus(request);
    if (wl === 'APPROVED') {
      router.replace('/(tabs)');
      return;
    }
    if (wl === 'PENDING') {
      router.replace('/screens/whitelistResponseWaiting');
      return;
    }
    router.replace('/auth/whitelistRequest');
    return;
  }
  router.replace('/(tabs)');
}

async function navigateFromUserPayload(
  payload: {
    data: {
      data: {
        activeAccount: { kyc_status: string };
        user: { first_name: string; last_name: string; id: string };
      };
    };
  },
  visibilityStatus: string,
  router: Router,
  request: WhitelistRequestClient
) {
  const kyc = payload.data.data.activeAccount.kyc_status;
  if (kyc === 'CONFIRMED') {
    await navigateAfterConfirmedKycForSplash(visibilityStatus, router, request);
    return;
  }
  if (kyc === 'REQUIRED') {
    router.replace({
      pathname: '/auth/kycRequest',
      params: {
        name: `${payload.data.data.user.first_name || ''} ${payload.data.data.user.last_name || ''}`,
        id: payload.data.data.user.id,
      },
    });
    return;
  }
  router.replace('/screens/kycWaiting');
}

async function runSplashAuthenticatedRouting(
  router: Router,
  userAccount: UserAccountClient,
  request: WhitelistRequestClient,
  visibilityStatus: string
) {
  const resetToHomeAfterExit =
    (await AsyncStorage.getItem(ASYNC_STORAGE_EXIT_RESET_TO_HOME)) === '1';

  const accessToken = await AsyncStorage.getItem('AccessToken');
  const refreshToken = await AsyncStorage.getItem('RefreshToken');
  if (!accessToken && !refreshToken) {
    if (resetToHomeAfterExit) {
      await AsyncStorage.removeItem(ASYNC_STORAGE_EXIT_RESET_TO_HOME);
    }
    const initialUrl = await Linking.getInitialURL();
    const oauth = initialUrl ? parseOAuthCallbackUrl(initialUrl) : null;
    if (oauth?.kind === 'code') {
      const pending = await AsyncStorage.getItem(OAUTH_UI_PROVIDER_PENDING_KEY);
      const oauthUiProvider = pending === 'facebook' ? 'facebook' : 'google';
      router.replace({
        pathname: '/auth/login',
        params: { googleOAuthCode: oauth.code, oauthUiProvider },
      });
      return;
    }
    if (oauth?.kind === 'error') {
      router.replace('/auth/login');
      return;
    }
    router.replace('/auth/login');
    return;
  }
  try {
    const data = await userAccount.getUser();
    if (data.success && data.data) {
      await navigateFromUserPayload(
        data as {
          data: {
            data: {
              activeAccount: { kyc_status: string };
              user: { first_name: string; last_name: string; id: string };
            };
          };
        },
        visibilityStatus,
        router,
        request
      );
      if (resetToHomeAfterExit) {
        await AsyncStorage.removeItem(ASYNC_STORAGE_EXIT_RESET_TO_HOME);
        router.replace('/(tabs)');
      }
    } else {
      if (resetToHomeAfterExit) {
        await AsyncStorage.removeItem(ASYNC_STORAGE_EXIT_RESET_TO_HOME);
      }
      console.log('Failed to fetch user details:', data.error);
    }
  } catch (error) {
    if (resetToHomeAfterExit) {
      await AsyncStorage.removeItem(ASYNC_STORAGE_EXIT_RESET_TO_HOME).catch(() => {});
    }
    console.error('Error loading user data:', error);
  }
}

async function runAuthRouting(
  fontsLoaded: boolean,
  fontError: boolean,
  router: Router,
  userAccount: UserAccountClient,
  request: WhitelistRequestClient
) {
  try {
    const result = await platform.validatePlatform();
    console.log('result.....',
      JSON.stringify(result, null, 2)
    );
    if (!result.success || !result.data) {
      router.replace('/screens/platformError');
      return;
    }
    await persistOfferingAndTenantFromPlatform(result.data);
    await persistPlatformSignInOptionsFromValidateResponse(result.data);
    const visibilityStatus = result.data.data.data.visibilityStatus;
    if (!(fontsLoaded || fontError)) return;
    try {
      await runSplashAuthenticatedRouting(
        router,
        userAccount,
        request,
        visibilityStatus
      );
    } catch (err) {
      console.error('Error loading user', err);
    }
  } catch (error) {
    console.error('Error loading data:', error);
  } finally {
    splashAuthBootstrapCompleted = true;
    void SplashScreen.hideAsync();
  }
}

/** Prevents duplicate cold-start navigations when the routing effect re-runs (e.g. unstable hook deps). */
let splashInitialNavigationDone = false;

/** True after the first `runAuthRouting` finishes; avoids AppState consuming exit-home before cold-start auth handles it. */
let splashAuthBootstrapCompleted = false;

export default function RootLayout() {
  useFrameworkReady();
  const router = useRouter();
  const appStateRef = useRef(AppState.currentState);
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    PlayfairDisplay_500Medium,
    PlayfairDisplay_700Bold,
  });
  const [showSplash, setShowSplash] = useState(true);
  const userAccount = useMemo(() => userManagement(), []);
  const request = useMemo(() => whitelistManagement(), []);

  // Dismiss native splash when fonts are ready so CustomSplash (Modal) is visible.
  useLayoutEffect(() => {
    if (!(fontsLoaded || fontError)) return;
    void SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    const splashTimer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(splashTimer);
  }, []);

  // After Android BackHandler.exitApp(), the process often resumes with the old stack; open the home tab.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      const prev = appStateRef.current;
      appStateRef.current = next;
      if (
        splashAuthBootstrapCompleted &&
        prev.match(/inactive|background/) &&
        next === 'active'
      ) {
        void (async () => {
          try {
            const v = await AsyncStorage.getItem(ASYNC_STORAGE_EXIT_RESET_TO_HOME);
            if (v !== '1') return;
            await AsyncStorage.removeItem(ASYNC_STORAGE_EXIT_RESET_TO_HOME);
            router.replace('/(tabs)');
          } catch {
            /* ignore */
          }
        })();
      }
    });
    return () => sub.remove();
  }, [router]);

  // Run auth routing once fonts are ready (native hides when fonts load; custom splash ~3s)
  useEffect(() => {
    if (!fontsLoaded && !fontError) return;
    const delay = Platform.OS === 'android' ? 500 : 0;
    const authTimer = setTimeout(() => {
      if (splashInitialNavigationDone) return;
      splashInitialNavigationDone = true;
      runAuthRouting(fontsLoaded, Boolean(fontError), router, userAccount, request).catch(
        (err) => console.error('Auth routing error:', err)
      );
    }, delay);
    return () => clearTimeout(authTimer);
  }, [fontsLoaded, fontError, router, userAccount, request]);

  return (
    <ThirdwebProvider>
      <PaperProvider>
        <TenantProvider>
          <ThemeProvider>
            <FcmNotificationBridge />
            <AlertProvider>
              <AuthProvider>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="auth" />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="+not-found" />
                </Stack>
                <StatusBar style="auto" />
                <CustomSplash visible={showSplash} />
              </AuthProvider>
            </AlertProvider>
          </ThemeProvider>
        </TenantProvider>
      </PaperProvider>
    </ThirdwebProvider>
  );
}