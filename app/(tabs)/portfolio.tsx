import React, { useCallback, useRef, useState } from 'react';
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
import { useTranslation } from 'react-i18next';
import { Plus, Pencil } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors, Typography } from '@/constants/theme';
import { useFavourites } from '@/contexts/FavouritesContext';
import { useFolders } from '@/contexts/FoldersContext';
import { useGlobalAlert } from '@/contexts/AlertContext';
import { useFocusEffect } from '@react-navigation/native';
import { mobileAppRecipes } from '@/hooks/mobileApp';
import { mapRecipeListItem } from '@/utils/mobileAppMappers';
import { getMobileAppJwt } from '@/utils/mobileAppAuthUtils';

const TAB_BAR_HEIGHT = 90;
const EDIT_MENU_WIDTH = 168;

type FavouritesTab = 'rezepte' | 'ordner';
type EditTarget = { kind: 'folder'; id: string } | { kind: 'all' };

interface EditMenuAnchor {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

interface EditMenuState extends EditMenuAnchor {
  readonly target: EditTarget;
}

export default function FavoritenScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const insets = useSafeAreaInsets();
  const { showAlert } = useGlobalAlert();

  const { favourites, toggleFavourite, replaceFavourites } = useFavourites();
  const { folders, renameFolder, deleteFolder } = useFolders();
  const recipesApi = React.useMemo(() => mobileAppRecipes(), []);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<FavouritesTab>('ordner');

  // Editable "Alle Favoriten" title on the Rezepte tab (folder titles live in FoldersContext)
  const [allFavouritesTitle, setAllFavouritesTitle] = useState(() => t('favoritenScreen.allFavourites'));

  const [editMenu, setEditMenu] = useState<EditMenuState | null>(null);

  // Rename modal — `target` is either { kind: 'folder', id } or { kind: 'all' }
  const [renameTarget, setRenameTarget] = useState<EditTarget | null>(null);
  const [renameInput, setRenameInput] = useState('');

  const openEditMenu = useCallback((target: EditTarget, anchor: EditMenuAnchor) => {
    setEditMenu({ target, ...anchor });
  }, []);

  const openRename = useCallback((target: EditTarget) => {
    if (target.kind === 'folder') {
      const folder = folders.find(f => f.id === target.id);
      setRenameInput(folder?.title ?? '');
    } else {
      setRenameInput(allFavouritesTitle);
    }
    setRenameTarget(target);
  }, [folders, allFavouritesTitle]);

  const handleRenameFromMenu = useCallback(() => {
    if (!editMenu) return;
    const target = editMenu.target;
    setEditMenu(null);
    openRename(target);
  }, [editMenu, openRename]);

  const handleDeleteFromMenu = useCallback(() => {
    if (editMenu?.target.kind !== 'folder') return;
    const folderId = editMenu.target.id;
    const folder = folders.find(f => f.id === folderId);
    setEditMenu(null);
    showAlert(
      t('favoritenScreen.deleteFolderTitle', { name: folder?.title ?? '' }),
      t('favoritenScreen.deleteFolderMessage', { count: folder?.count ?? 0 }),
      {
        secondaryButtonText: t('common.cancel'),
        buttonText: t('common.delete'),
        buttonCallback: () => deleteFolder(folderId),
      },
    );
  }, [editMenu, folders, showAlert, t, deleteFolder]);

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

  const loadFavourites = useCallback(async () => {
    const jwt = await getMobileAppJwt();
    if (!jwt) return;

    const response = await recipesApi.listFavoriteRecipes();
    if (response.success && response.data) {
      replaceFavourites(response.data.map(mapRecipeListItem));
    }
  }, [recipesApi, replaceFavourites]);

  useFocusEffect(
    useCallback(() => {
      void loadFavourites();
    }, [loadFavourites]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadFavourites().finally(() => setRefreshing(false));
  }, [loadFavourites]);

  const bottomPad = TAB_BAR_HEIGHT + Math.max(insets.bottom, 12) + 16;

