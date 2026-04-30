import { API_HEADER_CONFIG } from '@/config/apiHeaderConfig';
import NetworkService from '../services/NetworkService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const whitelistManagement = () => {

  const checkWhitelistStatus = async (id: string, offeringId: string) => {
    try {

      const response = await NetworkService.post(
        '/offerings/whitelist/check',
        {
          accountId: id,
          offeringId: offeringId
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
        'An error occurred while checking whitelist status. Please try again.'
      );
      return { success: false, error: errorMessage };
    }
  };

  const whiteListRequest = async (id: any, offeringId: string) => {
    try {

      const response = await NetworkService.post(
        '/offerings/whitelist',
        {
          accountId: id,
          offeringId: offeringId,
          locale: 'en',
        }, // params (none in this case)
        // API_HEADER_CONFIG

        {
          ...API_HEADER_CONFIG,
          "Authorization": `Bearer ${await AsyncStorage.getItem("IDToken")}`,
          "x-refresh-token": `${await AsyncStorage.getItem("RefreshToken")}`,
          "x-access-token": `${await AsyncStorage.getItem("AccessToken")}`
        }
      );

      console.log('whitelist offering request response', response);
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
        'An error occurred while request whitelist offering. Please try again.'
      );
      return { success: false, error: errorMessage };
    }
  };



  return {
    checkWhitelistStatus,
    whiteListRequest
  };
};
