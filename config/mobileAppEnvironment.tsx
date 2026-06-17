import { EnvironmentName } from './environment';

export interface MobileAppEnvironmentConfig {
  name: string;
  baseURL: string;
  timeout: number;
}

export const MOBILE_APP_ENVIRONMENT_CONFIG: Record<EnvironmentName, MobileAppEnvironmentConfig> = {
  dev: {
    name: 'Development',
    baseURL: 'https://beta.kochgourmet.com/_api/mobile-app',
    timeout: 15000,
  },
  stage: {
    name: 'Staging',
    baseURL: 'https://beta.kochgourmet.com/_api/mobile-app',
    timeout: 15000,
  },
  prod: {
    name: 'Production',
    baseURL: 'https://www.kochgourmet.com/_api/mobile-app',
    timeout: 15000,
  },
};

export const getMobileAppEnvironmentConfig = (
  environment: EnvironmentName,
): MobileAppEnvironmentConfig => {
  return MOBILE_APP_ENVIRONMENT_CONFIG[environment] ?? MOBILE_APP_ENVIRONMENT_CONFIG.dev;
};
