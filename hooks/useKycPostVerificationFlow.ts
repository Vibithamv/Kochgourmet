import { useCallback, useMemo } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { userManagement } from '@/hooks/userManagement';
import {
  routeAuthenticatedUser,
  type LoginSuccessPayload,
} from '@/app/auth/authNavigation';
import { useGlobalAlert } from '@/contexts/AlertContext';

/** KYC confirmed — continue into the app. */
export async function navigateAfterConfirmedKyc(accountId: string): Promise<void> {
  await AsyncStorage.setItem('AccountID', accountId);
  router.replace('/(tabs)');
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
  const userAccount = useMemo(() => userManagement(), []);

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

      const userPayload = data.data.data as LoginSuccessPayload;
      if (options?.alertWhenIncomplete) {
        const kycStatus = userPayload.activeAccount.kyc_status.toUpperCase();
        if (kycStatus !== 'CONFIRMED' && kycStatus !== 'PENDING') {
          showAlert(
            t('kycRequest.completeKycToContinueTitle'),
            t('kycRequest.completeKycToContinueMessage'),
          );
          return;
        }
      }
      await routeAuthenticatedUser(userPayload);
    },
    [userAccount, showAlert, t],
  );

  return { syncKycStatusAndNavigate, fetchActiveAccountKycStatus };
}
