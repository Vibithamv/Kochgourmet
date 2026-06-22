import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Image,
  type ListRenderItem,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Search, Check, X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors } from '@/constants/theme';
import { pillSearchBarStyle, pillSearchInputStyle } from '@/constants/textMetrics';
import { useRecipeFilters } from '@/contexts/RecipeFiltersContext';
import { recipeFilterSelectionToParams } from '@/utils/recipeFilterUtils';
import { mobileAppFavorites, mobileAppRecipes } from '@/hooks/mobileApp';
import { mapRecipeListItem } from '@/utils/mobileAppMappers';
import { useGlobalAlert } from '@/contexts/AlertContext';
import { RezepteGridShimmer } from '@/components/Shimmer';
import RecipeCard, { REZEPE_CARD_IMAGE_SIZE, type Recipe } from '@/components/RecipeCard';
import { RECIPES_PER_PAGE } from '@/constants/recipeListDefaults';

type AddRecipesToFolderModalProps = Readonly<{
  visible: boolean;
  folderId: string;
  existingRecipeIds: string[];
  onClose: () => void;
  onAdded: () => void;
}>;

export default function AddRecipesToFolderModal({
  visible,
  folderId,
  existingRecipeIds,
  onClose,
  onAdded,
}: AddRecipesToFolderModalProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const insets = useSafeAreaInsets();
  const { showAlert } = useGlobalAlert();
  const { selection, chips, removeChip } = useRecipeFilters();
  const recipesApi = useMemo(() => mobileAppRecipes(), []);
  const favoritesApi = useMemo(() => mobileAppFavorites(), []);

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const existingIdsSet = useMemo(() => new Set(existingRecipeIds), [existingRecipeIds]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: colors.background.primary,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingBottom: 12,
          gap: 12,
        },
        headerTitle: {
          flex: 1,
          fontFamily: 'PlayfairDisplay_700Bold',
          fontSize: 35,
          lineHeight: 48,
          letterSpacing: 0,
          color: colors.text.primary,
        },
        closeBtn: {
          width: 36,
          height: 36,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: colors.border.primary,
          alignItems: 'center',
          justifyContent: 'center',
        },
        searchRow: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          gap: 10,
          marginBottom: 16,
        },
        filterButton: {
          width: 46,
          height: 46,
        },
        filterButtonImage: {
          width: 46,
          height: 46,
        },
        chipsSection: {
          flexGrow: 0,
          flexShrink: 0,
          marginBottom: 16,
        },
        chipsRow: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          paddingHorizontal: 20,
          gap: 8,
          rowGap: 8,
        },
        chip: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          height: 25,
          borderRadius: 9999,
          paddingHorizontal: 10,
          gap: 4,
        },
        chipText: {
          color: '#fff',
          fontSize: 12,
          lineHeight: 16,
          fontFamily: 'Inter-Medium',
        },
        list: {
          flex: 1,
        },
        grid: {
          paddingHorizontal: 20,
          gap: 12,
          paddingBottom: 16,
        },
        row: {
          gap: 12,
        },
        cardWrapper: {
          flex: 1,
          position: 'relative',
        },
        cardSelected: {
          borderWidth: 2,
          borderRadius: 12,
        },
        checkWrap: {
          position: 'absolute',
          top: 8,
          right: 8,
          width: 28,
          height: 28,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2,
        },
        footer: {
          flexDirection: 'row',
          gap: 12,
          paddingHorizontal: 20,
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: colors.border.primary,
          backgroundColor: colors.background.primary,
        },
        footerBtn: {
          flex: 1,
          height: 48,
          borderRadius: 9999,
          alignItems: 'center',
          justifyContent: 'center',
        },
        cancelBtn: {
          borderWidth: 1,
          borderColor: colors.border.primary,
        },
        addBtn: {
          backgroundColor: colors.primary,
        },
        cancelText: {
          fontFamily: 'Roboto-Regular',
          fontSize: 15,
          color: colors.text.primary,
        },
        addText: {
          fontFamily: 'Roboto-Regular',
          fontSize: 15,
          color: theme === 'dark' || theme === 'darkGreen' ? '#0D1117' : '#FFFFFF',
        },
        emptyState: {
          flex: 1,
          paddingHorizontal: 24,
          paddingTop: 48,
          gap: 12,
        },
        emptyTitle: {
          fontFamily: 'PlayfairDisplay_700Bold',
          fontSize: 35,
          lineHeight: 48,
          letterSpacing: 0,
          color: colors.text.primary,
        },
        emptySubtitle: {
          fontFamily: 'Roboto-Light',
          fontSize: 17,
          lineHeight: 23,
          letterSpacing: 0,
          color: colors.text.primary,
        },
        selectedHint: {
          paddingHorizontal: 20,
          paddingBottom: 8,
          fontFamily: 'Roboto-Light',
          fontSize: 14,
          color: colors.text.secondary,
        },
      }),
    [colors, theme],
  );

  const loadRecipes = useCallback(
    async (options: { page?: number; append?: boolean; search?: string } = {}) => {
      const nextPage = options.page ?? 1;
      const append = options.append ?? false;
      const search = options.search ?? searchQuery;

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const response = await recipesApi.listRecipes({
          page: nextPage,
          itemsPerPage: RECIPES_PER_PAGE,
          ...recipeFilterSelectionToParams(selection),
          ...(search.trim() ? { search: search.trim() } : {}),
        });

        if (response.success && response.data) {
          const members = (response.data['hydra:member'] ?? [])
            .map(mapRecipeListItem)
            .filter((recipe) => !existingIdsSet.has(recipe.id));

          setRecipes((prev) => (append ? [...prev, ...members] : members));
          setPage(nextPage);
          setHasMore(Boolean(response.data['hydra:view']?.['hydra:next']));
        } else {
          showAlert(t('common.error'), t('common.recipe.loadError'));
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [existingIdsSet, recipesApi, searchQuery, selection, showAlert, t],
  );

  const resetModal = useCallback(() => {
    setSearchQuery('');
    setSelectedIds(new Set());
    setRecipes([]);
    setPage(1);
    setHasMore(true);
  }, []);

  useEffect(() => {
    if (!visible) {
      resetModal();
      return;
    }
    void loadRecipes({ page: 1 });
  }, [visible, selection]);

  useFocusEffect(
    useCallback(() => {
      if (visible) {
        void loadRecipes({ page: 1 });
      }
    }, [loadRecipes, visible]),
  );

  useEffect(() => {
    if (!visible) return undefined;

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      void loadRecipes({ page: 1, search: searchQuery });
    }, 350);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchQuery, visible]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleAdd = useCallback(async () => {
    if (selectedIds.size === 0 || submitting) return;

    setSubmitting(true);
    try {
      const results = await Promise.all(
        Array.from(selectedIds).map((recipeId) =>
          favoritesApi.addRecipeToFolder(folderId, { recipeId: Number(recipeId) }),
        ),
      );

      const allOk = results.every((result) => result.success);
      if (allOk) {
        onAdded();
        onClose();
        return;
      }

      showAlert(t('common.error'), t('favoritenScreen.addRecipesFailed'));
    } finally {
      setSubmitting(false);
    }
  }, [favoritesApi, folderId, onAdded, onClose, selectedIds, showAlert, submitting, t]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      void loadRecipes({ page: page + 1, append: true });
    }
  }, [hasMore, loadRecipes, loading, loadingMore, page]);

  const renderItem: ListRenderItem<Recipe> = useCallback(
    ({ item }) => {
      const isSelected = selectedIds.has(item.id);
      const checkIconColor = theme === 'dark' || theme === 'darkGreen' ? '#0D1117' : '#FFFFFF';
      return (
        <View
          style={[
            styles.cardWrapper,
            isSelected && [styles.cardSelected, { borderColor: colors.primary }],
          ]}
        >
          <RecipeCard
            recipe={item}
            variant="rezepte"
            imageSize={REZEPE_CARD_IMAGE_SIZE}
            showRating
            onPress={() => toggleSelection(item.id)}
          />
          {isSelected ? (
            <View style={[styles.checkWrap, { backgroundColor: colors.primary }]}>
              <Check size={16} color={checkIconColor} strokeWidth={3} />
            </View>
          ) : null}
        </View>
      );
    },
    [colors, selectedIds, styles, theme, toggleSelection],
  );

  const footerPadding = Math.max(insets.bottom, 12);

  const listBody = (() => {
    if (loading && recipes.length === 0) {
      return <RezepteGridShimmer />;
    }
    if (recipes.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>{t('common.recipe.nothingFound')}</Text>
          <Text style={styles.emptySubtitle}>{t('common.recipe.nothingFoundSubtitle')}</Text>
        </View>
      );
    }
    return (
      <FlatList
        style={styles.list}
        data={recipes}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        renderItem={renderItem}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        showsVerticalScrollIndicator={false}
      />
    );
  })();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, { paddingTop: Math.max(insets.top, 44) + 8 }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('favoritenScreen.addRecipesTitle')}</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={8}>
            <X size={18} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <View style={[pillSearchBarStyle, { flex: 1, backgroundColor: colors.background.secondary }]}>
            <TextInput
              style={pillSearchInputStyle({ color: colors.text.primary })}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t('common.recipe.searchPlaceholder')}
              placeholderTextColor={colors.text.tertiary}
            />
            <Search size={18} color={colors.text.tertiary} />
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => router.push('/recipe/filter')}
            activeOpacity={0.8}
          >
            <Image
              source={require('../assets/images/rezepte-filter-button.png')}
              style={styles.filterButtonImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        {chips.length > 0 && (
          <View style={styles.chipsSection}>
            <View style={styles.chipsRow}>
              {chips.map((chip) => (
                <TouchableOpacity
                  key={chip.id}
                  style={[styles.chip, { backgroundColor: colors.primary }]}
                  onPress={() => removeChip(chip.id)}
                  activeOpacity={0.8}
                >
                  <X size={10} color="#fff" />
                  <Text style={styles.chipText}>{chip.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {selectedIds.size > 0 ? (
          <Text style={styles.selectedHint}>
            {t('favoritenScreen.selectedCount', { count: selectedIds.size })}
          </Text>
        ) : null}

        {listBody}

        <View style={[styles.footer, { paddingBottom: footerPadding }]}>
          <TouchableOpacity
            style={[styles.footerBtn, styles.cancelBtn]}
            onPress={onClose}
            disabled={submitting}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.footerBtn,
              styles.addBtn,
              (selectedIds.size === 0 || submitting) && { opacity: 0.5 },
            ]}
            onPress={() => void handleAdd()}
            disabled={selectedIds.size === 0 || submitting}
            activeOpacity={0.8}
          >
            <Text style={styles.addText}>{t('favoritenScreen.addRecipes')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
