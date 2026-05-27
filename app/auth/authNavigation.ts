import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { loadIsPlatformKycMandatory } from '@/constants/platformKeyProvider';
import {
  isMagicEmbeddedWalletAutomaticMode,
  loadStoredMagicEmbeddedWalletMode,
  loadStoredMagicLinkPublicKey,
} from '@/constants/platformSignInOptions';
import { hasMagicLinkWalletInResponse } from '@/utils/hasActiveEmbeddedWallet';

export type LoginSuccessPayload = {
  activeAccount: {
    kyc_status: string;
    id: string;
    name?: string;
    blockchainWallets?: Array<{
      blockchain_provider?: string | null;
      status?: string | null;
    }>;
  };
  user: {
    first_name: string;
    last_name: string;
    id: string;
    email?: string;
  };
};

type NavigateAfterLoginOptions = {
  /** Skip automatic embedded-wallet gate (used when leaving the gate screen). */
  skipEmbeddedGate?: boolean;
};

export async function shouldRequireEmbeddedWalletGate(
  data: LoginSuccessPayload
): Promise<boolean> {
  const [mode, publicKey] = await Promise.all([
    loadStoredMagicEmbeddedWalletMode(),
    loadStoredMagicLinkPublicKey(),
  ]);
  if (!isMagicEmbeddedWalletAutomaticMode(mode) || !publicKey) {
    return false;
  }
  return !hasMagicLinkWalletInResponse(data);
}

export async function navigateTabsOrWhitelist(
  checkVisibilityStatus: () => Promise<boolean | undefined>,
  checkStatus: () => Promise<string | undefined>
): Promise<void> {
  if (await checkVisibilityStatus()) {
    router.replace('/(tabs)');
    return;
  }
  const whitelistStatus = await checkStatus();
  if (whitelistStatus === 'APPROVED') {
    router.replace('/(tabs)');
    return;
  }
  if (whitelistStatus === 'PENDING') {
    router.replace('/screens/whitelistResponseWaiting');
    return;
  }
  router.replace('/auth/whitelistRequest');
}

export async function navigateAfterLoginSuccess(
  data: LoginSuccessPayload,
  checkVisibilityStatus: () => Promise<boolean | undefined>,
  checkStatus: () => Promise<string | undefined>,
  options: NavigateAfterLoginOptions = {}
): Promise<void> {
  if (JSON.stringify(data.activeAccount) !== '{}') {
    await AsyncStorage.setItem('AccountID', data.activeAccount.id);
  }

  if (!options.skipEmbeddedGate && (await shouldRequireEmbeddedWalletGate(data))) {
    router.replace('/auth/embeddedWalletRequired');
    return;
  }

  const kycMandatory = await loadIsPlatformKycMandatory();
  if (!kycMandatory) {
    await navigateTabsOrWhitelist(checkVisibilityStatus, checkStatus);
    return;
  }

  const kycStatus = data.activeAccount.kyc_status;
  if (kycStatus === 'CONFIRMED') {
    await navigateTabsOrWhitelist(checkVisibilityStatus, checkStatus);
    return;
  }
  if (kycStatus === 'REQUIRED') {
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
