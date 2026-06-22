import KochgourmetApiService from '@/services/KochgourmetApiService';
import { KOCHGOURMET_OPERATIONS } from '@/config/kochgourmetApi';
import {
  ChangePasswordPayload,
  MobileAppAuthResponse,
  MobileAppUser,
  RegisterUserPayload,
  UpdateProfilePayload,
  UploadProfileImagePayload,
} from '@/types/mobileAppApi';
import { clearMobileAppAuth, persistMobileAppAuth } from '@/utils/mobileAppAuthUtils';

export interface RegisterConfirmPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  confirmationCode: string;
}

function asProxyBody<T extends object>(payload: T): Record<string, unknown> {
  return payload as Record<string, unknown>;
}

export const mobileAppUserManagement = () => {
  const register = async (payload: RegisterUserPayload) => {
    const response = await KochgourmetApiService.proxyPost<MobileAppUser>(
      KOCHGOURMET_OPERATIONS.register,
      asProxyBody(payload),
    );
    if (response.success) {
      return { success: true as const, data: response.data, status: response.status };
    }
    return { success: false as const, error: response.error, status: response.status };
  };

  const confirmRegistration = async (payload: RegisterConfirmPayload) => {
    const response = await KochgourmetApiService.proxyPost<MobileAppAuthResponse>(
      KOCHGOURMET_OPERATIONS.registerConfirm,
      asProxyBody(payload),
    );

    if (response.success && response.data?.token) {
      await persistMobileAppAuth({
        token: response.data.token,
        refreshToken: response.data.refreshToken,
        expiresAt: response.data.expiresAt,
      });
      return { success: true as const, data: response.data, status: response.status };
    }

    if (response.success) {
      return { success: true as const, data: response.data, status: response.status };
    }

    return { success: false as const, error: response.error, status: response.status };
  };

  const resendConfirmationEmail = async (email: string) => {
    const response = await KochgourmetApiService.proxyPost(
      KOCHGOURMET_OPERATIONS.registerResend,
      { email },
    );
    if (response.success) {
      return { success: true as const, status: response.status };
    }
    return { success: false as const, error: response.error, status: response.status };
  };

  const login = async (email: string, password: string) => {
    const response = await KochgourmetApiService.proxyPost<MobileAppAuthResponse>(
      KOCHGOURMET_OPERATIONS.login,
      { email, password },
    );

    if (response.success && response.data?.token) {
      await persistMobileAppAuth({
        token: response.data.token,
        refreshToken: response.data.refreshToken,
        expiresAt: response.data.expiresAt,
      });
      return { success: true as const, data: response.data, status: response.status };
    }

    return { success: false as const, error: response.error, status: response.status };
  };

  const initiatePasswordReset = async (email: string) => {
    const response = await KochgourmetApiService.proxyPost(
      KOCHGOURMET_OPERATIONS.passwordResetInit,
      { email },
    );
    if (response.success) {
      return { success: true as const, status: response.status };
    }
    return { success: false as const, error: response.error, status: response.status };
  };

  const getProfile = async () => {
    const response = await KochgourmetApiService.proxyGet<MobileAppUser>(
      KOCHGOURMET_OPERATIONS.getProfile,
    );
    if (response.success) {
      return { success: true as const, data: response.data, status: response.status };
    }
    return { success: false as const, error: response.error, status: response.status };
  };

  const updateProfile = async (payload: UpdateProfilePayload) => {
    const response = await KochgourmetApiService.proxyPatch<MobileAppUser>(
      KOCHGOURMET_OPERATIONS.updateProfile,
      asProxyBody(payload),
    );
    if (response.success) {
      return { success: true as const, data: response.data, status: response.status };
    }
    return { success: false as const, error: response.error, status: response.status };
  };

  const uploadProfileImage = async (payload: UploadProfileImagePayload) => {
    const response = await KochgourmetApiService.proxyPost<MobileAppUser>(
      KOCHGOURMET_OPERATIONS.uploadProfileImage,
      asProxyBody(payload),
    );
    if (response.success) {
      return { success: true as const, data: response.data, status: response.status };
    }
    return { success: false as const, error: response.error, status: response.status };
  };

  const changePassword = async ({ currentPassword, newPassword }: ChangePasswordPayload) => {
    const response = await KochgourmetApiService.proxyPost(
      KOCHGOURMET_OPERATIONS.changePassword,
      { currentPassword, newPassword },
    );
    if (response.success) {
      return { success: true as const, status: response.status };
    }
    return { success: false as const, error: response.error, status: response.status };
  };

  const deleteAccount = async () => {
    const response = await KochgourmetApiService.proxyDelete(KOCHGOURMET_OPERATIONS.deleteAccount);
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
    confirmRegistration,
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
