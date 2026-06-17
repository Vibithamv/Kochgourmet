import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  ScrollView,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { getColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { offeringDetails } from '@/hooks/offering_details';
import { useGlobalAlert } from '@/contexts/AlertContext';
import { useOfferingCheck } from '@/hooks/useOfferingCheck';
import { ProjectDetailShimmer, ProjectDetailCommunityBodyShimmer } from '@/components/Shimmer';
import ProjectDetailCommunityContent, {
  PROJECT_DETAIL_HERO_HEIGHT,
} from '@/components/ProjectDetailCommunityContent';
export { PROJECT_DETAIL_HERO_HEIGHT } from '@/components/ProjectDetailCommunityContent';
import OptimizedImage from '@/components/OptimizedImage';
import { parseOfferingNumber } from '@/utils/offeringTokenMetrics';
import {
  pickLocalizedHtmlField,
  projectDetailPageImage,
} from '@/utils/offeringLocalizedContent';

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
  minimum_investment: number;
  hardcap: number;
  price_per_token: number;
  annual_income_base: number;
  image_url: string;
  status: ProjectStatus;
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

function readOfferingTypeFromApi(data: unknown): string {
  if (data == null || typeof data !== 'object' || Array.isArray(data)) return '';
  const o = data as Record<string, unknown>;
  const v =
    o.type ?? o.offering_type ?? o.offeringType ?? o.access_type ?? o.accessType;
  return typeof v === 'string' ? v : '';
}

function getRemainingTime(fundingStartDate: string): string {
  const startDate = new Date(fundingStartDate);
  const now = new Date();
  const diffMs = startDate.getTime() - now.getTime();
  if (diffMs <= 0) return '00:00:00';
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
  return (match?.[1] ?? html).trim();
}

function sanitizeOfferingDescriptionHtml(raw: unknown): string {
  if (raw == null || typeof raw !== 'string') return '';
  if (!raw.trim()) return '';
  return extractOfferingBodyInnerHtml(raw);
}

function formatApiDate(dateString: string): string {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('T')[0].split('-');
  return `${day}-${month}-${year}`;
}

export interface OfferingDetailContentProps {
  readonly offeringId: string;
  readonly onClose: () => void;
  readonly showHeroImage?: boolean;
  readonly bodyOnlyLoading?: boolean;
  readonly heroImageUriOverride?: string;
  readonly floatingActionsBottom?: number;
  readonly onScrollOffsetChange?: (offsetY: number) => void;
}

function OfferingDetailScrollLoading({
  heroImageUri,
  onScrollOffsetChange,
}: {
  readonly heroImageUri: string;
  readonly onScrollOffsetChange?: (offsetY: number) => void;
}) {
  const { theme } = useTheme();
  const colors = getColors(theme);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    onScrollOffsetChange?.(event.nativeEvent.contentOffset.y);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background.primary }}
      showsVerticalScrollIndicator={false}
      onScroll={onScrollOffsetChange ? handleScroll : undefined}
      scrollEventThrottle={16}
    >
      <View
        style={{
          height: PROJECT_DETAIL_HERO_HEIGHT,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
          overflow: 'hidden',
        }}
      >
        <OptimizedImage
          source={{ uri: heroImageUri }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      </View>
      <ProjectDetailCommunityBodyShimmer />
    </ScrollView>
  );
}

