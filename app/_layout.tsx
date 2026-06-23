import { useEffect, useMemo, useRef, useState } from 'react';
import { Stack, useRouter, type Router } from 'expo-router';
import { AppState, LogBox, Platform, Text, TextInput } from 'react-native';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import {
  PlayfairDisplay_500Medium,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import { Roboto_300Light, Roboto_400Regular, Roboto_500Medium } from '@expo-google-fonts/roboto';
import * as SplashScreen from 'expo-splash-screen';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '@/contexts/AuthContext';
import { TenantProvider } from '@/contexts/TenantContext';
import { AlertProvider } from '@/contexts/AlertContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { FavouritesProvider } from '@/contexts/FavouritesContext';
import { FoldersProvider } from '@/contexts/FoldersContext';
import { RecipeFiltersProvider } from '@/contexts/RecipeFiltersContext';
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
import { FcmNotificationBridge } from '@/components/FcmNotificationBridge';
import CustomSplash from '@/components/CustomSplash';
import GlobalFloatingTabBar from '@/components/GlobalFloatingTabBar';
import { ThemedStatusBar } from '@/components/ThemedStatusBar';
import { persistPlatformValidateResponse } from '@/utils/persistPlatformValidateResponse';
import { getMobileAppJwt } from '@/utils/mobileAppAuthUtils';
import {
  routeAuthenticatedUser,
  type LoginSuccessPayload,
} from '@/app/auth/authNavigation';

void SplashScreen.preventAutoHideAsync();

// Prevent Android extra font padding that clips descenders (g, j, p, y, etc.).
if (Platform.OS === 'android') {
  const textDefaults = { includeFontPadding: false } as const;
  (Text as unknown as { defaultProps?: { includeFontPadding?: boolean } }).defaultProps = {
    ...(Text as unknown as { defaultProps?: object }).defaultProps,
    ...textDefaults,
  };
  (TextInput as unknown as { defaultProps?: { includeFontPadding?: boolean } }).defaultProps = {
    ...(TextInput as unknown as { defaultProps?: object }).defaultProps,
    ...textDefaults,
  };
}

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

type UserAccountClient = ReturnType<typeof userManagement>;

async function navigateFromUserPayload(payload: {
  data: { data: LoginSuccessPayload };
}) {
  await routeAuthenticatedUser(payload.data.data);
}

async function runSplashAuthenticatedRouting(
  router: Router,
  userAccount: UserAccountClient,
) {
  const resetToHomeAfterExit =
    (await AsyncStorage.getItem(ASYNC_STORAGE_EXIT_RESET_TO_HOME)) === '1';

  const kochgourmetJwt = await getMobileAppJwt();
  const hasSession = Boolean(kochgourmetJwt) ||
    (await AsyncStorage.getItem('AccessToken')) ||
    (await AsyncStorage.getItem('RefreshToken'));

  if (!hasSession) {
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
      if (resetToHomeAfterExit) {
        await AsyncStorage.removeItem(ASYNC_STORAGE_EXIT_RESET_TO_HOME);
        router.replace('/(tabs)');
        return;
      }
      await navigateFromUserPayload(
        data as { data: { data: LoginSuccessPayload } },
      );
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
  onBootstrapComplete: () => void,
) {
  try {
    const result = await platform.validatePlatform();
    if (!result.success || !result.data) {
      router.replace('/screens/platformError');
      return;
    }
    await persistPlatformValidateResponse(result.data);
    if (!(fontsLoaded || fontError)) return;
    try {
      await runSplashAuthenticatedRouting(router, userAccount);
    } catch (err) {
      console.error('Error loading user', err);
    }
  } catch (error) {
    console.error('Error loading data:', error);
  } finally {
    splashAuthBootstrapCompleted = true;
    onBootstrapComplete();
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
    'Roboto-Light': Roboto_300Light,
    'Roboto-Regular': Roboto_400Regular,
    'Roboto-Medium': Roboto_500Medium,
  });
  const [bootstrapComplete, setBootstrapComplete] = useState(false);
  const userAccount = useMemo(() => userManagement(), []);

  // Fast refresh / dev reload remounts RootLayout; reset guards so bootstrap runs again.
  useEffect(() => {
    if (!__DEV__) return undefined;
    return () => {
      splashInitialNavigationDone = false;
      splashAuthBootstrapCompleted = false;
    };
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
      runAuthRouting(
        fontsLoaded,
        Boolean(fontError),
        router,
        userAccount,
        () => setBootstrapComplete(true),
      ).catch(
        (err) => console.error('Auth routing error:', err)
      );
    }, delay);
    return () => clearTimeout(authTimer);
  }, [fontsLoaded, fontError, router, userAccount]);

  return (
    <ThirdwebProvider>
      <PaperProvider>
        <TenantProvider>
          <ThemeProvider>
            <FcmNotificationBridge />
            <AlertProvider>
              <AuthProvider>
                <FavouritesProvider>
                  <RecipeFiltersProvider>
                  <FoldersProvider>
                    <Stack screenOptions={{ headerShown: false }}>
                      <Stack.Screen name="auth" />
                      <Stack.Screen name="(tabs)" />
                      <Stack.Screen name="investment" options={{ headerShown: false }} />
                      <Stack.Screen name="recipe"    options={{ animation: 'slide_from_bottom', presentation: 'card', headerShown: false }} />
                      <Stack.Screen name="magazin"   options={{ animation: 'slide_from_bottom', presentation: 'card', headerShown: false }} />
                      <Stack.Screen name="favoriten" options={{ animation: 'slide_from_bottom', presentation: 'card', headerShown: false }} />
                      <Stack.Screen name="+not-found" />
                    </Stack>
                    <GlobalFloatingTabBar bootstrapComplete={bootstrapComplete} />
                    <ThemedStatusBar />
                  </FoldersProvider>
                  </RecipeFiltersProvider>
                </FavouritesProvider>
              </AuthProvider>
            </AlertProvider>
            <CustomSplash visible={!bootstrapComplete} />
          </ThemeProvider>
        </TenantProvider>
      </PaperProvider>
    </ThirdwebProvider>
  );
}