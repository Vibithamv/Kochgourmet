import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  type ListRenderItem,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors } from '@/constants/theme';
import OptimizedImage from '@/components/OptimizedImage';
import type { CardLayout } from '@/components/RecipeCard';
import OfferingExpandOverlay, {
  type BonusOfferingPreview,
} from '@/components/OfferingExpandOverlay';
import { projectDashboardImage } from '@/utils/offeringLocalizedContent';
import { listOfferings } from '@/hooks/listOfferings';
import { useGlobalAlert } from '@/contexts/AlertContext';
import { useOfferingCheck } from '@/hooks/useOfferingCheck';
import { useFocusEffect } from '@react-navigation/native';
import { BonusScreenShimmer } from '@/components/Shimmer';
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
const COMMUNITY_CARD_HEIGHT = 470;
const COMMUNITY_CARD_GAP = 16;
const COMMUNITY_SCREEN_PADDING = 26;

type CommunityBonusCardProps = Readonly<{
  project: ExtendedProject;
  hidden?: boolean;
  onPressWithLayout: (layout: CardLayout, preview: BonusOfferingPreview) => void;
}>;

function CommunityBonusCard({ project, hidden = false, onPressWithLayout }: CommunityBonusCardProps) {
  const { t, i18n } = useTranslation();
  const cardRef = useRef<View>(null);
  const cardImageUri =
    projectDashboardImage(project, i18n.language) || project.image_url;

  const resolveI18nLocale = () => {
    if (i18n.language === 'de') return 'de-DE';
    if (i18n.language === 'es') return 'es-ES';
    return 'en-US';
  };

  const formatPrice = (amount: number, currency: string) => {
    const upper = currency.toUpperCase();
    const locale = resolveI18nLocale();
    const isCrypto = ['BTC', 'ETH', 'USDT', 'BNB'].includes(upper);
    if (isCrypto) {
      const symbols: Record<string, string> = {
        BTC: '₿',
        ETH: 'Ξ',
        USDT: '₮',
        BNB: '🟡',
      };
      return `${symbols[upper] || upper}${Number.parseFloat(amount.toFixed(2))}`;
    }
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency || 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
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

  const durationLabel = getDuration(project.fundingStartDate, project.fundingEndDate);
  const priceLabel = formatPrice(
    project.minimum_investment,
    project.main_currency,
  );

  const handlePress = () => {
    cardRef.current?.measureInWindow((x, y, width, height) => {
      onPressWithLayout(
        { x, y, width, height },
        {
          id: project.id,
          title: project.title,
          imageUrl:
            cardImageUri ||
            'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800',
          durationLabel: t('bonusScreen.runtime', { duration: durationLabel }),
          priceLabel,
        },
      );
    });
  };

  return (
    <View ref={cardRef} collapsable={false} style={[hidden && styles.cardHidden]}>
    <TouchableOpacity
      style={styles.communityCard}
      onPress={handlePress}
      activeOpacity={0.92}
    >
      <OptimizedImage
        source={{
          uri:
            cardImageUri ||
            'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800',
        }}
        style={styles.communityCardImage}
        resizeMode="cover"
      />

      <Text style={styles.communityCardTitle} numberOfLines={2}>
        {project.title}
      </Text>

      <View style={styles.communityCardBadges}>
        <View style={styles.communityBadge}>
          <Text style={styles.communityBadgeText}>
            {t('bonusScreen.runtime', { duration: durationLabel })}
          </Text>
        </View>
        <View style={styles.communityBadge}>
          <Text style={styles.communityBadgeText}>{priceLabel}</Text>
        </View>
      </View>
    </TouchableOpacity>
    </View>
  );
}

const OfferingsScreen = React.memo(() => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const insets = useSafeAreaInsets();
  const listRef = React.useRef<FlatList>(null);

  const [projects, setProjects] = useState<ExtendedProject[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedOffering, setExpandedOffering] = useState<{
    offering: BonusOfferingPreview;
    layout: CardLayout;
  } | null>(null);

  const { showAlert } = useGlobalAlert();
  const offeringsApi = useMemo(() => listOfferings(), []);
  const { performOfferingCheck } = useOfferingCheck();
  const performOfferingCheckRef = useRef(performOfferingCheck);

  useEffect(() => {
    performOfferingCheckRef.current = performOfferingCheck;
  }, [performOfferingCheck]);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      await performOfferingCheckRef.current();
      const res = await offeringsApi.offerings();
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
    } finally {
      setLoading(false);
    }
  }, [offeringsApi, showAlert, t]);

  useFocusEffect(useCallback(() => { void loadProjects(); }, [loadProjects]));

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadProjects().finally(() => setRefreshing(false));
  }, [loadProjects]);

  const filteredProjects = useMemo(
    () => projects.filter((p) => p.title.toLowerCase().includes(searchQuery.toLowerCase())),
    [projects, searchQuery],
  );

  const renderProject: ListRenderItem<ExtendedProject> = useCallback(
    ({ item }) => (
      <CommunityBonusCard
        project={item}
        hidden={expandedOffering?.offering.id === item.id}
        onPressWithLayout={(layout, preview) =>
          setExpandedOffering({ offering: preview, layout })
        }
      />
    ),
    [expandedOffering?.offering.id],
  );

  const renderEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: colors.text.tertiary }]}>
        {t('common.noResultsFound')}
      </Text>
    </View>
  ), [t, colors]);

  const keyExtractor = useCallback((item: ExtendedProject) => item.id, []);

  const getItemLayout = useCallback(
    (_: ArrayLike<ExtendedProject> | null | undefined, index: number) => {
      const itemHeight = COMMUNITY_CARD_HEIGHT + COMMUNITY_CARD_GAP;
      return {
        length: itemHeight,
        offset: itemHeight * index,
        index,
      };
    },
    [],
  );

  const renderSeparator = useCallback(
    () => <View style={{ height: COMMUNITY_CARD_GAP }} />,
    [],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 44) + 16 }]}>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          {t('bonusScreen.title')}
        </Text>
        <Text style={[styles.subtitle, { color: colors.text.primary }]}>
          {t('bonusScreen.subtitle')}
        </Text>
      </View>

      <View style={styles.searchRow}>
        <View style={[styles.searchBar, { backgroundColor: colors.background.secondary }]}>
          <TextInput
            style={[styles.searchInput, { color: colors.text.primary }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('bonusScreen.searchPlaceholder')}
            placeholderTextColor={colors.text.tertiary}
          />
          <Search size={18} color={colors.text.primary} />
        </View>
      </View>

      {loading ? (
        <BonusScreenShimmer />
      ) : (
        <FlatList
          ref={listRef}
          data={filteredProjects}
          renderItem={renderProject}
          ItemSeparatorComponent={renderSeparator}
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

      {expandedOffering ? (
        <OfferingExpandOverlay
          offering={expandedOffering.offering}
          sourceLayout={expandedOffering.layout}
          onClose={() => setExpandedOffering(null)}
        />
      ) : null}
    </View>
  );
});

