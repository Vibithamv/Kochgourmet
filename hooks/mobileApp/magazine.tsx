import KochgourmetApiService, { QueryValue } from '@/services/KochgourmetApiService';
import { KOCHGOURMET_OPERATIONS } from '@/config/kochgourmetApi';
import {
  HydraCollection,
  MagazineListParams,
  MagazinePostDetail,
  MagazinePostListItem,
} from '@/types/mobileAppApi';

function toMagazineQueryParams(
  params: MagazineListParams = {},
): Record<string, QueryValue | undefined> {
  const query: Record<string, QueryValue | undefined> = {};

  if (params.page !== undefined) query.page = params.page;
  if (params.itemsPerPage !== undefined) query.itemsPerPage = params.itemsPerPage;
  if (params.search) query.search = params.search;

  if (params['category.uid']?.length) {
    query['category.uid[]'] = params['category.uid'];
  }

  if (params.order) {
    Object.entries(params.order).forEach(([field, direction]) => {
      if (direction) query[`order[${field}]`] = direction;
    });
  }

  return query;
}

export const mobileAppMagazine = () => {
  const listPosts = async (params: MagazineListParams = {}) => {
    const response = await KochgourmetApiService.proxyGet<HydraCollection<MagazinePostListItem>>(
      KOCHGOURMET_OPERATIONS.listMagazinePosts,
      {},
      toMagazineQueryParams(params),
    );

    if (response.success) {
      return { success: true as const, data: response.data, status: response.status };
    }
    return { success: false as const, error: response.error, status: response.status };
  };

  const getPost = async (id: number | string) => {
    const response = await KochgourmetApiService.proxyGet<MagazinePostDetail>(
      KOCHGOURMET_OPERATIONS.magazinePostDetail,
      { id },
    );
    if (response.success) {
      return { success: true as const, data: response.data, status: response.status };
    }
    return { success: false as const, error: response.error, status: response.status };
  };

  return {
    listPosts,
    getPost,
  };
};
