import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ChevronLeft, Minus, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors } from '@/constants/theme';
import { useFolders } from '@/contexts/FoldersContext';
import { useFavourites } from '@/contexts/FavouritesContext';
import { mobileAppFavorites } from '@/hooks/mobileApp';
import { mapFavoriteFolderDetail, mapFolderRecipe } from '@/utils/mobileAppMappers';
import RecipeCard, { type Recipe } from '@/components/RecipeCard';
import AddRecipesToFolderModal from '@/components/AddRecipesToFolderModal';
import type { Folder } from '@/contexts/FoldersContext';

export default function FolderDetailScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { removeRecipeFromFolder } = useFolders();
  const { toggleFavourite } = useFavourites();
  const favoritesApi = useMemo(() => mobileAppFavorites(), []);

  const [folder, setFolder] = useState<Folder | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const loadFolder = useCallback(async () => {
    if (!id) {
      setFolder(null);
      setRecipes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const response = await favoritesApi.getFolder(id);
    if (response.success && response.data) {
      const mapped = mapFavoriteFolderDetail(response.data);
      setFolder(mapped);
      setRecipes((response.data.recipes ?? []).map(mapFolderRecipe));
    } else {
      setFolder(null);
      setRecipes([]);
    }
    setLoading(false);
  }, [favoritesApi, id]);

  useFocusEffect(
    useCallback(() => {
      void loadFolder();
    }, [loadFolder]),
  );

  const handleRemove = useCallback(
    async (recipeId: string, thumbUri: string) => {
      if (!folder) return;
      const ok = await removeRecipeFromFolder(folder.id, recipeId, thumbUri);
      if (ok) {
        setRecipes((prev) => prev.filter((recipe) => recipe.id !== recipeId));
        setFolder((prev) =>
          prev
            ? {
                ...prev,
                count: Math.max(0, prev.count - 1),
                thumbnails: prev.thumbnails.filter((thumb) => thumb.recipeId !== recipeId),
              }
            : prev,
        );
      }
    },
    [folder, removeRecipeFromFolder],
  );

  if (loading) {
    return (
      <View style={[styles.screen, styles.centered, { backgroundColor: colors.background.primary }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

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
            {t('favoritenScreen.folderNotFound')}
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
        <TouchableOpacity
          style={[styles.addCircle, { borderColor: colors.border.primary, backgroundColor: colors.background.secondary }]}
          onPress={() => setAddModalOpen(true)}
          hitSlop={8}
          activeOpacity={0.7}
        >
          <Plus size={20} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      {recipes.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.text.tertiary }]}>
            {t('favoritenScreen.folderEmpty')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={[
            styles.grid,
            { paddingBottom: Math.max(insets.bottom, 12) + 16 },
          ]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <FolderRecipeCard
              recipe={item}
              onRemove={() => {
                const thumb = folder.thumbnails.find((entry) => entry.recipeId === item.id);
                void handleRemove(item.id, thumb?.uri ?? item.imageUrl);
              }}
              onToggleFavourite={toggleFavourite}
            />
          )}
        />
      )}

      <AddRecipesToFolderModal
        visible={addModalOpen}
        folderId={folder.id}
        existingRecipeIds={recipes.map((recipe) => recipe.id)}
        onClose={() => setAddModalOpen(false)}
        onAdded={() => {
          void loadFolder();
        }}
      />
    </View>
  );
}

interface FolderRecipeCardProps {
  readonly recipe: Recipe;
  readonly onRemove: () => void;
  readonly onToggleFavourite: (id: string) => void;
}

function FolderRecipeCard({ recipe, onRemove, onToggleFavourite }: FolderRecipeCardProps) {
  const { theme } = useTheme();
  const colors = getColors(theme);

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
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  addCircle: {
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
