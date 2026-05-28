import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ListRenderItem,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { Typography, getColors, getTypography, BorderRadius } from '@/constants/theme';
import ProjectCard from '@/components/ProjectCard';
import { listOfferings } from '@/hooks/listOfferings';
import { useGlobalAlert } from '@/contexts/AlertContext';
import { useOfferingCheck } from '@/hooks/useOfferingCheck';
import { useFocusEffect } from '@react-navigation/native';
import { ProjectsShimmer } from '@/components/Shimmer';

type ProjectStatus = 'privatesale' | 'presale' | 'whitelisting' | 'announcement' | 'presaleannouncement' | 'public' | 'finished' | 'draft';

interface ExtendedProject {
  id: string;
  title: string;
  description: string;
  minimum_investment: number;
  image_url: string;
  status: ProjectStatus;
  created_at: string;
  announcement_date?: string;
  presale_start_date?: string;
  is_whitelisted?: boolean;
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

const ProjectListScreen = React.memo(() => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const insets = useSafeAreaInsets();
  const scrollViewRef = React.useRef<FlatList>(null);
  const [projects, setProjects] = useState<ExtendedProject[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchFocused, setSearchFocused] = useState(false);
  const { showAlert } = useGlobalAlert();
  const offerings = listOfferings();
  const { performOfferingCheck } = useOfferingCheck();

  useFocusEffect(
    useCallback(() => {
      loadProjects();
    }, [])
  );

  const loadProjects = async () => {
    setLoading(true);
    await performOfferingCheck();
    offerings.offerings().then((res) => {
      setLoading(false);
      if (res.success && res.data) {
        const projectData: ExtendedProject[] = res.data.data.investWidget.selected_offerings.map((p: any) => ({
          id: p.id,
          title: p.details.asset_name,
          description: p.details.asset_description,
          minimum_investment: p.details.minimum_investment,
          image_url:
            p.details.detail_page_image ?? p.details.heroImage ?? '',
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
      } else {
        console.log('Failed to fetch offerings:', res.error);
        if (res.status === 401) {
          showAlert(t('profile.sessionExpired'), t('profile.loginAgain'));
          router.replace('/auth/login');
        } else {
          showAlert(t('common.error'), t('common.errorMessage'));
        }
      }
    });
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadProjects();
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const filteredProjects = projects.filter((project) =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderProject: ListRenderItem<ExtendedProject> = React.useCallback(({ item, index }) => (
    <ProjectCard
      key={item.id}
      project={item}
      showProgress={item.status === 'public'}
      style={{ marginTop: index === 0 ? 0 : 16 }}
    />
  ), []);

  const renderEmptyList = React.useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: colors.text.tertiary }]}>{t('common.noResultsFound')}</Text>
    </View>
  ), [t, colors]);

  const keyExtractor = React.useCallback((item: ExtendedProject) => item.id, []);

  const getItemLayout = React.useCallback((_data: any, index: number) => ({
    length: 400,
    offset: 400 * index + (index > 0 ? 16 * index : 0),
    index,
  }), []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      {/* Header / Search */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 50), backgroundColor: colors.background.primary, borderBottomColor: colors.border.primary }]}>
        <View style={styles.headerInner}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
            <ArrowLeft size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text
            style={[
              styles.headerTitle,
              {
                color: colors.text.primary,
                fontFamily: getTypography(theme).fontFamily.display,
              },
            ]}
          >
            {t('common.tabs.token')}
          </Text>
        </View>
        <View
          style={[
            styles.searchRow,
            {
              backgroundColor: colors.background.secondary,
              borderColor: searchFocused ? colors.border.focus : colors.border.primary,
              borderRadius: BorderRadius.full,
            },
          ]}
        >
          <Search size={16} color={searchFocused ? colors.border.focus : colors.text.tertiary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text.primary }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('projects.searchPlaceholder')}
            placeholderTextColor={colors.text.placeholder}
            selectionColor={colors.border.focus}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </View>
      </View>

      {loading ? (
        <ProjectsShimmer />
      ) : (
        <FlatList
          ref={scrollViewRef}
          data={filteredProjects}
          renderItem={renderProject}
          ListEmptyComponent={renderEmptyList}
          keyExtractor={keyExtractor}
          getItemLayout={getItemLayout}
          contentContainerStyle={[
            styles.listContent,
            filteredProjects.length === 0 && { flex: 1, justifyContent: 'center' },
            { paddingBottom: insets.bottom + 100 },
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
          removeClippedSubviews={true}
          maxToRenderPerBatch={5}
          updateCellsBatchingPeriod={50}
          initialNumToRender={3}
          windowSize={10}
        />
      )}
    </View>
  );
});

ProjectListScreen.displayName = 'ProjectListScreen';

export default ProjectListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: Typography.fontSize['2xl'],
    letterSpacing: -0.3,
  },

  // Search
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    paddingHorizontal: 12,
    height: 44,
  },
  searchRowFocused: {
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    fontFamily: 'Inter-Regular',
    height: '100%',
  },

  // List
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },

  // Loader
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty
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
