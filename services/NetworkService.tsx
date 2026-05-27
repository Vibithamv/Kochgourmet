import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig, AxiosHeaders } from "axios";
import { CURRENT_ENVIRONMENT, ENVIRONMENT_CONFIG, EnvironmentName } from "../config/environment";
import { isApiAuthSessionError, updateAuthTokensFromHeaders } from "../utils/authUtils";


type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: any;
  status?: number;
};

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
        const status = error.response?.status;
        const payload = error.response?.data ?? error.message;
        if (!isApiAuthSessionError(status, payload)) {
          console.error("API Error:", payload);
        }
        throw error;
      }
    );
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

  /**
   * GET request
   */
  async get<T = any>(
    endpoint: string,
    params: Record<string, any> = {},
    config: Record<string, any> = {}
  ): Promise<ApiResponse<T>> {
    try {
      const axiosConfig =
        config.headers || config['Api-Key']
          ? { params, headers: config } // treat config as headers
          : { params, ...config };
      const response = await this.api.get<T>(endpoint, axiosConfig);
      return { success: true, data: response.data, status: response.status };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status,
      };
    }
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
    try {
      const response = await this.api.post<T>(endpoint, data, {
        ...config,
        headers: {
          ...config.headers,
          ...header,
        },
      });
      return { success: true, data: response.data, status: response.status };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status,
      };
    }
  }

  /**
   * PUT request
   */
  async put<T = any>(
    endpoint: string,
    data: any = {},
    config: AxiosRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.put<T>(endpoint, data, config);
      return { success: true, data: response.data, status: response.status };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status,
      };
    }
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
    try {
      const response = await this.api.patch<T>(endpoint, data, {
        ...config,
        headers: {
          ...config.headers,
          ...header,
        },
      });
      return { success: true, data: response.data, status: response.status };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status,
      };
    }
  }

  /**
   * DELETE request
   */
  async delete<T = any>(
    endpoint: string,
    config: AxiosRequestConfig = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.delete<T>(endpoint, config);
      return { success: true, data: response.data, status: response.status };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data || error.message,
        status: error.response?.status,
      };
    }
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
