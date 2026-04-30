import AsyncStorage from '@react-native-async-storage/async-storage';
import { AxiosResponseHeaders, RawAxiosResponseHeaders } from 'axios';

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
