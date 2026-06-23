import { API_HEADER_CONFIG } from '@/config/apiHeaderConfig';
import NetworkService from '../services/NetworkService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const userManagement = () => {

  const getUser = async () => {
    try {

      const response = await NetworkService.get(
        '/user',
        {},
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
        'An error occurred while get user data. Please try again.'
      );
      return { success: false, error: errorMessage };
    }
  };

  const updateProfile = async (first_name: string, last_name: string, currentPassword: string,
    newPassword: string
  ) => {
    try {

      const params = currentPassword === '' ? {
        firstName: first_name,
        lastName: last_name,
      } :
        {
          firstName: first_name,
          lastName: last_name,
          oldPassword: currentPassword,
          newPassword: newPassword
        }
      const response = await NetworkService.patch(
        '/profile',
        params,
        // API_HEADER_CONFIG

        {
          ...API_HEADER_CONFIG,
          "Authorization": `Bearer ${await AsyncStorage.getItem("IDToken")}`,
          "x-refresh-token": `${await AsyncStorage.getItem("RefreshToken")}`
        }
      );

      console.log('update profile response', response);
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
        'An error occurred while updating profile data. Please try again.'
      );
      return { success: false, error: errorMessage };
    }
  };

  const updateProfilePicture = async (image: string, contentType: string) => {
    try {
      const response = await NetworkService.post(
        '/profile/picture',
        { image, contentType },
        {
          ...API_HEADER_CONFIG,
          Authorization: `Bearer ${await AsyncStorage.getItem('IDToken')}`,
          'x-refresh-token': `${await AsyncStorage.getItem('RefreshToken')}`,
        },
      );

      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.error, status: response.status };
    } catch (error: unknown) {
      let errorMessage = 'An unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      console.log(
        'Error',
        'An error occurred while updating profile picture. Please try again.',
      );
      return { success: false, error: errorMessage };
    }
  };

  const switchAccount = async (accountID: string
  ) => {
    try {

      const params =
      {
        accountId: accountID,
      }
      const response = await NetworkService.post(
        '/switch-account',
        params, // params (none in this case)
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
        'An error occurred while switching account. Please try again.'
      );
      return { success: false, error: errorMessage };
    }
  };

  const updateBankDetails = async (payload: {
    account_holder_name: string;
    bank_name: string;
    iban: string;
    bic: string;
    is_bank_payout: boolean;
  }) => {
    try {
      const trimmedHolder = payload.account_holder_name.trim();
      const trimmedBank = payload.bank_name.trim();
      const trimmedIban = payload.iban.trim();
      const trimmedBic = payload.bic.trim();

      const response = await NetworkService.patch(
        '/profile',
        {
          type: 'BANK_ACCOUNT',
          account_holder_name: trimmedHolder,
          bank_name: trimmedBank,
          iban: trimmedIban,
          ibc: trimmedBic,
          is_bank_payout: payload.is_bank_payout,
          accountHolderName: trimmedHolder,
          bankName: trimmedBank,
          bic: trimmedBic,
        },
        {
          ...API_HEADER_CONFIG,
          Authorization: `Bearer ${await AsyncStorage.getItem('IDToken')}`,
          'x-refresh-token': `${await AsyncStorage.getItem('RefreshToken')}`,
        },
      );

      if (response.success) {
        return { success: true as const, data: response.data, status: response.status };
      }
      return { success: false as const, error: response.error, status: response.status };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      return { success: false as const, error: errorMessage };
    }
  };

  const updateSecuritiesAccount = async (payload: {
    securities_account_number: string;
    securities_bic_swift_code: string;
  }) => {
    try {
      const response = await NetworkService.patch(
        '/profile',
        {
          type: 'SECURITY_ACCOUNT',
          securities_account_number: payload.securities_account_number,
          securities_bic_swift_code: payload.securities_bic_swift_code,
        },
        {
          ...API_HEADER_CONFIG,
          Authorization: `Bearer ${await AsyncStorage.getItem('IDToken')}`,
          'x-refresh-token': `${await AsyncStorage.getItem('RefreshToken')}`,
        },
      );

      if (response.success) {
        return { success: true as const, data: response.data, status: response.status };
      }
      return { success: false as const, error: response.error, status: response.status };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      return { success: false as const, error: errorMessage };
    }
  };

  return {
    getUser,
    updateProfile,
    updateProfilePicture,
    switchAccount,
    updateSecuritiesAccount,
    updateBankDetails,
  };
};
