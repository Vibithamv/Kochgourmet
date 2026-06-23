import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

export type LoginSuccessPayload = {
  activeAccount: { kyc_status: string; id: string };
  user: { first_name: string; last_name: string; id: string };
};

export async function navigateAfterLoginSuccess(
  data: LoginSuccessPayload,
): Promise<void> {
  const accountId = data.activeAccount.id || data.user.id;
  if (accountId) {
    await AsyncStorage.setItem('AccountID', accountId);
  }

  const kycStatus = data.activeAccount.kyc_status;
  if (kycStatus === 'CONFIRMED') {
    router.replace('/(tabs)');
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
