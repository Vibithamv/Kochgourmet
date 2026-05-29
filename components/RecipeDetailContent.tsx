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
import { Clock, Star, Heart, Share2, ChevronDown, Minus, Plus, Check, X } from 'lucide-react-native';
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

  const recipe = getRecipeDetail(recipeId);
  const [servings, setServings] = useState(recipe.servings);
  const [prepStyle, setPrepStyle] = useState(PREP_STYLES[0]);
  const [showPrepDropdown, setShowPrepDropdown] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { recipes, toggleFavourite } = useFavourites();
  const recipeFromList = recipes.find(r => r.id === recipeId);
  const isFavourite = recipeFromList?.isFavourite ?? false;
  const rating = recipeFromList?.rating ?? 0;

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

  const actionsBottom = floatingActionsBottom ?? Math.max(insets.bottom, 12) + 90;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.secondary }]}>
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
        {showHeroImage && (
          <Image source={{ uri: recipe.imageUrl }} style={styles.heroImage} resizeMode="cover" />
        )}

        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text.primary, fontFamily: typography.fontFamily.bold }]}>
            {recipe.title}
          </Text>

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

          <View style={[styles.nutritionTable, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}>
            <View style={styles.nutritionHeader}>
              <Text style={[styles.nutritionHeaderLabel, { color: colors.text.tertiary }]}>
                Nährwerte pro
              </Text>
              <Text style={[styles.nutritionHeaderValue, { color: colors.text.tertiary }]}>
                100 g
              </Text>
            </View>
            {recipe.nutrition.map(n => (
              <View key={n.label} style={[styles.nutritionRow, { borderTopColor: colors.border.primary }]}>
                <Text style={[styles.nutritionLabel, { color: colors.text.primary }]}>{n.label}</Text>
                <Text style={[styles.nutritionValue, { color: colors.text.primary }]}>{n.value}</Text>
              </View>
            ))}
          </View>

          <View style={styles.authorRow}>
            <Image source={{ uri: recipe.author.avatarUrl }} style={styles.authorAvatar} />
            <Text style={[styles.authorName, { color: colors.text.primary }]}>{recipe.author.name}</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border.primary }]} />

          <View style={styles.zutatenHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Zutaten</Text>
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

          <TouchableOpacity
            style={[styles.zubereitungSelector, { borderColor: colors.border.primary }]}
            onPress={() => setShowPrepDropdown(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.zubereitungText, { color: colors.text.primary }]}>
              {prepStyle}
            </Text>
            <ChevronDown size={16} color={colors.text.tertiary} />
          </TouchableOpacity>

          {scaledSections.map(section => (
            <View key={section.title} style={styles.ingredientSection}>
              <Text style={[styles.ingredientSectionTitle, { color: colors.text.primary }]}>
                {section.title}
              </Text>
              {section.items.map(item => (
                <View
                  key={`${section.title}-${item.name}`}
                  style={[styles.ingredientRow, { borderBottomColor: colors.border.primary }]}
                >
                  <Text style={[styles.ingredientAmount, { color: colors.text.tertiary }]}>
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

          <Text style={[styles.sectionTitle, { color: colors.text.primary, marginBottom: 16 }]}>
            Zubereitung
          </Text>
          {recipe.steps.map(step => (
            <View key={step.number} style={styles.stepBlock}>
              <Text style={[styles.stepLabel, { color: colors.primary }]}>
                Schritt {step.number} / {step.total}
              </Text>
              <Text style={[styles.stepText, { color: colors.text.primary }]}>
                {step.text}
              </Text>
            </View>
          ))}

          <Text style={[styles.appetit, { color: colors.text.primary, fontFamily: typography.fontFamily.display }]}>
            Guten Appetit 👋
          </Text>

          <View style={{ height: Math.max(insets.bottom, 16) + 180 }} />
        </View>
      </ScrollView>

      <View
        style={[styles.floatingActions, { bottom: actionsBottom }]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={[styles.closeBtn, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <X size={16} color={colors.text.primary} />
          <Text style={[styles.closeBtnText, { color: colors.text.primary }]}>Schließen</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.shareBtn, { backgroundColor: colors.primary }]}
          onPress={onShare}
          activeOpacity={0.8}
        >
          <Share2 size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      <Modal
        visible={showPrepDropdown}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPrepDropdown(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowPrepDropdown(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.background.card }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border.primary }]} />
            <Text style={[styles.sheetTitle, { color: colors.text.primary }]}>
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
  screen: { flex: 1 },
  fill: { flex: 1 },
  heroImage: { width: '100%', height: 280 },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  title: { fontSize: 22, letterSpacing: -0.3, marginBottom: 12, lineHeight: 30 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, fontFamily: 'Inter-Regular' },
  nutritionTable: { borderWidth: 1, borderRadius: 12, marginBottom: 20, overflow: 'hidden' },
  nutritionHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10 },
  nutritionHeaderLabel: { fontSize: 12, fontFamily: 'Inter-Regular' },
  nutritionHeaderValue: { fontSize: 12, fontFamily: 'Inter-Regular' },
  nutritionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth },
  nutritionLabel: { fontSize: 14, fontFamily: 'Inter-Regular' },
  nutritionValue: { fontSize: 14, fontFamily: 'Inter-SemiBold' },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  authorAvatar: { width: 36, height: 36, borderRadius: 18 },
  authorName: { fontSize: 14, fontFamily: 'Inter-Medium' },
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
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  divider: { height: 1, marginVertical: 20 },
  zutatenHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { fontSize: 20, fontFamily: 'Inter-Bold' },
  servingsControl: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  servingsDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  servingsText: { fontSize: 14, fontFamily: 'Inter-Medium' },
  zubereitungSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderRadius: 10, marginBottom: 20 },
  zubereitungText: { fontSize: 14, fontFamily: 'Inter-Regular' },
  ingredientSection: { marginBottom: 16 },
  ingredientSectionTitle: { fontSize: 14, fontFamily: 'Inter-SemiBold', marginBottom: 8 },
  ingredientRow: { flexDirection: 'row', gap: 12, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  ingredientAmount: { fontSize: 13, fontFamily: 'Inter-Regular', width: 60 },
  ingredientName: { fontSize: 13, fontFamily: 'Inter-Regular' },
  stepBlock: { marginBottom: 20 },
  stepLabel: { fontSize: 13, fontFamily: 'Inter-SemiBold', marginBottom: 6 },
  stepText: { fontSize: 14, fontFamily: 'Inter-Regular', lineHeight: 22 },
  appetit: { fontSize: 32, marginTop: 12, lineHeight: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 12 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 16, fontFamily: 'Inter-SemiBold', marginBottom: 8 },
  sheetOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  sheetOptionText: { fontSize: 15, fontFamily: 'Inter-Regular' },
});
