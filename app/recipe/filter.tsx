import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  FlatList,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  ChevronRight, ChevronLeft, ChevronDown, ChevronUp, Check,
  Soup, Beef, Salad, Cookie, Sandwich, Apple, CakeSlice,
  Droplet, Flame, Egg, CookingPot, Wine, Pizza, Star,
} from 'lucide-react-native';
import { SvgXml } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';
import { useGlobalAlert } from '@/contexts/AlertContext';
import { getColors } from '@/constants/theme';
import { inlineSvgStyles } from '@/utils/inlineSvgStyles';
import { useRecipeFilters } from '@/contexts/RecipeFiltersContext';
import { mobileAppRecipes } from '@/hooks/mobileApp';
import type {
  RecipeFilterCategory,
  RecipeFilterCountry,
  RecipeFilterOptions,
  RecipeFilterTimeBucket,
} from '@/types/mobileAppApi';
import {
  countryFlagUrl,
  type RecipeFilterSelection,
} from '@/utils/recipeFilterUtils';

type LucideIcon = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'Pasta & Reisgerichte': Soup,
  'Desserts': CakeSlice,
  'Getränke': Wine,
  'Fisch & Fleisch': Beef,
  'Backen': Cookie,
  'Ofen Gerichte': Pizza,
  'Grillen': Flame,
  'Streetfood & Snacks': Sandwich,
  'Saucen, Dips & Co': Droplet,
  'Käse': Pizza,
  'Suppen': Soup,
  'Eintöpfe': CookingPot,
  'Ei': Egg,
  'Gemüse & Obst': Apple,
  'Salate': Salad,
};

function getCategoryIcon(name: string): LucideIcon {
  return CATEGORY_ICONS[name] ?? Soup;
}

const FLAG_SIZE = 20;

const FILTER_SECTIONS = [
  'categories',
  'specials',
  'diets',
  'countries',
  'occasions',
  'preparationTypes',
  'difficulties',
  'menutypes',
  'timeBuckets',
] as const;

type FilterSectionKey = (typeof FILTER_SECTIONS)[number];
type ScreenMode = 'main' | FilterSectionKey;

type FlatFilterSectionKey = Exclude<
  FilterSectionKey,
  'categories' | 'countries' | 'difficulties' | 'timeBuckets'
>;

const FLAT_FILTER_UID_FIELD: Record<
  FlatFilterSectionKey,
  'specialUids' | 'dietUids' | 'occasionUids' | 'preparationTypeUids' | 'menutypeUids'
> = {
  specials: 'specialUids',
  diets: 'dietUids',
  occasions: 'occasionUids',
  preparationTypes: 'preparationTypeUids',
  menutypes: 'menutypeUids',
};

const EXACT_MATCH_SWITCH_TARGET = Platform.select({
  ios: {
    width: 26.755584716796875,
    height: 12.468358993530273,
  },
  android: {
    width: 42,
    height: 18,
  },
  default: {
    width: 26.755584716796875,
    height: 12.468358993530273,
  },
}) as { width: number; height: number };

const NATIVE_SWITCH_SIZE = Platform.select({
  ios: { width: 51, height: 31 },
  android: { width: 48, height: 28 },
  default: { width: 51, height: 31 },
}) as { width: number; height: number };

const EXACT_MATCH_SWITCH_SCALE = EXACT_MATCH_SWITCH_TARGET.width / NATIVE_SWITCH_SIZE.width;

const EXACT_MATCH_SWITCH_LAYOUT = {
  width: NATIVE_SWITCH_SIZE.width * EXACT_MATCH_SWITCH_SCALE,
  height: NATIVE_SWITCH_SIZE.height * EXACT_MATCH_SWITCH_SCALE,
};

type ColorsType = ReturnType<typeof getColors>;

interface ActionButtonsProps {
  readonly colors: ColorsType;
  readonly bottomInset: number;
  readonly onCancel: () => void;
  readonly onApply: () => void;
}

