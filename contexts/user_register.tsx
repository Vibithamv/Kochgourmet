import { API_HEADER_CONFIG } from '@/config/apiHeaderConfig';
import NetworkService from '../services/NetworkService';

export const userRegister = (
) => {
  const userRegisterApi = async (  firstName: string,
  lastName: string,
  password: string,
  email: string) => {
    try {
       const payload = {
        type: 'SIGNUP',
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: password,
      };
      const response = await NetworkService.post('/signup', payload ,API_HEADER_CONFIG);

      console.log('signup response', response)
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
        'An error occurred during registration. Please try again.'
      );
      return { success: false, error: errorMessage };
    }
  };

    const userRegisterConfirmationApi = async (firstName: string, lastName: string, password: string,
       email: string, confirmationCode: string) => {
    try {
      const response = await NetworkService.post('/signup', {
         "type": "CONFIRM",
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: password,
        confirmationCode: confirmationCode
      },API_HEADER_CONFIG);

      console.log('signup confirmation response', response)
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
        'An error occurred during confirmation. Please try again.'
      );
      return { success: false, error: errorMessage };
    }
  };

    const userRegisterResendOTPApi = async (email: string) => {
    try {
      const response = await NetworkService.post('/signup', {
         "type": "RESEND",
        email: email
      },API_HEADER_CONFIG);

      console.log('Resend OTP response', response)
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
        'An error occurred during resend OTP. Please try again.'
      );
      return { success: false, error: errorMessage };
    }
  };

  return {
    userRegisterApi,
     userRegisterConfirmationApi,
     userRegisterResendOTPApi
  };
  
};
