import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  MOBILE_APP_JWT_EXPIRES_AT_KEY,
  MOBILE_APP_JWT_STORAGE_KEY,
} from '@/config/mobileAppApiConfig';

export interface MobileAppAuthResult {
  token: string;
  expiresAt?: string;
}

export const persistMobileAppAuth = async (auth: MobileAppAuthResult): Promise<void> => {
  const updates: Promise<void>[] = [
    AsyncStorage.setItem(MOBILE_APP_JWT_STORAGE_KEY, auth.token),
  ];

  if (auth.expiresAt) {
    updates.push(AsyncStorage.setItem(MOBILE_APP_JWT_EXPIRES_AT_KEY, auth.expiresAt));
  }

  await Promise.all(updates);
};

export const clearMobileAppAuth = async (): Promise<void> => {
  await Promise.all([
    AsyncStorage.removeItem(MOBILE_APP_JWT_STORAGE_KEY),
    AsyncStorage.removeItem(MOBILE_APP_JWT_EXPIRES_AT_KEY),
  ]);
};

export const getMobileAppJwt = async (): Promise<string | null> => {
  return AsyncStorage.getItem(MOBILE_APP_JWT_STORAGE_KEY);
};
