import React from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Clock, Heart, Minus } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors, getTypography } from '@/constants/theme';
import { useFolders, type FolderThumb } from '@/contexts/FoldersContext';
import { getRecipeDetail } from '@/utils/mockRecipeDetails';

const TAB_BAR_HEIGHT = 90;

export default function FolderDetailScreen() {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const typography = getTypography(theme);
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getFolder, removeRecipeFromFolder } = useFolders();

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
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 44) + 16 }]}>
        <TouchableOpacity
          style={[styles.backCircle, { borderColor: colors.border.primary }]}
          onPress={() => router.back()}
          hitSlop={8}
          activeOpacity={0.7}
        >
          <ChevronLeft size={20} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text.primary, fontFamily: typography.fontFamily.display }]}>
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
              folderId={folder.id}
              onRemove={() => removeRecipeFromFolder(folder.id, item.recipeId, item.uri)}
              colors={colors}
            />
          )}
        />
      )}
    </View>
  );
}

interface FolderRecipeCardProps {
  readonly thumb: FolderThumb;
  readonly folderId: string;
  readonly onRemove: () => void;
  readonly colors: ReturnType<typeof getColors>;
}

function FolderRecipeCard({ thumb, onRemove, colors }: FolderRecipeCardProps) {
  const recipe = getRecipeDetail(thumb.recipeId);
  const duration = recipe.bakeDurationMinutes > 0
    ? recipe.bakeDurationMinutes
    : recipe.prepDurationMinutes;

  return (
    <View style={styles.cardWrapper}>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.background.card }]}
        onPress={() => router.push(`/recipe/${thumb.recipeId}`)}
        activeOpacity={0.85}
      >
        <View style={styles.imageWrap}>
          <Image source={{ uri: thumb.uri }} style={styles.image} resizeMode="cover" />
          <TouchableOpacity
            style={styles.minusBtn}
            onPress={onRemove}
            hitSlop={8}
            activeOpacity={0.7}
          >
            <Minus size={14} color={colors.text.primary} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <Text style={[styles.cardTitle, { color: colors.text.primary }]} numberOfLines={2}>
            {recipe.title}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Clock size={13} color="#525252" />
              <Text style={[styles.metaText, { color: '#525252' }]}>{duration} Min</Text>
            </View>
            <View style={styles.heartIcon}>
              <Heart size={18} color={colors.primary} fill={colors.primary} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
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
    fontSize: 36,
    lineHeight: 44,
    letterSpacing: -0.5,
    flex: 1,
  },

  grid: { paddingHorizontal: 20, gap: 16 },
  gridRow: { gap: 12 },
  cardWrapper: { flex: 1 },

  card: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  imageWrap: { position: 'relative' },
  image: { width: '100%', aspectRatio: 1 },
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  body: {
    flex: 1,
    padding: 12,
    gap: 10,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    lineHeight: 19,
    minHeight: 38, // two lines so titles always reserve equal vertical space
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: { fontSize: 13, fontFamily: 'Inter-Regular' },
  heartIcon: { padding: 2 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 15, fontFamily: 'Inter-Regular' },
});
