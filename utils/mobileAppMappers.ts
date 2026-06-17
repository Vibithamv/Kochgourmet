import type { Recipe } from '@/components/RecipeCard';
import type {
  RecipeDetail as ApiRecipeDetail,
  RecipeIngredientItem,
  RecipeListItem,
  RecipeNutritionItem,
  RecipePreparationStep,
} from '@/types/mobileAppApi';
import type {
  RecipeDetail as UiRecipeDetail,
  RecipeIngredientSection,
  RecipeNutrition,
  RecipeStep,
} from '@/utils/mockRecipeDetails';

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400';

export function mapRecipeListItem(item: RecipeListItem): Recipe {
  const prep = item.preparationTime ?? 0;
  const cook = item.cookingTime ?? 0;
  const totalMinutes = prep + cook;

  return {
    id: String(item.uid),
    title: item.title,
    imageUrl: item.imageThumbnailUrl?.trim() || PLACEHOLDER_IMAGE,
    durationMinutes: totalMinutes > 0 ? totalMinutes : prep,
    rating: item.rating?.value ?? 0,
    isFavourite: item.isFavorite ?? false,
  };
}

export function mapRecipeListItems(items: RecipeListItem[]): Recipe[] {
  return items.map(mapRecipeListItem);
}

function recipeHeroImage(detail: ApiRecipeDetail): string {
  return (
    detail.imageBannerUrl?.trim() ||
    detail.imageWideUrl?.trim() ||
    detail.imageThumbnailUrl?.trim() ||
    PLACEHOLDER_IMAGE
  );
}

function mapIngredients(items: RecipeIngredientItem[]): RecipeIngredientSection[] {
  if (!items.length) {
    return [{ title: 'Zutaten', items: [] }];
  }

  const sections: RecipeIngredientSection[] = [];
  let current: RecipeIngredientSection = { title: 'Zutaten', items: [] };

  items.forEach((item) => {
    if (item.isSectionHeader) {
      if (current.items.length > 0) {
        sections.push(current);
      }
      current = {
        title: item.freetext?.trim() || item.ingredient?.title || 'Zutaten',
        items: [],
      };
      return;
    }

    current.items.push({
      amount: String(item.number),
      unit: item.unit?.title ?? '',
      name: item.freetext?.trim() || item.ingredient?.title || '',
    });
  });

  if (current.items.length > 0 || sections.length === 0) {
    sections.push(current);
  }

  return sections;
}

function mapNutritions(items: RecipeNutritionItem[]): RecipeNutrition[] {
  return items.map((item) => {
    const unit = item.unit?.title ?? '';
    const value = unit ? `${item.number} ${unit}` : String(item.number);
    return { label: item.title, value };
  });
}

function mapPreparationSteps(steps: RecipePreparationStep[]): RecipeStep[] {
  return steps.map((step, index) => ({
    number: index + 1,
    total: steps.length,
    text: step.description,
  }));
}

export function getRecipePrepStepSets(detail: ApiRecipeDetail): {
  normal: RecipeStep[];
  thermomix: RecipeStep[];
  airfryer: RecipeStep[];
} {
  return {
    normal: mapPreparationSteps(detail.preparationSteps ?? []),
    thermomix: mapPreparationSteps(detail.thermomixPreparationSteps ?? []),
    airfryer: mapPreparationSteps(detail.airfryerPreparationSteps ?? []),
  };
}

export function mapRecipeDetail(detail: ApiRecipeDetail): UiRecipeDetail {
  const prep = detail.preparationTime ?? 0;
  const cook = detail.cookingTime ?? 0;
  const total = prep + cook;

  return {
    id: String(detail.uid),
    title: detail.title,
    imageUrl: recipeHeroImage(detail),
    bakeDurationMinutes: total > 0 ? total : prep,
    prepDurationMinutes: prep,
    servings: detail.defaultNumberOfServings ?? 4,
    author: detail.user?.displayName
      ? {
          name: detail.user.displayName,
          avatarUrl: detail.user.profileImageUrl?.trim() || 'https://i.pravatar.cc/150?img=12',
        }
      : { name: '', avatarUrl: '' },
    nutrition: mapNutritions(detail.nutritions ?? []),
    ingredientSections: mapIngredients(detail.ingredients ?? []),
    steps: mapPreparationSteps(detail.preparationSteps ?? []),
  };
}
