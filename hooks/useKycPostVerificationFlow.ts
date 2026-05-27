import { useCallback } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { userManagement } from '@/hooks/userManagement';
import { useGlobalAlert } from '@/contexts/AlertContext';
import { platformValidation } from '@/hooks/platformValidation';
import { whitelistManagement } from '@/hooks/whitelistManagement';
import { loadIsPlatformKycMandatory } from '@/constants/platformKeyProvider';

/** Whitelist / visibility follow-up when KYC is already CONFIRMED. */
export async function navigateAfterConfirmedKyc(
  accountId: string,
  checkVisibilityStatus: () => Promise<boolean | undefined>,
  checkStatus: () => Promise<string | undefined>
): Promise<void> {
  await AsyncStorage.setItem('AccountID', accountId);
  const visible = await checkVisibilityStatus();
  if (visible) {
    router.replace('/(tabs)');
    return;
  }
  const status = await checkStatus();
  if (status === 'APPROVED') {
    router.replace('/(tabs)');
    return;
  }
  if (status === 'PENDING') {
    router.replace('/screens/whitelistResponseWaiting');
    return;
  }
  router.replace('/auth/whitelistRequest');
}

export type SyncKycStatusOptions = {
  /** When true and KYC is neither CONFIRMED nor PENDING, show a “finish KYC” message (WebView Continue). */
  alertWhenIncomplete?: boolean;
};

/**
 * Refetch active account KYC status and navigate — same flow as
 * `loadData` on the KYC request screen (after WebView or on focus).
 */
export function useKycPostVerificationFlow() {
  const { t } = useTranslation();
  const { showAlert } = useGlobalAlert();
  const userAccount = userManagement();
  const platform = platformValidation();
  const whiteListRequest = whitelistManagement();

  const checkVisibilityStatus = useCallback(async () => {
    const result = await platform.validatePlatform();
    if (result.success && result.data) {
      await AsyncStorage.setItem(
        'offeringID',
        result.data.data.data.selected_offerings[0].id
      );
      if (
        result.data.data.data.visibilityStatus === 'privatesale' ||
        result.data.data.data.visibilityStatus === 'whitelisting'
      ) {
        return false;
      }
      return true;
    }
  }, [platform]);

  const checkStatus = useCallback(async () => {
    try {
      const offeringID = (await AsyncStorage.getItem('offeringID')) ?? '';
      const accountID = (await AsyncStorage.getItem('AccountID')) ?? '';
      const result = await whiteListRequest.checkWhitelistStatus(
        accountID,
        offeringID
      );
      if (result.success && result.data) {
        if (result.data.data.whitelistRequestData.length > 0) {
          if (result.data.data.whitelistRequestData[0].status === 'APPROVED') {
            return 'APPROVED';
          }
          return 'PENDING';
        }
        return 'REQUEST';
      }
      showAlert(
        t('common.error'),
        result.error.message || t('common.tryAgain')
      );
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, [whiteListRequest, showAlert, t]);

  /** Poll-friendly: returns active account `kyc_status` or `null` if the request fails (no alerts). */
  const fetchActiveAccountKycStatus = useCallback(async (): Promise<string | null> => {
    const data = await userAccount.getUser();
    if (!data.success || !data.data) return null;
    const status = data.data.data.activeAccount?.kyc_status;
    return typeof status === 'string' ? status : null;
  }, [userAccount]);

  const syncKycStatusAndNavigate = useCallback(
    async (options?: SyncKycStatusOptions): Promise<void> => {
    const data = await userAccount.getUser();
    if (!data.success || !data.data) {
      showAlert(t('common.error'), data.error.message);
      return;
    }

    const { kyc_status: kycStatus, id: activeAccountId } =
      data.data.data.activeAccount;

    const kycMandatory = await loadIsPlatformKycMandatory();
    if (!kycMandatory) {
      await navigateAfterConfirmedKyc(
        activeAccountId,
        checkVisibilityStatus,
        checkStatus
      );
      return;
    }

    if (kycStatus === 'CONFIRMED') {
      await navigateAfterConfirmedKyc(
        activeAccountId,
        checkVisibilityStatus,
        checkStatus
      );
      return;
    }
    if (kycStatus === 'PENDING') {
      router.replace('/screens/kycWaiting');
      return;
    }
    if (options?.alertWhenIncomplete) {
      showAlert(
        t('kycRequest.completeKycToContinueTitle'),
        t('kycRequest.completeKycToContinueMessage')
      );
    }
  }, [
    userAccount,
    showAlert,
    t,
    checkVisibilityStatus,
    checkStatus,
  ]);

  return { syncKycStatusAndNavigate, fetchActiveAccountKycStatus };
}
