import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from '../types';
import NetworkService from '@/services/NetworkService';
import { API_HEADER_CONFIG } from '@/config/apiHeaderConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearStoredAuthTokens, updateAuthTokensFromResponse } from '@/utils/authUtils';
import { unregisterPushTokenOnSignOut } from '@/utils/unregisterPushTokenOnSignOut';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; data?: any; error?: any }>;
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
        const accessToken = await AsyncStorage.getItem('AccessToken');
        const refreshToken = await AsyncStorage.getItem('RefreshToken');

        if (accessToken && refreshToken) {
          setUser({
            email: '', // If available, fetch user details or decode token
            accessToken,
            refreshToken,
            firstName: '',
            lastName: ''
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
      console.log('response...oauth2..',
        JSON.stringify(response, null, 2)
      );

      if (response.success) {
        await updateAuthTokensFromResponse(response.data.data.authentication_result);
        // if (JSON.stringify(response.data.data.activeAccount) !== '{}') {
        //   await AsyncStorage.setItem('AccountID', response.data.data.activeAccount.id);
        // }
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
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      const payload = {
        type: 'SIGNIN',
        email: email,
        password: password
      };
      const response = await NetworkService.post("/signin", payload, API_HEADER_CONFIG);
      console.log('response.....',
        JSON.stringify(response, null, 2)
      );

      if (response.success) {
        await updateAuthTokensFromResponse(response.data.data.authentication_result)
        if (JSON.stringify(response.data.data.activeAccount) !== '{}') {
          await AsyncStorage.setItem('AccountID', response.data.data.activeAccount.id)
        }
        const user: User = {
          email: email,
          accessToken: response.data.data.authentication_result.access_token,
          refreshToken: response.data.data.authentication_result.refresh_token,
          firstName: response.data.data.user.first_name,
          lastName: response.data.data.user.last_name

        };
        setUser(user);
        // await AsyncStorage.setItem('User',JSON.stringify(user))
        return { success: true, data: response.data };
      } else {
        console.log(
          "Login failed",
          response.error
        );
        return { success: false, error: response.error };
      }
    } catch (error: unknown) {
      let errorMessage = "An unexpected error occurred.";

      if (error instanceof Error) {
        // Safe to access error.message
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }
      console.log(
        "Error",
        error
      );
      return { success: false, error: errorMessage };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await unregisterPushTokenOnSignOut();
      await clearStoredAuthTokens();
      setUser(null);
    } catch (err) {
      console.error("Logout failed", err);
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

