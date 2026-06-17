import MobileAppApiService from '@/services/MobileAppApiService';
import { ContentPage } from '@/types/mobileAppApi';

export const mobileAppContent = () => {
  const getPage = async (slug: string) => {
    const response = await MobileAppApiService.get<ContentPage>(`/pages/${slug}`);
    if (response.success) {
      return { success: true as const, data: response.data, status: response.status };
    }
    return { success: false as const, error: response.error, status: response.status };
  };

  const getImpressum = async () => getPage('impressum');

  const getDatenschutz = async () => getPage('datenschutz');

  return {
    getPage,
    getImpressum,
    getDatenschutz,
  };
};