function ActionButtons({ colors, bottomInset, onCancel, onApply }: ActionButtonsProps) {
  const { t } = useTranslation();

  return (
    <View style={[styles.actions, { paddingBottom: Math.max(bottomInset, 16) + 16 }]}>
      <TouchableOpacity
        style={[styles.cancelBtn, { borderColor: colors.border.primary }]}
        onPress={onCancel}
        activeOpacity={0.7}
      >
        <Text style={[styles.cancelText, { color: colors.text.primary }]}>
          {t('common.recipe.filterCancel')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.applyBtn, { backgroundColor: colors.primary }]}
        onPress={onApply}
        activeOpacity={0.8}
      >
        <Text style={styles.applyText}>{t('common.recipe.filterApply')}</Text>
      </TouchableOpacity>
    </View>
  );
}

interface SubHeaderProps {
  readonly title: string;
  readonly colors: ColorsType;
  readonly topInset: number;
  readonly onBack: () => void;
}

interface CircularFlagProps {
  readonly flagUrl: string | null;
  readonly colors: ColorsType;
}

function FlagFallback({ colors }: { readonly colors: ColorsType }) {
  return (
    <View style={[styles.flagCircle, { backgroundColor: colors.primary }]}>
      <Star size={14} color="#fff" fill="#fff" />
    </View>
  );
}

