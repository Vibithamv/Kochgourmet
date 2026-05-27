import AsyncStorage from '@react-native-async-storage/async-storage';

/** Persisted after `/validate-platform` succeeds (see `app/_layout.tsx`, login). */
export const PLATFORM_KEY_PROVIDER_STORAGE_KEY = 'platformKeyProvider';

export type PlatformKeyProvider = 'NO_KYC' | 'SUMSUB' | (string & {});

/** Same nesting as `persistOfferingAndTenantFromPlatform` (`result.data` from validate). */
export async function persistPlatformKeyProviderFromValidateResponse(data: {
  data: { data: { key_provider?: string | null } };
}): Promise<void> {
  const provider = data.data?.data?.key_provider;
  if (typeof provider === 'string' && provider.length > 0) {
    await AsyncStorage.setItem(PLATFORM_KEY_PROVIDER_STORAGE_KEY, provider);
  }
}

export async function loadStoredPlatformKeyProvider(): Promise<string | null> {
  const raw = await AsyncStorage.getItem(PLATFORM_KEY_PROVIDER_STORAGE_KEY);
  return raw && raw.length > 0 ? raw : null;
}

/** `NO_KYC` — identity verification is not required for this tenant. */
export function isPlatformKycMandatory(
  keyProvider: string | null | undefined
): boolean {
  const normalized = keyProvider?.trim().toUpperCase();
  if (normalized === 'NO_KYC') return false;
  if (normalized === 'SUMSUB') return true;
  // Unknown / legacy tenants: keep existing KYC gate behavior.
  return true;
}

export async function loadIsPlatformKycMandatory(): Promise<boolean> {
  const stored = await loadStoredPlatformKeyProvider();
  return isPlatformKycMandatory(stored);
}