export default function OfferingDetailContent({
  offeringId,
  onClose,
  showHeroImage = true,
  bodyOnlyLoading = false,
  heroImageUriOverride,
  floatingActionsBottom,
  onScrollOffsetChange,
}: OfferingDetailContentProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const [project, setProject] = useState<ExtendedProject | null>(null);
  const [selectedTokens, setSelectedTokens] = useState(1);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useGlobalAlert();
  const offeringApi = useMemo(() => offeringDetails(), []);
  const { performOfferingCheck } = useOfferingCheck();
  const performOfferingCheckRef = useRef(performOfferingCheck);
  const showAlertRef = useRef(showAlert);
  const tRef = useRef(t);

  useEffect(() => {
    performOfferingCheckRef.current = performOfferingCheck;
    showAlertRef.current = showAlert;
    tRef.current = t;
  }, [performOfferingCheck, showAlert, t]);

  useEffect(() => {
    let cancelled = false;

    const loadProject = async () => {
      setLoading(true);
      setProject(null);

      await performOfferingCheckRef.current();
      const data = await offeringApi.details(offeringId);

      if (cancelled) return;

      if (data.success && data.data) {
        const projectData: ExtendedProject = {
          id: data.data.data.id,
          title: data.data.data.asset_name,
          description: data.data.data.asset_description,
          minimum_investment: parseOfferingNumber(data.data.data.minimum_investment, 1),
          hardcap: parseOfferingNumber(
            data.data.data.hardcap ?? data.data.data.field_0,
            1,
          ),
          price_per_token: parseOfferingNumber(data.data.data.price_per_token, 0),
          annual_income_base: parseOfferingNumber(data.data.data.field_2, 0),
          image_url:
            (typeof data.data.data.detail_page_image === 'string'
              ? data.data.data.detail_page_image
              : '') ||
            (typeof data.data.data.heroImage === 'string'
              ? data.data.data.heroImage
              : ''),
          status: data.data.data.visibility_status,
          privatesale_content: data.data.data.privatesale_content,
          publicsale_content: data.data.data.publicsale_content,
          presale_content: data.data.data.presale_content,
          announcement_content: data.data.data.announcement_content,
          finished_content: data.data.data.finished_content,
          whitelisting_content: data.data.data.whitelisting_content,
          main_currency: data.data.data.main_currency,
          fundingStartDate: formatApiDate(data.data.data.funding_start_date),
          fundingEndDate: formatApiDate(data.data.data.funding_end_date),
          investors: data.data.data.investors,
          asset_symbol: data.data.data.asset_symbol,
        };
        readOfferingTypeFromApi(data.data.data);
        setProject(projectData);
        setSelectedTokens(Math.max(1, Math.round(projectData.minimum_investment)));
        setLoading(false);
        return;
      }

      setLoading(false);
      if (data.status === 401) {
        showAlertRef.current(tRef.current('profile.sessionExpired'), tRef.current('profile.loginAgain'));
        router.replace('/auth/login');
      } else {
        showAlertRef.current(tRef.current('common.error'), tRef.current('projectDetail.failedMsg'));
      }
    };

    void loadProject();

    return () => {
      cancelled = true;
    };
  }, [offeringApi, offeringId]);

  const handleInvestNow = () => {
    if (!project) return;
    if (
      project.status === 'public' ||
      project.status === 'presale' ||
      project.status === 'privatesale' ||
      project.status === 'presaleannouncement'
    ) {
      router.push(`/investment/${project.id}`);
    } else if (project.status === 'announcement') {
      showAlert(
        'Coming Soon',
        `This offering has been announced and will be open for investment with in ${getRemainingTime(project.fundingStartDate)}`,
      );
    } else if (project.status === 'finished') {
      showAlert(
        'Funding completed',
        'Funding for this offering has been completed. You can no longer invest in this offering.',
      );
    } else {
      showAlert(t('investment.notAvailable'), t('investment.investmentNotAvailable'));
    }
  };

  if (loading) {
    if (bodyOnlyLoading && showHeroImage && heroImageUriOverride) {
      return (
        <OfferingDetailScrollLoading
          heroImageUri={heroImageUriOverride}
          onScrollOffsetChange={onScrollOffsetChange}
        />
      );
    }
    return bodyOnlyLoading ? <ProjectDetailCommunityBodyShimmer /> : <ProjectDetailShimmer />;
  }

  if (!project) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background.primary }]}>
        <Text style={[styles.errorText, { color: colors.text.primary }]}>
          {t('projectDetail.projectNotFound')}
        </Text>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.primary }]}
          onPress={onClose}
        >
          <Text style={[styles.backButtonText, { color: colors.text.onPrimary }]}>
            {t('projectDetail.goBack')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const localizedLang = i18n.language;
  const heroImageUri =
    heroImageUriOverride ||
    projectDetailPageImage(project, localizedLang) ||
    project.image_url;

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

  const htmlParsing = sanitizeOfferingDescriptionHtml;

  const projectDescription = () => {
    switch (project.status) {
      case 'public':
        return htmlParsing(
          pickLocalizedHtmlField(project.publicsale_content, 'offering_description', localizedLang),
        );
      case 'presale':
        return htmlParsing(
          pickLocalizedHtmlField(project.presale_content, 'offering_description', localizedLang),
        );
      case 'whitelisting':
        return htmlParsing(
          pickLocalizedHtmlField(project.whitelisting_content, 'offering_description', localizedLang),
        );
      case 'privatesale':
        return htmlParsing(
          pickLocalizedHtmlField(project.privatesale_content, 'offering_description', localizedLang),
        );
      case 'announcement':
        return htmlParsing(
          pickLocalizedHtmlField(project.announcement_content, 'offering_description', localizedLang),
        );
      case 'finished':
        return htmlParsing(
          pickLocalizedHtmlField(project.finished_content, 'offering_description', localizedLang),
        );
      default:
        return sanitizeOfferingDescriptionHtml(project.description);
    }
  };

  const faq = () => {
    switch (project.status) {
      case 'public':
        return htmlParsing(
          pickLocalizedHtmlField(project.publicsale_content, 'faq', localizedLang),
        );
      case 'presale':
        return htmlParsing(pickLocalizedHtmlField(project.presale_content, 'faq', localizedLang));
      case 'whitelisting':
        return htmlParsing(
          pickLocalizedHtmlField(project.whitelisting_content, 'faq', localizedLang),
        );
      case 'privatesale':
        return htmlParsing(
          pickLocalizedHtmlField(project.privatesale_content, 'faq', localizedLang),
        );
      case 'announcement':
        return htmlParsing(
          pickLocalizedHtmlField(project.announcement_content, 'faq', localizedLang),
        );
      case 'finished':
        return htmlParsing(
          pickLocalizedHtmlField(project.finished_content, 'faq', localizedLang),
        );
      default:
        return sanitizeOfferingDescriptionHtml(project.description);
    }
  };

  const investDisabled =
    project.status === 'announcement' ||
    project.status === 'finished' ||
    project.status === 'whitelisting';

  return (
    <ProjectDetailCommunityContent
      project={project}
      heroImageUri={heroImageUri}
      selectedTokens={selectedTokens}
      onSelectedTokensChange={setSelectedTokens}
      descriptionHtml={projectDescription()}
      faqHtml={faq()}
      durationLabel={getDuration(project.fundingStartDate, project.fundingEndDate)}
      investLabel={t('projectDetail.buy')}
      investDisabled={investDisabled}
      onInvest={handleInvestNow}
      onClose={onClose}
      onShare={() => Share.share({ message: project.title })}
      showHeroImage={showHeroImage}
      floatingActionsBottom={floatingActionsBottom}
      onScrollOffsetChange={onScrollOffsetChange}
    />
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 9999,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
});
