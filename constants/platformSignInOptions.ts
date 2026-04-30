import AsyncStorage from '@react-native-async-storage/async-storage';

/** Persisted after `/validate-platform` succeeds (see `app/_layout.tsx`). */
export const PLATFORM_SIGN_IN_OPTIONS_STORAGE_KEY = 'platformSignInOptions';

export type PlatformSignInOptions = {
  google?: boolean;
  facebook?: boolean;
  linkedIn?: boolean;
  wallet?: boolean;
};

/** Same nesting as `persistOfferingAndTenantFromPlatform` (`result.data` from validate). */
export async function persistPlatformSignInOptionsFromValidateResponse(data: {
  data: { data: { sign_in_options?: PlatformSignInOptions } };
}): Promise<void> {
  const opts = data.data?.data?.sign_in_options;
  if (opts && typeof opts === 'object') {
    await AsyncStorage.setItem(PLATFORM_SIGN_IN_OPTIONS_STORAGE_KEY, JSON.stringify(opts));
  }
}

export async function loadStoredPlatformSignInOptions(): Promise<PlatformSignInOptions | null> {
  const raw = await AsyncStorage.getItem(PLATFORM_SIGN_IN_OPTIONS_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PlatformSignInOptions;
  } catch {
    return null;
  }
}
