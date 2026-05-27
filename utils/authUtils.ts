import AsyncStorage from '@react-native-async-storage/async-storage';
import { AxiosResponseHeaders, RawAxiosResponseHeaders } from 'axios';

const AUTH_TOKEN_KEYS = [
  'AccessToken',
  'RefreshToken',
  'IDToken',
  'Session',
  'AccountID',
] as const;

function isNotAuthorizedPayload(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    return (
      lower.includes('notauthorizedexception') ||
      lower.includes('not authorized')
    );
  }
  if (typeof value !== 'object') return false;
  const o = value as Record<string, unknown>;
  if (o.__type === 'NotAuthorizedException' || o.name === 'NotAuthorizedException') {
    return true;
  }
  if (o.message != null) return isNotAuthorizedPayload(o.message);
  return false;
}

/** Cognito often returns HTTP 400 + NotAuthorizedException when tokens are cleared or invalid. */
export function isApiAuthSessionError(
  status?: number,
  error?: unknown
): boolean {
  if (status === 401) return true;
  if (status === 400 && isNotAuthorizedPayload(error)) return true;
  return isNotAuthorizedPayload(error);
}

export async function clearStoredAuthTokens(): Promise<void> {
  await Promise.all(AUTH_TOKEN_KEYS.map((key) => AsyncStorage.removeItem(key)));
}

export const updateAuthTokensFromHeaders = async (
  headers: AxiosResponseHeaders | RawAxiosResponseHeaders | undefined,
) => {
    if (!headers) return;

    // Axios headers are usually lowercased, but checking both just in case
    const accessToken = headers['x-access-token'] || headers['X-Access-Token'];
    const refreshToken = headers['x-refresh-token'] || headers['X-Refresh-Token'];
    const idToken = headers['x-id-token'] || headers['X-Id-Token'];
    const session = headers['x-session'] || headers['X-Session'];

    try {
        const updates = [];
        if (accessToken) {
            updates.push(AsyncStorage.setItem('AccessToken', accessToken));
        }
        if (refreshToken) {
            updates.push(AsyncStorage.setItem('RefreshToken', refreshToken));
        }
        if (idToken) {
            updates.push(AsyncStorage.setItem('IDToken', idToken));
        }
        if (session) {
            updates.push(AsyncStorage.setItem('Session', session));
        }

        if (updates.length > 0) {
            await Promise.all(updates);
            console.log('Auth tokens updated from headers');
        }
    } catch (error) {
        console.error('Error updating auth tokens from headers:', error);
    }
};

export const updateAuthTokensFromResponse = async (authResult: any) => {
    if (!authResult) return;
    const accessToken = authResult.AccessToken;
    const refreshToken = authResult.RefreshToken;
    const idToken = authResult.IdToken;

    try {
        const updates = [];
        if (accessToken) {
            updates.push(AsyncStorage.setItem('AccessToken', accessToken));
        }
        if (refreshToken) {
            updates.push(AsyncStorage.setItem('RefreshToken', refreshToken));
        }
        if (idToken) {
            updates.push(AsyncStorage.setItem('IDToken', idToken));
        }

        if (updates.length > 0) {
            await Promise.all(updates);
            console.log('Auth tokens updated from login response');
        }
    } catch (error) {
        console.error('Error updating auth tokens from login response:', error);
    }
};
