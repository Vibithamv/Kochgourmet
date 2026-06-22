import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import {
  KOCHGOURMET_API_BASE_URL,
  KOCHGOURMET_API_HEADERS,
} from '@/config/kochgourmetApiConfig';
import type {
  KochgourmetOperationType,
  KochgourmetPathParams,
} from '@/config/kochgourmetApi';
import { KOCHGOURMET_OPERATIONS } from '@/config/kochgourmetApi';
import { MOBILE_APP_JWT_STORAGE_KEY, MOBILE_APP_REFRESH_TOKEN_STORAGE_KEY } from '@/config/mobileAppApiConfig';
import { redactBody } from '@/utils/apiLogger';
import { persistMobileAppAuth } from '@/utils/mobileAppAuthUtils';
import {
  isKochgourmetTokenExpiredError,
  refreshKochgourmetAccessToken,
} from '@/utils/kochgourmetTokenRefresh';

const AUTH_OPERATIONS_WITHOUT_REFRESH = new Set<KochgourmetOperationType>([
  KOCHGOURMET_OPERATIONS.refresh,
  KOCHGOURMET_OPERATIONS.login,
  KOCHGOURMET_OPERATIONS.register,
  KOCHGOURMET_OPERATIONS.registerResend,
  KOCHGOURMET_OPERATIONS.registerConfirm,
  KOCHGOURMET_OPERATIONS.passwordResetInit,
]);

export type KochgourmetApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: unknown;
  status?: number;
};

export type QueryPrimitive = string | number | boolean;
export type QueryValue =
  | QueryPrimitive
  | QueryPrimitive[]
  | Record<string, QueryPrimitive | undefined>;

function serializeQueryParams(params: Record<string, QueryValue | undefined>): string {
  const parts: string[] = [];

  const append = (key: string, value: QueryPrimitive) => {
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  };

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (Array.isArray(value)) {
      value.forEach((item) => append(key, item));
      return;
    }

    if (typeof value === 'object') {
      Object.entries(value).forEach(([nestedKey, nestedValue]) => {
        if (nestedValue !== undefined && nestedValue !== null) {
          append(`${key}[${nestedKey}]`, nestedValue);
        }
      });
      return;
    }

    append(key, value);
  });

  return parts.join('&');
}

function buildProxyPayload(
  type: KochgourmetOperationType,
  body: Record<string, unknown>,
  pathParams: KochgourmetPathParams,
): Record<string, unknown> {
  if (Object.keys(pathParams).length > 0) {
    return { type, pathParams, body };
  }
  return { type, body };
}

type ProxyLogMeta = Readonly<{
  operation: KochgourmetOperationType;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  pathParams?: KochgourmetPathParams;
  query?: Record<string, QueryValue | undefined>;
  body?: Record<string, unknown>;
}>;

function logProxyRequest(meta: ProxyLogMeta): void {
  console.log('[Kochgourmet] request', {
    type: meta.operation,
    method: meta.method,
    url: KOCHGOURMET_API_BASE_URL,
    pathParams: meta.pathParams,
    query: meta.query,
    body: redactBody(meta.body),
  });
}

function logProxyResponse(
  meta: ProxyLogMeta,
  result: KochgourmetApiResponse<unknown>,
): void {
  console.log('[Kochgourmet] response', {
    type: meta.operation,
    method: meta.method,
    status: result.status,
    success: result.success,
    data: JSON.stringify(result.data),
    error: result.error,
  });
}