function CircularFlag({ flagUrl, colors }: CircularFlagProps) {
  const [svgXml, setSvgXml] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (!flagUrl) {
      setSvgXml(null);
      setLoadFailed(false);
      return undefined;
    }

    let cancelled = false;
    setSvgXml(null);
    setLoadFailed(false);

    void fetch(flagUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Flag request failed (${response.status})`);
        }
        return response.text();
      })
      .then((rawSvg) => {
        if (!cancelled) {
          setSvgXml(inlineSvgStyles(rawSvg));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadFailed(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [flagUrl]);

  if (!flagUrl || loadFailed) {
    return <FlagFallback colors={colors} />;
  }

  const isSvg = /\.svg(?:$|\?)/i.test(flagUrl);

  if (isSvg) {
    if (!svgXml) {
      return <View style={[styles.flagCircle, { backgroundColor: colors.background.tertiary }]} />;
    }

    return (
      <View style={styles.flagCircle}>
        <SvgXml
          xml={svgXml}
          width={FLAG_SIZE}
          height={FLAG_SIZE}
          onError={() => setLoadFailed(true)}
          fallback={<FlagFallback colors={colors} />}
        />
      </View>
    );
  }

  return (
    <View style={styles.flagCircle}>
      <Image
        source={{ uri: flagUrl }}
        style={styles.flagImage}
        resizeMode="cover"
        onError={() => setLoadFailed(true)}
      />
    </View>
  );
}

function SubHeader({ title, colors, topInset, onBack }: SubHeaderProps) {
  return (
    <View style={[styles.header, { paddingTop: Math.max(topInset, 44) + 16 }]}>
      <TouchableOpacity
        style={[styles.backCircle, { borderColor: colors.border.primary }]}
        onPress={onBack}
        hitSlop={8}
        activeOpacity={0.7}
      >
        <ChevronLeft size={20} color={colors.text.primary} />
      </TouchableOpacity>
      <Text
        style={[styles.titleDisplay, styles.subHeaderTitle, { color: colors.text.primary }]}
        numberOfLines={2}
      >
        {title}
      </Text>
    </View>
  );
}

function timeBucketKey(bucket: RecipeFilterTimeBucket): string {
  return `${bucket.operator}:${bucket.value}`;
}

function getActiveFilterSections(options: RecipeFilterOptions): FilterSectionKey[] {
  return FILTER_SECTIONS.filter((key) => {
    const value = options[key];
    return Array.isArray(value) && value.length > 0;
  });
}

function capitalizeFilterMenuLabel(label: string): string {
  if (!label) return label;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function FilterScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const insets = useSafeAreaInsets();
  const { showAlert } = useGlobalAlert();
  const { options, selection, setOptions, setSelection } = useRecipeFilters();
  const recipesApi = useMemo(() => mobileAppRecipes(), []);

  const [screen, setScreen] = useState<ScreenMode>('main');
  const [draft, setDraft] = useState<RecipeFilterSelection>(selection);
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(!options);

  const loadFilterOptions = useCallback(async () => {
    setLoadingOptions(true);
    const response = await recipesApi.getFilterOptions();
    if (response.success && response.data) {
      setOptions(response.data);
    } else {
      showAlert(t('common.error'), t('common.recipe.filterOptionsLoadError'));
    }
    setLoadingOptions(false);
  }, [recipesApi, setOptions, showAlert, t]);

  useFocusEffect(
    useCallback(() => {
      setDraft(selection);
      if (!options) {
        void loadFilterOptions();
      }
    }, [loadFilterOptions, options, selection]),
  );

  const goBack = () => router.back();
  const goMain = () => setScreen('main');

  const applyFilters = () => {
    setSelection(draft);
    router.back();
  };

  const toggleCategoryUid = (uid: number) => {
    setDraft((prev) => ({
      ...prev,
      categoryUids: prev.categoryUids.includes(uid)
        ? prev.categoryUids.filter((id) => id !== uid)
        : [...prev.categoryUids, uid],
    }));
  };

  const toggleExpand = (uid: number) => {
    setExpandedCategories((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid],
    );
  };

  const toggleCountryUid = (uid: number) => {
    setDraft((prev) => ({
      ...prev,
      countryUids: prev.countryUids.includes(uid)
        ? prev.countryUids.filter((id) => id !== uid)
        : [...prev.countryUids, uid],
    }));
  };

  const toggleUidList = (
    field: 'specialUids' | 'dietUids' | 'occasionUids' | 'preparationTypeUids' | 'menutypeUids',
    uid: number,
  ) => {
    setDraft((prev) => ({
      ...prev,
      [field]: prev[field].includes(uid)
        ? prev[field].filter((id) => id !== uid)
        : [...prev[field], uid],
    }));
  };

  const toggleDifficulty = (uid: number) => {
    setDraft((prev) => ({
      ...prev,
      difficultyUid: prev.difficultyUid === uid ? undefined : uid,
    }));
  };

  const toggleTimeBucket = (bucket: RecipeFilterTimeBucket) => {
    const key = timeBucketKey(bucket);
    setDraft((prev) => ({
      ...prev,
      timeBucket:
        prev.timeBucket && timeBucketKey(prev.timeBucket) === key ? undefined : bucket,
    }));
  };

  const isCategoryChecked = (cat: RecipeFilterCategory) => {
    if (draft.categoryUids.includes(cat.uid)) return true;
    return (cat.children ?? []).some((child) => draft.categoryUids.includes(child.uid));
  };

  const countFor = (key: FilterSectionKey): number => {
    if (key === 'categories') return draft.categoryUids.length;
    if (key === 'countries') return draft.countryUids.length;
    if (key === 'difficulties') return draft.difficultyUid !== undefined ? 1 : 0;
    if (key === 'timeBuckets') return draft.timeBucket ? 1 : 0;

    const field = FLAT_FILTER_UID_FIELD[key as FlatFilterSectionKey];
    const value = draft[field];
    return Array.isArray(value) ? value.length : 0;
  };

  const actionsProps = {
    colors,
    bottomInset: insets.bottom,
    onCancel: goBack,
    onApply: applyFilters,
  };
  const subHeaderProps = {
    colors,
    topInset: insets.top,
    onBack: goMain,
  };

  if (loadingOptions && !options) {
    return (
      <View style={[styles.screen, styles.loadingScreen, { backgroundColor: colors.background.primary }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const categories = options?.categories ?? [];
  const countries = options?.countries ?? [];
  const activeSections = options ? getActiveFilterSections(options) : [];

  if (screen === 'main') {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 44) + 16 }]}>
          <Text style={[styles.titleDisplay, { color: colors.text.primary }]}>
            {t('common.filter')}
          </Text>
        </View>
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {activeSections.map((sectionKey, index) => {
            const badge = countFor(sectionKey);
            const isLastRow = index === activeSections.length - 1;
            return (
              <TouchableOpacity
                key={sectionKey}
                style={[
                  styles.row,
                  { borderBottomColor: colors.border.primary },
                  isLastRow && styles.rowNoBorder,
                ]}
                onPress={() => setScreen(sectionKey)}
                activeOpacity={0.7}
              >
                <Text style={[styles.rowLabel, { color: colors.text.primary }]}>
                  {capitalizeFilterMenuLabel(sectionKey)}
                </Text>
                <View style={styles.rowRight}>
                  {badge > 0 && (
                    <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.badgeText}>{badge}</Text>
                    </View>
                  )}
                  <ChevronRight size={18} color={colors.text.tertiary} />
                </View>
              </TouchableOpacity>
            );
          })}
          <View style={styles.toggleRow}>
            <View style={styles.exactMatchSwitchWrap}>
              <View style={styles.exactMatchSwitchScale}>
                <Switch
                  value={draft.exactMatch}
                  onValueChange={(value) => setDraft((prev) => ({ ...prev, exactMatch: value }))}
                  trackColor={{ false: colors.border.primary, true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>
            </View>
            <View style={styles.toggleLabelRow}>
              <Text style={[styles.rowLabel, { color: colors.text.primary }]}>
                {capitalizeFilterMenuLabel('exactMatch')}
              </Text>
              <TouchableOpacity
                style={[styles.infoCircle, { borderColor: colors.border.secondary }]}
                hitSlop={8}
                activeOpacity={0.6}
              >
                <Text style={[styles.infoIconLetter, { color: colors.text.primary }]}>i</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        <ActionButtons {...actionsProps} />
      </View>
    );
  }

  if (screen === 'categories') {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
        <SubHeader title={capitalizeFilterMenuLabel('categories')} {...subHeaderProps} />
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {categories.map((cat) => {
            const isExpanded = expandedCategories.includes(cat.uid);
            const isChecked = isCategoryChecked(cat);
            const children = cat.children ?? [];
            const hasChildren = children.length > 0;
            const CatIcon = getCategoryIcon(cat.name);
            return (
              <View key={cat.uid}>
                <TouchableOpacity
                  style={[styles.catRow, { borderBottomColor: colors.border.primary }]}
                  onPress={() =>
                    hasChildren ? toggleExpand(cat.uid) : toggleCategoryUid(cat.uid)
                  }
                  activeOpacity={0.7}
                >
                  <View style={styles.catRowLeft}>
                    <CatIcon size={22} color={colors.text.primary} strokeWidth={1.5} />
                    <Text style={[styles.rowLabel, { color: colors.text.primary }]}>{cat.name}</Text>
                  </View>
                  <View style={styles.rowRight}>
                    {isChecked && (
                      <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
                        <Check size={12} color="#fff" />
                      </View>
                    )}
                    {hasChildren && (
                      isExpanded
                        ? <ChevronUp size={18} color={colors.text.tertiary} />
                        : <ChevronDown size={18} color={colors.text.tertiary} />
                    )}
                  </View>
                </TouchableOpacity>
                {isExpanded && children.map((sub) => (
                  <TouchableOpacity
                    key={sub.uid}
                    style={[styles.subRow, { borderBottomColor: colors.border.primary }]}
                    onPress={() => toggleCategoryUid(sub.uid)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.subLabel, { color: colors.text.secondary }]}>{sub.name}</Text>
                    {draft.categoryUids.includes(sub.uid) && (
                      <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
                        <Check size={12} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            );
          })}
        </ScrollView>
        <ActionButtons {...actionsProps} />
      </View>
    );
  }

  if (screen === 'countries') {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
        <SubHeader title={capitalizeFilterMenuLabel('countries')} {...subHeaderProps} />
        <FlatList
          data={countries}
          keyExtractor={(item: RecipeFilterCountry) => String(item.uid)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.countryRow, { borderBottomColor: colors.border.primary }]}
              onPress={() => toggleCountryUid(item.uid)}
              activeOpacity={0.7}
            >
              <CircularFlag flagUrl={countryFlagUrl(item.flagImage)} colors={colors} />
              <Text style={[styles.rowLabel, { color: colors.text.primary, flex: 1 }]}>{item.name}</Text>
              {draft.countryUids.includes(item.uid) && (
                <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
                  <Check size={12} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          )}
        />
        <ActionButtons {...actionsProps} />
      </View>
    );
  }

  const flatKey = screen;

  if (flatKey === 'difficulties') {
    const difficulties = options?.difficulties ?? [];
    return (
      <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
        <SubHeader title={capitalizeFilterMenuLabel('difficulties')} {...subHeaderProps} />
        <FlatList
          data={difficulties}
          keyExtractor={(item) => String(item.uid)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.row, { borderBottomColor: colors.border.primary }]}
              onPress={() => toggleDifficulty(item.uid)}
              activeOpacity={0.7}
            >
              <Text style={[styles.rowLabel, { color: colors.text.primary }]}>{item.name}</Text>
              {draft.difficultyUid === item.uid && (
                <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
                  <Check size={12} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          )}
        />
        <ActionButtons {...actionsProps} />
      </View>
    );
  }

  if (flatKey === 'timeBuckets') {
    const timeBuckets = options?.timeBuckets ?? [];
    return (
      <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
        <SubHeader title={capitalizeFilterMenuLabel('timeBuckets')} {...subHeaderProps} />
        <FlatList
          data={timeBuckets}
          keyExtractor={(item) => timeBucketKey(item)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.row, { borderBottomColor: colors.border.primary }]}
              onPress={() => toggleTimeBucket(item)}
              activeOpacity={0.7}
            >
              <Text style={[styles.rowLabel, { color: colors.text.primary }]}>{item.label}</Text>
              {draft.timeBucket && timeBucketKey(draft.timeBucket) === timeBucketKey(item) && (
                <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
                  <Check size={12} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          )}
        />
        <ActionButtons {...actionsProps} />
      </View>
    );
  }

  const flatOptionsMap: Record<FlatFilterSectionKey, { uid: number; name: string }[]> = {
    specials: options?.specials ?? [],
    diets: options?.diets ?? [],
    occasions: options?.occasions ?? [],
    preparationTypes: options?.preparationTypes ?? [],
    menutypes: options?.menutypes ?? [],
  };

  const flatOptions = flatOptionsMap[flatKey as FlatFilterSectionKey];
  const uidField = FLAT_FILTER_UID_FIELD[flatKey as FlatFilterSectionKey];
  const selectedUids = draft[uidField];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <SubHeader title={capitalizeFilterMenuLabel(flatKey)} {...subHeaderProps} />
      <FlatList
        data={flatOptions}
        keyExtractor={(item) => String(item.uid)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.row, { borderBottomColor: colors.border.primary }]}
            onPress={() => toggleUidList(uidField, item.uid)}
            activeOpacity={0.7}
          >
            <Text style={[styles.rowLabel, { color: colors.text.primary }]}>{item.name}</Text>
            {selectedUids.includes(item.uid) && (
              <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
                <Check size={12} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        )}
      />
      <ActionButtons {...actionsProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  loadingScreen: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  titleDisplay: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 35,
    lineHeight: 48,
    letterSpacing: 0,
  },
  subHeaderTitle: {
    flex: 1,
    flexShrink: 1,
  },
  backCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  infoCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    marginLeft: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  infoIconLetter: {
    fontFamily: 'Roboto-Regular',
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0,
    marginTop: -0.5,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowNoBorder: {
    borderBottomWidth: 0,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingLeft: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  toggleLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  exactMatchSwitchWrap: {
    width: EXACT_MATCH_SWITCH_LAYOUT.width,
    height: EXACT_MATCH_SWITCH_LAYOUT.height,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  exactMatchSwitchScale: {
    transform: [{ scale: EXACT_MATCH_SWITCH_SCALE }],
  },
  rowLabel: {
    fontFamily: 'Roboto-Light',
    fontSize: 17,
    lineHeight: 25.5,
    letterSpacing: 0,
  },
  subLabel: {
    fontFamily: 'Roboto-Light',
    fontSize: 16,
    lineHeight: 35,
    letterSpacing: 0,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagCircle: {
    width: FLAG_SIZE,
    height: FLAG_SIZE,
    borderRadius: FLAG_SIZE / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagImage: {
    width: FLAG_SIZE,
    height: FLAG_SIZE,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  cancelBtn: {
    flex: 2,
    height: 45,
    borderRadius: 9999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontFamily: 'Roboto-Light',
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: 0,
    textAlign: 'center',
  },
  applyBtn: {
    flex: 3,
    height: 45,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: {
    color: '#fff',
    fontFamily: 'Roboto-Regular',
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: 0,
    textAlign: 'center',
  },
});
