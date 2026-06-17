import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import type { Recipe } from '@/components/RecipeCard';
import { useRecipeFavorite } from '@/hooks/useRecipeFavorite';

interface FavouritesContextType {
  favourites: Recipe[];
  syncRecipesFromList: (recipes: Recipe[]) => void;
  setRecipeFavorite: (recipe: Recipe, isFavorite: boolean) => void;
  replaceFavourites: (recipes: Recipe[]) => void;
  toggleFavourite: (id: string, recipe?: Recipe) => void;
}

const FavouritesContext = createContext<FavouritesContextType | undefined>(undefined);

type FavouritesProviderProps = Readonly<{ children: React.ReactNode }>;

export function FavouritesProvider({ children }: FavouritesProviderProps) {
  const { toggleFavorite } = useRecipeFavorite();
  const [favouriteMap, setFavouriteMap] = useState<Map<string, Recipe>>(new Map());

  const favourites = useMemo(
    () => Array.from(favouriteMap.values()),
    [favouriteMap],
  );

  const setRecipeFavorite = useCallback((recipe: Recipe, isFavorite: boolean) => {
    setFavouriteMap((prev) => {
      const next = new Map(prev);
      if (isFavorite) {
        next.set(recipe.id, { ...recipe, isFavourite: true });
      } else {
        next.delete(recipe.id);
      }
      return next;
    });
  }, []);

  const syncRecipesFromList = useCallback((recipes: Recipe[]) => {
    setFavouriteMap((prev) => {
      const next = new Map(prev);
      recipes.forEach((recipe) => {
        if (recipe.isFavourite) {
          next.set(recipe.id, { ...recipe, isFavourite: true });
        }
      });
      return next;
    });
  }, []);

  const replaceFavourites = useCallback((recipes: Recipe[]) => {
    const next = new Map<string, Recipe>();
    recipes.forEach((recipe) => {
      next.set(recipe.id, { ...recipe, isFavourite: true });
    });
    setFavouriteMap(next);
  }, []);

  const toggleFavourite = useCallback(
    (id: string, recipe?: Recipe) => {
      const existing = favouriteMap.get(id) ?? recipe;
      const currentlyFavorite = existing?.isFavourite ?? favouriteMap.has(id);

      void (async () => {
        const nextFavorite = await toggleFavorite(id, currentlyFavorite);
        if (nextFavorite === null) return;

        if (existing) {
          setRecipeFavorite(existing, nextFavorite);
        } else if (nextFavorite) {
          setRecipeFavorite(
            recipe ?? { id, title: '', imageUrl: '', durationMinutes: 0, rating: 0, isFavourite: true },
            true,
          );
        } else {
          setRecipeFavorite(
            recipe ?? { id, title: '', imageUrl: '', durationMinutes: 0, rating: 0 },
            false,
          );
        }
      })();
    },
    [favouriteMap, setRecipeFavorite, toggleFavorite],
  );

  const value = useMemo(
    () => ({
      favourites,
      syncRecipesFromList,
      setRecipeFavorite,
      replaceFavourites,
      toggleFavourite,
    }),
    [favourites, syncRecipesFromList, setRecipeFavorite, replaceFavourites, toggleFavourite],
  );

  return (
    <FavouritesContext.Provider value={value}>
      {children}
    </FavouritesContext.Provider>
  );
}

export function useFavourites() {
  const ctx = useContext(FavouritesContext);
  if (!ctx) throw new Error('useFavourites must be used within FavouritesProvider');
  return ctx;
}