OfferingsScreen.displayName = 'OfferingsScreen';
export default OfferingsScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: COMMUNITY_SCREEN_PADDING,
    paddingBottom: 20,
    gap: 8,
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 42,
    lineHeight: 48,
    letterSpacing: 0,
  },
  subtitle: {
    fontFamily: 'Roboto-Light',
    fontSize: 17,
    lineHeight: 23,
    letterSpacing: 0,
  },
  searchRow: {
    paddingHorizontal: COMMUNITY_SCREEN_PADDING,
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    minHeight: 48,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Roboto-Light',
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: 0,
    paddingVertical: 0,
  },
  listContent: {
    paddingHorizontal: COMMUNITY_SCREEN_PADDING,
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
    fontSize: 15,
    fontFamily: 'Roboto-Light',
    textAlign: 'center',
  },
  cardHidden: {
    opacity: 0,
  },
  communityCard: {
    width: '100%',
    height: COMMUNITY_CARD_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  communityCardImage: {
    width: '100%',
    height: '100%',
  },
  communityCardTitle: {
    position: 'absolute',
    top: 18,
    left: 18,
    right: 18,
    color: '#FFFFFF',
    fontFamily: 'Roboto-Regular',
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: 0,
  },
  communityCardBadges: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  communityBadge: {
    backgroundColor: 'rgba(255, 249, 240, 0.92)',
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  communityBadgeText: {
    color: '#141414',
    fontFamily: 'Roboto-Light',
    fontSize: 15,
    lineHeight: 18,
    letterSpacing: 0,
  },
});
