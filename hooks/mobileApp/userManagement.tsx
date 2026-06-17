import MobileAppApiService from '@/services/MobileAppApiService';
import {
  ChangePasswordPayload,
  MobileAppAuthResponse,
  MobileAppUser,
  RegisterUserPayload,
  UpdateProfilePayload,
} from '@/types/mobileAppApi';
import { clearMobileAppAuth, persistMobileAppAuth } from '@/utils/mobileAppAuthUtils';

export const mobileAppUserManagement = () => {
  const register = async (payload: RegisterUserPayload) => {
    const response = await MobileAppApiService.post<MobileAppUser>('/users/register', payload);
    if (response.success) {
      return { success: true as const, data: response.data, status: response.status };
    }
    return { success: false as const, error: response.error, status: response.status };
  };

  const resendConfirmationEmail = async (email: string) => {
    const response = await MobileAppApiService.post('/users/register/resend', { email });
    if (response.success) {
      return { success: true as const, status: response.status };
    }
    return { success: false as const, error: response.error, status: response.status };
  };

  const login = async (email: string, password: string) => {
    const response = await MobileAppApiService.post<MobileAppAuthResponse>('/users/auth', {
      email,
      password,
    });

    if (response.success && response.data?.token) {
      await persistMobileAppAuth({
        token: response.data.token,
        expiresAt: response.data.expiresAt,
      });
      return { success: true as const, data: response.data, status: response.status };
    }

    return { success: false as const, error: response.error, status: response.status };
  };

  const initiatePasswordReset = async (email: string) => {
    const response = await MobileAppApiService.post('/users/password-reset/init', { email });
    if (response.success) {
      return { success: true as const, status: response.status };
    }
    return { success: false as const, error: response.error, status: response.status };
  };

  const getProfile = async () => {
    const response = await MobileAppApiService.get<MobileAppUser>('/users/me');
    if (response.success) {
      return { success: true as const, data: response.data, status: response.status };
    }
    return { success: false as const, error: response.error, status: response.status };
  };

  const updateProfile = async (payload: UpdateProfilePayload) => {
    const response = await MobileAppApiService.patch<MobileAppUser>('/users/me', payload);
    if (response.success) {
      return { success: true as const, data: response.data, status: response.status };
    }
    return { success: false as const, error: response.error, status: response.status };
  };

  const uploadProfileImage = async (file: { uri: string; name: string; type: string }) => {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as unknown as Blob);

    const response = await MobileAppApiService.postFormData<{ profileImageUrl: string }>(
      '/users/me/profile-image',
      formData,
    );

    if (response.success) {
      return { success: true as const, data: response.data, status: response.status };
    }
    return { success: false as const, error: response.error, status: response.status };
  };

  const changePassword = async (payload: ChangePasswordPayload) => {
    const response = await MobileAppApiService.post('/users/me/password', payload);
    if (response.success) {
      return { success: true as const, status: response.status };
    }
    return { success: false as const, error: response.error, status: response.status };
  };

  const deleteAccount = async () => {
    const response = await MobileAppApiService.delete('/users/me');
    if (response.success) {
      await clearMobileAppAuth();
      return { success: true as const, status: response.status };
    }
    return { success: false as const, error: response.error, status: response.status };
  };

  const logout = async () => {
    await clearMobileAppAuth();
    return { success: true as const };
  };

  return {
    register,
    resendConfirmationEmail,
    login,
    initiatePasswordReset,
    getProfile,
    updateProfile,
    uploadProfileImage,
    changePassword,
    deleteAccount,
    logout,
  };
};
