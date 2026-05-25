// Define allowed environment names
export type EnvironmentName = 'dev' | 'stage' | 'prod';

// Tenant identifiers — these select which white-label tenant the backend serves.
// Not authentication secrets; safe to ship in source.
export interface TenantKeys {
  apiKey: string;
  investKey: string;
  iframePage: string;
}

export interface EnvironmentConfig {
  name: string;
  baseURL: string;
  timeout: number;
  debug: boolean;
  tenant: TenantKeys;
}

// Detect current environment (React Native provides __DEV__)
export const CURRENT_ENVIRONMENT: EnvironmentName = __DEV__ ? 'dev' : 'prod';

const ASSETERA_TENANT: TenantKeys = {
  apiKey: '747ea1cf4806d024a53b',
  investKey: '6ec73de16fa5f63ca99e',
  iframePage: 'localhost:5174',
};

// Environment-specific settings
export const ENVIRONMENT_CONFIG: Record<EnvironmentName, EnvironmentConfig> = {
  dev: {
    name: 'Development',
    baseURL: 'https://stage.go.floris3.com/portal',
    timeout: 10000,
    debug: true,
    tenant: ASSETERA_TENANT,
  },
  stage: {
    name: 'Staging',
    baseURL: 'https://stage.go.floris3.com/portal',
    timeout: 15000,
    debug: true,
    tenant: ASSETERA_TENANT,
  },
  prod: {
    name: 'Production',
    baseURL: 'https://stage.go.floris3.com/portal',
    timeout: 15000,
    debug: false,
    tenant: ASSETERA_TENANT,
  },
};

// Helper function to get current environment config
export const getCurrentEnvironmentConfig = (): EnvironmentConfig => {
  return ENVIRONMENT_CONFIG[CURRENT_ENVIRONMENT] || ENVIRONMENT_CONFIG.dev;
};

// Helper function to check if we're in development
export const isDevelopment = () => {
  return CURRENT_ENVIRONMENT === 'dev';
};

// Helper function to check if we're in production
export const isProduction = () => {
  return CURRENT_ENVIRONMENT === 'prod';
};
