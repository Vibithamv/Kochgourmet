import AsyncStorage from '@react-native-async-storage/async-storage';

/** Persisted after `/validate-platform` succeeds. */
export const PLATFORM_KEY_PROVIDER_STORAGE_KEY = 'platformKeyProvider';

export type PlatformKeyProvider = 'NO_KYC' | 'SUMSUB' | (string & {});

export function normalizePlatformKeyProvider(value: unknown): PlatformKeyProvider | null {
  if (typeof value !== 'string' || value.length === 0) return null;
  return value;
}

export function isPlatformNoKyc(keyProvider: string | null | undefined): boolean {
  return keyProvider?.toUpperCase() === 'NO_KYC';
}

/** Same nesting as `persistPlatformSignInOptionsFromValidateResponse`. */
export async function persistPlatformKeyProviderFromValidateResponse(data: {
  data: { data: { key_provider?: string | null } };
}): Promise<void> {
  const provider = normalizePlatformKeyProvider(data.data?.data?.key_provider);
  if (provider) {
    await AsyncStorage.setItem(PLATFORM_KEY_PROVIDER_STORAGE_KEY, provider);
  }
}

export async function loadStoredPlatformKeyProvider(): Promise<PlatformKeyProvider | null> {
  const raw = await AsyncStorage.getItem(PLATFORM_KEY_PROVIDER_STORAGE_KEY);
  return normalizePlatformKeyProvider(raw);
}
