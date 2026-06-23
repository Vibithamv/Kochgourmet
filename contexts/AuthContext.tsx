import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from '../types';
import NetworkService from '@/services/NetworkService';
import { API_HEADER_CONFIG } from '@/config/apiHeaderConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateAuthTokensFromResponse } from '@/utils/authUtils';
import { unregisterPushTokenOnSignOut } from '@/utils/unregisterPushTokenOnSignOut';
import { mobileAppUserManagement } from '@/hooks/mobileApp';
import {
  clearMobileAppAuth,
  getMobileAppJwt,
  getMobileAppRefreshToken,
  persistMobileAppAuth,
} from '@/utils/mobileAppAuthUtils';
import { resolveMobileAppAuthUser } from '@/utils/mobileAppAuthResponse';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; data?: any; error?: any; status?: number }>;
  /** Exchange Google OAuth authorization code (same redirect_uri as used when starting OAuth). */
  signInWithGoogleCode: (
    code: string,
    redirectUri: string
  ) => Promise<{ success: boolean; data?: any; error?: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = Readonly<{
  children: React.ReactNode;
}>;

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        const kochgourmetJwt = await getMobileAppJwt();
        const kochgourmetRefresh = await getMobileAppRefreshToken();

        if (kochgourmetJwt) {
          setUser({
            email: '',
            accessToken: kochgourmetJwt,
            refreshToken: kochgourmetRefresh ?? '',
            firstName: '',
            lastName: '',
          });
          return;
        }

        const accessToken = await AsyncStorage.getItem('AccessToken');
        const refreshToken = await AsyncStorage.getItem('RefreshToken');

        if (accessToken && refreshToken) {
          setUser({
            email: '',
            accessToken,
            refreshToken,
            firstName: '',
            lastName: '',
          });
        }
      } catch (err) {
        console.error('Error loading user', err);
      } finally {
        setLoading(false);
      }
    };

    loadUserFromStorage();
  }, []);

  const signInWithGoogleCode = useCallback(async (code: string, redirectUri: string) => {
    try {
      const payload = {
        code,
        redirect_uri: redirectUri,
      };
      const response = await NetworkService.post('/oauth2/token', payload, API_HEADER_CONFIG);

      if (response.success) {
        await updateAuthTokensFromResponse(response.data.data.authentication_result);
        const user: User = {
          email: response.data.data.user?.email ?? '',
          accessToken: response.data.data.authentication_result.access_token,
          refreshToken: response.data.data.authentication_result.refresh_token,
          firstName: response.data.data.user.first_name,
          lastName: response.data.data.user.last_name,
        };
        setUser(user);
        return { success: true, data: response.data };
      }
      return { success: false, error: response.error };
    } catch (error: unknown) {
      let errorMessage = 'An unexpected error occurred.';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      return { success: false, error: errorMessage };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const authApi = mobileAppUserManagement();

    try {
      const response = await authApi.login(email, password);

      if (!response.success || !response.data?.token) {
        return { success: false, error: response.error, status: response.status };
      }

      await persistMobileAppAuth({
        token: response.data.token,
        refreshToken: response.data.refreshToken,
        expiresAt: response.data.expiresAt,
      });

      const authUser = resolveMobileAppAuthUser(response.data, email);
      const nextUser: User = {
        email: authUser.email ?? email,
        accessToken: response.data.token,
        refreshToken: response.data.refreshToken ?? '',
        firstName: authUser.firstName,
        lastName: authUser.lastName,
      };
      setUser(nextUser);

      return {
        success: true,
        data: {
          data: {
            activeAccount: { kyc_status: 'CONFIRMED', id: '' },
            user: {
              first_name: authUser.firstName,
              last_name: authUser.lastName,
              id: String(authUser.uid),
            },
            authentication_result: {
              access_token: response.data.token,
              refresh_token: response.data.refreshToken ?? '',
            },
          },
        },
      };
    } catch (error: unknown) {
      let errorMessage = 'An unexpected error occurred.';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      return { success: false, error: errorMessage };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await unregisterPushTokenOnSignOut();
      await clearMobileAppAuth();
      await AsyncStorage.removeItem('AccountID');
      setUser(null);
    } catch (err) {
      console.error('Logout failed', err);
    }
  }, []);

  const contextValue = useMemo(
    () => ({ user, loading, signIn, signInWithGoogleCode, signOut }),
    [user, loading, signIn, signInWithGoogleCode, signOut]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
