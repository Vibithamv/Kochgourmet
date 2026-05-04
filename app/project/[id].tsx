import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  ActivityIndicator,
} from 'react-native';
import RenderHTML from 'react-native-render-html';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Clock,
  Users,
  CircleCheck as CheckCircle,
  Calendar,
  Zap,
  ArrowRight,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import i18n from '@/i18n';
import {
  getColors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import OptimizedImage from '@/components/OptimizedImage';
import { offeringDetails } from '@/hooks/offering_details';
import { useGlobalAlert } from '@/contexts/AlertContext';
import { useFocusEffect } from '@react-navigation/native';
import { useOfferingCheck } from '@/hooks/useOfferingCheck';
import { ProjectDetailShimmer } from '@/components/Shimmer';
import {
  pickLocalizedHtmlField,
  projectDetailPageImage,
} from '@/utils/offeringLocalizedContent';

const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT = 300;

type ProjectStatus =
  | 'privatesale'
  | 'presale'
  | 'whitelisting'
  | 'announcement'
  | 'presaleannouncement'
  | 'public'
  | 'finished'
  | 'draft';

interface ExtendedProject {
  id: string;
  title: string;
  description: string;
  location: string;
  target_amount: number;
  raised_amount: number;
  minimum_investment: number;
  expected_return: number;
  duration_months: number;
  /** API `detail_page_image` (+ optional `heroImage`) when localized `detail_page_image` is missing */
  image_url: string;
  status: ProjectStatus;
  created_at: string;
  tenant_id: string;
  announcement_date?: string;
  presale_start_date?: string;
  is_whitelisted?: boolean;
  /** API: HTML string or `{ [locale]: { faq, offering_description, ... } }` */
  privatesale_content: unknown;
  publicsale_content: unknown;
  presale_content: unknown;
  announcement_content: unknown;
  finished_content: unknown;
  whitelisting_content: unknown;
  main_currency: string;
  fundingStartDate: string;
  fundingEndDate: string;
  investors: string;
  asset_symbol: string;
}

function getRemainingTime(fundingStartDate: string): string {
  const startDate = new Date(fundingStartDate);
  const now = new Date();
  const diffMs = startDate.getTime() - now.getTime();

  if (diffMs <= 0) {
    return '00:00:00';
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

const OFFERING_BODY_INNER_HTML_RE = /<body[^>]*>([\s\S]*?)<\/body>/i;

function extractOfferingBodyInnerHtml(html: string): string {
  if (typeof html !== 'string') return '';
  const match = OFFERING_BODY_INNER_HTML_RE.exec(html);
  const bodyHTML = match?.[1] ?? html;
  return bodyHTML.trim();
}

function sanitizeOfferingDescriptionHtml(raw: unknown): string {
  if (raw == null || typeof raw !== 'string') return '';
  if (!raw.trim()) return '';
  return extractOfferingBodyInnerHtml(raw);
}

type AppColors = ReturnType<typeof getColors>;

type ProjectStatusInfo = {
  label: string;
  color: string;
  bgColor: string;
  emoji: string;
  description: string;
};

type StatusPaletteKey =
  | 'privateSale'
  | 'preSale'
  | 'whitelist'
  | 'public'
  | 'announcement'
  | 'finished';

type StatusSpec = {
  emoji: string;
  labelKey: string;
  descriptionKey: string;
  lightBg: string;
  darkBg: string;
  paletteKey: StatusPaletteKey;
};

const PROJECT_STATUS_SPECS: Record<ProjectStatus, StatusSpec> = {
  privatesale: {
    emoji: '🔒',
    labelKey: 'projects.privateSale',
    descriptionKey: 'projectDetail.exclusiveOpportunity',
    lightBg: 'rgba(167,139,250,0.15)',
    darkBg: '#2D1B69',
    paletteKey: 'privateSale',
  },
  presale: {
    emoji: '⚡',
    labelKey: 'projects.preSale',
    descriptionKey: 'projectDetail.earlyBirdAccess',
    lightBg: 'rgba(245,158,11,0.15)',
    darkBg: '#78350F',
    paletteKey: 'preSale',
  },
  whitelisting: {
    emoji: '📝',
    labelKey: 'projects.whitelist',
    descriptionKey: 'projectDetail.registerToday',
    lightBg: 'rgba(143,150,163,0.15)',
    darkBg: '#374151',
    paletteKey: 'whitelist',
  },
  public: {
    emoji: '🚀',
    labelKey: 'projects.public',
    descriptionKey: 'projectDetail.openToEveryone',
    lightBg: 'rgba(152,209,71,0.15)',
    darkBg: '#064E3B',
    paletteKey: 'public',
  },
  announcement: {
    emoji: '📢',
    labelKey: 'projects.announcement',
    descriptionKey: 'projectDetail.comingSoon',
    lightBg: 'rgba(96,165,250,0.15)',
    darkBg: '#1E3A8A',
    paletteKey: 'announcement',
  },
  presaleannouncement: {
    emoji: '🎯',
    labelKey: 'projects.presaleAnnouncement',
    descriptionKey: 'projectDetail.getReady',
    lightBg: 'rgba(245,158,11,0.15)',
    darkBg: '#78350F',
    paletteKey: 'preSale',
  },
  finished: {
    emoji: '✅',
    labelKey: 'projects.finished',
    descriptionKey: 'projectDetail.successfullyCompleted',
    lightBg: 'rgba(143,150,163,0.15)',
    darkBg: '#374151',
    paletteKey: 'finished',
  },
  draft: {
    emoji: '📝',
    labelKey: 'projects.draft',
    descriptionKey: 'projectDetail.draft',
    lightBg: 'rgba(143,150,163,0.15)',
    darkBg: '#374151',
    paletteKey: 'finished',
  },
};

function getProjectStatusInfo(
  status: ProjectStatus,
  t: TFunction,
  colors: AppColors,
  theme: string
): ProjectStatusInfo {
  const spec = PROJECT_STATUS_SPECS[status];
  if (spec === undefined) {
    return {
      label: t('projects.unknown'),
      color: colors.text.secondary,
      bgColor: theme === 'light' ? 'rgba(143,150,163,0.15)' : '#374151',
      emoji: '❓',
      description: t('projectDetail.statusUnknown'),
    };
  }
  return {
    label: t(spec.labelKey),
    color: colors.status[spec.paletteKey],
    bgColor: theme === 'light' ? spec.lightBg : spec.darkBg,
    emoji: spec.emoji,
    description: t(spec.descriptionKey),
  };
}

export default function ProjectDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [project, setProject] = useState<ExtendedProject | null>(null);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useGlobalAlert();
  const colors = getColors(theme);
  const isDark = theme === 'dark' || theme === 'darkGreen';
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const offering = offeringDetails();
  const { performOfferingCheck } = useOfferingCheck();

  let projectData: ExtendedProject;

  useFocusEffect(
    React.useCallback(() => {
      loadProject();
    }, [])
  );

  useEffect(() => {
    loadProject();
  }, [id]);

  const loadProject = async () => {
    setLoading(true);
    await performOfferingCheck();
    offering.details(id).then((data) => {
      if (data.success && data.data) {
        projectData = {
          id: data.data.data.id,
          title: data.data.data.asset_name,
          description: data.data.data.asset_description,
          location: 'Baden bei Wien, AT',
          target_amount: 14000000,
          raised_amount: data.data.data.raised_amount,
          minimum_investment: data.data.data.minimum_investment,
          expected_return: 4,
          duration_months: 36,
          image_url:
            (typeof data.data.data.detail_page_image === 'string'
              ? data.data.data.detail_page_image
              : '') ||
            (typeof data.data.data.heroImage === 'string'
              ? data.data.data.heroImage
              : ''),
          status: data.data.data.visibility_status,
          created_at: data.data.data.created_at,
          tenant_id: data.data.data.tenant_id,
          announcement_date: '',
          presale_start_date: '',
          is_whitelisted: false,
          privatesale_content: data.data.data.privatesale_content,
          publicsale_content: data.data.data.publicsale_content,
          presale_content: data.data.data.presale_content,
          announcement_content: data.data.data.announcement_content,
          finished_content: data.data.data.finished_content,
          whitelisting_content: data.data.data.whitelisting_content,
          main_currency: data.data.data.main_currency,
          fundingStartDate: formatDate(data.data.data.funding_start_date),
          fundingEndDate: formatDate(data.data.data.funding_end_date),
          investors: data.data.data.investors,
          asset_symbol: data.data.data.asset_symbol,
        };
        setProject(projectData);
        setLoading(false);
      } else {
        setLoading(false);
        if (data.status === 401) {
          showAlert("Session Expired", "Please login again....");
          router.replace("/auth/login");
        } else {
          showAlert(t('common.error'), t('projectDetail.failedMsg'));
        }
      }
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('T')[0].split('-');
    return `${day}-${month}-${year}`;
  };

  const getStatusInfo = (status: ProjectStatus) =>
    getProjectStatusInfo(status, t, colors, theme);

  const handleInvestNow = () => {
    if (
      project?.status === 'public' ||
      project?.status === 'presale' ||
      project?.status === 'privatesale' ||
      project?.status === 'presaleannouncement'
    ) {
      router.push(`/investment/${project.id}`);
    } else if (project?.status === 'announcement') {
      showAlert(
        'Coming Soon',
        `This offering has been announced and will be open for investment with in ${getRemainingTime(project?.fundingStartDate)}`
      );
    } else if (project?.status === 'finished') {
      showAlert(
        'Funding completed',
        'Funding for this offering has been completed. You can no longer invest in this offering.'
      );
    } else {
      showAlert(
        t('investment.notAvailable'),
        t('investment.investmentNotAvailable')
      );
    }
  };

  // Header animation
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT - 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const imageTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_HEIGHT],
    outputRange: [0, -HEADER_HEIGHT * 0.3],
    extrapolate: 'clamp',
  });

  if (loading) {
    return <ProjectDetailShimmer />;
  } else if (!project) {
    return (
      <View
        style={[
          styles.errorContainer,
          { backgroundColor: colors.background.secondary },
        ]}
      >
        <View
          style={[
            styles.errorCard,
            { backgroundColor: colors.background.card },
          ]}
        >
          <Text style={styles.errorEmoji}>😔</Text>
          <Text style={[styles.errorText, { color: colors.text.primary }]}>
            {t('projectDetail.projectNotFound')}
          </Text>
          <Text style={[styles.errorSubtext, { color: colors.text.secondary }]}>
            {t('projectDetail.projectMightBeMoved')}
          </Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text
              style={[styles.backButtonText, { color: colors.text.onPrimary }]}
            >
              {t('projectDetail.goBack')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const htmlParsing = sanitizeOfferingDescriptionHtml;
  const htmlFAQParsing = sanitizeOfferingDescriptionHtml;

  const getDuration = (fundingStartDate: string, fundingEndDate: string) => {
    const [day1, month1, year1] = fundingStartDate.split('-');
    const startDate = new Date(`${year1}-${month1}-${day1}`);
    const [day, month, year] = fundingEndDate.split('-');
    const endDate = new Date(`${year}-${month}-${day}`);

    const diffMs = endDate.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 1) return t('time.today');
    if (diffDays === 1) return t('time.duration_day');
    if (diffDays < 30) return t('time.duration_days', { count: diffDays });

    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths === 1) return t('time.duration_month');
    return t('time.duration_months', { count: diffMonths });
  };

  const localizedLang = i18n.language;
  const heroImageUri =
    projectDetailPageImage(project, localizedLang) || project.image_url;

  const projectDescription = () => {
    switch (project.status) {
      case 'public': {
        const html = pickLocalizedHtmlField(
          project.publicsale_content,
          'offering_description',
          localizedLang
        );
        return htmlParsing(html);
      }
      case 'presale': {
        const html = pickLocalizedHtmlField(
          project.presale_content,
          'offering_description',
          localizedLang
        );
        return htmlParsing(html);
      }
      case 'whitelisting': {
        const html = pickLocalizedHtmlField(
          project.whitelisting_content,
          'offering_description',
          localizedLang
        );
        return htmlParsing(html);
      }
      case 'privatesale': {
        const html = pickLocalizedHtmlField(
          project.privatesale_content,
          'offering_description',
          localizedLang
        );
        return htmlParsing(html);
      }
      case 'announcement': {
        const html = pickLocalizedHtmlField(
          project.announcement_content,
          'offering_description',
          localizedLang
        );
        return htmlParsing(html);
      }
      case 'finished': {
        const html = pickLocalizedHtmlField(
          project.finished_content,
          'offering_description',
          localizedLang
        );
        return htmlParsing(html);
      }
      default:
        return sanitizeOfferingDescriptionHtml(project.description);
    }
  };

  const faq = () => {
    switch (project.status) {
      case 'public': {
        const html = pickLocalizedHtmlField(
          project.publicsale_content,
          'faq',
          localizedLang
        );
        return htmlFAQParsing(html);
      }
      case 'presale': {
        const html = pickLocalizedHtmlField(
          project.presale_content,
          'faq',
          localizedLang
        );
        return htmlFAQParsing(html);
      }
      case 'whitelisting': {
        const html = pickLocalizedHtmlField(
          project.whitelisting_content,
          'faq',
          localizedLang
        );
        return htmlFAQParsing(html);
      }
      case 'privatesale': {
        const html = pickLocalizedHtmlField(
          project.privatesale_content,
          'faq',
          localizedLang
        );
        return htmlFAQParsing(html);
      }
      case 'announcement': {
        const html = pickLocalizedHtmlField(
          project.announcement_content,
          'faq',
          localizedLang
        );
        return htmlFAQParsing(html);
      }
      case 'finished': {
        const html = pickLocalizedHtmlField(
          project.finished_content,
          'faq',
          localizedLang
        );
        return htmlFAQParsing(html);
      }
      default:
        return sanitizeOfferingDescriptionHtml(project.description);
    }
  };

  const statusInfo = getStatusInfo(project.status);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background.secondary },
      ]}
    >
      {/* Animated Header */}
      <Animated.View
        style={[
          styles.animatedHeader,
          {
            backgroundColor: colors.background.primary,
            borderBottomColor: colors.border.primary,
            paddingTop: insets.top,
            opacity: headerOpacity,
          },
        ]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={[
              styles.headerBackButton,
              { backgroundColor: colors.background.secondary },
            ]}
            onPress={() => router.back()}
          >
            <ArrowLeft size={25} color={colors.text.primary} />
          </TouchableOpacity>
          <Text
            style={[styles.headerTitle, { color: colors.text.primary }]}
            numberOfLines={1}
          >
            {project.title}
          </Text>
          {/* <TouchableOpacity
            style={[
              styles.headerActionButton,
              { backgroundColor: colors.background.secondary },
            ]}
            onPress={toggleFavorite}
          >
            <Heart
              size={20}
              color={isFavorited ? colors.error : colors.text.secondary}
              fill={isFavorited ? colors.error : 'transparent'}
            />
          </TouchableOpacity> */}
        </View>
      </Animated.View>

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image Section */}
        <View style={styles.heroContainer}>
          <Animated.View
            style={[
              styles.heroImageContainer,
              { transform: [{ translateY: imageTranslateY }] },
            ]}
          >
            {heroImageUri ? (
              <OptimizedImage
                source={{ uri: heroImageUri }}
                style={styles.heroImage}
                resizeMode="cover"
              />
            ) : <OptimizedImage
              source={{ uri: 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800' }}
              style={styles.heroImage}
              resizeMode="cover"
            />}
            {/* Top scrim — makes badge readable */}
            <LinearGradient
              colors={['rgba(0,0,0,0.55)', 'transparent']}
              style={styles.heroGradientTop}
            />
            {/* Bottom scrim — fades into content card */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.75)']}
              style={styles.heroGradient}
            />
          </Animated.View>

          {/* Floating Controls */}
          <TouchableOpacity
            style={[
              styles.floatingBackButton,
              { backgroundColor: 'rgba(0,0,0,0.6)' },
            ]}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* <TouchableOpacity style={[styles.floatingShareButton, { backgroundColor: 'rgba(0,0,0,0.6)' }]} onPress={handleShare}>
            <Share size={20} color="#FFFFFF" />
          </TouchableOpacity> */}

          {/* <TouchableOpacity
            style={[
              styles.floatingFavoriteButton,
              { backgroundColor: 'rgba(0,0,0,0.6)' },
            ]}
            onPress={toggleFavorite}
          >
            <Heart
              size={20}
              color={isFavorited ? '#EF4444' : '#FFFFFF'}
              fill={isFavorited ? '#EF4444' : 'transparent'}
            />
          </TouchableOpacity> */}

          {/* Status Badge */}
          <View style={[styles.statusBadge, { borderLeftColor: statusInfo.color }]}>
            <Text style={styles.statusEmoji}>{statusInfo.emoji}</Text>
            <Text style={styles.statusText}>{statusInfo.label}</Text>
          </View>

          {/* Return Badge */}
          {/* <View style={[styles.returnBadge, { backgroundColor: 'rgba(16, 185, 129, 0.95)' }]}>
            <Text style={styles.returnText}>{project.expected_return}%</Text>
            <Text style={styles.returnLabel}>p.a.</Text>
          </View> */}

          {/* Hero Content */}
          <View style={styles.heroContent}>
            <View
              style={[styles.heroTitleBadge, { borderLeftColor: statusInfo.color }]}
            >
              <Text style={[styles.heroTitle, { color: '#F2F2F2' }]}>
                {project.title}
              </Text>
            </View>
            {/* <View style={styles.heroLocation}>
              <MapPin size={16} color="rgba(255, 255, 255, 0.8)" />
              <Text style={styles.heroLocationText}>{project.location}</Text>
            </View> */}
          </View>
        </View>

        {/* Main Content Card */}
        <View
          style={[
            styles.contentCard,
            { backgroundColor: colors.background.primary },
          ]}
        >
          {/* Invest Button */}
          <View style={styles.investButtonSection}>
            {(() => {
              const isDisabled =
                project?.status === 'announcement' ||
                project?.status === 'finished' ||
                project?.status === 'whitelisting';
              // Disabled fill uses interactive.disabled; text.disabled is the same hex, so use secondary for contrast
              let investButtonForeground: string;
              if (isDisabled) {
                investButtonForeground = colors.text.secondary;
              } else if (isDark) {
                investButtonForeground = '#0D1117';
              } else {
                investButtonForeground = '#FFFFFF';
              }
              return (
                <TouchableOpacity onPress={handleInvestNow} activeOpacity={0.85} disabled={isDisabled}>
                  <LinearGradient
                    colors={isDisabled ? [colors.interactive.disabled, colors.interactive.disabled] : [colors.primary, colors.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.investButtonGradient}
                  >
                    <Text style={[styles.investButtonText, { color: investButtonForeground }]}>
                      {t('dashboard.investNow')}
                    </Text>
                    <ArrowRight size={20} color={investButtonForeground} />
                  </LinearGradient>
                </TouchableOpacity>
              );
            })()}
            <Text style={[styles.minInvestmentText, { color: colors.text.tertiary }]}>
              {t('dashboard.minInvestment')}: {Number(project.minimum_investment)} {project.asset_symbol}
            </Text>
          </View>

          {/* Key Metrics Cards */}
          <View style={styles.metricsSection}>
            <View style={styles.metricsRow}>
              {/* <View style={[styles.metricCard, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}>
                <View style={[styles.metricIconContainer, { backgroundColor: `${colors.success}15` }]}>
                  <TrendingUp size={20} color={colors.success} />
                </View>
                <Text style={[styles.metricValue, { color: colors.text.primary }]}>{project.expected_return}%</Text>
                <Text style={[styles.metricLabel, { color: colors.text.secondary }]}>{t('projects.expectedReturn')}</Text>
              </View> */}
              {!project.fundingStartDate || !project.fundingEndDate ? null :
                <View
                  style={[
                    styles.metricCard,
                    {
                      backgroundColor: colors.background.secondary,
                      borderColor: colors.border.primary,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.metricIconContainer,
                      { backgroundColor: 'rgba(245,158,11,0.15)' },
                    ]}
                  >
                    <Clock size={20} color={'#F59E0B'} />
                  </View>
                  <Text
                    style={[styles.metricValue, { color: colors.text.primary }]}
                  >
                    {getDuration(
                      project.fundingStartDate,
                      project.fundingEndDate
                    )}
                  </Text>
                  <Text
                    style={[styles.metricLabel, { color: colors.text.secondary }]}
                  >
                    {t('projects.duration')}
                  </Text>
                </View>}


              <View
                style={[
                  styles.metricCard,
                  {
                    backgroundColor: colors.background.secondary,
                    borderColor: colors.border.primary,
                  },
                ]}
              >
                <View
                  style={[
                    styles.metricIconContainer,
                    { backgroundColor: 'rgba(59,130,246,0.15)' },
                  ]}
                >
                  <Users size={20} color={'#3B82F6'} />
                </View>
                <Text
                  style={[styles.metricValue, { color: colors.text.primary }]}
                >
                  {project.investors}
                </Text>
                <Text
                  style={[styles.metricLabel, { color: colors.text.secondary }]}
                >
                  {t('projects.investors')}
                </Text>
              </View>
            </View>
          </View>

          {/* Funding Progress */}
          {/* <View style={styles.progressSection}>
            <View style={[styles.progressCard, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}>
              <View style={styles.progressHeader}>
                <View style={styles.progressTitleRow}>
                  <Target size={20} color={colors.primary} />
                  <Text style={[styles.progressTitle, { color: colors.text.primary }]}>{t('projects.fundingProgress')}</Text>
                </View>
                <Text style={[styles.progressPercentage, { color: colors.primary }]}>{Math.round(fundingPercentage)}%</Text>
              </View>
              
              <View style={[styles.progressTrack, { backgroundColor: colors.border.secondary }]}>
                <LinearGradient
                  colors={[colors.primary, colors.primaryDark]}
                  style={[styles.progressBar, { width: `${fundingPercentage}%` }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
              
              <View style={styles.progressStats}>
                <View style={styles.progressStat}>
                  <Text style={[styles.progressStatValue, { color: colors.text.primary }]}>{formatCurrency(project.raised_amount)}</Text>
                  <Text style={[styles.progressStatLabel, { color: colors.text.secondary }]}>{t('projects.raised')}</Text>
                </View>
                <View style={styles.progressStat}>
                  <Text style={[styles.progressStatValue, { color: colors.text.primary }]}>{formatCurrency(project.target_amount)}</Text>
                  <Text style={[styles.progressStatLabel, { color: colors.text.secondary }]}>{t('projectDetail.target')}</Text>
                </View>
              </View>
            </View>
          </View> */}

          {/* Project Description */}

          {projectDescription() === '' ? null :
            <View style={styles.descriptionSection}>
              <View
                style={[
                  styles.descriptionCard,
                  {
                    backgroundColor: colors.background.secondary,
                    borderColor: colors.border.primary,
                  },
                ]}
              >
                <RenderHTML
                  contentWidth={width}
                  source={{ html: projectDescription() }}
                  enableCSSInlineProcessing
                  classesStyles={{
                    title: {
                      color: colors.text.primary,
                      backgroundColor: 'transparent',
                      marginTop: 12,
                      marginBottom: 8,
                    },
                    desc: {
                      color: colors.text.primary,
                      backgroundColor: 'transparent',
                      textAlign: 'justify',
                      marginBottom: 10,
                    },
                  }}
                  baseStyle={{
                    color: colors.text.primary,
                    textAlign: 'justify',
                  }}
                  tagsStyles={{
                    body: { textAlign: 'justify', marginBottom: 4 },
                    div: { textAlign: 'justify', marginBottom: 10 },
                    p: {
                      fontSize: 14,
                      lineHeight: 22,
                      color: colors.text.secondary,
                      textAlign: 'justify',
                      marginTop: 0,
                      marginBottom: 12,
                    },
                    ul: {
                      marginTop: 4,
                      marginBottom: 12,
                      paddingLeft: 20,
                    },
                    ol: {
                      marginTop: 4,
                      marginBottom: 12,
                      paddingLeft: 20,
                    },
                    li: {
                      marginBottom: 8,
                      lineHeight: 22,
                      textAlign: 'justify',
                    },
                    h1: {
                      fontSize: 22,
                      fontWeight: '700',
                      marginTop: 8,
                      marginBottom: 10,
                      color: colors.text.primary,
                      textAlign: 'left',
                    },
                    h2: {
                      fontSize: 18,
                      fontWeight: '600',
                      marginTop: 8,
                      marginBottom: 8,
                      color: colors.text.primary,
                      textAlign: 'left',
                    },
                    h3: {
                      fontSize: 16,
                      fontWeight: '600',
                      marginTop: 12,
                      marginBottom: 6,
                      color: colors.text.primary,
                      textAlign: 'left',
                    },
                    h4: {
                      fontSize: 15,
                      fontWeight: '600',
                      marginTop: 10,
                      marginBottom: 4,
                      color: colors.text.primary,
                      textAlign: 'left',
                    },
                    strong: { fontWeight: 'bold' },
                    hr: {
                      height: 1,
                      marginVertical: 14,
                      backgroundColor: colors.border.primary,
                    },
                    dl: { marginBottom: 12 },
                    dt: {
                      fontWeight: '600',
                      marginTop: 12,
                      marginBottom: 4,
                      color: colors.text.primary,
                    },
                    dd: {
                      marginBottom: 10,
                      marginLeft: 8,
                      color: colors.text.secondary,
                      lineHeight: 22,
                      textAlign: 'justify',
                    },
                    span: { textAlign: 'justify' },
                  }}
                />
                {/* Project Highlights */}
                {/* <View style={styles.highlightsSection}>
                <Text style={[styles.highlightsTitle, { color: colors.text.primary }]}>{t('projectDetail.highlights')}</Text>
                <View style={styles.highlightsList}>
                  <View style={styles.highlightItem}>
                    <CheckCircle size={16} color={colors.success} />
                    <Text style={[styles.highlightText, { color: colors.text.secondary }]}>{t('projectDetail.premiumLocation')}</Text>
                  </View>
                  <View style={styles.highlightItem}>
                    <CheckCircle size={16} color={colors.success} />
                    <Text style={[styles.highlightText, { color: colors.text.secondary }]}>{t('projectDetail.professionalManagement')}</Text>
                  </View>
                  <View style={styles.highlightItem}>
                    <CheckCircle size={16} color={colors.success} />
                    <Text style={[styles.highlightText, { color: colors.text.secondary }]}>{t('projectDetail.transparentReporting')}</Text>
                  </View>
                </View>
              </View> */}
              </View>
            </View>
          }

          {/* Investment Timeline */}
          {!project.fundingStartDate || !project.fundingEndDate ? null :
            <View style={styles.timelineSection}>
              <View
                style={[
                  styles.timelineCard,
                  {
                    backgroundColor: colors.background.secondary,
                    borderColor: colors.border.primary,
                  },
                ]}
              >
                <View style={styles.timelineHeader}>
                  <Calendar size={20} color={'#F59E0B'} />
                  <Text
                    style={[styles.timelineTitle, { color: colors.text.primary }]}
                  >
                    {t('projectDetail.timeline')}
                  </Text>
                </View>

                <View style={styles.timelineItems}>
                  <View style={styles.timelineItem}>
                    <View
                      style={[
                        styles.timelineIcon,
                        { backgroundColor: colors.success },
                      ]}
                    >
                      <CheckCircle size={16} color={colors.text.onPrimary} />
                    </View>
                    <View style={styles.timelineContent}>
                      <Text
                        style={[
                          styles.timelineItemTitle,
                          { color: colors.text.primary },
                        ]}
                      >
                        {t('projectDetail.projectLaunched')}
                      </Text>
                      <Text
                        style={[
                          styles.timelineItemDate,
                          { color: colors.text.secondary },
                        ]}
                      >
                        {project.fundingStartDate.split('T')[0]}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.timelineLine,
                      { backgroundColor: colors.border.primary },
                    ]}
                  />

                  <View style={styles.timelineItem}>
                    <View
                      style={[
                        styles.timelineIcon,
                        { backgroundColor: colors.warning },
                      ]}
                    >
                      <Zap size={16} color={'#0D1117'} />
                    </View>
                    <View style={styles.timelineContent}>
                      <Text
                        style={[
                          styles.timelineItemTitle,
                          { color: colors.text.primary },
                        ]}
                      >
                        {t('projectDetail.expectedCompletion')}
                      </Text>
                      <Text
                        style={[
                          styles.timelineItemDate,
                          { color: colors.text.secondary },
                        ]}
                      >
                        {project.fundingEndDate.split('T')[0]}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>}

          {/* Trust & Security */}
          {faq() === '' ? null :
            <View style={styles.trustSection}>
              <View
                style={[
                  styles.trustCard,
                  {
                    backgroundColor: colors.background.secondary,
                    borderColor: colors.border.primary,
                  },
                ]}
              >
                {/* <View style={styles.trustHeader}>
                <Shield size={20} color={colors.status.privateSale} />
                <Text style={[styles.trustTitle, { color: colors.text.primary }]}>{t('projectDetail.whyTrustUs')}</Text>
              </View> */}
                <RenderHTML
                  contentWidth={width}
                  source={{ html: faq() }}
                  enableCSSInlineProcessing
                  classesStyles={{
                    'faq-answer': {
                      color: colors.text.primary,
                      backgroundColor: 'transparent',
                      marginTop: 6,
                      marginBottom: 16,
                    },
                    'faq-question': {
                      color: colors.text.primary,
                      backgroundColor: 'transparent',
                      marginTop: 20,
                      marginBottom: 8,
                      fontWeight: '600',
                    },
                  }}
                  baseStyle={{
                    color: colors.text.primary,
                  }}
                  tagsStyles={{
                    body: { marginBottom: 4 },
                    div: { marginBottom: 10 },
                    p: {
                      fontSize: 14,
                      lineHeight: 22,
                      color: colors.text.secondary,
                      marginTop: 0,
                      marginBottom: 12,
                    },
                    ul: {
                      marginTop: 4,
                      marginBottom: 12,
                      paddingLeft: 20,
                    },
                    ol: {
                      marginTop: 4,
                      marginBottom: 12,
                      paddingLeft: 20,
                    },
                    li: {
                      marginBottom: 8,
                      lineHeight: 22,
                    },
                    h1: {
                      fontSize: 22,
                      fontWeight: '700',
                      marginTop: 8,
                      marginBottom: 10,
                      color: colors.text.primary,
                    },
                    h2: {
                      fontSize: 18,
                      fontWeight: '600',
                      marginTop: 8,
                      marginBottom: 8,
                      color: colors.text.primary,
                    },
                    h3: {
                      fontSize: 16,
                      fontWeight: '600',
                      marginTop: 12,
                      marginBottom: 6,
                      color: colors.text.primary,
                    },
                    h4: {
                      fontSize: 15,
                      fontWeight: '600',
                      marginTop: 10,
                      marginBottom: 4,
                      color: colors.text.primary,
                    },
                    strong: { fontWeight: 'bold' },
                    hr: {
                      height: 1,
                      marginVertical: 14,
                      backgroundColor: colors.border.primary,
                    },
                    dl: { marginBottom: 12 },
                    dt: {
                      fontWeight: '600',
                      marginTop: 12,
                      marginBottom: 4,
                      color: colors.text.primary,
                    },
                    dd: {
                      marginBottom: 10,
                      marginLeft: 8,
                      color: colors.text.secondary,
                      lineHeight: 22,
                    },
                  }}
                />
              </View>
            </View>}

          {/* Community Section */}
          <View style={styles.communitySection}>
            <View
              style={[
                styles.communityCard,
                {
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.primary,
                },
              ]}
            >
              <View style={styles.communityHeader}>
                <Text style={styles.communityEmoji}>🎉</Text>
                <Text
                  style={[
                    styles.communityTitle,
                    { color: colors.text.primary, flexShrink: 1 },
                  ]}
                >
                  {t('projectDetail.joinCommunity')}
                </Text>
              </View>
              <Text
                style={[styles.communityText, { color: colors.text.secondary }]}
              >
                {t('projectDetail.communitySupport', {
                  count: Number(project.investors),
                })}
              </Text>

              <View style={styles.communityStats}>
                <View style={styles.communityStat}>
                  <Text
                    style={[
                      styles.communityStatValue,
                      { color: colors.primary },
                    ]}
                  >
                    {project.investors}+
                  </Text>
                  <Text
                    style={[
                      styles.communityStatLabel,
                      { color: colors.text.tertiary },
                    ]}
                  >
                    {t('projectDetail.smartInvestors')}
                  </Text>
                </View>
                {/* <View style={styles.communityStat}>
                  <Text style={[styles.communityStatValue, { color: colors.primary }]}>{Math.round(fundingPercentage)}%</Text>
                  <Text style={[styles.communityStatLabel, { color: colors.text.secondary }]}>{t('projectDetail.funded')}</Text>
                </View> */}
              </View>
            </View>
          </View>
        </View>
      </Animated.ScrollView>
      {loading && (
        <View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: colors.background.secondary,
              zIndex: 1000,
            },
          ]}
        >
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {/* Sticky Bottom Investment Button */}
      {/* <View
        style={[
          styles.stickyBottomContainer,
          {
            backgroundColor: colors.background.primary,
            borderTopColor: colors.border.primary,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.stickyInvestButton,
            { backgroundColor: colors.primary },
          ]}
          onPress={handleInvestNow}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={styles.stickyButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <DollarSign size={20} color={colors.text.inverse} />
            <Text
              style={[styles.stickyButtonText, { color: colors.text.inverse }]}
            >
              {t('dashboard.investNow')} •{' '}
              {formatCurrency(
                Number(project.minimum_investment),
                project.main_currency
              )}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View> */}
      <View
        style={[
          styles.stickyBottomContainer,
          {
            backgroundColor: colors.background.primary,
            borderTopColor: colors.border.primary,
            paddingBottom: insets.bottom,
          },
        ]}
      >
      </View>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1
    },
    scrollView: {
      flex: 1,
    },

    // Loading & Error States
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.xl,
    },
    loadingCard: {
      borderRadius: BorderRadius.xl,
      padding: Spacing['4xl'],
      alignItems: 'center',
      ...Shadows.lg,
    },
    loadingText: {
      fontSize: Typography.fontSize.xl,
      fontFamily: Typography.fontFamily.bold,
      marginTop: Spacing.lg,
      marginBottom: Spacing.sm,
    },
    loadingSubtext: {
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.regular,
      textAlign: 'center',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.xl,
    },
    errorCard: {
      borderRadius: BorderRadius.xl,
      padding: Spacing['4xl'],
      alignItems: 'center',
      ...Shadows.lg,
    },
    errorEmoji: {
      fontSize: 48,
      marginBottom: Spacing.lg,
    },
    errorText: {
      fontSize: Typography.fontSize.xl,
      fontFamily: Typography.fontFamily.bold,
      marginBottom: Spacing.sm,
      textAlign: 'center',
    },
    errorSubtext: {
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.regular,
      textAlign: 'center',
      marginBottom: Spacing.xl,
    },
    backButton: {
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.md,
      ...Shadows.button,
    },
    backButtonText: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.semiBold,
    },

    // Animated Header
    animatedHeader: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing.md,
      borderBottomWidth: 1,
      ...Shadows.sm,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 44,
    },
    headerBackButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      //   marginRight: Spacing.md,
    },
    headerTitleWrapper: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.sm,
      minWidth: 0,
    },
    headerTitleBadge: {
      width: '100%',
      maxWidth: '100%',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      borderLeftWidth: 3,
    },
    headerTitle: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.semiBold,
      textAlign: 'center',
      letterSpacing: -0.2,
      lineHeight: Typography.fontSize.lg * 1.2,
      marginLeft: Spacing.md,
    },
    headerActionButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: Spacing.md,
    },

    // Hero Section
    heroContainer: {
      position: 'relative',
      height: HEADER_HEIGHT,
      overflow: 'hidden',
    },
    heroImageContainer: {
      width: '100%',
      height: HEADER_HEIGHT + 100, // Extra height for parallax
    },
    heroImage: {
      width: '100%',
      height: '100%',
    },
    heroGradientTop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 160,
    },
    heroGradient: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 140,
    },
    floatingBackButton: {
      position: 'absolute',
      top: 50,
      left: Spacing.xl,
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    floatingShareButton: {
      position: 'absolute',
      top: 50,
      right: 70,
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    floatingFavoriteButton: {
      position: 'absolute',
      top: 50,
      right: Spacing.xl,
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statusBadge: {
      position: 'absolute',
      top: 110,
      left: Spacing.xl,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      backgroundColor: 'rgba(0,0,0,0.65)',
      borderLeftWidth: 3,
    },
    statusEmoji: {
      fontSize: 14,
      marginRight: 5,
    },
    statusText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.semiBold,
      letterSpacing: -0.1,
      color: '#F2F2F2',
    },
    returnBadge: {
      position: 'absolute',
      top: 110,
      right: Spacing.xl,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.full,
      alignItems: 'center',
      ...Shadows.md,
    },
    returnText: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.bold,
      color: '#FFFFFF',
      letterSpacing: -0.2,
    },
    returnLabel: {
      fontSize: Typography.fontSize.xs,
      fontFamily: Typography.fontFamily.medium,
      color: 'rgba(255, 255, 255, 0.8)',
    },
    heroContent: {
      position: 'absolute',
      bottom: Spacing.xl,
      left: Spacing.xl,
      right: Spacing.xl,
    },
    heroTitleBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      backgroundColor: 'rgba(0,0,0,0.65)',
      borderLeftWidth: 3,
      maxWidth: '100%',
      marginBottom: Spacing.sm,
    },
    heroTitle: {
      fontSize: Typography.fontSize['2xl'],
      fontFamily: Typography.fontFamily.bold,
      color: '#5b5959ff',
      letterSpacing: -0.5,
      lineHeight: 28,
      textShadowColor: 'rgba(0, 0, 0, 0.25)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    heroLocation: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    heroLocationText: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.medium,
      color: 'rgba(255, 255, 255, 0.9)',
      marginLeft: Spacing.xs,
      letterSpacing: -0.1,
    },

    // Main Content Card
    contentCard: {
      borderTopLeftRadius: BorderRadius['3xl'],
      borderTopRightRadius: BorderRadius['3xl'],
      marginTop: -Spacing.xl,
      paddingTop: Spacing.xl,
      minHeight: height - HEADER_HEIGHT + Spacing.xl,
      // ...Shadows.xl,
    },

    // Invest Button Section
    investButtonSection: {
      paddingHorizontal: Spacing.xl,
      marginBottom: Spacing['3xl'],
    },
    investButtonGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 15,
      borderRadius: 12,
      gap: Spacing.sm,
    },
    investButtonText: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.semiBold,
      letterSpacing: 0.2,
    },
    minInvestmentText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      textAlign: 'center',
      marginTop: Spacing.md,
    },

    // Metrics Section
    metricsSection: {
      paddingHorizontal: Spacing.xl,
      marginBottom: Spacing['3xl'],
    },
    metricsRow: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    metricCard: {
      flex: 1,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      alignItems: 'center',
      borderWidth: 1,
      ...Shadows.sm,
    },
    metricIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.sm,
    },
    metricValue: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.bold,
      marginBottom: Spacing.xs,
      letterSpacing: -0.2,
    },
    metricLabel: {
      fontSize: Typography.fontSize.xs,
      fontFamily: Typography.fontFamily.medium,
      textAlign: 'center',
      letterSpacing: -0.1,
    },

    // Progress Section
    progressSection: {
      paddingHorizontal: Spacing.xl,
      marginBottom: Spacing['3xl'],
    },
    progressCard: {
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      borderWidth: 1,
      ...Shadows.md,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    progressTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    progressTitle: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.semiBold,
      marginLeft: Spacing.sm,
      letterSpacing: -0.2,
    },
    progressPercentage: {
      fontSize: Typography.fontSize.xl,
      fontFamily: Typography.fontFamily.bold,
      letterSpacing: -0.3,
    },
    progressTrack: {
      height: 8,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: Spacing.lg,
    },
    progressBar: {
      height: '100%',
      borderRadius: 4,
    },
    progressStats: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    progressStat: {
      alignItems: 'center',
    },
    progressStatValue: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.bold,
      marginBottom: Spacing.xs,
      letterSpacing: -0.2,
    },
    progressStatLabel: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
    },

    // Description Section
    descriptionSection: {
      paddingHorizontal: Spacing.xl,
      marginBottom: Spacing['3xl'],
    },
    descriptionCard: {
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      borderWidth: 1,
      ...Shadows.md,
    },
    descriptionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    descriptionTitle: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.semiBold,
      marginLeft: Spacing.sm,
      letterSpacing: -0.2,
    },
    descriptionText: {
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.regular,
      lineHeight: 24,
      marginBottom: Spacing.xl,
      letterSpacing: -0.1,
    },
    highlightsSection: {
      marginTop: Spacing.lg,
    },
    highlightsTitle: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.semiBold,
      marginBottom: Spacing.lg,
      letterSpacing: -0.2,
    },
    highlightsList: {
      gap: Spacing.md,
    },
    highlightItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    highlightText: {
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.regular,
      marginLeft: Spacing.sm,
      letterSpacing: -0.1,
    },

    // Timeline Section
    timelineSection: {
      paddingHorizontal: Spacing.xl,
      marginBottom: Spacing['3xl'],
    },
    timelineCard: {
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      borderWidth: 1,
      ...Shadows.md,
    },
    timelineHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.xl,
    },
    timelineTitle: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.semiBold,
      marginLeft: Spacing.sm,
      letterSpacing: -0.2,
    },
    timelineItems: {
      position: 'relative',
    },
    timelineItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.md,
    },
    timelineIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.lg,
      zIndex: 1,
    },
    timelineContent: {
      flex: 1,
    },
    timelineItemTitle: {
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.semiBold,
      marginBottom: Spacing.xs,
      letterSpacing: -0.1,
    },
    timelineItemDate: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
    },
    timelineLine: {
      position: 'absolute',
      left: 15,
      top: 44,
      bottom: 44,
      width: 2,
      zIndex: 0,
    },

    // Trust Section
    trustSection: {
      paddingHorizontal: Spacing.xl,
      marginBottom: Spacing['3xl'],
    },
    trustCard: {
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      borderWidth: 1,
      ...Shadows.md,
    },
    trustHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.xl,
    },
    trustTitle: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.semiBold,
      marginLeft: Spacing.sm,
      letterSpacing: -0.2,
    },
    trustGrid: {
      gap: Spacing.lg,
    },
    trustItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    trustIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
    },
    trustItemText: {
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.regular,
      flex: 1,
      letterSpacing: -0.1,
    },

    // Community Section
    communitySection: {
      paddingHorizontal: Spacing.xl,
      marginBottom: Spacing['3xl'],
    },
    communityCard: {
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      borderWidth: 1,
      ...Shadows.md,
    },
    communityHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    communityEmoji: {
      fontSize: 24,
      marginRight: Spacing.sm,
    },
    communityTitle: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.semiBold,
      letterSpacing: -0.2,
    },
    communityText: {
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.regular,
      lineHeight: 22,
      marginBottom: Spacing.xl,
      letterSpacing: -0.1,
    },
    communityStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    communityStat: {
      alignItems: 'center',
    },
    communityStatValue: {
      fontSize: Typography.fontSize.xl,
      fontFamily: Typography.fontFamily.bold,
      marginBottom: Spacing.xs,
      letterSpacing: -0.3,
    },
    communityStatLabel: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
    },

    // Sticky Bottom Button
    stickyBottomContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.lg,
      borderTopWidth: 1,
      ...Shadows.xl,
    },
    stickyInvestButton: {
      borderRadius: BorderRadius.xl,
      overflow: 'hidden',
      ...Shadows.button,
    },
    stickyButtonGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing.xl,
      gap: Spacing.sm,
    },
    stickyButtonText: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.bold,
      letterSpacing: -0.2,
    },
  });