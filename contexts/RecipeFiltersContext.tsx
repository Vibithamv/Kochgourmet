import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import type { RecipeFilterOptions } from '@/types/mobileAppApi';
import {
  buildRecipeFilterChips,
  EMPTY_RECIPE_FILTER_SELECTION,
  type RecipeFilterChip,
  type RecipeFilterSelection,
  removeChipFromSelection,
} from '@/utils/recipeFilterUtils';

interface RecipeFiltersContextType {
  options: RecipeFilterOptions | null;
  selection: RecipeFilterSelection;
  chips: RecipeFilterChip[];
  setOptions: (options: RecipeFilterOptions | null) => void;
  setSelection: (selection: RecipeFilterSelection) => void;
  removeChip: (chipId: string) => void;
  clearFilters: () => void;
}

const RecipeFiltersContext = createContext<RecipeFiltersContextType | undefined>(undefined);

type RecipeFiltersProviderProps = Readonly<{ children: React.ReactNode }>;

export function RecipeFiltersProvider({ children }: RecipeFiltersProviderProps) {
  const [options, setOptions] = useState<RecipeFilterOptions | null>(null);
  const [selection, setSelection] = useState<RecipeFilterSelection>(EMPTY_RECIPE_FILTER_SELECTION);

  const chips = useMemo(
    () => buildRecipeFilterChips(selection, options),
    [options, selection],
  );

  const removeChip = useCallback((chipId: string) => {
    setSelection((prev) => removeChipFromSelection(prev, chipId));
  }, []);

  const clearFilters = useCallback(() => {
    setSelection(EMPTY_RECIPE_FILTER_SELECTION);
  }, []);

  const value = useMemo(
    () => ({
      options,
      selection,
      chips,
      setOptions,
      setSelection,
      removeChip,
      clearFilters,
    }),
    [options, selection, chips, removeChip, clearFilters],
  );

  return (
    <RecipeFiltersContext.Provider value={value}>
      {children}
    </RecipeFiltersContext.Provider>
  );
}

export function useRecipeFilters() {
  const ctx = useContext(RecipeFiltersContext);
  if (!ctx) throw new Error('useRecipeFilters must be used within RecipeFiltersProvider');
  return ctx;
}
