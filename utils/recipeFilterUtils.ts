import type { RecipeFilterOptions, RecipeFilterTimeBucket, RecipeListParams } from '@/types/mobileAppApi';

export const RECIPE_MEDIA_BASE_URL = 'https://beta.kochgourmet.com/';

export interface RecipeFilterSelection {
  categoryUids: number[];
  countryUids: number[];
  specialUids: number[];
  dietUids: number[];
  occasionUids: number[];
  preparationTypeUids: number[];
  difficultyUid?: number;
  menutypeUids: number[];
  timeBucket?: RecipeFilterTimeBucket;
  exactMatch: boolean;
}

export interface RecipeFilterChip {
  id: string;
  label: string;
}

export const EMPTY_RECIPE_FILTER_SELECTION: RecipeFilterSelection = {
  categoryUids: [],
  countryUids: [],
  specialUids: [],
  dietUids: [],
  occasionUids: [],
  preparationTypeUids: [],
  menutypeUids: [],
  exactMatch: false,
};

export function countryFlagUrl(flagImage?: string): string | null {
  if (!flagImage?.trim()) return null;
  if (flagImage.startsWith('http')) return flagImage;
  return `${RECIPE_MEDIA_BASE_URL}${flagImage.replace(/^\//, '')}`;
}

export function recipeFilterSelectionToParams(
  selection: RecipeFilterSelection,
): RecipeListParams {
  const params: RecipeListParams = {
    exactMatch: selection.exactMatch ? 1 : 0,
  };

  if (selection.categoryUids.length) params.category = selection.categoryUids;
  if (selection.countryUids.length) params.country = selection.countryUids;
  if (selection.specialUids.length) params.special = selection.specialUids;
  if (selection.dietUids.length) params.diet = selection.dietUids;
  if (selection.occasionUids.length) params.occasion = selection.occasionUids;
  if (selection.preparationTypeUids.length) {
    params.preparationType = selection.preparationTypeUids;
  }
  if (selection.menutypeUids.length) params.menutype = selection.menutypeUids;
  if (selection.difficultyUid !== undefined) params.difficulty = selection.difficultyUid;

  if (selection.timeBucket) {
    params.time = {
      [selection.timeBucket.operator]: selection.timeBucket.value,
    };
  }

  return params;
}

function findNameByUid(
  items: { uid: number; name: string }[] | undefined,
  uid: number,
): string | undefined {
  return items?.find((item) => item.uid === uid)?.name;
}

export function buildRecipeFilterChips(
  selection: RecipeFilterSelection,
  options: RecipeFilterOptions | null,
): RecipeFilterChip[] {
  if (!options) return [];

  const chips: RecipeFilterChip[] = [];

  selection.categoryUids.forEach((uid) => {
    const parent = options.categories.find((cat) => cat.uid === uid);
    const child = options.categories
      .flatMap((cat) => cat.children ?? [])
      .find((item) => item.uid === uid);
    const label = parent?.name ?? child?.name;
    if (label) chips.push({ id: `category:${uid}`, label });
  });

  selection.countryUids.forEach((uid) => {
    const label = findNameByUid(options.countries, uid);
    if (label) chips.push({ id: `country:${uid}`, label });
  });

  selection.specialUids.forEach((uid) => {
    const label = findNameByUid(options.specials, uid);
    if (label) chips.push({ id: `special:${uid}`, label });
  });

  selection.dietUids.forEach((uid) => {
    const label = findNameByUid(options.diets, uid);
    if (label) chips.push({ id: `diet:${uid}`, label });
  });

  selection.occasionUids.forEach((uid) => {
    const label = findNameByUid(options.occasions, uid);
    if (label) chips.push({ id: `occasion:${uid}`, label });
  });

  selection.preparationTypeUids.forEach((uid) => {
    const label = findNameByUid(options.preparationTypes, uid);
    if (label) chips.push({ id: `preparationType:${uid}`, label });
  });

  if (selection.difficultyUid !== undefined) {
    const label = findNameByUid(options.difficulties, selection.difficultyUid);
    if (label) chips.push({ id: `difficulty:${selection.difficultyUid}`, label });
  }

  selection.menutypeUids.forEach((uid) => {
    const label = findNameByUid(options.menutypes, uid);
    if (label) chips.push({ id: `menutype:${uid}`, label });
  });

  if (selection.timeBucket) {
    chips.push({
      id: `time:${selection.timeBucket.operator}:${selection.timeBucket.value}`,
      label: selection.timeBucket.label,
    });
  }

  return chips;
}

export function removeChipFromSelection(
  selection: RecipeFilterSelection,
  chipId: string,
): RecipeFilterSelection {
  const [group, value] = chipId.split(':');

  switch (group) {
    case 'category':
      return {
        ...selection,
        categoryUids: selection.categoryUids.filter((uid) => uid !== Number(value)),
      };
    case 'country':
      return {
        ...selection,
        countryUids: selection.countryUids.filter((uid) => uid !== Number(value)),
      };
    case 'special':
      return {
        ...selection,
        specialUids: selection.specialUids.filter((uid) => uid !== Number(value)),
      };
    case 'diet':
      return {
        ...selection,
        dietUids: selection.dietUids.filter((uid) => uid !== Number(value)),
      };
    case 'occasion':
      return {
        ...selection,
        occasionUids: selection.occasionUids.filter((uid) => uid !== Number(value)),
      };
    case 'preparationType':
      return {
        ...selection,
        preparationTypeUids: selection.preparationTypeUids.filter((uid) => uid !== Number(value)),
      };
    case 'difficulty':
      return { ...selection, difficultyUid: undefined };
    case 'menutype':
      return {
        ...selection,
        menutypeUids: selection.menutypeUids.filter((uid) => uid !== Number(value)),
      };
    case 'time':
      return { ...selection, timeBucket: undefined };
    default:
      return selection;
  }
}

export function countFilterSelection(selection: RecipeFilterSelection): number {
  return (
    selection.categoryUids.length +
    selection.countryUids.length +
    selection.specialUids.length +
    selection.dietUids.length +
    selection.occasionUids.length +
    selection.preparationTypeUids.length +
    selection.menutypeUids.length +
    (selection.difficultyUid !== undefined ? 1 : 0) +
    (selection.timeBucket ? 1 : 0)
  );
}
