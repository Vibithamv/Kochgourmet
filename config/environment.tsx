// Define allowed environment names
export type EnvironmentName = 'dev' | 'stage' | 'prod';

// Define structure for each environment config
export interface EnvironmentConfig {
  name: string;
  baseURL: string;
  timeout: number;
  debug: boolean;
}

// Detect current environment (React Native provides __DEV__)
export const CURRENT_ENVIRONMENT: EnvironmentName = __DEV__ ? 'dev' : 'prod';

// Environment-specific settings
export const ENVIRONMENT_CONFIG: Record<EnvironmentName, EnvironmentConfig> = {
  dev: {
    name: 'Development',
     baseURL: 'https://stage.go.floris3.com/portal',
    //baseURL: 'https://dev.go.simplytokenized.com/portal',
    timeout: 10000,
    debug: true,
  },
  stage: {
    name: 'Staging',
     baseURL: 'https://stage.go.floris3.com/portal',
    //baseURL: 'https://go.simplytokenized.com/portal',
    timeout: 15000,
    debug: true,
  },
  prod: {
    name: 'Production',
     baseURL: 'https://stage.go.floris3.com/portal',
     //baseURL: 'https://dev.go.simplytokenized.com/portal',
    timeout: 15000,
    debug: false,
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
