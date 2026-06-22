import axios from 'axios';
import {
  KOCHGOURMET_API_BASE_URL,
  KOCHGOURMET_API_HEADERS,
} from '@/config/kochgourmetApiConfig';
import { KOCHGOURMET_OPERATIONS } from '@/config/kochgourmetApi';
import type { KochgourmetRefreshResponse } from '@/types/kochgourmetApi';
import { redactBody } from '@/utils/apiLogger';
import { getMobileAppRefreshToken, persistMobileAppAuth } from '@/utils/mobileAppAuthUtils';

export const KOCHGOURMET_TOKEN_EXPIRED_CODE = 'kochgourmet_access_token_expired';

let refreshInFlight: Promise<boolean> | null = null;

function extractErrorPayload(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== 'object') return null;

  const obj = data as Record<string, unknown>;
  if (typeof obj.code === 'string') return obj;

  if (obj.error && typeof obj.error === 'object') {
    const nested = obj.error as Record<string, unknown>;
    if (typeof nested.code === 'string') return nested;
  }

  return null;
}

export function isKochgourmetTokenExpiredError(data: unknown): boolean {
  const payload = extractErrorPayload(data);
  return payload?.code === KOCHGOURMET_TOKEN_EXPIRED_CODE;
}

export async function refreshKochgourmetAccessToken(): Promise<boolean> {
  if (refreshInFlight !== null) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const refreshToken = await getMobileAppRefreshToken();
    if (!refreshToken) {
      console.warn('[Kochgourmet] token refresh skipped — no refresh token');
      return false;
    }

    console.log('[Kochgourmet] request', {
      type: KOCHGOURMET_OPERATIONS.refresh,
      method: 'POST',
      url: KOCHGOURMET_API_BASE_URL,
      body: redactBody({ type: 'refresh', body: { refreshToken } }),
    });

    try {
      const response = await axios.post<KochgourmetRefreshResponse>(
        KOCHGOURMET_API_BASE_URL,
        {
          type: KOCHGOURMET_OPERATIONS.refresh,
          body: { refreshToken },
        },
        {
          timeout: 15000,
          headers: {
            ...KOCHGOURMET_API_HEADERS,
          },
        },
      );

      if (!response.data?.token) {
        console.warn('[Kochgourmet] token refresh failed — missing token in response');
        return false;
      }

      await persistMobileAppAuth({
        token: response.data.token,
        refreshToken: response.data.refreshToken,
        expiresAt: response.data.expiresAt,
      });

      console.log('[Kochgourmet] response', {
        type: KOCHGOURMET_OPERATIONS.refresh,
        method: 'POST',
        status: response.status,
        success: true,
      });

      return true;
    } catch (error: unknown) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      let refreshError: unknown = 'Unknown error';
      if (axios.isAxiosError(error)) {
        refreshError = error.response?.data ?? error.message;
      } else if (error instanceof Error) {
        refreshError = error.message;
      }

      console.log('[Kochgourmet] response', {
        type: KOCHGOURMET_OPERATIONS.refresh,
        method: 'POST',
        status,
        success: false,
        error: refreshError,
      });

      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}
