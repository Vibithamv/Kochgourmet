import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Share,
  RefreshControl,
  Modal,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Clock, Star, Heart, Share2, ChevronDown, Minus, Plus, Check } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors, getTypography } from '@/constants/theme';
import { getRecipeDetail } from '@/utils/mockRecipeDetails';
import { useFavourites } from '@/contexts/FavouritesContext';

const PREP_STYLES = [
  'Normale Zubereitung',
  'Schnelle Zubereitung (Airfryer)',
  'Meal Prep Version',
];

const AMOUNT_REGEX = /^(\d+([.,]\d+)?)/;

/** Scale a quantity string proportionally. "80 g" × 1.5 → "120 g". */
function scaleAmount(raw: string, factor: number): string {
  if (!raw || factor === 1) return raw;
  const match = AMOUNT_REGEX.exec(raw);
  if (!match) return raw;
  const num = Number.parseFloat(match[1].replace(',', '.')) * factor;
  const formatted = Number.isInteger(num)
    ? String(num)
    : Number.parseFloat(num.toFixed(1)).toString();
  return raw.replace(match[1], formatted);
}

export interface RecipeDetailContentProps {
  readonly recipeId: string;
  readonly onClose: () => void;
  readonly showHeroImage?: boolean;
  readonly floatingActionsBottom?: number;
}

