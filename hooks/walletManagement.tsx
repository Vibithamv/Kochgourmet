import { API_HEADER_CONFIG } from '@/config/apiHeaderConfig';
import NetworkService from '../services/NetworkService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const walletManagement = () => {

  const addWallet = async (address: string, provider: string, name: string, accountId: string) => {
    try {

      const response = await NetworkService.post(
        '/wallets',
        {
          publicAddress: address,
          provider: provider,
          name: name,
          accountId: accountId
        }, // params (none in this case)
        // API_HEADER_CONFIG

        {
          ...API_HEADER_CONFIG,
          "Authorization": `Bearer ${await AsyncStorage.getItem("IDToken")}`,
          "x-refresh-token": `${await AsyncStorage.getItem("RefreshToken")}`
        }
      );

      console.log('add wallet response', response);
      if (response.success) {
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.error, status: response.status };
      }
    } catch (error: unknown) {
      let errorMessage = 'An unknown error occurred';

      // Narrow down to Error type
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      console.log(
        'Error',
        'An error occurred while adding wallet. Please try again.'
      );
      return { success: false, error: errorMessage };
    }
  };

  const checkWalletSignature = async (id: string, provider: string, signature: string) => {
    try {

      const response = await NetworkService.post(
        `/wallets/${id}/verify`,
        {
          id: id,
          signature: signature,
          provider: provider
        }, // params (none in this case)
        // API_HEADER_CONFIG

        {
          ...API_HEADER_CONFIG,
          "Authorization": `Bearer ${await AsyncStorage.getItem("IDToken")}`,
          "x-refresh-token": `${await AsyncStorage.getItem("RefreshToken")}`
        }
      );

      if (response.success) {
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.error, status: response.status };
      }
    } catch (error: unknown) {
      let errorMessage = 'An unknown error occurred';

      // Narrow down to Error type
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      console.log(
        'Error',
        'An error occurred while verifying wallet signature. Please try again.'
      );
      return { success: false, error: errorMessage };
    }
  };


  const updateWalletStatus = async (id: string, status: string) => {
    try {
      console.log('updateWalletStatus', id, status);

      const response = await NetworkService.patch(
        `/wallets/${id}/status`,
        {
          walletId: id,
          status: status
        }, // params (none in this case)
        // API_HEADER_CONFIG

        {
          ...API_HEADER_CONFIG,
          "Authorization": `Bearer ${await AsyncStorage.getItem("IDToken")}`,
          "x-refresh-token": `${await AsyncStorage.getItem("RefreshToken")}`
        }
      );

      console.log('update wallet status response', response);
      if (response.success) {
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.error, status: response.status };
      }
    } catch (error: unknown) {
      let errorMessage = 'An unknown error occurred';

      // Narrow down to Error type
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      console.log(
        'Error',
        'An error occurred while updating wallet status. Please try again.'
      );
      return { success: false, error: errorMessage };
    }
  };

  return {
    addWallet,
    checkWalletSignature,
    updateWalletStatus
  };
};
