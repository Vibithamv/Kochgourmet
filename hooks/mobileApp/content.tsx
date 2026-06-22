import KochgourmetApiService from '@/services/KochgourmetApiService';
import { KOCHGOURMET_OPERATIONS } from '@/config/kochgourmetApi';
import { ContentPage } from '@/types/mobileAppApi';
import { normalizeContentPage } from '@/utils/mobileAppMappers';

export const mobileAppContent = () => {
  const getImpressum = async () => {
    const response = await KochgourmetApiService.proxyGet<ContentPage>(
      KOCHGOURMET_OPERATIONS.pageImpressum,
    );
    if (response.success) {
      const data = normalizeContentPage(response.data);
      if (!data) {
        return { success: false as const, error: 'Invalid content page payload', status: response.status };
      }
      return { success: true as const, data, status: response.status };
    }
    return { success: false as const, error: response.error, status: response.status };
  };

  const getDatenschutz = async () => {
    const response = await KochgourmetApiService.proxyGet<ContentPage>(
      KOCHGOURMET_OPERATIONS.pageDatenschutz,
    );
    if (response.success) {
      const data = normalizeContentPage(response.data);
      if (!data) {
        return { success: false as const, error: 'Invalid content page payload', status: response.status };
      }
      return { success: true as const, data, status: response.status };
    }
    return { success: false as const, error: response.error, status: response.status };
  };

  return {
    getImpressum,
    getDatenschutz,
  };
};
