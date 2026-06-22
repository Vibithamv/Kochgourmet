import { mobileAppUserManagement } from '@/hooks/mobileApp';
import type { RegisterUserPayload } from '@/types/mobileAppApi';

export const userRegister = () => {
  const api = mobileAppUserManagement();

  const userRegisterApi = async (payload: RegisterUserPayload) => {
    try {
      const response = await api.register(payload);

      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.error };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      return { success: false, error: errorMessage };
    }
  };

  const userRegisterConfirmationApi = async (
    firstName: string,
    lastName: string,
    password: string,
    email: string,
    confirmationCode: string,
  ) => {
    try {
      const response = await api.confirmRegistration({
        firstName,
        lastName,
        email,
        password,
        confirmationCode,
      });

      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.error };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      return { success: false, error: errorMessage };
    }
  };

  const userRegisterResendOTPApi = async (email: string) => {
    try {
      const response = await api.resendConfirmationEmail(email);
      if (response.success) {
        return { success: true, data: response };
      }
      return { success: false, error: response.error };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      return { success: false, error: errorMessage };
    }
  };

  return {
    userRegisterApi,
    userRegisterConfirmationApi,
    userRegisterResendOTPApi,
  };
};
