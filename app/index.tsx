import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import {
  OAUTH_UI_PROVIDER_PENDING_KEY,
  parseOAuthCallbackUrl,
} from '@/app/auth/oauthDeepLinkUtils';

export default function IndexScreen() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace('/(tabs)');
      return;
    }
    let cancelled = false;
    (async () => {
      const initialUrl = await Linking.getInitialURL();
      if (cancelled) return;
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
    })();
    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#10B981" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E293B',
  },
});