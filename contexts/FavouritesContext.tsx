import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { Recipe } from '@/components/RecipeCard';

const INITIAL_RECIPES: Recipe[] = [
  { id: '1', title: 'Fränkischer Bratwurst Döner', imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400', durationMinutes: 60, rating: 4.3 },
  { id: '2', title: 'Veganer Döner-Flammkuchen', imageUrl: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400', durationMinutes: 15, rating: 5 },
  { id: '3', title: 'Brazil Limonade', imageUrl: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400', durationMinutes: 5, rating: 5, isFavourite: true },
  { id: '4', title: 'Kinderriegel Cheesecake', imageUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400', durationMinutes: 25, rating: 4.5 },
  { id: '5', title: "Nicht gegrillter Dickmann's Smores", imageUrl: 'https://images.unsplash.com/photo-1481070414801-51fd732d7184?w=400', durationMinutes: 2, rating: 4.25 },
  { id: '6', title: 'Karamelisiert Zwiebelpasta', imageUrl: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400', durationMinutes: 25, rating: 4 },
  { id: '7', title: 'Allgäuer Käsespätzle', imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400', durationMinutes: 60, rating: 4.3 },
  { id: '8', title: 'Klassische Gulaschsuppe', imageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400', durationMinutes: 90, rating: 4.7 },
];

interface FavouritesContextType {
  recipes: Recipe[];
  favourites: Recipe[];
  toggleFavourite: (id: string) => void;
}

const FavouritesContext = createContext<FavouritesContextType | undefined>(undefined);

type FavouritesProviderProps = Readonly<{ children: React.ReactNode }>;

export function FavouritesProvider({ children }: FavouritesProviderProps) {
  const [recipes, setRecipes] = useState<Recipe[]>(INITIAL_RECIPES);

  const toggleFavourite = useCallback((id: string) => {
    setRecipes(prev =>
      prev.map(r => r.id === id ? { ...r, isFavourite: !r.isFavourite } : r)
    );
  }, []);

  const favourites = useMemo(() => recipes.filter(r => r.isFavourite), [recipes]);

  const value = useMemo(
    () => ({ recipes, favourites, toggleFavourite }),
    [recipes, favourites, toggleFavourite]
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
