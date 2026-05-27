import { API_HEADER_CONFIG } from '@/config/apiHeaderConfig';
import NetworkService from '../services/NetworkService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const kycRequest = () => {

  const request = async (id: string, applicantType: string) => {
    try {
      console.log('kyc request called with', id, applicantType);

      const response = await NetworkService.post(
        '/kyc-request',
        {
          id: id,
          type: "SUMSUB_VERIFICATION",
          applicantType: applicantType
        },

        {
          ...API_HEADER_CONFIG,
          "Authorization": `Bearer ${await AsyncStorage.getItem("IDToken")}`,
          "x-refresh-token": `${await AsyncStorage.getItem("RefreshToken")}`
        }
      );

      console.log('kyc request response', response);
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
        'An error occurred. Please try again.'
      );
      return { success: false, error: errorMessage };
    }
  };

  return {
    request
  };
};
