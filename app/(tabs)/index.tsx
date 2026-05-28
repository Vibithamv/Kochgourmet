import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
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
import { Search, SlidersHorizontal, X, Sparkles, ChevronRight } from 'lucide-react-native';
import RecipeCard from '@/components/RecipeCard';
import { useFavourites } from '@/contexts/FavouritesContext';
import { useFocusEffect } from '@react-navigation/native';
import { userManagement } from '@/hooks/userManagement';
import { useGlobalAlert } from '@/contexts/AlertContext';
import { replaceLoginClearingAuthStack } from '@/utils/authNavigation';
import { LinearGradient } from 'expo-linear-gradient';


function PromoBanner({ onDismiss, tabBarHeight }: Readonly<{ onDismiss: () => void; tabBarHeight: number }>) {
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
            <Text style={styles.bannerTitle}>Werde Teil der Familie! 🎁</Text>
            <Text style={styles.bannerSubtitle}>
              Jetzt Gutschein sichern & von exklusiven Rabatten profitieren!
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
  const { theme } = useTheme();
  const colors = getColors(theme);
  const insets = useSafeAreaInsets();
  const { showAlert } = useGlobalAlert();
  const userAccount = userManagement();

  const { recipes, toggleFavourite } = useFavourites();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const bannerShownRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      userAccount.getUser().then(res => {
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
          showAlert('Sitzung abgelaufen', 'Bitte melde dich erneut an.');
          replaceLoginClearingAuthStack();
        }
      });
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const filteredRecipes = useMemo(() => {
    if (!searchQuery) return recipes;
    return recipes.filter(r =>
      r.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [recipes, searchQuery]);

  const removeFilter = useCallback((filter: string) => {
    setActiveFilters(prev => prev.filter(f => f !== filter));
  }, []);

  const TAB_BAR_HEIGHT = 80;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.secondary }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 44) + 12 }]}>
        {profilePictureUrl ? (
          <Image source={{ uri: profilePictureUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarInitial}>
              {userName ? userName[0].toUpperCase() : '?'}
            </Text>
          </View>
        )}
        <View style={styles.greeting}>
          <Text style={[styles.greetingName, { color: colors.text.primary }]}>
            Bonjour {userName || '...'} 👋
          </Text>
          <Text style={[styles.greetingSubtitle, { color: colors.text.tertiary }]}>
            Was willst du heute Kochen?
          </Text>
        </View>
      </View>

      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={[styles.searchBar, { backgroundColor: colors.background.tertiary }]}>
          <TextInput
            style={[styles.searchInput, { color: colors.text.primary }]}
            placeholder="Rezeptsuche"
            placeholderTextColor={colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Search size={20} color={colors.text.tertiary} />
        </View>
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/recipe/filter')}
          activeOpacity={0.8}
        >
          <SlidersHorizontal size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {activeFilters.map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.chip, { backgroundColor: colors.primary }]}
              onPress={() => removeFilter(f)}
              activeOpacity={0.8}
            >
              <X size={11} color="#fff" />
              <Text style={styles.chipText}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Floating promo banner */}
      {showBanner && (
        <PromoBanner
          tabBarHeight={TAB_BAR_HEIGHT}
          onDismiss={() => setShowBanner(false)}
        />
      )}

      {/* Recipe grid / empty state */}
      {filteredRecipes.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
            Nichts gefunden 😱
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.text.tertiary }]}>
            Ändere deine Suchanfrage oder Filter-Einstellungen.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredRecipes}
          keyExtractor={item => item.id}
          extraData={recipes}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[
            styles.grid,
            { paddingBottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 12) + 16 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <RecipeCard
                recipe={item}
                onPress={() => router.push(`/recipe/${item.id}`)}
                onToggleFavourite={() => toggleFavourite(item.id)}
              />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
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
  greeting: { gap: 2 },
  greetingName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  greetingSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 14,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsRow: {
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 5,
  },
  chipText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Inter-Medium',
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
  emptyState: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
  },
  emptySubtitle: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
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
