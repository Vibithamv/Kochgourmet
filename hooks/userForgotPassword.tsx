import { API_HEADER_CONFIG } from '@/config/apiHeaderConfig';
import NetworkService from '../services/NetworkService';

export const userForgotPassword = () => {

  const forgotPassword = async (type:string,email:string,password:string,confirmationCode:string) => {
    try {
        let payload = {};
        if(type === 'FORGOT_PASSWORD'){
         payload = {
                type: 'FORGOT_PASSWORD',
        email: email
      };
    } else if(type === 'CONFIRM_FORGOT_PASSWORD'){
     payload = {
                type: 'CONFIRM_FORGOT_PASSWORD',
                password:password,
  confirmationCode:confirmationCode,
  email: email

        };
    }

      const response = await NetworkService.post(
        '/forgot-password',
       payload, // params (none in this case)
        API_HEADER_CONFIG
      );

      console.log('forgot password response', response);
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
        'An error occurred while resetting password. Please try again.'
      );
      return { success: false, error: errorMessage };
    }
  };


  return {
    forgotPassword,
  };
};
