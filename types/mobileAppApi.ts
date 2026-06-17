export interface HydraView {
  'hydra:first'?: string;
  'hydra:last'?: string;
  'hydra:next'?: string;
  'hydra:previous'?: string;
  'hydra:page'?: number;
}

export interface HydraCollection<T> {
  'hydra:member': T[];
  'hydra:totalItems': number;
  'hydra:view'?: HydraView;
}

export interface RecipeRating {
  value: number;
  count: number;
}

export interface RecipeListItem {
  uid: number;
  title: string;
  '@id'?: string;
  imageThumbnailUrl?: string;
  preparationTime?: number;
  cookingTime?: number;
  rating?: RecipeRating;
  difficulty?: { uid: number; name: string };
  isFavorite?: boolean;
  listedInFoldersUids?: number[];
}

export interface RecipeIngredientUnit {
  title: string;
  uid: number;
}

export interface RecipeIngredientItem {
  uid: number;
  number: number;
  freetext?: string;
  note?: string;
  unit?: RecipeIngredientUnit;
  ingredient?: { title: string; uid: number };
  isSectionHeader?: boolean;
}

export interface RecipePreparationStep {
  uid: number;
  description: string;
}

export interface RecipeNutritionItem {
  uid: number;
  title: string;
  number: number;
  unit?: RecipeIngredientUnit;
}

export interface RecipeCategory {
  uid: number;
  title: string;
}

export interface RecipeDetail extends RecipeListItem {
  imageBannerUrl?: string;
  imageWideUrl?: string;
  shortDescription?: string;
  defaultNumberOfServings: number;
  ingredients: RecipeIngredientItem[];
  nutritions: RecipeNutritionItem[];
  categories: RecipeCategory[];
  preparationSteps: RecipePreparationStep[];
  thermomixPreparationSteps: RecipePreparationStep[];
  airfryerPreparationSteps: RecipePreparationStep[];
  user?: { displayName?: string; profileImageUrl?: string } | null;
}

export interface MobileAppUser {
  uid: number;
  email: string;
  username?: string;
  displayName?: string;
  gender?: string;
  firstName: string;
  lastName: string;
  address?: string;
  zip?: string;
  city?: string;
  country?: string;
  telephone?: string;
  image?: string;
  profileImageUrl?: string;
  newsletterDaily: boolean;
  newsletterWeekly: boolean;
}

export interface MobileAppAuthResponse {
  token: string;
  expiresAt: string;
  user: MobileAppUser;
}

export interface RegisterUserPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  newsletterDaily?: boolean;
  newsletterWeekly?: boolean;
  displayName?: string;
}

export interface UpdateProfilePayload {
  gender?: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  zip?: string;
  city?: string;
  country?: string;
  telephone?: string;
  newsletterDaily?: boolean;
  newsletterWeekly?: boolean;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface RecipeFilterChild {
  uid: number;
  name: string;
}

export interface RecipeFilterCategory {
  uid: number;
  name: string;
  icon?: string | null;
  children?: RecipeFilterChild[];
}

export interface RecipeFilterCountry {
  uid: number;
  name: string;
  flagImage?: string;
}

export interface RecipeFilterTimeBucket {
  label: string;
  operator: 'lte' | 'lt' | 'gte' | 'gt';
  value: number;
}

export interface RecipeFilterOption {
  uid: number;
  name: string;
}

export interface RecipeFilterOptions {
  categories: RecipeFilterCategory[];
  specials: RecipeFilterOption[];
  diets: RecipeFilterOption[];
  countries: RecipeFilterCountry[];
  occasions: RecipeFilterOption[];
  preparationTypes: RecipeFilterOption[];
  difficulties: RecipeFilterOption[];
  menutypes: RecipeFilterOption[];
  timeBuckets: RecipeFilterTimeBucket[];
}

export interface RecipeListParams {
  page?: number;
  itemsPerPage?: number;
  search?: string;
  category?: number[];
  special?: number[];
  diet?: number[];
  country?: number[];
  occasion?: number[];
  preparationType?: number[];
  difficulty?: number;
  menutype?: number[];
  time?: number | { lte?: number; lt?: number; gte?: number; gt?: number };
  exactMatch?: 0 | 1;
  order?: {
    title?: 'asc' | 'desc';
    totalRating?: 'asc' | 'desc';
    preparationtime?: 'asc' | 'desc';
  };
}

export interface MagazinePostListItem {
  uid: number;
  title: string;
  categories?: { uid: number; title: string }[];
}

export interface MagazinePostDetail extends MagazinePostListItem {
  text: string;
  imageBannerUrl?: string;
  gallery?: string[];
  sliderImages?: unknown[];
  products?: { name: string; imageUrl?: string }[];
  relatedRecipes?: {
    uid?: number;
    title: string;
    preparationTime: number;
    imageThumbnailUrl?: string;
  }[];
  relatedFaqs?: unknown[];
  blogger?: { displayName?: string };
}

export interface MagazineListParams {
  page?: number;
  itemsPerPage?: number;
  search?: string;
  'category.uid'?: number[];
  order?: {
    sorting?: 'asc' | 'desc';
  };
}

export interface FavoriteFolderRecipe {
  uid: number;
  title: string;
  imageThumbnailUrl?: string;
  preparationTime?: number;
}

export interface FavoriteFolder {
  uid: number;
  title: string;
  recipes?: FavoriteFolderRecipe[];
}

export interface FavoriteFolderDetail extends FavoriteFolder {
  recipes: FavoriteFolderRecipe[];
}

export interface CreateFolderPayload {
  title: string;
}

export interface RenameFolderPayload {
  title: string;
}

export interface AddRecipeToFolderPayload {
  recipeId: number;
}

export interface ContentPage {
  uid: number;
  slug: string;
  title: string;
  content: string;
}
