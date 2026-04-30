import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Lock, Clock, Users, CircleCheck as CheckCircle, CircleAlert as AlertCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import OptimizedImage from './OptimizedImage';
import { projectDashboardImage } from '@/utils/offeringLocalizedContent';

type ProjectStatus = 'privatesale' | 'presale' | 'whitelisting' | 'announcement' | 'presaleannouncement' | 'public' | 'finished' | 'draft';

interface ExtendedProject {
  id: string;
  title: string;
  description: string;
  minimum_investment: number;
  /** Fallback when status-specific `dashboard_image` is missing (e.g. `detail_page_image`) */
  image_url: string;
  status: ProjectStatus;
  created_at: string;
  //tenant_id: string;
  announcement_date?: string;
  presale_start_date?: string;
  is_whitelisted?: boolean;
  asset_symbol?: string,
  decimals?: string,
  price_per_token?: string,
  main_currency: string,
  fundingStartDate: string,
  fundingEndDate: string;
  privatesale_content?: unknown;
  publicsale_content?: unknown;
  presale_content?: unknown;
  announcement_content?: unknown;
  finished_content?: unknown;
  whitelisting_content?: unknown;
}

interface ProjectCardProps {
  project: ExtendedProject;
  style?: any;
  showProgress?: boolean;
}

