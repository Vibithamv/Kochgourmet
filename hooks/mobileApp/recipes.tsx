import MobileAppApiService, { QueryValue } from '@/services/MobileAppApiService';
import { DEFAULT_RECIPE_LIST_PARAMS } from '@/constants/recipeListDefaults';
import {
  HydraCollection,
  RecipeDetail,
  RecipeFilterOptions,
  RecipeListItem,
  RecipeListParams,
} from '@/types/mobileAppApi';

function toRecipeQueryParams(
  params: RecipeListParams = {},
): Record<string, QueryValue | undefined> {
  const query: Record<string, QueryValue | undefined> = {};

  if (params.page !== undefined) query.page = params.page;
  if (params.itemsPerPage !== undefined) query.itemsPerPage = params.itemsPerPage;
  if (params.search) query.search = params.search;
  if (params.difficulty !== undefined) query.difficulty = params.difficulty;
  if (params.exactMatch !== undefined) query.exactMatch = params.exactMatch;

  if (params.category?.length) query['category[]'] = params.category;
  if (params.special?.length) query['special[]'] = params.special;
  if (params.diet?.length) query['diet[]'] = params.diet;
  if (params.country?.length) query['country[]'] = params.country;
  if (params.occasion?.length) query['occasion[]'] = params.occasion;
  if (params.preparationType?.length) query['preparationType[]'] = params.preparationType;
  if (params.menutype?.length) query['menutype[]'] = params.menutype;

  if (params.time !== undefined) {
    query.time = params.time;
  }

  if (params.order) {
    Object.entries(params.order).forEach(([field, direction]) => {
      if (direction) query[`order[${field}]`] = direction;
    });
  }

  return query;
}

const FAVORITE_SCAN_MAX_PAGES = 10;
const FAVORITE_SCAN_PAGE_SIZE = 100;

export const mobileAppRecipes = () => {
  const listRecipes = async (params: RecipeListParams = {}) => {
    const response = await MobileAppApiService.get<HydraCollection<RecipeListItem>>(
      '/recipes',
      toRecipeQueryParams({
        ...DEFAULT_RECIPE_LIST_PARAMS,
        ...params,
        order: params.order ?? DEFAULT_RECIPE_LIST_PARAMS.order,
        itemsPerPage: params.itemsPerPage ?? DEFAULT_RECIPE_LIST_PARAMS.itemsPerPage,
      }),
    );

    if (response.success) {
      return { success: true as const, data: response.data, status: response.status };
    }
    return { success: false as const, error: response.error, status: response.status };
  };

  const getRecipe = async (id: number | string) => {
    const response = await MobileAppApiService.get<RecipeDetail>(`/recipes/${id}`);
    if (response.success) {
      return { success: true as const, data: response.data, status: response.status };
    }
    return { success: false as const, error: response.error, status: response.status };
  };

  const getFilterOptions = async () => {
    const response = await MobileAppApiService.get<RecipeFilterOptions>('/recipes/filter-options');
    if (response.success) {
      return { success: true as const, data: response.data, status: response.status };
    }
    return { success: false as const, error: response.error, status: response.status };
  };

  const listFavoriteRecipes = async () => {
    const favorites: RecipeListItem[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= FAVORITE_SCAN_MAX_PAGES) {
      const response = await listRecipes({
        page,
        itemsPerPage: FAVORITE_SCAN_PAGE_SIZE,
        order: { totalRating: 'desc' },
      });

      if (!response.success || !response.data) {
        return {
          success: false as const,
          error: response.error,
          status: response.status,
        };
      }

      const members = response.data['hydra:member'] ?? [];
      favorites.push(...members.filter((item) => item.isFavorite));
      hasMore = Boolean(response.data['hydra:view']?.['hydra:next']);
      page += 1;
    }

    return { success: true as const, data: favorites, status: 200 };
  };

  return {
    listRecipes,
    getRecipe,
    getFilterOptions,
    listFavoriteRecipes,
  };
};
