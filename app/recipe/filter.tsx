import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ChevronRight, ChevronLeft, ChevronDown, ChevronUp, Check, Info,
  Soup, Beef, Salad, Cookie, Sandwich, Apple, CakeSlice,
  Droplet, Flame, Egg, CookingPot, Wine, Pizza,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors, getTypography } from '@/constants/theme';

// ─── Filter definitions ─────────────────────────────────────────────────────

type LucideIcon = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

const KATEGORIEN: { name: string; sub: string[]; icon: LucideIcon }[] = [
  { name: 'Pasta & Reisgerichte', sub: ['Nudeln', 'Reis', 'Risotto'], icon: Soup },
  { name: 'Fisch & Fleisch', sub: ['Fisch', 'Rind', 'Geflügel', 'Lamm'], icon: Beef },
  { name: 'Salate', sub: [], icon: Salad },
  { name: 'Backen', sub: ['Kuchen', 'Brot', 'Muffins'], icon: Cookie },
  { name: 'Fast-Food-Snacks', sub: ['Burger', 'Pizza', 'Wraps'], icon: Sandwich },
  { name: 'Gemüse & Obst', sub: [], icon: Apple },
  { name: 'Suppen', sub: [], icon: Soup },
  { name: 'Süssspeisen', sub: ['Eis', 'Pudding', 'Mousse'], icon: CakeSlice },
  { name: 'Saucen, Dips & Co', sub: [], icon: Droplet },
  { name: 'Grillen', sub: [], icon: Flame },
  { name: 'Ei', sub: [], icon: Egg },
  { name: 'Eintöpfe', sub: [], icon: CookingPot },
  { name: 'Getränke', sub: ['Smoothies', 'Tee', 'Cocktails'], icon: Wine },
  { name: 'Käse', sub: [], icon: Pizza },
];

const COUNTRIES: { flag: string; name: string }[] = [
  { flag: '🇺🇸', name: 'Amerika' },
  { flag: '🇦🇱', name: 'Albanien' },
  { flag: '🇨🇳', name: 'China' },
  { flag: '🇩🇪', name: 'Deutsch' },
  { flag: '🇫🇷', name: 'Frankreich' },
  { flag: '🇬🇷', name: 'Griechenland' },
  { flag: '🌍', name: 'International' },
  { flag: '🇮🇳', name: 'Indien' },
  { flag: '🇮🇱', name: 'Israel' },
  { flag: '🇮🇹', name: 'Italien' },
  { flag: '🇯🇵', name: 'Japan' },
  { flag: '🇰🇷', name: 'Korea' },
  { flag: '🇲🇦', name: 'Maroko' },
  { flag: '🇦🇹', name: 'Österreich' },
  { flag: '🇨🇭', name: 'Schweiz' },
  { flag: '🇪🇸', name: 'Spanien' },
  { flag: '🇹🇭', name: 'Thailand' },
  { flag: '🇹🇷', name: 'Türkei' },
  { flag: '🇻🇳', name: 'Vietnam' },
];

/** Flat filter screens — each row opens a list of selectable demo options. */
type FilterKey = 'thema' | 'ernaehrung' | 'saisonal' | 'zubereitung' | 'schwierigkeit' | 'menuefolge' | 'zeit';

const FLAT_FILTERS: Record<FilterKey, { label: string; options: string[] }> = {
  thema: {
    label: 'Thema',
    options: ['Schnell & Einfach', 'Sonntagsessen', 'Picknick', 'Party', 'Romantisch', 'Kinder-Lieblinge', 'Resteverwertung', 'Gäste'],
  },
  ernaehrung: {
    label: 'Ernährung',
    options: ['Vegetarisch', 'Vegan', 'Glutenfrei', 'Laktosefrei', 'Low Carb', 'High Protein', 'Zuckerfrei', 'Paleo', 'Keto'],
  },
  saisonal: {
    label: 'Saisonal',
    options: ['Frühling', 'Sommer', 'Herbst', 'Winter', 'Weihnachten', 'Ostern', 'Silvester', 'Oktoberfest'],
  },
  zubereitung: {
    label: 'Zubereitung',
    options: ['Backofen', 'Pfanne', 'Topf', 'Grill', 'Airfryer', 'Mikrowelle', 'Rohkost', 'Slow Cooker', 'Wok'],
  },
  schwierigkeit: {
    label: 'Schwierigkeit',
    options: ['Einfach', 'Mittel', 'Schwierig'],
  },
  menuefolge: {
    label: 'Menüfolge',
    options: ['Vorspeise', 'Hauptgericht', 'Beilage', 'Nachspeise', 'Snack', 'Frühstück', 'Brunch', 'Getränk'],
  },
  zeit: {
    label: 'Zeit',
    options: ['Unter 15 Minuten', '15–30 Minuten', '30–60 Minuten', '1–2 Stunden', 'Über 2 Stunden'],
  },
};

