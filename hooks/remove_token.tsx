import { API_HEADER_CONFIG } from '@/config/apiHeaderConfig';
import NetworkService from '../services/NetworkService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const RemoveToken = () => {

  const request = async (token: string, device_id: string) => {
    console.log('remove token called with', token, device_id);
    try {

      const response = await NetworkService.post(
        '/remove-token',
        {
          token,
          device_id
        },
        {
          ...API_HEADER_CONFIG,
          "Authorization": `Bearer ${await AsyncStorage.getItem("IDToken")}`,
          "x-refresh-token": `${await AsyncStorage.getItem("RefreshToken")}`
        }
      );

      console.log('remove token response', JSON.stringify(response, null, 2));
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
