import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { CURRENT_ENVIRONMENT, EnvironmentName } from '@/config/environment';
import {
  MOBILE_APP_API_HEADER_CONFIG,
  MOBILE_APP_JWT_STORAGE_KEY,
} from '@/config/mobileAppApiConfig';
import { getMobileAppEnvironmentConfig } from '@/config/mobileAppEnvironment';

export type MobileAppApiResponse<T = unknown> = {
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

function buildRecipeListParams(params: Record<string, QueryValue | undefined> = {}): string {
  return serializeQueryParams(params);
}

class MobileAppApiService {
  private environment: EnvironmentName;
  private readonly api: AxiosInstance;

  constructor() {
    this.environment = CURRENT_ENVIRONMENT;
    const envConfig = getMobileAppEnvironmentConfig(this.environment);

    this.api = axios.create({
      baseURL: envConfig.baseURL,
      timeout: envConfig.timeout,
      headers: {
        ...MOBILE_APP_API_HEADER_CONFIG,
      },
      paramsSerializer: {
        serialize: serializeQueryParams,
      },
    });

    this.api.interceptors.request.use(
      async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
        const jwt = await AsyncStorage.getItem(MOBILE_APP_JWT_STORAGE_KEY);
        if (jwt) {
          config.headers.set('Authorization', `Bearer ${jwt}`);
        }
        return config;
      },
      (error: AxiosError) => Promise.reject(error),
    );

    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => {
        console.error('Mobile App API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      },
    );
  }

  setEnvironment(env: EnvironmentName): void {
    const envConfig = getMobileAppEnvironmentConfig(env);
    if (!envConfig) return;
    this.environment = env;
    this.api.defaults.baseURL = envConfig.baseURL;
    this.api.defaults.timeout = envConfig.timeout;
  }

  getEnvironment(): EnvironmentName {
    return this.environment;
  }

  private async request<T>(
    executor: () => Promise<AxiosResponse<T>>,
  ): Promise<MobileAppApiResponse<T>> {
    try {
      const response = await executor();
      return { success: true, data: response.data, status: response.status };
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data || error.message,
          status: error.response?.status,
        };
      }
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async get<T = unknown>(
    endpoint: string,
    params: Record<string, QueryValue | undefined> = {},
    config: AxiosRequestConfig = {},
  ): Promise<MobileAppApiResponse<T>> {
    return this.request(() => this.api.get<T>(endpoint, { ...config, params }));
  }

  async post<T = unknown>(
    endpoint: string,
    data: unknown = {},
    config: AxiosRequestConfig = {},
  ): Promise<MobileAppApiResponse<T>> {
    return this.request(() => this.api.post<T>(endpoint, data, config));
  }

  async patch<T = unknown>(
    endpoint: string,
    data: unknown = {},
    config: AxiosRequestConfig = {},
  ): Promise<MobileAppApiResponse<T>> {
    return this.request(() => this.api.patch<T>(endpoint, data, config));
  }

  async delete<T = unknown>(
    endpoint: string,
    config: AxiosRequestConfig = {},
  ): Promise<MobileAppApiResponse<T>> {
    return this.request(() => this.api.delete<T>(endpoint, config));
  }

  async postFormData<T = unknown>(
    endpoint: string,
    formData: FormData,
    config: AxiosRequestConfig = {},
  ): Promise<MobileAppApiResponse<T>> {
    return this.request(() =>
      this.api.post<T>(endpoint, formData, {
        ...config,
        headers: {
          ...config.headers,
          'Content-Type': 'multipart/form-data',
        },
      }),
    );
  }

  buildRecipeQuery(params: Record<string, QueryValue | undefined> = {}): string {
    return buildRecipeListParams(params);
  }
}

export default new MobileAppApiService();
