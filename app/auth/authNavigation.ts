import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import {
  isPlatformNoKyc,
  loadStoredPlatformKeyProvider,
  normalizePlatformKeyProvider,
} from '@/constants/platformKeyProvider';
import { platformValidation } from '@/hooks/platformValidation';
import { persistPlatformValidateResponse } from '@/utils/persistPlatformValidateResponse';

export type LoginSuccessPayload = {
  activeAccount: { kyc_status: string; id: string };
  user: { first_name: string; last_name: string; id: string };
};

function kycRequiresAction(kycStatus: string): boolean {
  const normalized = kycStatus.toUpperCase();
  return normalized === 'REQUIRED' || normalized === 'RETRY';
}

function kycIsConfirmed(kycStatus: string): boolean {
  return kycStatus.toUpperCase() === 'CONFIRMED';
}

async function persistAccountId(data: LoginSuccessPayload): Promise<void> {
  const accountId = data.activeAccount.id || data.user.id;
  if (accountId) {
    await AsyncStorage.setItem('AccountID', accountId);
  }
}

/** Route an authenticated user using platform `key_provider` and account `kyc_status`. */
export async function routeAuthenticatedUser(
  data: LoginSuccessPayload,
  keyProvider?: string | null,
): Promise<void> {
  await persistAccountId(data);

  const resolvedKeyProvider =
    normalizePlatformKeyProvider(keyProvider) ?? (await loadStoredPlatformKeyProvider());

  console.log('[Auth] routeAuthenticatedUser', {
    key_provider: resolvedKeyProvider,
    kyc_status: data.activeAccount.kyc_status,
    activeAccountId: data.activeAccount.id,
    userId: data.user.id,
  });

  if (isPlatformNoKyc(resolvedKeyProvider)) {
    router.replace('/(tabs)');
    return;
  }

  const kycStatus = data.activeAccount.kyc_status;
  if (kycIsConfirmed(kycStatus)) {
    router.replace('/(tabs)');
    return;
  }
  if (kycRequiresAction(kycStatus)) {
    router.replace({
      pathname: '/auth/kycRequest',
      params: {
        name: `${data.user.first_name || ''} ${data.user.last_name || ''}`,
        id: data.user.id,
      },
    });
    return;
  }
  router.replace('/screens/kycWaiting');
}

/** After login: validate platform, then route using `key_provider` + `/user` KYC status. */
export async function navigateAfterLoginSuccess(
  data: LoginSuccessPayload,
): Promise<void> {
  const platform = platformValidation();
  const validateResult = await platform.validatePlatform();

  let keyProvider: string | null = null;
  if (validateResult.success && validateResult.data) {
    await persistPlatformValidateResponse(validateResult.data);
    keyProvider = validateResult.data.data?.data?.key_provider ?? null;
    console.log('[Auth] post-login validate-platform key_provider:', keyProvider);
  } else {
    keyProvider = await loadStoredPlatformKeyProvider();
    console.log('[Auth] post-login validate-platform failed, using cached key_provider:', keyProvider);
  }

  await routeAuthenticatedUser(data, keyProvider);
}
