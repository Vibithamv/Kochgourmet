import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { mobileAppFavorites } from '@/hooks/mobileApp';
import { useGlobalAlert } from '@/contexts/AlertContext';
import { getMobileAppJwt } from '@/utils/mobileAppAuthUtils';

export function useRecipeFavorite() {
  const { t } = useTranslation();
  const { showAlert } = useGlobalAlert();
  const favoritesApi = useMemo(() => mobileAppFavorites(), []);

  const toggleFavorite = useCallback(
    async (recipeId: string, currentlyFavorite: boolean): Promise<boolean | null> => {
      const jwt = await getMobileAppJwt();
      if (!jwt) {
        showAlert(t('common.error'), t('favoritenScreen.loginRequired'));
        return null;
      }

      const response = currentlyFavorite
        ? await favoritesApi.removeFavorite(recipeId)
        : await favoritesApi.addFavorite(recipeId);

      if (response.success) {
        return !currentlyFavorite;
      }

      if (response.status === 401) {
        showAlert(t('profile.sessionExpired'), t('profile.loginAgain'));
        return null;
      }

      showAlert(t('common.error'), t('common.errorMessage'));
      return null;
    },
    [favoritesApi, showAlert, t],
  );

  return { toggleFavorite };
}
