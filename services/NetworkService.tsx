import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig, AxiosHeaders } from "axios";
import { CURRENT_ENVIRONMENT, ENVIRONMENT_CONFIG, EnvironmentName } from "../config/environment";
import { updateAuthTokensFromHeaders } from "../utils/authUtils";
import { attachApiLoggingInterceptors } from "../utils/apiLogger";
import {
  isKochgourmetTokenExpiredError,
  refreshKochgourmetAccessToken,
} from "../utils/kochgourmetTokenRefresh";

type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: any;
  status?: number;
};

const ENDPOINTS_WITHOUT_TOKEN_REFRESH = new Set([
  "/validate-platform",
  "/oauth2/token",
]);

/** Platform validation and OAuth must not send stored user tokens — stale tokens can cause 401. */
const ENDPOINTS_WITHOUT_AUTH_HEADERS = new Set([
  "/validate-platform",
  "/oauth2/token",
]);

type RequestMeta = Readonly<{
  endpoint: string;
}>;

class NetworkService {
  private environment: EnvironmentName;
  private baseURL: string;
  private timeout: number;
  private readonly api: AxiosInstance;

  constructor() {
    this.environment = CURRENT_ENVIRONMENT;
    const envConfig = ENVIRONMENT_CONFIG[this.environment];
    this.baseURL = envConfig.baseURL;
    this.timeout = envConfig.timeout;

    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request Interceptor - Attach token
    this.api.interceptors.request.use(
      async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
        const requestPath = config.url ?? "";
        const skipAuthHeaders = [...ENDPOINTS_WITHOUT_AUTH_HEADERS].some(
          (endpoint) =>
            requestPath === endpoint || requestPath.endsWith(endpoint),
        );
        if (skipAuthHeaders) {
          return config;
        }
        try {
          const token = await AsyncStorage.getItem("IDToken");
          const refreshToken = await AsyncStorage.getItem("RefreshToken");
          if (token) {
            (config.headers as AxiosHeaders).set("Authorization", `Bearer ${token}`);
          }
          if (refreshToken) {
            (config.headers as AxiosHeaders).set("x-refresh-token", refreshToken);
          }
        } catch (error: unknown) {
          console.error("Error getting auth token:", error);
        }
        return config;
      },
      (error: AxiosError) => {
        throw error;
      }
    );

    // Response Interceptor - Error Handling
    this.api.interceptors.response.use(
      async (response: AxiosResponse) => {
        await updateAuthTokensFromHeaders(response.headers);
        return response;
      },
      async (error: AxiosError) => {
        if (error.response?.headers) {
          await updateAuthTokensFromHeaders(error.response.headers);
        }
        throw error;
      }
    );

    attachApiLoggingInterceptors(this.api, "NetworkService");
  }

  /**
   * Set environment
   */
  setEnvironment(env: EnvironmentName): void {
    if (ENVIRONMENT_CONFIG[env]) {
      this.environment = env;
      const envConfig = ENVIRONMENT_CONFIG[env];
      this.baseURL = envConfig.baseURL;
      this.timeout = envConfig.timeout;
      this.api.defaults.baseURL = this.baseURL;
      this.api.defaults.timeout = this.timeout;
    } else {
      console.warn(`Invalid environment: ${env}. Using default: dev`);
    }
  }

  getEnvironment(): string {
    return this.environment;
  }

  private shouldAttemptTokenRefresh(endpoint: string | undefined, isRetry: boolean): boolean {
    return !isRetry && !!endpoint && !ENDPOINTS_WITHOUT_TOKEN_REFRESH.has(endpoint);
  }

  private async request<T>(
    executor: () => Promise<AxiosResponse<T>>,
    meta?: RequestMeta,
    isRetry = false,
  ): Promise<ApiResponse<T>> {
    try {
      const response = await executor();

      if (
        this.shouldAttemptTokenRefresh(meta?.endpoint, isRetry) &&
        isKochgourmetTokenExpiredError(response.data)
      ) {
        const refreshed = await refreshKochgourmetAccessToken();
        if (refreshed) {
          return this.request(executor, meta, true);
        }

        return {
          success: false,
          error: response.data,
          status: response.status,
        };
      }

      return { success: true, data: response.data, status: response.status };
    } catch (error: unknown) {
      if (
        this.shouldAttemptTokenRefresh(meta?.endpoint, isRetry) &&
        axios.isAxiosError(error) &&
        isKochgourmetTokenExpiredError(error.response?.data)
      ) {
        const refreshed = await refreshKochgourmetAccessToken();
        if (refreshed) {
          return this.request(executor, meta, true);
        }
      }

      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data || error.message,
          status: error.response?.status,
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * GET request
   */
  async get<T = any>(
    endpoint: string,
    params: Record<string, any> = {},
    config: Record<string, any> = {}
  ): Promise<ApiResponse<T>> {
    const axiosConfig =
      config.headers || config['Api-Key']
        ? { params, headers: config }
        : { params, ...config };

    return this.request(
      () => this.api.get<T>(endpoint, axiosConfig),
      { endpoint },
    );
  }

  /**
   * POST request
   */
  async post<T = any>(
    endpoint: string,
    data: any = {},
    header: Record<string, string> = {},
    config: AxiosRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    return this.request(
      () =>
        this.api.post<T>(endpoint, data, {
          ...config,
          headers: {
            ...config.headers,
            ...header,
          },
        }),
      { endpoint },
    );
  }

  /**
   * PUT request
   */
  async put<T = any>(
    endpoint: string,
    data: any = {},
    config: AxiosRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    return this.request(() => this.api.put<T>(endpoint, data, config), { endpoint });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(
    endpoint: string,
    data: any = {},
    header: Record<string, string> = {},
    config: AxiosRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    return this.request(
      () =>
        this.api.patch<T>(endpoint, data, {
          ...config,
          headers: {
            ...config.headers,
            ...header,
          },
        }),
      { endpoint },
    );
  }

  /**
   * DELETE request
   */
  async delete<T = any>(
    endpoint: string,
    config: AxiosRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    return this.request(() => this.api.delete<T>(endpoint, config), { endpoint });
  }

  /**
   * AsyncStorage Helpers
   */
  async storeData(key: string, data: any): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error storing data for key ${key}:`, error);
    }
  }

  // async getStoredData<T = any>(key: string): Promise<T | null> {
  //   try {
  //     const data = await AsyncStorage.getItem(key);
  //     return data ? JSON.parse(data) : null;
  //   } catch (error) {
  //     console.error(`Error retrieving data for key ${key}:`, error);
  //     return null;
  //   }
  // }

  async removeStoredData(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing data for key ${key}:`, error);
    }
  }
}

export default new NetworkService();
