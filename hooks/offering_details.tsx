import { API_HEADER_CONFIG } from '@/config/apiHeaderConfig';
import NetworkService from '../services/NetworkService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const offeringDetails = () => {

  const details = async (id: string) => {
    try {

      const response = await NetworkService.post(
        '/offerings/details',
        { id: id }, // params (none in this case)
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
        'An error occurred while fetching offering details. Please try again.'
      );
      return { success: false, error: errorMessage };
    }
  };

  const calculateTokenAmt = async (tokenAmt: any, paymentChoice: string, tokenChoice: string, payAmount: any) => {
    try {

      const response = await NetworkService.post(
        '/offerings/token-calculator',
        {
          tokenAmount: tokenAmt,
          paymentChoice: paymentChoice,
          tokenChoice: tokenChoice,
          payAmount: payAmount,
        }, // params (none in this case)
        // API_HEADER_CONFIG

        {
          ...API_HEADER_CONFIG,
          "Authorization": `Bearer ${await AsyncStorage.getItem("IDToken")}`,
          "x-refresh-token": `${await AsyncStorage.getItem("RefreshToken")}`
        }
      );

      console.log('calculate token amount response', response);
      if (response.success) {
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error: unknown) {
      let errorMessage = 'An unknown error occurred';

      // Narrow down to Error type
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      console.log(
        'Error',
        'An error occurred while calculate token amount. Please try again.'
      );
      return { success: false, error: errorMessage };
    }
  };



  return {
    details,
    calculateTokenAmt
  };
};
