import KochgourmetApiService from '@/services/KochgourmetApiService';
import { KOCHGOURMET_OPERATIONS } from '@/config/kochgourmetApi';
import {
  AddRecipeToFolderPayload,
  CreateFolderPayload,
  FavoriteFolder,
  FavoriteFolderDetail,
  HydraCollection,
  RenameFolderPayload,
} from '@/types/mobileAppApi';

function asProxyBody<T extends object>(payload: T): Record<string, unknown> {
  return payload as Record<string, unknown>;
}

export const mobileAppFavorites = () => {
  const listFolders = async () => {
    const response = await KochgourmetApiService.proxyGet<HydraCollection<FavoriteFolder>>(
      KOCHGOURMET_OPERATIONS.listFolders,
    );
    if (response.success) {
      return { success: true as const, data: response.data, status: response.status };
    }
    return { success: false as const, error: response.error, status: response.status };
  };

  const getFolder = async (
    folderId: number | string,
    params: { page?: number; itemsPerPage?: number } = {},
  ) => {
    const response = await KochgourmetApiService.proxyGet<FavoriteFolderDetail>(
      KOCHGOURMET_OPERATIONS.folderDetail,
      { id: folderId },
      params,
    );
    if (response.success) {
      return { success: true as const, data: response.data, status: response.status };
    }
    return { success: false as const, error: response.error, status: response.status };
  };

  const createFolder = async (payload: CreateFolderPayload) => {
    const response = await KochgourmetApiService.proxyPost<FavoriteFolder>(
      KOCHGOURMET_OPERATIONS.createFolder,
      asProxyBody(payload),
    );
    if (response.success) {
      return { success: true as const, data: response.data, status: response.status };
    }
    return { success: false as const, error: response.error, status: response.status };
  };

  const renameFolder = async (folderId: number | string, payload: RenameFolderPayload) => {
    const response = await KochgourmetApiService.proxyPatch<FavoriteFolder>(
      KOCHGOURMET_OPERATIONS.renameFolder,
      asProxyBody(payload),
      { id: folderId },
    );
    if (response.success) {
      return { success: true as const, data: response.data, status: response.status };
    }
    return { success: false as const, error: response.error, status: response.status };
  };

  const deleteFolder = async (folderId: number | string) => {
    const response = await KochgourmetApiService.proxyDelete(
      KOCHGOURMET_OPERATIONS.deleteFolder,
      { id: folderId },
    );
    if (response.success) {
      return { success: true as const, status: response.status };
    }
    return { success: false as const, error: response.error, status: response.status };
  };

  const addRecipeToFolder = async (
    folderId: number | string,
    payload: AddRecipeToFolderPayload,
  ) => {
    const response = await KochgourmetApiService.proxyPost(
      KOCHGOURMET_OPERATIONS.addRecipeToFolder,
      asProxyBody(payload),
      { id: folderId },
    );
    if (response.success) {
      return { success: true as const, status: response.status };
    }
    return { success: false as const, error: response.error, status: response.status };
  };

  const removeRecipeFromFolder = async (
    folderId: number | string,
    recipeId: number | string,
  ) => {
    const response = await KochgourmetApiService.proxyDelete(
      KOCHGOURMET_OPERATIONS.removeRecipeFromFolder,
      { id: folderId, recipeId },
    );
    if (response.success) {
      return { success: true as const, status: response.status };
    }
    return { success: false as const, error: response.error, status: response.status };
  };

  const addFavorite = async (recipeId: number | string) => {
    const response = await KochgourmetApiService.proxyPost(
      KOCHGOURMET_OPERATIONS.addFavorite,
      {},
      { recipeId },
    );
    if (response.success) {
      return { success: true as const, status: response.status };
    }
    return { success: false as const, error: response.error, status: response.status };
  };

  const removeFavorite = async (recipeId: number | string) => {
    const response = await KochgourmetApiService.proxyDelete(
      KOCHGOURMET_OPERATIONS.removeFavorite,
      { recipeId },
    );
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
