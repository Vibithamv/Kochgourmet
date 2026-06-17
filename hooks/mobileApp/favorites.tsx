import MobileAppApiService from '@/services/MobileAppApiService';
import {
  AddRecipeToFolderPayload,
  CreateFolderPayload,
  FavoriteFolder,
  FavoriteFolderDetail,
  HydraCollection,
  RenameFolderPayload,
} from '@/types/mobileAppApi';

export const mobileAppFavorites = () => {
  const listFolders = async () => {
    const response = await MobileAppApiService.get<HydraCollection<FavoriteFolder>>('/me/folders');
    if (response.success) {
      return { success: true as const, data: response.data, status: response.status };
    }
    return { success: false as const, error: response.error, status: response.status };
  };

  const getFolder = async (
    folderId: number | string,
    params: { page?: number; itemsPerPage?: number } = {},
  ) => {
    const response = await MobileAppApiService.get<FavoriteFolderDetail>(
      `/me/folders/${folderId}`,
      params,
    );
    if (response.success) {
      return { success: true as const, data: response.data, status: response.status };
    }
    return { success: false as const, error: response.error, status: response.status };
  };

  const createFolder = async (payload: CreateFolderPayload) => {
    const response = await MobileAppApiService.post<FavoriteFolder>('/me/folders', payload);
    if (response.success) {
      return { success: true as const, data: response.data, status: response.status };
    }
    return { success: false as const, error: response.error, status: response.status };
  };

  const renameFolder = async (folderId: number | string, payload: RenameFolderPayload) => {
    const response = await MobileAppApiService.patch<FavoriteFolder>(
      `/me/folders/${folderId}`,
      payload,
    );
    if (response.success) {
      return { success: true as const, data: response.data, status: response.status };
    }
    return { success: false as const, error: response.error, status: response.status };
  };

  const deleteFolder = async (folderId: number | string) => {
    const response = await MobileAppApiService.delete(`/me/folders/${folderId}`);
    if (response.success) {
      return { success: true as const, status: response.status };
    }
    return { success: false as const, error: response.error, status: response.status };
  };

  const addRecipeToFolder = async (
    folderId: number | string,
    payload: AddRecipeToFolderPayload,
  ) => {
    const response = await MobileAppApiService.post(`/me/folders/${folderId}/recipes`, payload);
    if (response.success) {
      return { success: true as const, status: response.status };
    }
    return { success: false as const, error: response.error, status: response.status };
  };

  const removeRecipeFromFolder = async (
    folderId: number | string,
    recipeId: number | string,
  ) => {
    const response = await MobileAppApiService.delete(
      `/me/folders/${folderId}/recipes/${recipeId}`,
    );
    if (response.success) {
      return { success: true as const, status: response.status };
    }
    return { success: false as const, error: response.error, status: response.status };
  };

  const addFavorite = async (recipeId: number | string) => {
    const response = await MobileAppApiService.post(`/me/favorites/${recipeId}`);
    if (response.success) {
      return { success: true as const, status: response.status };
    }
    return { success: false as const, error: response.error, status: response.status };
  };

  const removeFavorite = async (recipeId: number | string) => {
    const response = await MobileAppApiService.delete(`/me/favorites/${recipeId}`);
    if (response.success) {
      return { success: true as const, status: response.status };
    }
    return { success: false as const, error: response.error, status: response.status };
  };

  return {
    listFolders,
    getFolder,
    createFolder,
    renameFolder,
    deleteFolder,
    addRecipeToFolder,
    removeRecipeFromFolder,
    addFavorite,
    removeFavorite,
  };
};