const FILTER_ROW_ORDER: { label: string; key: 'kategorien' | 'laenderkuechen' | FilterKey }[] = [
  { label: 'Kategorien', key: 'kategorien' },
  { label: 'Thema', key: 'thema' },
  { label: 'Ernährung', key: 'ernaehrung' },
  { label: 'Länderküchen', key: 'laenderkuechen' },
  { label: 'Saisonal', key: 'saisonal' },
  { label: 'Zubereitung', key: 'zubereitung' },
  { label: 'Schwierigkeit', key: 'schwierigkeit' },
  { label: 'Menüfolge', key: 'menuefolge' },
  { label: 'Zeit', key: 'zeit' },
];

type ScreenMode = 'main' | 'kategorien' | 'laenderkuechen' | FilterKey;

// ─── Sub-components (defined outside parent to avoid re-creation per render) ─

type ColorsType = ReturnType<typeof getColors>;

interface ActionButtonsProps {
  readonly colors: ColorsType;
  readonly bottomInset: number;
  readonly onCancel: () => void;
  readonly onApply: () => void;
}

function ActionButtons({ colors, bottomInset, onCancel, onApply }: ActionButtonsProps) {
  return (
    <View style={[styles.actions, { borderTopColor: colors.border.primary, paddingBottom: Math.max(bottomInset, 16) + 90 }]}>
      <TouchableOpacity
        style={[styles.cancelBtn, { borderColor: colors.border.primary }]}
        onPress={onCancel}
        activeOpacity={0.7}
      >
        <Text style={[styles.cancelText, { color: colors.text.primary }]}>Abbrechen</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.applyBtn, { backgroundColor: colors.primary }]}
        onPress={onApply}
        activeOpacity={0.8}
      >
        <Text style={styles.applyText}>Filter anwenden</Text>
      </TouchableOpacity>
    </View>
  );
}

interface SubHeaderProps {
  readonly title: string;
  readonly colors: ColorsType;
  readonly displayFontFamily: string;
  readonly topInset: number;
  readonly onBack: () => void;
}

