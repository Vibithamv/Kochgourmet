import { API_HEADER_CONFIG } from '@/config/apiHeaderConfig';
import NetworkService from '../services/NetworkService';

const VALIDATE_PLATFORM_ATTEMPTS = 3;
const VALIDATE_PLATFORM_RETRY_MS = 500;

function shouldRetryValidatePlatform(status?: number): boolean {
  if (status == null) return true;
  if (status >= 500) return true;
  if (status === 408 || status === 429) return true;
  return false;
}

export const platformValidation = () => {
  const validatePlatform = async () => {
    let lastError: unknown = 'An unknown error occurred';

    for (let attempt = 1; attempt <= VALIDATE_PLATFORM_ATTEMPTS; attempt++) {
      try {
        const response = await NetworkService.get(
          '/validate-platform',
          {},
          API_HEADER_CONFIG,
        );
        if (response.success) {
          return { success: true, data: response.data };
        }

        lastError = response.error;
        if (!shouldRetryValidatePlatform(response.status) || attempt === VALIDATE_PLATFORM_ATTEMPTS) {
          return { success: false, error: response.error };
        }
      } catch (error: unknown) {
        lastError = error instanceof Error ? error.message : error;
        if (attempt === VALIDATE_PLATFORM_ATTEMPTS) {
          return { success: false, error: lastError };
        }
      }

      await new Promise((resolve) => setTimeout(resolve, VALIDATE_PLATFORM_RETRY_MS * attempt));
    }

    return { success: false, error: lastError };
  };

  return {
    validatePlatform
  };
};
