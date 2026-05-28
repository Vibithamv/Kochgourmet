import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  RefreshControl,
  type ListRenderItem,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors, getTypography, Typography } from '@/constants/theme';
import ProjectCard from '@/components/ProjectCard';
import { listOfferings } from '@/hooks/listOfferings';
import { useGlobalAlert } from '@/contexts/AlertContext';
import { useOfferingCheck } from '@/hooks/useOfferingCheck';
import { useFocusEffect } from '@react-navigation/native';
import { ProjectsShimmer } from '@/components/Shimmer';
import { replaceLoginClearingAuthStack } from '@/utils/authNavigation';

type ProjectStatus =
  | 'privatesale' | 'presale' | 'whitelisting' | 'announcement'
  | 'presaleannouncement' | 'public' | 'finished' | 'draft';

interface ExtendedProject {
  id: string;
  title: string;
  description: string;
  minimum_investment: number;
  image_url: string;
  status: ProjectStatus;
  created_at: string;
  asset_symbol?: string;
  decimals?: string;
  price_per_token?: string;
  main_currency: string;
  fundingStartDate: string;
  fundingEndDate: string;
  privatesale_content?: unknown;
  publicsale_content?: unknown;
  presale_content?: unknown;
  announcement_content?: unknown;
  finished_content?: unknown;
  whitelisting_content?: unknown;
}

const TAB_BAR_HEIGHT = 90;

const OfferingsScreen = React.memo(() => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const typography = getTypography(theme);
  const insets = useSafeAreaInsets();
  const listRef = React.useRef<FlatList>(null);

  const [projects, setProjects] = useState<ExtendedProject[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const { showAlert } = useGlobalAlert();
  const offerings = listOfferings();
  const { performOfferingCheck } = useOfferingCheck();

  const loadProjects = useCallback(async () => {
    setLoading(true);
    await performOfferingCheck();
    const res = await offerings.offerings();
    setLoading(false);
    if (res.success && res.data) {
      const projectData: ExtendedProject[] = res.data.data.investWidget.selected_offerings.map((p: any) => ({
        id: p.id,
        title: p.details.asset_name,
        description: p.details.asset_description,
        minimum_investment: p.details.minimum_investment,
        image_url: p.details.detail_page_image ?? p.details.heroImage ?? '',
        status: p.details.visibility_status,
        created_at: p.details.created_at,
        asset_symbol: p.details.asset_symbol,
        decimals: p.details.decimals,
        price_per_token: p.details.price_per_token,
        main_currency: p.details.main_currency,
        fundingStartDate: p.details.funding_start_date,
        fundingEndDate: p.details.funding_end_date,
        privatesale_content: p.details.privatesale_content,
        publicsale_content: p.details.publicsale_content,
        presale_content: p.details.presale_content,
        announcement_content: p.details.announcement_content,
        finished_content: p.details.finished_content,
        whitelisting_content: p.details.whitelisting_content,
      }));
      setProjects(projectData);
    } else if (res.status === 401) {
      showAlert(t('profile.sessionExpired'), t('profile.loginAgain'));
      replaceLoginClearingAuthStack();
    } else {
      showAlert(t('common.error'), t('common.errorMessage'));
    }
  }, []);

  useFocusEffect(useCallback(() => { void loadProjects(); }, []));

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadProjects().finally(() => setRefreshing(false));
  }, [loadProjects]);

  const filteredProjects = projects.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderProject: ListRenderItem<ExtendedProject> = useCallback(({ item, index }) => (
    <ProjectCard
      key={item.id}
      project={item}
      showProgress={item.status === 'public'}
      style={{ marginTop: index === 0 ? 0 : 16 }}
    />
  ), []);

  const renderEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: colors.text.tertiary }]}>
        {t('common.noResultsFound')}
      </Text>
    </View>
  ), [t, colors]);

  const keyExtractor = useCallback((item: ExtendedProject) => item.id, []);

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: 400,
    offset: 400 * index + (index > 0 ? 16 * index : 0),
    index,
  }), []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      {/* Header — Playfair Display title matching Magazin/Favoriten */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 44) + 16 }]}>
        <Text style={[styles.title, {
          color: colors.text.primary,
          fontFamily: typography.fontFamily.display,
        }]}>
          {t('common.tabs.token')} 🎁
        </Text>
        <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
          Deine Bonus & Token
        </Text>
      </View>

      <View style={styles.searchRow}>
        <View style={[styles.searchBar, { backgroundColor: colors.background.tertiary }]}>
          <TextInput
            style={[styles.searchInput, { color: colors.text.primary }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('projects.searchPlaceholder')}
            placeholderTextColor={colors.text.tertiary}
          />
          <Search size={20} color={colors.text.tertiary} />
        </View>
      </View>

      {loading ? (
        <ProjectsShimmer />
      ) : (
        <FlatList
          ref={listRef}
          data={filteredProjects}
          renderItem={renderProject}
          ListEmptyComponent={renderEmpty}
          keyExtractor={keyExtractor}
          getItemLayout={getItemLayout}
          contentContainerStyle={[
            styles.listContent,
            filteredProjects.length === 0 && styles.listContentCenter,
            { paddingBottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 12) + 16 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          maxToRenderPerBatch={5}
          initialNumToRender={3}
          windowSize={10}
        />
      )}
    </View>
  );
});

OfferingsScreen.displayName = 'OfferingsScreen';
export default OfferingsScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 18,
    gap: 6,
  },
  title: {
    fontSize: 42,
    lineHeight: 52,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    lineHeight: 22,
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
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  listContentCenter: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
});