function SubHeader({ title, colors, displayFontFamily, topInset, onBack }: SubHeaderProps) {
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
      <Text style={[styles.titleDisplay, { color: colors.text.primary, fontFamily: displayFontFamily }]}>
        {title}
      </Text>
    </View>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function FilterScreen() {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const typography = getTypography(theme);
  const insets = useSafeAreaInsets();

  const [screen, setScreen] = useState<ScreenMode>('main');
  const [exactMatch, setExactMatch] = useState(true);

  const goBack = () => router.back();
  const goMain = () => setScreen('main');

  // Pre-selected demo values so badges are visible from the start
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Pasta & Reisgerichte']);
  const [selectedSubs, setSelectedSubs] = useState<string[]>(['Reis', 'Geflügel']);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Fisch & Fleisch', 'Salate']);
  const [selectedCountries, setSelectedCountries] = useState<string[]>(['Italien', 'Japan']);

  const [flatSelections, setFlatSelections] = useState<Record<FilterKey, string[]>>({
    thema: ['Schnell & Einfach'],
    ernaehrung: ['Vegetarisch'],
    saisonal: ['Sommer'],
    zubereitung: ['Backofen', 'Pfanne'],
    schwierigkeit: ['Einfach', 'Mittel'],
    menuefolge: ['Hauptgericht'],
    zeit: ['15–30 Minuten'],
  });

  // Toggle helpers
  const toggleExpand = (name: string) => {
    setExpandedCategories(prev => prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]);
  };
  const toggleSub = (sub: string) => {
    setSelectedSubs(prev => prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]);
  };
  const toggleCategory = (name: string) => {
    setSelectedCategories(prev => prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]);
  };
  const toggleCountry = (name: string) => {
    setSelectedCountries(prev => prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]);
  };
  const toggleFlat = (key: FilterKey, option: string) => {
    setFlatSelections(prev => ({
      ...prev,
      [key]: prev[key].includes(option) ? prev[key].filter(o => o !== option) : [...prev[key], option],
    }));
  };

  const isCategoryChecked = (cat: { name: string; sub: string[] }) => {
    if (selectedCategories.includes(cat.name)) return true;
    return cat.sub.some(s => selectedSubs.includes(s));
  };

  // Count badges shown on the main list
  const countFor = (key: 'kategorien' | 'laenderkuechen' | FilterKey): number => {
    if (key === 'kategorien') return selectedCategories.length + selectedSubs.length;
    if (key === 'laenderkuechen') return selectedCountries.length;
    return flatSelections[key].length;
  };

  const displayFont = typography.fontFamily.display;
  const actionsProps = {
    colors,
    bottomInset: insets.bottom,
    onCancel: goBack,
    onApply: goBack,
  };
  const subHeaderProps = {
    colors,
    displayFontFamily: displayFont,
    topInset: insets.top,
    onBack: goMain,
  };

  // ── Main filter list ───────────────────────────────────────────────────────
  if (screen === 'main') {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 44) + 16 }]}>
          <Text style={[styles.titleDisplay, { color: colors.text.primary, fontFamily: displayFont }]}>
            Filter
          </Text>
        </View>
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {FILTER_ROW_ORDER.map(row => {
            const badge = countFor(row.key);
            return (
              <TouchableOpacity
                key={row.key}
                style={[styles.row, { borderBottomColor: colors.border.primary }]}
                onPress={() => setScreen(row.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.rowLabel, { color: colors.text.primary }]}>{row.label}</Text>
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
          <View style={[styles.toggleRow, { borderBottomColor: colors.border.primary }]}>
            <Switch
              value={exactMatch}
              onValueChange={setExactMatch}
              trackColor={{ false: colors.border.primary, true: colors.primary }}
              thumbColor="#fff"
            />
            <Text style={[styles.rowLabel, styles.toggleLabel, { color: colors.text.primary }]}>
              Exakte Treffer
            </Text>
            <TouchableOpacity
              style={[styles.infoCircle, { borderColor: colors.border.primary }]}
              hitSlop={8}
              activeOpacity={0.6}
            >
              <Info size={12} color={colors.text.tertiary} />
            </TouchableOpacity>
          </View>
        </ScrollView>
        <ActionButtons {...actionsProps} />
      </View>
    );
  }

  // ── Kategorien sub-screen (expandable, with leading icons) ─────────────────
  if (screen === 'kategorien') {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
        <SubHeader title="Kategorien" {...subHeaderProps} />
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {KATEGORIEN.map(cat => {
            const isExpanded = expandedCategories.includes(cat.name);
            const isChecked = isCategoryChecked(cat);
            const hasSub = cat.sub.length > 0;
            const CatIcon = cat.icon;
            return (
              <View key={cat.name}>
                <TouchableOpacity
                  style={[styles.catRow, { borderBottomColor: colors.border.primary }]}
                  onPress={() => hasSub ? toggleExpand(cat.name) : toggleCategory(cat.name)}
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
                    {hasSub && (
                      isExpanded
                        ? <ChevronUp size={18} color={colors.text.tertiary} />
                        : <ChevronDown size={18} color={colors.text.tertiary} />
                    )}
                  </View>
                </TouchableOpacity>
                {isExpanded && cat.sub.map(sub => (
                  <TouchableOpacity
                    key={sub}
                    style={[styles.subRow, { borderBottomColor: colors.border.primary }]}
                    onPress={() => toggleSub(sub)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.subLabel, { color: colors.text.secondary }]}>{sub}</Text>
                    {selectedSubs.includes(sub) && (
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

  // ── Länderküchen sub-screen ────────────────────────────────────────────────
  if (screen === 'laenderkuechen') {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
        <SubHeader title="Länderküchen" {...subHeaderProps} />
        <FlatList
          data={COUNTRIES}
          keyExtractor={item => item.name}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.countryRow, { borderBottomColor: colors.border.primary }]}
              onPress={() => toggleCountry(item.name)}
              activeOpacity={0.7}
            >
              <Text style={styles.flag}>{item.flag}</Text>
              <Text style={[styles.rowLabel, { color: colors.text.primary, flex: 1 }]}>{item.name}</Text>
              {selectedCountries.includes(item.name) && (
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

  // ── Generic flat sub-screen ────────────────────────────────────────────────
  const flatKey = screen;
  const config = FLAT_FILTERS[flatKey];
  const selected = flatSelections[flatKey];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <SubHeader title={config.label} {...subHeaderProps} />
      <FlatList
        data={config.options}
        keyExtractor={item => item}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.row, { borderBottomColor: colors.border.primary }]}
            onPress={() => toggleFlat(flatKey, item)}
            activeOpacity={0.7}
          >
            <Text style={[styles.rowLabel, { color: colors.text.primary }]}>{item}</Text>
            {selected.includes(item) && (
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    letterSpacing: -0.5,
  },
  titleDisplay: {
    fontSize: 42,
    lineHeight: 50,
    letterSpacing: -0.6,
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
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  toggleLabel: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
  },
  subLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
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
  flag: {
    fontSize: 22,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 9999,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
  },
  applyBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 9999,
    alignItems: 'center',
  },
  applyText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
  },
});
