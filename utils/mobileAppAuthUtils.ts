import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  MOBILE_APP_JWT_EXPIRES_AT_KEY,
  MOBILE_APP_JWT_STORAGE_KEY,
  MOBILE_APP_REFRESH_TOKEN_STORAGE_KEY,
} from '@/config/mobileAppApiConfig';

export interface MobileAppAuthResult {
  token: string;
  refreshToken?: string;
  expiresAt?: string;
}

/** Persist Kochgourmet login tokens (replaces legacy portal AccessToken/RefreshToken for app auth). */
export const persistMobileAppAuth = async (auth: MobileAppAuthResult): Promise<void> => {
  const updates: Promise<void>[] = [
    AsyncStorage.setItem(MOBILE_APP_JWT_STORAGE_KEY, auth.token),
    AsyncStorage.setItem('IDToken', auth.token),
    AsyncStorage.setItem('AccessToken', auth.token),
  ];

  if (auth.refreshToken) {
    updates.push(
      AsyncStorage.setItem(MOBILE_APP_REFRESH_TOKEN_STORAGE_KEY, auth.refreshToken),
      AsyncStorage.setItem('RefreshToken', auth.refreshToken),
    );
  }

  if (auth.expiresAt) {
    updates.push(AsyncStorage.setItem(MOBILE_APP_JWT_EXPIRES_AT_KEY, auth.expiresAt));
  }

  await Promise.all(updates);
};

export const clearMobileAppAuth = async (): Promise<void> => {
  await Promise.all([
    AsyncStorage.removeItem(MOBILE_APP_JWT_STORAGE_KEY),
    AsyncStorage.removeItem(MOBILE_APP_REFRESH_TOKEN_STORAGE_KEY),
    AsyncStorage.removeItem(MOBILE_APP_JWT_EXPIRES_AT_KEY),
    AsyncStorage.removeItem('IDToken'),
    AsyncStorage.removeItem('AccessToken'),
    AsyncStorage.removeItem('RefreshToken'),
  ]);
};

export const getMobileAppJwt = async (): Promise<string | null> => {
  return AsyncStorage.getItem(MOBILE_APP_JWT_STORAGE_KEY);
};

export const getMobileAppRefreshToken = async (): Promise<string | null> => {
  return AsyncStorage.getItem(MOBILE_APP_REFRESH_TOKEN_STORAGE_KEY);
};