export default function RecipeDetailContent({
  recipeId,
  onClose,
  showHeroImage = true,
  floatingActionsBottom,
}: RecipeDetailContentProps) {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const typography = getTypography(theme);
  const insets = useSafeAreaInsets();
  const actionsBottom = floatingActionsBottom ?? Math.max(insets.bottom, 12) + 90;

  const recipe = getRecipeDetail(recipeId);
  const [servings, setServings] = useState(recipe.servings);
  const [prepStyle, setPrepStyle] = useState(PREP_STYLES[0]);
  const [showPrepDropdown, setShowPrepDropdown] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { recipes, toggleFavourite } = useFavourites();
  const recipeFromList = recipes.find(r => r.id === recipeId);
  const isFavourite = recipeFromList?.isFavourite ?? false;
  const rating = recipeFromList?.rating ?? 0;

  // Scale ingredient amounts when serving count changes
  const scaledSections = useMemo(() => {
    const factor = servings / recipe.servings;
    return recipe.ingredientSections.map(section => ({
      ...section,
      items: section.items.map(item => ({
        ...item,
        amount: scaleAmount(item.amount, factor),
      })),
    }));
  }, [recipe, servings]);

  const onShare = async () => {
    await Share.share({ message: `Schau dir dieses Rezept an: ${recipe.title}` });
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <View style={[styles.fill, { backgroundColor: colors.background.secondary }]}>
      <ScrollView
        style={styles.fill}
        showsVerticalScrollIndicator={false}
        bounces
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Hero image — full bleed */}
        {showHeroImage && (
          <Image source={{ uri: recipe.imageUrl }} style={styles.heroImage} resizeMode="cover" />
        )}

        <View style={styles.content}>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text.primary, fontFamily: typography.fontFamily.display }]}>
            {recipe.title}
          </Text>

          {/* Meta row */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Clock size={13} color={colors.text.tertiary} />
              <Text style={[styles.metaText, { color: colors.text.tertiary }]}>
                {recipe.bakeDurationMinutes} Min Gesamt
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={13} color={colors.text.tertiary} />
              <Text style={[styles.metaText, { color: colors.text.tertiary }]}>
                {recipe.prepDurationMinutes} Min Arbeit
              </Text>
            </View>
            {rating > 0 && (
              <View style={styles.metaItem}>
                <Star size={13} color={colors.text.tertiary} />
                <Text style={[styles.metaText, { color: colors.text.tertiary }]}>{rating}</Text>
              </View>
            )}
            <TouchableOpacity onPress={() => toggleFavourite(recipeId)} hitSlop={8}>
              <Heart
                size={16}
                color={isFavourite ? colors.primary : colors.text.tertiary}
                fill={isFavourite ? colors.primary : 'transparent'}
              />
            </TouchableOpacity>
          </View>

          {/* Nutrition table — borderless rows with dividers between items only */}
          <View style={styles.nutritionTable}>
            <View style={[styles.nutritionRow, styles.nutritionRowDivider, { borderBottomColor: colors.border.primary }]}>
              <Text style={[styles.nutritionLabel, { color: colors.text.tertiary }]}>
                Nährwerte pro
              </Text>
              <Text style={[styles.nutritionValue, { color: colors.text.tertiary }]}>
                100 g
              </Text>
            </View>
            {recipe.nutrition.map((n, index) => (
              <View
                key={n.label}
                style={[
                  styles.nutritionRow,
                  index < recipe.nutrition.length - 1 && styles.nutritionRowDivider,
                  index < recipe.nutrition.length - 1 && { borderBottomColor: colors.border.primary },
                ]}
              >
                <Text style={[styles.nutritionLabel, { color: colors.text.primary }]}>{n.label}</Text>
                <Text style={[styles.nutritionValue, { color: colors.text.primary }]}>{n.value}</Text>
              </View>
            ))}
          </View>

          {/* Author */}
          <View style={styles.authorRow}>
            <Image source={{ uri: recipe.author.avatarUrl }} style={styles.authorAvatar} />
            <Text style={[styles.authorName, { color: colors.text.primary, fontFamily: typography.fontFamily.display }]}>
              {recipe.author.name}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border.primary }]} />

          {/* Zutaten header with +/- servings */}
          <View style={styles.zutatenHeader}>
            <Text style={[styles.displaySectionTitle, { color: colors.text.primary, fontFamily: typography.fontFamily.display }]}>
              Zutaten
            </Text>
            <View style={styles.servingsControl}>
              <TouchableOpacity
                style={[styles.servingsDot, { backgroundColor: colors.primary }]}
                onPress={() => setServings(s => Math.max(1, s - 1))}
                hitSlop={8}
              >
                <Minus size={12} color="#fff" strokeWidth={2.5} />
              </TouchableOpacity>
              <Text style={[styles.servingsText, { color: colors.text.primary }]}>
                {servings} Personen
              </Text>
              <TouchableOpacity
                style={[styles.servingsDot, { backgroundColor: colors.primary }]}
                onPress={() => setServings(s => s + 1)}
                hitSlop={8}
              >
                <Plus size={12} color="#fff" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Preparation style dropdown trigger */}
          <TouchableOpacity
            style={[styles.zubereitungSelector, { borderColor: colors.border.primary }]}
            onPress={() => setShowPrepDropdown(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.zubereitungText, { color: colors.text.primary, fontFamily: typography.fontFamily.display }]}>
              {prepStyle}
            </Text>
            <ChevronDown size={16} color={colors.text.tertiary} />
          </TouchableOpacity>

          {/* Scaled ingredient sections */}
          {scaledSections.map(section => (
            <View key={section.title} style={styles.ingredientSection}>
              <Text style={[styles.ingredientSectionTitle, { color: colors.text.primary }]}>
                {section.title}
              </Text>
              {section.items.map(item => (
                <View
                  key={`${section.title}-${item.name}`}
                  style={styles.ingredientRow}
                >
                  <Text style={[styles.ingredientAmount, { color: colors.text.primary }]}>
                    {[item.amount, item.unit].filter(Boolean).join(' ')}
                  </Text>
                  <Text style={[styles.ingredientName, { color: colors.text.primary, flex: 1 }]}>
                    {item.name}
                  </Text>
                </View>
              ))}
            </View>
          ))}

          <View style={[styles.divider, { backgroundColor: colors.border.primary }]} />

          {/* Steps */}
          <Text style={[styles.displaySectionTitle, { color: colors.text.primary, fontFamily: typography.fontFamily.display, marginBottom: 16 }]}>
            Zubereitung
          </Text>
          {recipe.steps.map(step => (
            <View key={step.number} style={styles.stepBlock}>
              <Text style={[styles.stepLabel, { color: colors.text.primary }]}>
                Schritt {step.number} / {step.total}
              </Text>
              <Text style={[styles.stepText, { color: colors.text.primary }]}>
                {step.text}
              </Text>
            </View>
          ))}

          {/* Guten Appetit */}
          <Text style={[styles.appetit, { color: colors.text.primary, fontFamily: typography.fontFamily.display }]}>
            Guten Appetit 👏
          </Text>

          <View style={{ height: Math.max(insets.bottom, 16) + 180 }} />
        </View>
      </ScrollView>

      {/* Floating action buttons — sit above the floating tab bar */}
      <View style={[styles.floatingActions, { bottom: actionsBottom }]} pointerEvents="box-none">
        <TouchableOpacity
          style={[styles.closeBtn, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}
          onPress={onClose}
          activeOpacity={0.7}
        >
          {/* <X size={16} color={colors.text.primary} /> */}
          <Text style={[styles.closeBtnText, { color: colors.text.primary }]}>Schließen</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.shareBtn,
            {
              backgroundColor: '#FFFFFF',
              borderColor: colors.border.primary,
            },
          ]}
          onPress={onShare}
          activeOpacity={0.8}
        >
          <Share2 size={16} color="#141414" />
        </TouchableOpacity>
      </View>

      {/* Prep style bottom sheet */}
      <Modal
        visible={showPrepDropdown}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPrepDropdown(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowPrepDropdown(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.background.card }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border.primary }]} />
            <Text style={[styles.sheetTitle, { color: colors.text.primary, fontFamily: typography.fontFamily.display }]}>
              Zubereitungsart
            </Text>
            {PREP_STYLES.map(style => (
              <TouchableOpacity
                key={style}
                style={[styles.sheetOption, { borderBottomColor: colors.border.primary }]}
                onPress={() => { setPrepStyle(style); setShowPrepDropdown(false); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.sheetOptionText, { color: colors.text.primary }]}>{style}</Text>
                {prepStyle === style && <Check size={18} color={colors.primary} />}
              </TouchableOpacity>
            ))}
            <View style={{ height: Math.max(insets.bottom, 16) }} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  heroImage: { width: '100%', height: 280 },
  content: { paddingHorizontal: 20, paddingTop: 20 },

  title: { fontSize: 28, letterSpacing: -0.3, marginBottom: 12, lineHeight: 36 },

  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, fontFamily: 'Inter-Regular' },

  nutritionTable: { marginBottom: 20 },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  nutritionRowDivider: { borderBottomWidth: StyleSheet.hairlineWidth },
  nutritionLabel: { fontSize: 14, fontFamily: 'Inter-Regular' },
  nutritionValue: { fontSize: 14, fontFamily: 'Inter-Regular', textAlign: 'right' },

  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  authorAvatar: { width: 36, height: 36, borderRadius: 18 },
  authorName: { fontSize: 16, letterSpacing: -0.2 },

  floatingActions: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 20,
  },
  closeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 9999,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  closeBtnText: { fontSize: 14, fontFamily: 'Inter-SemiBold' },
  shareBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },

  divider: { height: 1, marginVertical: 20 },

  zutatenHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  displaySectionTitle: { fontSize: 28, lineHeight: 36, letterSpacing: -0.3 },
  servingsControl: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  servingsDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  servingsText: { fontSize: 14, fontFamily: 'Inter-Medium' },

  zubereitungSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderRadius: 10, marginBottom: 20 },
  zubereitungText: { fontSize: 14, letterSpacing: -0.2 },

  ingredientSection: { marginBottom: 20 },
  ingredientSectionTitle: { fontSize: 15, fontFamily: 'Inter-SemiBold', marginBottom: 10, lineHeight: 22 },
  ingredientRow: { flexDirection: 'row', gap: 16, paddingVertical: 6 },
  ingredientAmount: { fontSize: 15, fontFamily: 'Inter-Regular', width: 72, lineHeight: 22 },
  ingredientName: { fontSize: 15, fontFamily: 'Inter-Regular', lineHeight: 22 },

  stepBlock: { marginBottom: 24 },
  stepLabel: { fontSize: 15, fontFamily: 'Inter-SemiBold', marginBottom: 8, lineHeight: 22 },
  stepText: { fontSize: 15, fontFamily: 'Inter-Regular', lineHeight: 24 },

  appetit: { fontSize: 32, marginTop: 12, lineHeight: 40 },

  // Bottom sheet
  modalOverlay: { flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 12 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 16, letterSpacing: -0.2, marginBottom: 8 },
  sheetOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  sheetOptionText: { fontSize: 15, fontFamily: 'Inter-Regular' },
});
