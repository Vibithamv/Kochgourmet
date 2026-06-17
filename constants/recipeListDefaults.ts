import type { RecipeListParams } from '@/types/mobileAppApi';

export const RECIPES_PER_PAGE = 20;

export const DEFAULT_RECIPE_LIST_PARAMS: Pick<RecipeListParams, 'order' | 'itemsPerPage'> = {
  itemsPerPage: RECIPES_PER_PAGE,
  order: { totalRating: 'desc' },
};
