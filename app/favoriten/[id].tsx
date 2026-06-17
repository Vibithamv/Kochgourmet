import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Minus } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors } from '@/constants/theme';
import { useFolders, type FolderThumb } from '@/contexts/FoldersContext';
import { useFavourites } from '@/contexts/FavouritesContext';
import { getRecipeDetail } from '@/utils/mockRecipeDetails';
import RecipeCard, { type Recipe } from '@/components/RecipeCard';

const TAB_BAR_HEIGHT = 90;

function folderThumbToRecipe(thumb: FolderThumb, recipes: Recipe[]): Recipe {
  const detail = getRecipeDetail(thumb.recipeId);
  const fromList = recipes.find(r => r.id === thumb.recipeId);
  const durationMinutes = detail.bakeDurationMinutes > 0
    ? detail.bakeDurationMinutes
    : detail.prepDurationMinutes;

  return {
    id: thumb.recipeId,
    title: detail.title,
    imageUrl: thumb.uri,
    durationMinutes,
    rating: fromList?.rating ?? 5,
    isFavourite: fromList?.isFavourite ?? true,
  };
}

export default function FolderDetailScreen() {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getFolder, removeRecipeFromFolder } = useFolders();
  const { recipes, toggleFavourite } = useFavourites();

  const folder = getFolder(id);

  if (!folder) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 44) + 16 }]}>
          <TouchableOpacity
            style={[styles.backCircle, { borderColor: colors.border.primary }]}
            onPress={() => router.back()}
            hitSlop={8}
          >
            <ChevronLeft size={20} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.text.tertiary }]}>
            Ordner nicht gefunden
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 44) + 16 }]}>
        <TouchableOpacity
          style={[styles.backCircle, { borderColor: colors.border.primary }]}
          onPress={() => router.back()}
          hitSlop={8}
          activeOpacity={0.7}
        >
          <ChevronLeft size={20} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          {folder.title}
        </Text>
      </View>

      {folder.thumbnails.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.text.tertiary }]}>
            Noch keine Rezepte in diesem Ordner
          </Text>
        </View>
      ) : (
        <FlatList
          data={folder.thumbnails}
          keyExtractor={(item, i) => `${item.recipeId}-${item.uri}-${i}`}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={[
            styles.grid,
            { paddingBottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 12) + 16 },
          ]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <FolderRecipeCard
              thumb={item}
              recipes={recipes}
              onRemove={() => removeRecipeFromFolder(folder.id, item.recipeId, item.uri)}
              onToggleFavourite={toggleFavourite}
            />
          )}
        />
      )}
    </View>
  );
}

interface FolderRecipeCardProps {
  readonly thumb: FolderThumb;
  readonly recipes: Recipe[];
  readonly onRemove: () => void;
  readonly onToggleFavourite: (id: string) => void;
}

function FolderRecipeCard({ thumb, recipes, onRemove, onToggleFavourite }: FolderRecipeCardProps) {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const recipe = folderThumbToRecipe(thumb, recipes);

  return (
    <View style={styles.cardWrapper}>
      <View style={styles.cardShell}>
        <RecipeCard
          recipe={recipe}
          variant="rezepte"
          showRating={false}
          onPress={() => router.push(`/recipe/${recipe.id}`)}
          onToggleFavourite={() => onToggleFavourite(recipe.id)}
        />
        <TouchableOpacity
          style={styles.minusBtn}
          onPress={onRemove}
          hitSlop={8}
          activeOpacity={0.7}
        >
          <Minus size={14} color={colors.text.primary} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 14,
  },
  backCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 35,
    lineHeight: 48,
    letterSpacing: 0,
    flex: 1,
  },

  grid: { paddingHorizontal: 20, gap: 12 },
  gridRow: { gap: 12 },
  cardWrapper: { flex: 1 },
  cardShell: { flex: 1, position: 'relative' },
  minusBtn: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 15, fontFamily: 'Inter-Regular' },
});
