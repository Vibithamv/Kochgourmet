import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  RefreshControl,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors } from '@/constants/theme';
import { pillSearchBarStyle, pillSearchInputStyle } from '@/constants/textMetrics';
import { Search, X, Sparkles, ChevronRight } from 'lucide-react-native';
import RecipeCard, {
  type Recipe,
  type CardLayout,
  REZEPE_CARD_IMAGE_SIZE,
} from '@/components/RecipeCard';
import RecipeExpandOverlay from '@/components/RecipeExpandOverlay';
import { useFavourites } from '@/contexts/FavouritesContext';
import { useRecipeFilters } from '@/contexts/RecipeFiltersContext';
import { recipeFilterSelectionToParams } from '@/utils/recipeFilterUtils';
import { useRecipeFavorite } from '@/hooks/useRecipeFavorite';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { userManagement } from '@/hooks/userManagement';
import { mobileAppRecipes } from '@/hooks/mobileApp';
import { mapRecipeListItem } from '@/utils/mobileAppMappers';
import { useGlobalAlert } from '@/contexts/AlertContext';
import { replaceLoginClearingAuthStack } from '@/utils/authNavigation';
import { RezepteGridShimmer, ShimmerBlock, useShimmerAnim } from '@/components/Shimmer';
import OptimizedImage from '@/components/OptimizedImage';
import { LinearGradient } from 'expo-linear-gradient';
import { RECIPES_PER_PAGE } from '@/constants/recipeListDefaults';

const TAB_BAR_HEIGHT = 80;

