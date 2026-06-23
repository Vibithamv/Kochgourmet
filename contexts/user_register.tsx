import { mobileAppUserManagement } from '@/hooks/mobileApp';
import type { RegisterUserPayload, MobileAppUser } from '@/types/mobileAppApi';

type RegisterApiResult =
  | { success: true; data: MobileAppUser | undefined }
  | { success: false; error: unknown; status?: number };

export const userRegister = () => {
  const api = mobileAppUserManagement();

  const userRegisterApi = async (payload: RegisterUserPayload): Promise<RegisterApiResult> => {
    try {
      const response = await api.register(payload);

      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false, error: response.error, status: response.status };
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
