import { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  OAUTH_UI_PROVIDER_PENDING_KEY,
  parseOAuthCallbackUrl,
} from '@/app/auth/oauthDeepLinkUtils';

WebBrowser.maybeCompleteAuthSession();

function firstParam(v: string | string[] | undefined): string | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

/** Avoid duplicate navigation when React Strict Mode runs effects twice (same URL params). */
let oauthCallbackLastHandledKey = '';

const HYDRATE_POLL_MS = 90;
const HYDRATE_MAX_ATTEMPTS = 14;

async function mergeCodeFromInitialUrl(
  code: string | undefined,
  error: string | undefined
): Promise<{ code?: string; error?: string }> {
  if (code || error) return { code, error };
  const initial = await Linking.getInitialURL();
  const oauth = initial ? parseOAuthCallbackUrl(initial) : null;
  let nextCode = code;
  let nextError = error;
  if (oauth?.kind === 'code') nextCode = oauth.code;
  if (oauth?.kind === 'error') nextError = oauth.error;
  return { code: nextCode, error: nextError };
}

/**
 * Google (and the backend) redirect here after social auth, e.g. myapp://auth/callback?code=...
 * This route must exist or Expo Router shows +not-found.
 */
export default function AuthOAuthCallbackScreen() {
  const params = useLocalSearchParams<{ code?: string | string[]; error?: string | string[] }>();
  const paramsRef = useRef(params);
  paramsRef.current = params;
  const paramsKey = JSON.stringify({
    c: params.code,
    e: params.error,
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const readParams = () => ({
        code: firstParam(paramsRef.current.code),
        error: firstParam(paramsRef.current.error),
      });

      let code: string | undefined;
      let error: string | undefined;

      for (let attempt = 0; attempt < HYDRATE_MAX_ATTEMPTS; attempt++) {
        if (cancelled) return;
        ({ code, error } = readParams());
        ({ code, error } = await mergeCodeFromInitialUrl(code, error));
        if (cancelled) return;
        if (code || error) break;
        if (attempt < HYDRATE_MAX_ATTEMPTS - 1) {
          await new Promise<void>((r) => setTimeout(r, HYDRATE_POLL_MS));
        }
      }

      if (cancelled) return;

      const dedupeKey = `${error ?? ''}|${code ?? ''}`;
      if (code || error) {
        if (dedupeKey === oauthCallbackLastHandledKey) return;
        oauthCallbackLastHandledKey = dedupeKey;
      }

      console.log('[Social auth] callback route hit:', {
        hasCode: Boolean(code),
        hasError: Boolean(error),
      });

      if (error) {
        console.log('[Social auth] OAuth error query param:', error);
        router.replace('/auth/login');
        return;
      }

      if (code) {
        console.log('[Social auth] authorization code:', code);
        const pending = await AsyncStorage.getItem(OAUTH_UI_PROVIDER_PENDING_KEY);
        const oauthUiProvider = pending === 'facebook' ? 'facebook' : 'google';
        router.replace({
          pathname: '/auth/login',
          params: { googleOAuthCode: code, oauthUiProvider },
        });
        return;
      }

      console.log('[Social auth] no code or error in callback URL — sending user to login');
      router.replace('/auth/login');
    })();

    return () => {
      cancelled = true;
    };
  }, [paramsKey]);

  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
