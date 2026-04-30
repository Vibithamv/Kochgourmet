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

  return {
    getUser,
    updateProfile,
    switchAccount
  };
};
