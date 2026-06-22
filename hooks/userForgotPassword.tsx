import { mobileAppUserManagement } from '@/hooks/mobileApp';

export const userForgotPassword = () => {
  const api = mobileAppUserManagement();

  const forgotPassword = async (email: string) => {
    try {
      const response = await api.initiatePasswordReset(email);
      if (response.success) {
        return { success: true, status: response.status, data: response.data };
      }
      return { success: false, error: response.error, status: response.status };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      return { success: false, error: errorMessage };
    }
  };

  return {
    forgotPassword,
  };
};