  const editMenuLeft = editMenu
    ? Math.min(
        Math.max(20, editMenu.x + editMenu.width - EDIT_MENU_WIDTH),
        SCREEN_WIDTH - EDIT_MENU_WIDTH - 20,
      )
    : 0;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      {/* Header — Playfair title + circular "+" button */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 44) + 16 }]}>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          {t('common.tabs.favoriten')}
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
              }]}>
                {tab === 'rezepte' ? t('favoritenScreen.tabRecipes') : t('favoritenScreen.tabFolders')}
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
              {t('favoritenScreen.noFavouritesYet')}
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
                    {t('favoritenScreen.recipeCount', { count: favourites.length })}
                  </Text>
                </View>
                <FolderEditButton
                  colors={colors}
                  onPress={anchor => openEditMenu({ kind: 'all' }, anchor)}
                />
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
                    {t('favoritenScreen.recipeCount', { count: folder.count })}
                  </Text>
                </View>
                <FolderEditButton
                  colors={colors}
                  onPress={anchor => openEditMenu({ kind: 'folder', id: folder.id }, anchor)}
                />
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
      {/* ── Edit menu popover ──────────────────────────────────────────── */}
      <Modal
        visible={editMenu !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditMenu(null)}
      >
        <View style={styles.menuOverlay}>
          <Pressable style={styles.menuBackdrop} onPress={() => setEditMenu(null)} />
          {editMenu && (
            <View
              style={[
                styles.editMenu,
                {
                  top: editMenu.y + editMenu.height + 6,
                  left: editMenuLeft,
                  backgroundColor: colors.background.card,
                  borderColor: colors.border.primary,
                },
              ]}
            >
              <Pressable
                style={[
                  styles.editMenuItem,
                  editMenu.target.kind === 'folder' && styles.editMenuItemDivider,
                  editMenu.target.kind === 'folder' && { borderBottomColor: colors.border.primary },
                ]}
                onPress={handleRenameFromMenu}
              >
                <Text style={[styles.editMenuItemText, { color: colors.text.primary }]}>
                  {t('favoritenScreen.rename')}
                </Text>
              </Pressable>
              {editMenu.target.kind === 'folder' && (
                <Pressable style={styles.editMenuItem} onPress={handleDeleteFromMenu}>
                  <Text style={[styles.editMenuItemText, { color: colors.error }]}>
                    {t('favoritenScreen.delete')}
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      </Modal>

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
              {renameTarget?.kind === 'folder'
                ? t('favoritenScreen.renameFolder')
                : t('favoritenScreen.renameList')}
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
              placeholder={t('favoritenScreen.namePlaceholder')}
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
                <Text style={[styles.renameCancelText, { color: colors.text.primary }]}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.renameSave, { backgroundColor: colors.primary }]}
                onPress={confirmRename}
                activeOpacity={0.8}
              >
                <Text style={styles.renameSaveText}>{t('common.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

interface FolderEditButtonProps {
  readonly colors: ReturnType<typeof getColors>;
  readonly onPress: (anchor: EditMenuAnchor) => void;
}

function FolderEditButton({ colors, onPress }: FolderEditButtonProps) {
  const ref = useRef<View>(null);

  return (
    <View ref={ref} collapsable={false}>
      <TouchableOpacity
        style={[styles.folderEdit, { borderColor: colors.border.primary }]}
        onPress={() => {
          ref.current?.measureInWindow((x, y, width, height) => {
            onPress({ x, y, width, height });
          });
        }}
        activeOpacity={0.7}
      >
        <Pencil size={14} color={colors.text.primary} strokeWidth={2} />
      </TouchableOpacity>
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
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 45,
    lineHeight: 61,
    letterSpacing: 0,
  },
  addButton: {
    width: 45,
    height: 45,
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
    fontFamily: 'Roboto-Light',
    fontSize: 17,
    lineHeight: 27,
    letterSpacing: 0,
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
    fontFamily: 'Roboto-Regular',
    fontSize: 17,
    lineHeight: 21,
    letterSpacing: 0,
  },
  folderCount: {
    fontFamily: 'Roboto-Light',
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: 0,
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

  // Edit menu popover
  menuOverlay: {
    flex: 1,
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  editMenu: {
    position: 'absolute',
    width: EDIT_MENU_WIDTH,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  editMenuItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  editMenuItemDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  editMenuItemText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 16,
    lineHeight: 21,
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
    fontSize: Typography.fontSize.xl,
    fontFamily: 'Roboto-Medium',
    textAlign: 'center',
  },
  renameInput: {
    borderRadius: 9999,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: Typography.fontSize.base,
    fontFamily: 'Roboto-Light',
    lineHeight: 22,
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
  renameCancelText: {
    fontSize: 17,
    fontFamily: 'Roboto-Light',
    lineHeight: 23,
    letterSpacing: 0,
    textAlign: 'center',
  },
  renameSave: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 9999,
    alignItems: 'center',
  },
  renameSaveText: {
    color: '#fff',
    fontSize: 17,
    fontFamily: 'Roboto-Regular',
    lineHeight: 23,
    letterSpacing: 0,
    textAlign: 'center',
  },
});