function PromoBanner({ onDismiss, tabBarHeight }: Readonly<{ onDismiss: () => void; tabBarHeight: number }>) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(120)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 60, friction: 10 }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    );
    shimmerLoop.start();
    return () => shimmerLoop.stop();
  }, []);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 140, duration: 280, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(onDismiss);
  };

  const shimmerOpacity = shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.18] });

  const bottom = tabBarHeight + Math.max(insets.bottom, 12) + 12;

  return (
    <Animated.View
      style={[
        styles.bannerWrap,
        { bottom, opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <TouchableOpacity activeOpacity={0.9} onPress={() => { dismiss(); router.push('/(tabs)/offerings'); }}>
        <LinearGradient
          colors={['#C8412A', '#EE7B5F', '#F4A27A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bannerGradient}
        >
          {/* Animated shimmer overlay */}
          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, styles.shimmerOverlay, { opacity: shimmerOpacity }]}
          />

          {/* Left icon */}
          <View style={styles.bannerIconWrap}>
            <Sparkles size={28} color="#fff" />
          </View>

          {/* Text */}
          <View style={styles.bannerTextBlock}>
            <Text style={styles.bannerTitle}>{t('common.recipe.bannerTitle')}</Text>
            <Text style={styles.bannerSubtitle}>
              {t('common.recipe.bannerSubtitle')}
            </Text>
          </View>

          {/* Arrow */}
          <ChevronRight size={20} color="rgba(255,255,255,0.75)" style={styles.bannerArrow} />
        </LinearGradient>
      </TouchableOpacity>

      {/* Dismiss button */}
      <TouchableOpacity style={styles.bannerClose} onPress={dismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <View style={styles.bannerCloseInner}>
          <X size={13} color="#fff" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function RezepteScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const insets = useSafeAreaInsets();
  const { showAlert } = useGlobalAlert();
  const userAccount = useMemo(() => userManagement(), []);
  const recipesApi = useMemo(() => mobileAppRecipes(), []);

  const { setRecipeFavorite, syncRecipesFromList } = useFavourites();
  const { toggleFavorite } = useRecipeFavorite();
  const { selection, chips, removeChip } = useRecipeFilters();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [userName, setUserName] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const avatarShimmerAnim = useShimmerAnim();
  const [showBanner, setShowBanner] = useState(false);
  const bannerShownRef = useRef(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tabBlurredRef = useRef(false);
  const [expandedRecipe, setExpandedRecipe] = useState<{
    recipe: Recipe;
    layout: CardLayout;
  } | null>(null);

  const openRecipeDetail = useCallback((recipe: Recipe, layout: CardLayout) => {
    setExpandedRecipe({ recipe, layout });
  }, []);

  const closeRecipeDetail = useCallback(() => {
    setExpandedRecipe(null);
  }, []);

  const recipesRef = useRef(recipes);
  recipesRef.current = recipes;

  const loadRecipes = useCallback(
    async (
      options: { page?: number; append?: boolean; search?: string; silent?: boolean } = {},
    ) => {
      const nextPage = options.page ?? 1;
      const append = options.append ?? false;
      const search = options.search ?? searchQuery;
      const silent = options.silent ?? false;

      if (append) {
        setLoadingMore(true);
      } else if (nextPage === 1 && !silent && recipesRef.current.length === 0) {
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
          const members = response.data['hydra:member'] ?? [];
          const mapped = members.map(mapRecipeListItem);
          setRecipes((prev) => (append ? [...prev, ...mapped] : mapped));
          syncRecipesFromList(mapped);
          setPage(nextPage);
          setHasMore(Boolean(response.data['hydra:view']?.['hydra:next']));
        } else {
          if (!append) {
            setRecipes([]);
          }
          setHasMore(false);
          if (!append && response.status !== undefined) {
            showAlert(t('common.error'), t('common.recipe.loadError'));
          }
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [recipesApi, searchQuery, selection, showAlert, syncRecipesFromList, t],
  );

  const loadRecipesRef = useRef(loadRecipes);
  loadRecipesRef.current = loadRecipes;

  useFocusEffect(
    useCallback(() => {
      if (tabBlurredRef.current) {
        setSearchQuery('');
        if (searchDebounceRef.current) {
          clearTimeout(searchDebounceRef.current);
        }
        void loadRecipesRef.current({ page: 1, search: '', silent: true });
      }
      return () => {
        tabBlurredRef.current = true;
        if (searchDebounceRef.current) {
          clearTimeout(searchDebounceRef.current);
        }
        setSearchQuery('');
      };
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      userAccount.getUser().then((res) => {
        if (cancelled) return;
        if (res.success && res.data) {
          const u = res.data.data.user;
          setUserName(u.first_name ?? '');
          const pic = u.profile_picture;
          setProfilePictureUrl(typeof pic === 'string' && pic.trim() ? pic : null);
          if (!bannerShownRef.current) {
            bannerShownRef.current = true;
            setTimeout(() => setShowBanner(true), 800);
          }
        } else if (res.status === 401) {
          showAlert(t('profile.sessionExpired'), t('profile.loginAgain'));
          replaceLoginClearingAuthStack();
        }
        setProfileLoading(false);
      });
      return () => {
        cancelled = true;
      };
    }, [showAlert, t, userAccount]),
  );

  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    if (!refreshing && recipesRef.current.length === 0) {
      setLoading(true);
    }
    searchDebounceRef.current = setTimeout(() => {
      void loadRecipes({ page: 1, search: searchQuery });
    }, 400);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchQuery, selection, loadRecipes]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadRecipes({ page: 1, search: searchQuery });
  }, [loadRecipes, searchQuery]);

  const onLoadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    void loadRecipes({ page: page + 1, append: true, search: searchQuery });
  }, [hasMore, loadRecipes, loading, loadingMore, page, searchQuery]);

  const handleToggleFavourite = useCallback(
    (recipe: Recipe) => {
      void (async () => {
        const nextFavorite = await toggleFavorite(recipe.id, recipe.isFavourite ?? false);
        if (nextFavorite === null) return;
        setRecipes((prev) =>
          prev.map((item) =>
            item.id === recipe.id ? { ...item, isFavourite: nextFavorite } : item,
          ),
        );
        setRecipeFavorite({ ...recipe, isFavourite: nextFavorite }, nextFavorite);
      })();
    },
    [setRecipeFavorite, toggleFavorite],
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 44) + 12 }]}>
        {profileLoading ? (
          <ShimmerBlock anim={avatarShimmerAnim} width={52} height={52} borderRadius={26} />
        ) : profilePictureUrl ? (
          <OptimizedImage
            source={{ uri: profilePictureUrl }}
            style={styles.avatar}
            resizeMode="cover"
            placeholder={
              <ShimmerBlock
                anim={avatarShimmerAnim}
                width={52}
                height={52}
                borderRadius={26}
              />
            }
          />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarInitial}>
              {userName ? userName[0].toUpperCase() : '?'}
            </Text>
          </View>
        )}
        <View style={styles.greeting}>
          <Text style={[styles.greetingName, { color: colors.text.primary }]}>
            {t('common.recipe.greeting', { name: userName || '...' })}
          </Text>
          <Text style={[styles.greetingSubtitle, { color: colors.text.primary }]}>
            {t('common.recipe.greetingSubtitle')}
          </Text>
        </View>
      </View>

      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={[pillSearchBarStyle, { flex: 1, backgroundColor: colors.background.secondary }]}>
          <TextInput
            style={pillSearchInputStyle({ color: colors.text.primary })}
            placeholder={t('common.recipe.searchPlaceholder')}
            placeholderTextColor={colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Search size={18} color={colors.text.tertiary} />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => router.push('/recipe/filter')}
          activeOpacity={0.8}
        >
          <Image
            source={require('../../assets/images/rezepte-filter-button.png')}
            style={styles.filterButtonImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      {/* Active filter chips */}
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

      {/* Floating promo banner */}
      {showBanner && (
        <PromoBanner
          tabBarHeight={TAB_BAR_HEIGHT}
          onDismiss={() => setShowBanner(false)}
        />
      )}

      {/* Recipe grid / empty state */}
      {loading && !refreshing && recipes.length === 0 ? (
        <RezepteGridShimmer itemCount={RECIPES_PER_PAGE} />
      ) : recipes.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
            {t('common.recipe.nothingFound')}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.text.primary }]}>
            {t('common.recipe.nothingFoundSubtitle')}
          </Text>
        </View>
      ) : (
        <FlatList
          style={styles.list}
          data={recipes}
          keyExtractor={(item) => item.id}
          extraData={expandedRecipe?.recipe.id ?? recipes}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[
            styles.grid,
            { paddingBottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 12) + 16 },
          ]}
          showsVerticalScrollIndicator={false}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadMore}>
                <Text style={[styles.loadMoreText, { color: colors.text.tertiary }]}>
                  {t('common.recipe.loadMore')}
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <RecipeCard
                recipe={item}
                variant="rezepte"
                imageSize={REZEPE_CARD_IMAGE_SIZE}
                hidden={expandedRecipe?.recipe.id === item.id}
                onPressWithLayout={(layout) => openRecipeDetail(item, layout)}
                onToggleFavourite={() => handleToggleFavourite(item)}
              />
            </View>
          )}
        />
      )}

      {expandedRecipe && (
        <RecipeExpandOverlay
          recipe={expandedRecipe.recipe}
          sourceLayout={expandedRecipe.layout}
          onClose={closeRecipeDetail}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 0,
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Inter-Bold',
  },
  greeting: {
    flex: 1,
    paddingTop: 4,
    gap: 4,
  },
  greetingName: {
    fontFamily: 'Roboto-Regular',
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: 0,
  },
  greetingSubtitle: {
    fontFamily: 'Roboto-Light',
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: 0,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 10,
    marginTop: 50,
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
  },
  row: {
    gap: 12,
  },
  cardWrapper: {
    flex: 1,
  },
  loadMore: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadMoreText: {
    fontFamily: 'Roboto-Light',
    fontSize: 14,
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
  },
  emptySubtitle: {
    fontFamily: 'Roboto-Light',
    fontSize: 17,
    lineHeight: 23,
    letterSpacing: 0,
  },
  bannerWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 100,
  },
  bannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
    shadowColor: '#C8412A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 12,
    overflow: 'hidden',
  },
  shimmerOverlay: {
    backgroundColor: '#fff',
    borderRadius: 20,
  },
  bannerIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bannerTextBlock: {
    flex: 1,
    gap: 3,
  },
  bannerTitle: {
    fontSize: 15,
    fontFamily: 'Inter-Bold',
    color: '#fff',
    letterSpacing: -0.2,
  },
  bannerSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 17,
  },
  bannerArrow: {
    flexShrink: 0,
  },
  bannerClose: {
    position: 'absolute',
    top: -8,
    right: -8,
    zIndex: 101,
  },
  bannerCloseInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
