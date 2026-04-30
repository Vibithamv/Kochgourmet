import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

export type LoginSuccessPayload = {
  activeAccount: { kyc_status: string; id: string };
  user: { first_name: string; last_name: string; id: string };
};

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
  checkStatus: () => Promise<string | undefined>
): Promise<void> {
  if (JSON.stringify(data.activeAccount) !== '{}') {
    await AsyncStorage.setItem('AccountID', data.activeAccount.id)
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
