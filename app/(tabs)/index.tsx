import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { Typography, getColors, getTypography } from '@/constants/theme';
import ProjectCard from '@/components/ProjectCard';
import { listOfferings } from '@/hooks/listOfferings';
import { userManagement } from '@/hooks/userManagement';
import { useGlobalAlert } from '@/contexts/AlertContext';
import { useOfferingCheck } from '@/hooks/useOfferingCheck';
import { useFocusEffect } from '@react-navigation/native';
import { DashboardShimmer } from '@/components/Shimmer';
import { projectDashboardImage } from '@/utils/offeringLocalizedContent';
import AsseteraLogo from '@/components/AsseteraLogo';

type ProjectStatus = 'privatesale' | 'presale' | 'whitelisting' | 'announcement' | 'presaleannouncement' | 'public' | 'finished' | 'draft';

interface ExtendedProject {
  id: string;
  title: string;
  description: string;
  minimum_investment: number;
  image_url: string;
  status: ProjectStatus;
  created_at: string;
  tenant_id: string;
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

const DashboardScreen = React.memo(() => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const insets = useSafeAreaInsets();
  const scrollViewRef = React.useRef<ScrollView>(null);
  const offerings = listOfferings();
  const [projects, setProjects] = useState<ExtendedProject[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const { showAlert } = useGlobalAlert();
  const { performOfferingCheck } = useOfferingCheck();
  const userAccount = userManagement();

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadProject(), getUser()]);
    setLoading(false);
  };

  const loadProject = async () => {
    await performOfferingCheck();
    const res = await offerings.offerings();
    if (res.success && res.data) {
      const projectData: ExtendedProject[] = res.data.data.investWidget.selected_offerings.map((p: any) => ({
        id: p.id,
        title: p.details.asset_name,
        description: p.details.asset_description,
        minimum_investment: p.details.minimum_investment,
        image_url:
          p.details.dashboard_image ??
          p.details.detail_page_image ??
          p.details.heroImage ??
          '',
        status: p.details.visibility_status,
        created_at: p.details.created_at,
        tenant_id: 'default',
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
    }
  };

  const getUser = async () => {
    try {
      const data = await userAccount.getUser();
      if (data.success && data.data) {
        setUserName(data.data.data.activeAccount.name);
      } else if (data.status === 401) {
        showAlert(t('profile.sessionExpired'), t('profile.loginAgain'));
        router.replace('/auth/login');
      } else {
        showAlert(t('common.error'), t('common.errorMessage'));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadData();
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const projectsForDisplay = React.useMemo(
    () =>
      projects.map((project) => ({
        ...project,
        image_url:
          projectDashboardImage(project, i18n.language) ||
          project.image_url ||
          '',
      })),
    [projects, i18n.language]
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
        <DashboardShimmer />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 50), backgroundColor: colors.background.primary, borderBottomColor: colors.border.primary }]}>
        <View style={styles.headerInner}>
          <View style={styles.headerLogoWrap}>
            <AsseteraLogo width={130} height={25} />
          </View>
          <View style={styles.greetingCol}>
            <Text style={[styles.greeting, { color: colors.text.tertiary }]}>{t('dashboard.greeting')}</Text>
            <Text
              style={[
                styles.userName,
                {
                  color: colors.text.primary,
                  fontFamily: getTypography(theme).fontFamily.display,
                },
              ]}
            >
              {userName || 'Investor'}
            </Text>
          </View>
        </View>
        <View style={styles.headerDivider} />
      </View>
      <ScrollView
        ref={scrollViewRef}
        style={[styles.scrollBody, { backgroundColor: colors.background.secondary }]}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHeader}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.text.primary,
                fontFamily: getTypography(theme).fontFamily.display,
              },
            ]}
          >
            {t('dashboard.token')}
          </Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={[styles.seeAll, { color: colors.text.tertiary }]}>{t('dashboard.seeAll')}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.cardsContainer}>
          {projectsForDisplay.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              showProgress={project.status === 'public'}
              style={{ marginBottom: 16 }}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
});

DashboardScreen.displayName = 'DashboardScreen';

export default DashboardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollBody: {
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
    justifyContent: 'space-between',
  },
  greetingCol: {
    flex: 1,
  },
  greeting: {
    fontSize: Typography.fontSize.xs,
    fontFamily: 'Inter-Regular',
    marginBottom: 1,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  userName: {
    fontSize: Typography.fontSize['2xl'],
    letterSpacing: -0.3,
  },
  headerLogoWrap: {
    height: 28,
    marginRight: 16,
    justifyContent: 'center',
  },
  headerDivider: {
    height: 0,
  },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: Typography.fontSize['2xl'],
    letterSpacing: -0.3,
  },
  seeAll: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'Inter-Medium',
  },

  // Cards
  cardsContainer: {
    paddingHorizontal: 24,
  },
});
