import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { mobileAppFavorites } from '@/hooks/mobileApp';
import { mapFavoriteFolder } from '@/utils/mobileAppMappers';
import { getMobileAppJwt } from '@/utils/mobileAppAuthUtils';

export interface FolderThumb {
  uri: string;
  recipeId: string;
}

export interface Folder {
  id: string;
  title: string;
  count: number;
  thumbnails: FolderThumb[];
}

interface FoldersContextType {
  folders: Folder[];
  loading: boolean;
  refreshFolders: () => Promise<void>;
  getFolder: (id: string) => Folder | undefined;
  createFolder: (title: string) => Promise<boolean>;
  renameFolder: (id: string, title: string) => Promise<boolean>;
  deleteFolder: (id: string) => Promise<boolean>;
  removeRecipeFromFolder: (folderId: string, recipeId: string, thumbUri: string) => Promise<boolean>;
}

const FoldersContext = createContext<FoldersContextType | undefined>(undefined);

type FoldersProviderProps = Readonly<{ children: React.ReactNode }>;

export function FoldersProvider({ children }: FoldersProviderProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);
  const favoritesApi = useMemo(() => mobileAppFavorites(), []);

  const refreshFolders = useCallback(async () => {
    const jwt = await getMobileAppJwt();
    if (!jwt) {
      setFolders([]);
      return;
    }

    setLoading(true);
    try {
      const response = await favoritesApi.listFolders();
      if (response.success && response.data) {
        const members = response.data['hydra:member'] ?? [];
        setFolders(members.map(mapFavoriteFolder));
      } else if (response.success) {
        setFolders([]);
      }
    } finally {
      setLoading(false);
    }
  }, [favoritesApi]);

  const getFolder = useCallback(
    (id: string) => folders.find((f) => f.id === id),
    [folders],
  );

  const createFolder = useCallback(async (title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return false;

    const response = await favoritesApi.createFolder({ title: trimmed });
    if (response.success && response.data) {
      const folder = mapFavoriteFolder(response.data);
      setFolders((prev) => [...prev, folder]);
      return true;
    }
    return false;
  }, [favoritesApi]);

  const renameFolder = useCallback(async (id: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return false;

    const response = await favoritesApi.renameFolder(id, { title: trimmed });
    if (response.success) {
      setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, title: trimmed } : f)));
      return true;
    }
    return false;
  }, [favoritesApi]);

  const deleteFolder = useCallback(async (id: string) => {
    const response = await favoritesApi.deleteFolder(id);
    if (response.success) {
      setFolders((prev) => prev.filter((f) => f.id !== id));
      return true;
    }
    return false;
  }, [favoritesApi]);

  const removeRecipeFromFolder = useCallback(
    async (folderId: string, recipeId: string, thumbUri: string) => {
      const response = await favoritesApi.removeRecipeFromFolder(folderId, recipeId);
      if (response.success) {
        setFolders((prev) =>
          prev.map((f) => {
            if (f.id !== folderId) return f;
            const thumbnails = f.thumbnails.filter(
              (t) => !(t.recipeId === recipeId && t.uri === thumbUri),
            );
            return { ...f, thumbnails, count: thumbnails.length };
          }),
        );
        return true;
      }
      return false;
    },
    [favoritesApi],
  );

  const value = useMemo(
    () => ({
      folders,
      loading,
      refreshFolders,
      getFolder,
      createFolder,
      renameFolder,
      deleteFolder,
      removeRecipeFromFolder,
    }),
    [
      folders,
      loading,
      refreshFolders,
      getFolder,
      createFolder,
      renameFolder,
      deleteFolder,
      removeRecipeFromFolder,
    ],
  );

  return <FoldersContext.Provider value={value}>{children}</FoldersContext.Provider>;
}

export function useFolders() {
  const ctx = useContext(FoldersContext);
  if (!ctx) throw new Error('useFolders must be used within FoldersProvider');
  return ctx;
}
