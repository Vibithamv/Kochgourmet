import { API_HEADER_CONFIG } from '@/config/apiHeaderConfig';
import NetworkService from '../services/NetworkService';

export const platformValidation = () => {

  const validatePlatform = async () => {
    try {

      const response = await NetworkService.get(
        '/validate-platform',
        {},
      API_HEADER_CONFIG
      );
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
        'An error occurred while validating platform. Please try again.'
      );
      return { success: false, error: errorMessage };
    }
  };

  return {
    validatePlatform
  };
};