class KochgourmetApiService {
  private readonly api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: KOCHGOURMET_API_BASE_URL,
      timeout: 15000,
      headers: {
        ...KOCHGOURMET_API_HEADERS,
      },
      paramsSerializer: {
        serialize: serializeQueryParams,
      },
    });

    this.api.interceptors.request.use(
      async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
        const jwt = await AsyncStorage.getItem(MOBILE_APP_JWT_STORAGE_KEY);
        const refreshToken = await AsyncStorage.getItem(MOBILE_APP_REFRESH_TOKEN_STORAGE_KEY);
        if (jwt) {
          config.headers.set('Authorization', `Bearer ${jwt}`);
        }
        if (refreshToken) {
          config.headers.set('x-refresh-token', refreshToken);
        }
        return config;
      },
      (error: AxiosError) => Promise.reject(error),
    );

    this.api.interceptors.response.use(
      async (response: AxiosResponse) => {
        const data = response.data;
        if (data && typeof data === 'object' && 'token' in data && typeof data.token === 'string') {
          await persistMobileAppAuth({
            token: data.token,
            refreshToken:
              'refreshToken' in data && typeof data.refreshToken === 'string'
                ? data.refreshToken
                : undefined,
            expiresAt:
              'expiresAt' in data && typeof data.expiresAt === 'string' ? data.expiresAt : undefined,
          });
        }
        return response;
      },
      (error: AxiosError) => Promise.reject(error),
    );
  }

  get client(): AxiosInstance {
    return this.api;
  }

  private shouldAttemptTokenRefresh(
    operation: KochgourmetOperationType | undefined,
    isRetry: boolean,
  ): boolean {
    return !isRetry && !!operation && !AUTH_OPERATIONS_WITHOUT_REFRESH.has(operation);
  }

  private async request<T>(
    executor: () => Promise<AxiosResponse<T>>,
    meta?: ProxyLogMeta,
    isRetry = false,
  ): Promise<KochgourmetApiResponse<T>> {
    if (meta) {
      logProxyRequest(meta);
    }

    try {
      const response = await executor();

      if (
        this.shouldAttemptTokenRefresh(meta?.operation, isRetry) &&
        isKochgourmetTokenExpiredError(response.data)
      ) {
        const refreshed = await refreshKochgourmetAccessToken();
        if (refreshed) {
          return this.request(executor, meta, true);
        }

        const expiredResult: KochgourmetApiResponse<T> = {
          success: false,
          error: response.data,
          status: response.status,
        };
        if (meta) {
          logProxyResponse(meta, expiredResult);
        }
        return expiredResult;
      }

      const result: KochgourmetApiResponse<T> = {
        success: true,
        data: response.data,
        status: response.status,
      };
      if (meta) {
        logProxyResponse(meta, result);
      }
      return result;
    } catch (error: unknown) {
      if (
        this.shouldAttemptTokenRefresh(meta?.operation, isRetry) &&
        axios.isAxiosError(error) &&
        isKochgourmetTokenExpiredError(error.response?.data)
      ) {
        const refreshed = await refreshKochgourmetAccessToken();
        if (refreshed) {
          return this.request(executor, meta, true);
        }
      }

      const result: KochgourmetApiResponse<T> = axios.isAxiosError(error)
        ? {
            success: false,
            error: error.response?.data ?? error.message,
            status: error.response?.status,
          }
        : {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
      if (meta) {
        logProxyResponse(meta, result);
      }
      return result;
    }
  }

  /** GET /kochgourmet?type=...&id=... */
  proxyGet<T = unknown>(
    type: KochgourmetOperationType,
    pathParams: KochgourmetPathParams = {},
    query: Record<string, QueryValue | undefined> = {},
    config: AxiosRequestConfig = {},
  ): Promise<KochgourmetApiResponse<T>> {
    return this.request(
      () =>
        this.api.get<T>('', {
          ...config,
          params: { type, ...pathParams, ...query },
        }),
      { operation: type, method: 'GET', pathParams, query },
    );
  }

  /** POST /kochgourmet { type, pathParams?, body? } */
  proxyPost<T = unknown>(
    type: KochgourmetOperationType,
    body: Record<string, unknown> = {},
    pathParams: KochgourmetPathParams = {},
    config: AxiosRequestConfig = {},
  ): Promise<KochgourmetApiResponse<T>> {
    const payload = buildProxyPayload(type, body, pathParams);
    return this.request(
      () => this.api.post<T>('', payload, config),
      { operation: type, method: 'POST', pathParams, body: payload },
    );
  }

  /** PATCH /kochgourmet { type, pathParams?, body? } */
  proxyPatch<T = unknown>(
    type: KochgourmetOperationType,
    body: Record<string, unknown> = {},
    pathParams: KochgourmetPathParams = {},
    config: AxiosRequestConfig = {},
  ): Promise<KochgourmetApiResponse<T>> {
    const payload = buildProxyPayload(type, body, pathParams);
    return this.request(
      () => this.api.patch<T>('', payload, config),
      { operation: type, method: 'PATCH', pathParams, body: payload },
    );
  }

  /** DELETE /kochgourmet { type, pathParams?, body? } */
  proxyDelete<T = unknown>(
    type: KochgourmetOperationType,
    pathParams: KochgourmetPathParams = {},
    body: Record<string, unknown> = {},
    config: AxiosRequestConfig = {},
  ): Promise<KochgourmetApiResponse<T>> {
    const payload = buildProxyPayload(type, body, pathParams);
    return this.request(
      () => this.api.delete<T>('', { ...config, data: payload }),
      { operation: type, method: 'DELETE', pathParams, body: payload },
    );
  }
}

export default new KochgourmetApiService();