function ProjectCard({
  project,
  style,
  showProgress = true,
}: Readonly<ProjectCardProps>) {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const isDark = theme === 'dark' || theme === 'darkGreen';
  const startX = useRef(0);
  const startY = useRef(0);
  const isSwipe = useRef(false);

  const resolveI18nLocale = () => {
    if (i18n.language === 'de') return 'de-DE';
    if (i18n.language === 'es') return 'es-ES';
    return 'en-US';
  };

  const formatCurrency = (amount: number, currency: string) => {
    const symbols: Record<string, string> = {
      BTC: '₿',
      ETH: 'Ξ',
      USDT: '₮',
      BNB: '🟡',
    };

    const upper = currency.toUpperCase();
    const symbol = symbols[upper] || upper;
    const locale = resolveI18nLocale();
    // Crypto: show up to 8 decimals
    const isCrypto = ['BTC', 'ETH', 'USDT', 'BNB'].includes(upper);

    if (isCrypto) {
      return `${symbol}${Number.parseFloat(amount.toFixed(2))}`;
    }
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getDuration = (fundingStartDate: string, fundingEndDate: string) => {
    const startDate = new Date(fundingStartDate);
    const endDate = new Date(fundingEndDate);

    const diffMs = endDate.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 1) return t('time.today');
    if (diffDays === 1) return t('time.duration_day');
    if (diffDays < 30) return t('time.duration_days', { count: diffDays });

    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths === 1) return t('time.duration_month');
    return t('time.duration_months', { count: diffMonths });
  };

  const getStatusInfo = (status: ProjectStatus, project: ExtendedProject) => {
    switch (status) {
      case 'privatesale':
        return {
          label: t('projects.privateSale'),
          color: colors.status.privateSale,
          bgColor: 'rgba(167,139,250,0.15)',
          icon: <Lock size={14} color={colors.status.privateSale} />,
          buttonText: project.is_whitelisted ? t('dashboard.investNow') : t('dashboard.notEligible'),
          //  buttonDisabled: !project.is_whitelisted,
          buttonDisabled: false,
        };
      case 'presale':
        return {
          label: t('projects.preSale'),
          color: colors.status.preSale,
          bgColor: 'rgba(245,158,11,0.15)',
          icon: <Clock size={14} color={colors.status.preSale} />,
          buttonText: t('dashboard.investNow'),
          buttonDisabled: false,
        };
      case 'whitelisting':
        return {
          label: t('projects.whitelist'),
          color: colors.status.whitelist,
          bgColor: 'rgba(143,150,163,0.15)',
          icon: <Users size={14} color={colors.status.whitelist} />,
          buttonText: t('dashboard.registerForWhitelist'),
          buttonDisabled: false,
        };
      case 'public':
        return {
          label: t('projects.public'),
          color: colors.status.public,
          bgColor: 'rgba(152,209,71,0.15)',
          icon: <CheckCircle size={14} color={colors.status.public} />,
          buttonText: t('dashboard.investNow'),
          buttonDisabled: false,
        };
      case 'announcement':
        return {
          label: t('projects.announcement'),
          color: colors.status.announcement,
          bgColor: 'rgba(96,165,250,0.15)',
          icon: <AlertCircle size={14} color={colors.status.announcement} />,
          buttonText: `${t('dashboard.startsOn')} ${new Date(project.announcement_date!).toLocaleDateString()}`,
          buttonDisabled: false,
        };
      case 'presaleannouncement':
        return {
          label: t('projects.presaleAnnouncement'),
          color: colors.status.preSale,
          bgColor: 'rgba(245,158,11,0.15)',
          icon: <Clock size={14} color={colors.status.preSale} />,
          buttonText: t('dashboard.investNow'),
          buttonDisabled: false,
        };
      case 'finished':
        return {
          label: t('projects.finished'),
          color: colors.status.finished,
          bgColor: 'rgba(143,150,163,0.15)',
          icon: <CheckCircle size={14} color={colors.status.finished} />,
          buttonText: t('dashboard.investmentEnded'),
          buttonDisabled: false,
        };
      case 'draft':
        return {
          label: t('projects.draft'),
          color: colors.status.finished,
          bgColor: 'rgba(143,150,163,0.15)',
          icon: <CheckCircle size={14} color={colors.status.finished} />,
          buttonText: t('dashboard.draft'),
          buttonDisabled: false,
        };
      default:
        return {
          label: t('projects.unknown'),
          color: colors.text.secondary,
          bgColor: 'rgba(143,150,163,0.15)',
          icon: <AlertCircle size={14} color={colors.text.secondary} />,
          buttonText: t('projects.notAvailable'),
          buttonDisabled: false,
        };
    }
  };

  const statusInfo = getStatusInfo(project.status, project);
  const cardImageUri =
    projectDashboardImage(project, i18n.language) || project.image_url;
  const activeButtonTextColor = colors.text.onPrimary;
  const buttonTextColor = statusInfo.buttonDisabled ? colors.text.tertiary : activeButtonTextColor;

  const handlePress = () => {
    if (!isSwipe.current) {
      router.push(`/project/${project.id}`);
    }
  };

  const onTouchStart = (e: any) => {
    startX.current = e.nativeEvent.pageX;
    startY.current = e.nativeEvent.pageY;
    isSwipe.current = false;
  };

  const onTouchMove = (e: any) => {
    const diffX = Math.abs(e.nativeEvent.pageX - startX.current);
    const diffY = Math.abs(e.nativeEvent.pageY - startY.current);
    if (diffX > 10 || diffY > 10) {
      isSwipe.current = true;
    }
  };

  return (
    <View
      style={[styles.projectCard, style, {
        backgroundColor: colors.background.secondary, borderColor: colors.border.primary,
        borderWidth: 1,
      }]}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.98}
      >
        {/* Hero Image with Gradient Overlay */}
        <View style={styles.imageContainer}>
          {cardImageUri ?
            <OptimizedImage
              source={{ uri: cardImageUri }}
              style={styles.projectImage}
              resizeMode="cover"
            /> : <OptimizedImage
              source={{ uri: 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800' }}
              style={styles.projectImage}
              resizeMode="cover"
            />}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)']}
            style={styles.imageGradient}
          />

          {/* Floating Status Badge */}
          <View style={[styles.statusBadge, { borderLeftColor: statusInfo.color }]}>
            {statusInfo.icon}
            <Text style={[styles.statusText, { color: '#F2F2F2' }]}>
              {statusInfo.label}
            </Text>
          </View>

          {/* Return Badge */}
          {/* <View style={styles.returnBadge}>
          <Text style={styles.returnText}>
            {project.expected_return.toLocaleString(i18n.language === 'de' ? 'de-DE' : i18n.language === 'es' ? 'es-ES' : 'en-US', {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1
            })}%
          </Text>
          <Text style={styles.returnLabel}>p.a.</Text>
        </View> */}
        </View>

        {/* Content Section */}
        <View style={styles.cardContent}>
          <View style={styles.projectHeader}>
            <Text style={[styles.projectTitle, { color: colors.text.primary }]}>{project.title}</Text>
            {/* <View style={styles.locationRow}>
            <MapPin size={14} color="#8E8E93" />
            <Text style={styles.locationText}>{project.location}</Text>
          </View> */}
          </View>

          <Text style={[styles.projectDescription, { color: colors.text.secondary }]} numberOfLines={2}>
            {project.description}
          </Text>

          {/* Key Metrics */}
          {/* <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{formatCurrency(project.target_amount)}</Text>
            <Text style={styles.metricLabel}>{t('dashboard.totalValue')}</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metric}>
            <Text style={styles.metricValue}>
              {formatNumber(project.duration_months)}{t('time.monthsShort')}
            </Text>
            <Text style={styles.metricLabel}>{t('projects.duration')}</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{formatCurrency(project.minimum_investment)}</Text>
            <Text style={styles.metricLabel}>{t('dashboard.minInvestment')}</Text>
          </View>
        </View> */}

          <View style={styles.metricsRow}>
            <View style={styles.metric}>
              <Text style={[styles.metricValue, { color: colors.text.secondary }]}>{formatCurrency(Number(project?.price_per_token), project?.main_currency)}</Text>
              <Text style={[styles.metricLabel, { color: colors.text.tertiary }]}>{t('dashboard.pricePerToken')}</Text>
            </View>
            <View style={[styles.metricDivider, { backgroundColor: colors.border.primary }]} />
            <View style={styles.metric}>
              <Text style={[styles.metricValue, { color: colors.text.secondary }]}>{getDuration(project.fundingStartDate, project.fundingEndDate)}</Text>
              <Text style={[styles.metricLabel, { color: colors.text.tertiary }]}>{t('projects.duration')}</Text>
            </View>
            <View style={[styles.metricDivider, { backgroundColor: colors.border.primary }]} />
            <View style={styles.metric}>
              <Text style={[styles.metricValue, { color: colors.text.secondary }]}>{project.minimum_investment} {project.asset_symbol}</Text>
              <Text style={[styles.metricLabel, { color: colors.text.tertiary }]}>{t('dashboard.minInvestment')}</Text>
            </View>
          </View>


          {/* Action Button */}
          <TouchableOpacity
            style={[
              styles.investButton,
              { backgroundColor: statusInfo.buttonDisabled ? colors.border.primary : colors.primary },
            ]}
            onPress={handlePress}
            disabled={statusInfo.buttonDisabled}
          >
            <Text style={[styles.investButtonText, { color: buttonTextColor }]}>
              {t('projects.viewDetails')}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const MemoizedProjectCard = React.memo(ProjectCard);
MemoizedProjectCard.displayName = 'ProjectCard';

const styles = StyleSheet.create({
  projectCard: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.md,
  },
  imageContainer: {
    position: 'relative',
    height: 160,
  },
  projectImage: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  statusBadge: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderLeftWidth: 3,
  },
  statusText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    letterSpacing: -0.1,
    marginLeft: 5,
  },
  returnBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    ...Shadows.sm,
  },
  returnText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: '#10B981',
    letterSpacing: -0.2,
  },
  returnLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: '#6B7280',
    letterSpacing: -0.1,
  },
  cardContent: {
    padding: Spacing.xl,
  },
  projectHeader: {
    marginBottom: Spacing.md,
  },
  projectTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    letterSpacing: -0.3,
    marginBottom: Spacing.xs,
    lineHeight: 22,
    color: '#F2F2F2',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    marginLeft: Spacing.xs,
    letterSpacing: -0.1,
    color: '#6B7280', // Always use gray text for location
  },
  projectDescription: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: 20,
    marginBottom: Spacing.lg,
    letterSpacing: -0.1,
    color: '#8F96A3',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.xs,
  },
  metric: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  metricDivider: {
    width: 1,
    height: 20,
    marginHorizontal: Spacing.sm,
    backgroundColor: '#2A2F38',
  },
  metricValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    letterSpacing: -0.2,
    marginBottom: 2,
    textAlign: 'center',
    color: '#C8CDD6',
  },
  metricLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    letterSpacing: -0.1,
    textAlign: 'center',
    lineHeight: 12,
    color: '#636B78',
  },
  progressSection: {
    marginBottom: Spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  progressLabel: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.medium,
    letterSpacing: -0.1,
    color: '#374151', // Always use dark gray for progress label
  },
  progressPercentage: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semiBold,
    color: '#10B981',
    letterSpacing: -0.1,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB', // Always use light gray for track
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  raisedText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: '#10B981',
    letterSpacing: -0.1,
  },
  targetText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    letterSpacing: -0.1,
    color: '#6B7280', // Always use gray text for target
  },
  investButton: {
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  investButtonDisabled: {
    backgroundColor: '#2A2F38',
  },
  investButtonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.semiBold,
    color: '#0D1117',
  },
  investButtonTextDisabled: {
    color: '#636B78',
  },
});

export default MemoizedProjectCard;