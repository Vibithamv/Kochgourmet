import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Dimensions,
  Modal,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_OUTER_MARGIN = 20;   // styles.folderList paddingHorizontal
const CARD_INNER_PADDING = 18;  // styles.folderCard padding
const THUMB_GAP = 8;
const THUMB_COLS = 3;
const THUMB_SIZE = Math.floor(
  (SCREEN_WIDTH - 2 * CARD_OUTER_MARGIN - 2 * CARD_INNER_PADDING - (THUMB_COLS - 1) * THUMB_GAP) / THUMB_COLS
);
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Plus, Pencil } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors, getTypography } from '@/constants/theme';
import { useFavourites } from '@/contexts/FavouritesContext';
import { useFolders } from '@/contexts/FoldersContext';

const TAB_BAR_HEIGHT = 90;

type FavouritesTab = 'rezepte' | 'ordner';

export default function FavoritenScreen() {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const typography = getTypography(theme);
  const insets = useSafeAreaInsets();

  const { favourites, toggleFavourite } = useFavourites();
  const { folders, renameFolder } = useFolders();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<FavouritesTab>('ordner');

  // Editable "Alle Favoriten" title on the Rezepte tab (folder titles live in FoldersContext)
  const [allFavouritesTitle, setAllFavouritesTitle] = useState('Alle Favoriten');

  // Rename modal — `target` is either { kind: 'folder', id } or { kind: 'all' }
  const [renameTarget, setRenameTarget] = useState<
    | { kind: 'folder'; id: string }
    | { kind: 'all' }
    | null
  >(null);
  const [renameInput, setRenameInput] = useState('');

  const openRename = useCallback((target: { kind: 'folder'; id: string } | { kind: 'all' }) => {
    if (target.kind === 'folder') {
      const folder = folders.find(f => f.id === target.id);
      setRenameInput(folder?.title ?? '');
    } else {
      setRenameInput(allFavouritesTitle);
    }
    setRenameTarget(target);
  }, [folders, allFavouritesTitle]);

  const confirmRename = useCallback(() => {
    const trimmed = renameInput.trim();
    if (!trimmed || !renameTarget) {
      setRenameTarget(null);
      return;
    }
    if (renameTarget.kind === 'folder') {
      renameFolder(renameTarget.id, trimmed);
    } else {
      setAllFavouritesTitle(trimmed);
    }
    setRenameTarget(null);
  }, [renameInput, renameTarget, renameFolder]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const bottomPad = TAB_BAR_HEIGHT + Math.max(insets.bottom, 12) + 16;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      {/* Header — Playfair title + circular "+" button */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 44) + 16 }]}>
        <Text style={[styles.title, {
          color: colors.text.primary,
          fontFamily: typography.fontFamily.display,
        }]}>
          Favoriten
        </Text>
        <TouchableOpacity
          style={[styles.addButton, { borderColor: colors.border.primary }]}
          activeOpacity={0.7}
        >
          <Plus size={20} color={colors.text.primary} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Tab switcher */}
      <View style={styles.tabRow}>
        {(['rezepte', 'ordner'] as FavouritesTab[]).map(tab => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={styles.tab}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabLabel, {
                color: isActive ? colors.text.primary : colors.text.tertiary,
                fontFamily: isActive ? 'Inter-SemiBold' : 'Inter-Regular',
              }]}>
                {tab === 'rezepte' ? 'Rezepte' : 'Ordner'}
              </Text>
              {isActive && (
                <View style={[styles.tabUnderline, { backgroundColor: colors.primary }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Rezepte tab — single folder-style card containing all favourites ── */}
      {activeTab === 'rezepte' && (
        favourites.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.text.tertiary }]}>
              Noch keine Favoriten gespeichert
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={[styles.folderList, { paddingBottom: bottomPad }]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
          >
            <View style={[styles.folderCard, { backgroundColor: colors.background.secondary }]}>
              <View style={styles.folderHeader}>
                <View style={styles.folderTitleWrap}>
                  <Text style={[styles.folderTitle, { color: colors.text.primary }]}>
                    {allFavouritesTitle}
                  </Text>
                  <Text style={[styles.folderCount, { color: colors.text.secondary }]}>
                    {favourites.length} {favourites.length === 1 ? 'Rezept' : 'Rezepte'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.folderEdit, { borderColor: colors.border.primary, backgroundColor: colors.background.card }]}
                  onPress={() => openRename({ kind: 'all' })}
                  activeOpacity={0.7}
                >
                  <Pencil size={14} color={colors.text.primary} strokeWidth={2} />
                </TouchableOpacity>
              </View>

              <View style={styles.thumbGrid}>
                {favourites.map(recipe => (
                  <TouchableOpacity
                    key={recipe.id}
                    style={styles.thumbWrapper}
                    onPress={() => router.push(`/recipe/${recipe.id}`)}
                    onLongPress={() => toggleFavourite(recipe.id)}
                    activeOpacity={0.85}
                  >
                    <Image
                      source={{ uri: recipe.imageUrl }}
                      style={styles.thumb}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        )
      )}

      {/* ── Ordner tab — folder cards ── */}
      {activeTab === 'ordner' && (
        <ScrollView
          contentContainerStyle={[styles.folderList, { paddingBottom: bottomPad }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {folders.map(folder => (
            <TouchableOpacity
              key={folder.id}
              style={[styles.folderCard, { backgroundColor: colors.background.secondary }]}
              onPress={() => router.push(`/favoriten/${folder.id}`)}
              activeOpacity={0.85}
            >
              {/* Folder header */}
              <View style={styles.folderHeader}>
                <View style={styles.folderTitleWrap}>
                  <Text style={[styles.folderTitle, { color: colors.text.primary }]}>
                    {folder.title}
                  </Text>
                  <Text style={[styles.folderCount, { color: colors.text.secondary }]}>
                    {folder.count} Rezepte
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.folderEdit, { borderColor: colors.border.primary, backgroundColor: colors.background.card }]}
                  onPress={() => openRename({ kind: 'folder', id: folder.id })}
                  activeOpacity={0.7}
                >
                  <Pencil size={14} color={colors.text.primary} strokeWidth={2} />
                </TouchableOpacity>
              </View>

              {/* Thumbnail grid (3 per row) — each opens the themed recipe detail */}
              <View style={styles.thumbGrid}>
                {folder.thumbnails.map(thumb => (
                  <TouchableOpacity
                    key={thumb.uri}
                    style={styles.thumbWrapper}
                    onPress={() => router.push(`/recipe/${thumb.recipeId}`)}
                    activeOpacity={0.85}
                  >
                    <Image
                      source={{ uri: thumb.uri }}
                      style={styles.thumb}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      {/* ── Rename modal ───────────────────────────────────────────────── */}
      <Modal
        visible={renameTarget !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameTarget(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setRenameTarget(null)} />
          <View style={[styles.renameCard, { backgroundColor: colors.background.card }]}>
            <Text style={[styles.renameTitle, { color: colors.text.primary }]}>
              {renameTarget?.kind === 'folder' ? 'Ordner umbenennen' : 'Liste umbenennen'}
            </Text>
            <TextInput
              style={[styles.renameInput, {
                color: colors.text.primary,
                backgroundColor: colors.background.secondary,
                borderColor: colors.border.primary,
              }]}
              value={renameInput}
              onChangeText={setRenameInput}
              autoFocus
              placeholder="Name eingeben"
              placeholderTextColor={colors.text.tertiary}
              returnKeyType="done"
              onSubmitEditing={confirmRename}
            />
            <View style={styles.renameActions}>
              <TouchableOpacity
                style={[styles.renameCancel, { borderColor: colors.border.primary }]}
                onPress={() => setRenameTarget(null)}
                activeOpacity={0.7}
              >
                <Text style={[styles.renameCancelText, { color: colors.text.primary }]}>Abbrechen</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.renameSave, { backgroundColor: colors.primary }]}
                onPress={confirmRename}
                activeOpacity={0.8}
              >
                <Text style={styles.renameSaveText}>Speichern</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 42,
    lineHeight: 52,
    letterSpacing: -0.5,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 28,
    marginTop: 8,
    marginBottom: 20,
  },
  tab: {
    paddingBottom: 8,
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 17,
  },
  tabUnderline: {
    height: 2,
    width: '100%',
    borderRadius: 2,
    marginTop: 6,
  },

  // Rezepte tab grid (existing)
  grid: { paddingHorizontal: 20, gap: 12 },
  gridRow: { gap: 12 },
  cardWrapper: { flex: 1 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 15, fontFamily: 'Inter-Regular' },

  // Folder cards
  folderList: { paddingHorizontal: 20, gap: 24 },
  folderCard: {
    borderRadius: 20,
    padding: 18,
    gap: 16,
  },
  folderHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  folderTitleWrap: { flex: 1, gap: 4 },
  folderTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    letterSpacing: -0.3,
  },
  folderCount: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },
  folderEdit: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THUMB_GAP,
  },
  thumbWrapper: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 10,
    overflow: 'hidden',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },

  // Rename modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  renameCard: {
    width: '100%',
    borderRadius: 20,
    padding: 22,
    gap: 16,
  },
  renameTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
  },
  renameInput: {
    borderRadius: 9999,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: 'Inter-Regular',
  },
  renameActions: {
    flexDirection: 'row',
    gap: 10,
  },
  renameCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 9999,
    borderWidth: 1,
    alignItems: 'center',
  },
  renameCancelText: { fontSize: 15, fontFamily: 'Inter-SemiBold' },
  renameSave: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 9999,
    alignItems: 'center',
  },
  renameSaveText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Inter-SemiBold',
  },
});
