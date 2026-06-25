import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Clock, Coins, Share2, Plus, Check, CircleCheck, Rocket, Calendar } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors } from '@/constants/theme';
import OptimizedImage from '@/components/OptimizedImage';
import OfferingTokenSlider from '@/components/OfferingTokenSlider';
import {
  OfferingDescriptionHtml,
  OfferingFaqHtml,
} from '@/components/OfferingApiHtml';
import {
  getOfferingVisibilityStatusEmoji,
  getOfferingVisibilityStatusLabel,
  type OfferingVisibilityStatus,
} from '@/utils/offeringVisibilityStatus';

const HERO_HEIGHT = 320;
const CONTENT_PADDING = 26;
const HERO_RADIUS = 24;

export const PROJECT_DETAIL_HERO_HEIGHT = HERO_HEIGHT;

export interface ProjectDetailCommunityProject {
  title: string;
  minimum_investment: number;
  hardcap: number;
  annual_income_base: number;
  asset_symbol: string;
  main_currency: string;
  fundingStartDate: string;
  fundingEndDate: string;
  fundingStartAt?: string;
  investors: string;
  status: OfferingVisibilityStatus;
}

export interface ProjectDetailCommunityContentProps {
  readonly project: ProjectDetailCommunityProject;
  readonly heroImageUri: string;
  readonly selectedTokens: number;
  readonly onSelectedTokensChange: (value: number) => void;
  readonly descriptionHtml: string;
  readonly faqHtml: string;
  readonly durationLabel: string;
  readonly investLabel: string;
  readonly investDisabled: boolean;
  readonly onInvest: () => void;
  readonly onClose: () => void;
  readonly onShare: () => void;
  readonly showHeroImage?: boolean;
  readonly floatingActionsBottom?: number;
  readonly onScrollOffsetChange?: (offsetY: number) => void;
  readonly showBuyButton?: boolean;
  readonly whitelistAction?: {
    readonly label: string;
    readonly loading: boolean;
    readonly onPress: () => void;
  } | null;
  readonly showWhitelistApprovedBanner?: boolean;
  readonly heroAssumeCached?: boolean;
}

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const [day, month, year] = dateStr.split('-');
  if (day && month && year) return `${day}.${month}.${year}`;
  return dateStr.replaceAll('-', '.');
}

function formatInvestorCount(count: string, locale: string): string {
  const num = Number.parseInt(count, 10);
  if (Number.isNaN(num)) return count;
  return new Intl.NumberFormat(locale === 'de' ? 'de-DE' : locale).format(num);
}

type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function parseFundingStartDate(value: string): Date | null {
  if (!value) return null;

  const isoDate = new Date(value);
  if (!Number.isNaN(isoDate.getTime())) {
    return isoDate;
  }

  const [day, month, year] = value.split('-');
  if (day && month && year) {
    const parsed = new Date(`${year}-${month}-${day}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
}

function getCountdownParts(targetIso: string): CountdownParts {
  const target = parseFundingStartDate(targetIso);
  if (!target) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const diffMs = target.getTime() - Date.now();
  if (diffMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

function formatFundingStartLabel(isoDate: string, locale: string): string {
  const date = parseFundingStartDate(isoDate);
  if (!date) return '';

  const localeTag = locale === 'de' ? 'de-DE' : locale === 'es' ? 'es-ES' : 'en-US';
  return new Intl.DateTimeFormat(localeTag, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

function padCountdownValue(value: number): string {
  return value.toString().padStart(2, '0');
}

function FundingCountdownBanner({
  fundingStartAt,
  variant,
}: {
  readonly fundingStartAt: string;
  readonly variant: 'announcement' | 'presaleannouncement';
}) {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const [countdown, setCountdown] = useState<CountdownParts>(() =>
    getCountdownParts(fundingStartAt),
  );

  useEffect(() => {
    setCountdown(getCountdownParts(fundingStartAt));
    const interval = setInterval(() => {
      setCountdown(getCountdownParts(fundingStartAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [fundingStartAt]);

  const timerBackgroundColor = '#FFF6EA';
  const timerTitleColor = '#141414';
  const timerTextColor = '#141414';
  const timerUnitColor = colors.text.tertiary;
  const timerCellBg = 'rgba(45, 70, 53, 0.08)';
  const startLabel = formatFundingStartLabel(fundingStartAt, i18n.language);
  const isAnnouncement = variant === 'announcement';

  const units: { key: keyof CountdownParts; label: string }[] = [
    { key: 'days', label: t('projectDetail.countdownDays') },
    { key: 'hours', label: t('projectDetail.countdownHours') },
    { key: 'minutes', label: t('projectDetail.countdownMinutes') },
    { key: 'seconds', label: t('projectDetail.countdownSeconds') },
  ];

  return (
    <View style={styles.presaleAnnouncementCard}>
      <View style={styles.presaleAnnouncementHeader}>
        <View
          style={[
            styles.presaleAnnouncementHeaderIcon,
            { backgroundColor: colors.background.secondary },
          ]}
        >
          {isAnnouncement ? (
            <Calendar size={18} color={colors.warning} strokeWidth={2} />
          ) : (
            <Rocket size={18} color={colors.warning} strokeWidth={2} />
          )}
        </View>
        <Text style={[styles.presaleAnnouncementHeaderLabel, { color: timerTitleColor }]}>
          {isAnnouncement
            ? t('projectDetail.upcomingProject')
            : t('projectDetail.launchingSoon')}
        </Text>
      </View>

      <View style={[styles.presaleAnnouncementTimer, { backgroundColor: timerBackgroundColor }]}>
        <Text style={[styles.presaleAnnouncementTimerHeading, { color: timerTitleColor }]}>
          {isAnnouncement
            ? t('projectDetail.fundingOpensIn')
            : t('projectDetail.publicFundingStartsIn')}
        </Text>

        <View style={styles.presaleAnnouncementCountdownRow}>
          {units.map(({ key, label }) => (
            <View key={key} style={styles.presaleAnnouncementCountdownCell}>
              <View style={[styles.presaleAnnouncementCountdownValueWrap, { backgroundColor: timerCellBg }]}>
                <Text style={[styles.presaleAnnouncementCountdownValue, { color: timerTextColor }]}>
                  {padCountdownValue(countdown[key])}
                </Text>
              </View>
              <Text style={[styles.presaleAnnouncementCountdownUnit, { color: timerUnitColor }]}>
                {label}
              </Text>
            </View>
          ))}
        </View>

        {startLabel ? (
          <>
            <View style={[styles.presaleAnnouncementDivider, { backgroundColor: timerCellBg }]} />
            <Text style={[styles.presaleAnnouncementStartLabel, { color: timerTextColor }]}>
              {t('projectDetail.fundingStartsAt', { date: startLabel })}
            </Text>
          </>
        ) : null}
      </View>

      {!isAnnouncement ? (
        <View
          style={[
            styles.presaleAnnouncementMessageBox,
            { backgroundColor: colors.background.secondary },
          ]}
        >
          <Text style={[styles.presaleAnnouncementMessage, { color: colors.text.secondary }]}>
            {t('projectDetail.presaleAnnouncementMessage')}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export default function ProjectDetailCommunityContent({
  project,
  heroImageUri,
  selectedTokens,
  onSelectedTokensChange,
  descriptionHtml,
  faqHtml,
  durationLabel,
  investLabel,
  investDisabled,
  onInvest,
  onClose,
  onShare,
  showHeroImage = true,
  floatingActionsBottom,
  onScrollOffsetChange,
  showBuyButton = true,
  whitelistAction = null,
  showWhitelistApprovedBanner = false,
  heroAssumeCached = false,
}: ProjectDetailCommunityContentProps) {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const insets = useSafeAreaInsets();
  const isDark = theme === 'dark' || theme === 'darkGreen';
  const [showMoreInfo, setShowMoreInfo] = useState(false);

  const buyTextColor = investDisabled
    ? colors.text.secondary
    : isDark
      ? '#0D1117'
      : '#FFFFFF';

  const investorCount = formatInvestorCount(project.investors, i18n.language);
  const statusLabel = getOfferingVisibilityStatusLabel(project.status, t);
  const statusEmoji = getOfferingVisibilityStatusEmoji(project.status);
  const isFinished = project.status === 'finished';
  const isPresaleAnnouncement = project.status === 'presaleannouncement';
  const isAnnouncement = project.status === 'announcement';
  const fundingStartAt = project.fundingStartAt ?? project.fundingStartDate;
  const displayedMinTokens = Math.max(
    Math.round(project.minimum_investment),
    Math.round(selectedTokens),
  );
  const floatingBottom =
    floatingActionsBottom ?? Math.max(insets.bottom, 12) + 16;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    onScrollOffsetChange?.(event.nativeEvent.contentOffset.y);
  };

  return (
    <View style={styles.fill}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={onScrollOffsetChange ? handleScroll : undefined}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingBottom: floatingBottom + 72,
        }}
      >
      {showHeroImage ? (
        <View style={styles.heroWrap}>
          <OptimizedImage
            source={{
              uri:
                heroImageUri ||
                'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800',
            }}
            style={styles.heroImage}
            resizeMode="cover"
            assumeCached={heroAssumeCached}
          />
          <View style={[styles.heroOverlayBadges, { top: Math.max(insets.top, 44) + 8 }]}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeEmoji}>{statusEmoji}</Text>
              <Text style={styles.heroBadgeText}>{statusLabel}</Text>
            </View>
            {project.asset_symbol ? (
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>{project.asset_symbol}</Text>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}

      <View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.background.primary,
            marginTop: showHeroImage ? -HERO_RADIUS : 0,
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.text.primary }]}>
          {project.title}
        </Text>

        {isAnnouncement ? (
          <FundingCountdownBanner fundingStartAt={fundingStartAt} variant="announcement" />
        ) : isPresaleAnnouncement ? (
          <FundingCountdownBanner fundingStartAt={fundingStartAt} variant="presaleannouncement" />
        ) : isFinished ? (
          <View style={styles.fundingCompleteCard}>
            <View style={styles.fundingCompleteTitleRow}>
              <View
                style={[
                  styles.fundingCompleteIconWrap,
                  { backgroundColor: colors.background.secondary },
                ]}
              >
                <CircleCheck size={18} color={colors.warning} strokeWidth={2} />
              </View>
              <Text style={[styles.fundingCompleteTitle, { color: colors.text.primary }]}>
                {t('projectDetail.fundingCompleteTitle')}
              </Text>
            </View>
            <Text style={[styles.fundingCompleteMessage, { color: colors.text.secondary }]}>
              {t('projectDetail.fundingCompleteMessage')}
            </Text>
          </View>
        ) : showWhitelistApprovedBanner ? (
          <View style={styles.whitelistApprovedCard}>
            <View style={styles.whitelistApprovedInner}>
              <View style={styles.whitelistApprovedTitleRow}>
                <View
                  style={[
                    styles.whitelistApprovedIconWrap,
                    { backgroundColor: colors.background.secondary },
                  ]}
                >
                  <Check size={18} color={colors.warning} strokeWidth={2.5} />
                </View>
                <Text style={[styles.whitelistApprovedTitle, { color: colors.text.primary }]}>
                  {t('projectDetail.whitelistApprovedTitle')}
                </Text>
              </View>
              <Text style={[styles.whitelistApprovedMessage, { color: colors.text.secondary }]}>
                {t('projectDetail.whitelistApprovedMessage')}
              </Text>
            </View>

            <View style={styles.whitelistApprovedFooter}>
              <View style={[styles.whitelistApprovedDot, { backgroundColor: colors.warning }]} />
              <Text style={[styles.whitelistApprovedFooterText, { color: colors.text.secondary }]}>
                {t('projectDetail.whitelistInvestmentSoon')}
              </Text>
            </View>
          </View>
        ) : whitelistAction ? (
          <TouchableOpacity
            style={[
              styles.whitelistButton,
              {
                backgroundColor: colors.primary,
                opacity: whitelistAction.loading ? 0.7 : 1,
              },
            ]}
            onPress={whitelistAction.onPress}
            disabled={whitelistAction.loading}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.whitelistButtonText,
                { color: isDark ? '#0D1117' : '#FFFFFF' },
              ]}
            >
              {whitelistAction.label}
            </Text>
          </TouchableOpacity>
        ) : null}

        {showBuyButton && !investDisabled && project.hardcap >= project.minimum_investment ? (
          <OfferingTokenSlider
            variant="community"
            tokenSymbol={project.asset_symbol}
            currency={project.main_currency}
            minTokens={project.minimum_investment}
            maxTokens={project.hardcap}
            annualIncomeBase={project.annual_income_base}
            value={selectedTokens}
            onChange={onSelectedTokensChange}
          />
        ) : null}

        <View
          style={[
            styles.communityBanner,
            { backgroundColor: colors.background.secondary },
          ]}
        >
          <Text style={[styles.communityBannerText, { color: colors.text.primary }]}>
            {i18n.language === 'es' ? '¡' : null}
            <Text style={[styles.communityBannerCount, { color: colors.text.primary }]}>
              {investorCount}
            </Text>
            {' '}
            {t('projectDetail.communityMembersJoinedSuffix')}
          </Text>
          <Text style={styles.communityBannerEmoji}>🎉</Text>
        </View>

        <View style={styles.metaPills}>
          <View
            style={[
              styles.metaPill,
              { backgroundColor: colors.background.secondary },
            ]}
          >
            <Clock size={14} color={colors.text.primary} />
            <Text style={[styles.metaPillText, { color: colors.text.primary }]}>
              {t('bonusScreen.runtime', { duration: durationLabel })}
            </Text>
          </View>
          <View
            style={[
              styles.metaPill,
              { backgroundColor: colors.background.secondary },
            ]}
          >
            <Coins size={14} color={colors.text.primary} />
            <Text style={[styles.metaPillText, { color: colors.text.primary }]}>
              {t('projectDetail.minTokens', {
                count: displayedMinTokens,
                symbol: project.asset_symbol,
              })}
            </Text>
          </View>
        </View>

        {descriptionHtml ? (
          <View style={styles.htmlSection}>
            <OfferingDescriptionHtml html={descriptionHtml} />
          </View>
        ) : null}

        {faqHtml ? (
          <View style={styles.moreInfoSection}>
            <TouchableOpacity
              style={[
                styles.moreInfoButton,
                {
                  backgroundColor: colors.background.primary,
                  borderColor: colors.border.primary,
                },
              ]}
              onPress={() => setShowMoreInfo((prev) => !prev)}
              activeOpacity={0.7}
            >
              <Plus size={16} color={colors.text.primary} />
              <Text style={[styles.moreInfoText, { color: colors.text.primary }]}>
                {t('projectDetail.moreInfo')}
              </Text>
            </TouchableOpacity>
            {showMoreInfo ? <OfferingFaqHtml html={faqHtml} /> : null}
          </View>
        ) : null}

        {project.fundingStartDate && project.fundingEndDate ? (
          <View style={styles.timelineSection}>
            <Text style={[styles.timelineTitle, { color: colors.text.primary }]}>
              {t('projectDetail.schedule')}
            </Text>

            <View style={styles.timelineList}>
              <View
                style={[
                  styles.timelineCard,
                  { backgroundColor: colors.background.secondary },
                ]}
              >
                <View style={styles.timelineCardText}>
                  <Text style={[styles.timelineLabel, { color: colors.text.primary }]}>
                    {t('projectDetail.projectLaunched')}
                  </Text>
                  <Text style={[styles.timelineDate, { color: colors.text.primary }]}>
                    {formatDisplayDate(project.fundingStartDate)}
                  </Text>
                </View>
                <Text style={styles.timelineEmoji}>😊</Text>
              </View>

              <View
                style={[
                  styles.timelineCard,
                  { backgroundColor: colors.background.secondary },
                ]}
              >
                <View style={styles.timelineCardText}>
                  <Text style={[styles.timelineLabel, { color: colors.text.primary }]}>
                    {t('projectDetail.expectedCompletion')}
                  </Text>
                  <Text style={[styles.timelineDate, { color: colors.text.primary }]}>
                    {formatDisplayDate(project.fundingEndDate)}
                  </Text>
                </View>
                <Text style={styles.timelineEmoji}>👏</Text>
              </View>
            </View>
          </View>
        ) : null}
      </View>
      </ScrollView>

      <View
        style={[
          styles.floatingActions,
          { bottom: floatingBottom },
          !showBuyButton && styles.floatingActionsCentered,
        ]}
        pointerEvents="box-none"
      >
        {showBuyButton ? (
          <View style={styles.actionButtonSlot}>
            <TouchableOpacity
              style={[
                styles.buyButton,
                {
                  backgroundColor: investDisabled
                    ? colors.interactive.disabled
                    : colors.primary,
                },
              ]}
              onPress={onInvest}
              disabled={investDisabled}
              activeOpacity={0.85}
            >
              <Text style={[styles.buyButtonText, { color: buyTextColor }]}>
                {investLabel}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={showBuyButton ? styles.actionButtonSlot : undefined}>
          <TouchableOpacity
            style={[
              styles.closeButton,
              showBuyButton ? styles.closeButtonFilled : styles.closeButtonCompact,
              {
                backgroundColor: colors.background.card,
                borderColor: colors.border.primary,
              },
            ]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={[styles.closeButtonText, { color: colors.text.primary }]}>
              {t('common.close')}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.shareButton,
            {
              backgroundColor: colors.background.card,
              borderColor: colors.border.primary,
            },
          ]}
          onPress={onShare}
          activeOpacity={0.8}
        >
          <Share2 size={16} color={colors.text.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  heroWrap: {
    height: HERO_HEIGHT,
    borderBottomLeftRadius: HERO_RADIUS,
    borderBottomRightRadius: HERO_RADIUS,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlayBadges: {
    position: 'absolute',
    left: 16,
    gap: 8,
    zIndex: 2,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    gap: 6,
  },
  heroBadgeEmoji: {
    fontSize: 14,
  },
  heroBadgeText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 13,
    color: '#F2F2F2',
    letterSpacing: 0,
  },
  sheet: {
    borderTopLeftRadius: HERO_RADIUS,
    borderTopRightRadius: HERO_RADIUS,
    paddingHorizontal: CONTENT_PADDING,
    paddingTop: 24,
    gap: 20,
  },
  whitelistButton: {
    height: 45,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  whitelistButtonText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: 0,
  },
  whitelistApprovedCard: {
    gap: 16,
  },
  whitelistApprovedIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whitelistApprovedInner: {
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  whitelistApprovedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  whitelistApprovedTitle: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 20,
    lineHeight: 26,
  },
  whitelistApprovedMessage: {
    fontFamily: 'Roboto-Light',
    fontSize: 15,
    lineHeight: 22,
  },
  whitelistApprovedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  whitelistApprovedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  whitelistApprovedFooterText: {
    fontFamily: 'Roboto-Light',
    fontSize: 14,
    lineHeight: 20,
  },
  fundingCompleteCard: {
    gap: 8,
    alignSelf: 'stretch',
  },
  fundingCompleteTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fundingCompleteIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fundingCompleteTitle: {
    flex: 1,
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 24,
    lineHeight: 32,
    textAlign: 'left',
  },
  fundingCompleteMessage: {
    fontFamily: 'Roboto-Light',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'left',
  },
  presaleAnnouncementCard: {
    gap: 16,
  },
  presaleAnnouncementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  presaleAnnouncementHeaderIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presaleAnnouncementHeaderLabel: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 22,
    lineHeight: 28,
  },
  presaleAnnouncementTimer: {
    borderRadius: 14,
    padding: 16,
    gap: 14,
  },
  presaleAnnouncementTimerHeading: {
    fontFamily: 'Roboto-Regular',
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.8,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  presaleAnnouncementCountdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  presaleAnnouncementCountdownCell: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  presaleAnnouncementCountdownValueWrap: {
    width: '100%',
    minHeight: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  presaleAnnouncementCountdownValue: {
    fontFamily: 'Roboto-Medium',
    fontSize: 24,
    lineHeight: 28,
  },
  presaleAnnouncementCountdownUnit: {
    fontFamily: 'Roboto-Light',
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  presaleAnnouncementDivider: {
    height: 1,
    width: '100%',
  },
  presaleAnnouncementStartLabel: {
    fontFamily: 'Roboto-Medium',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  presaleAnnouncementMessageBox: {
    borderRadius: 12,
    padding: 16,
  },
  presaleAnnouncementMessage: {
    fontFamily: 'Roboto-Light',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 35,
    lineHeight: 48,
    letterSpacing: 0,
  },
  floatingActions: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 8,
    paddingBottom: 20,
    paddingHorizontal: CONTENT_PADDING,
  },
  floatingActionsCentered: {
    justifyContent: 'center',
  },
  actionButtonSlot: {
    flex: 1,
    minWidth: 0,
  },
  buyButton: {
    width: '100%',
    height: 45,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  buyButtonText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: 0,
  },
  closeButton: {
    height: 45,
    borderRadius: 9999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  closeButtonFilled: {
    width: '100%',
  },
  closeButtonCompact: {
    paddingHorizontal: 50,
  },
  closeButtonText: {
    fontFamily: 'Roboto-Light',
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: 0,
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  communityBanner: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  communityBannerText: {
    flex: 1,
    fontFamily: 'Roboto-Light',
    fontSize: 17,
    lineHeight: 23,
    letterSpacing: 0,
  },
  communityBannerCount: {
    fontFamily: 'Roboto-Medium',
    fontSize: 17,
    lineHeight: 23,
    letterSpacing: 0,
  },
  communityBannerEmoji: {
    fontSize: 20,
  },
  metaPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  metaPillText: {
    fontFamily: 'Roboto-Light',
    fontSize: 15,
    lineHeight: 18,
    letterSpacing: 0,
  },
  htmlSection: {
    gap: 8,
    marginBottom: -8,
  },
  moreInfoSection: {
    gap: 16,
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  moreInfoButton: {
    width: '60%',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    height: 45,
    paddingHorizontal: 20,
    borderRadius: 9999,
    borderWidth: 1,
  },
  moreInfoText: {
    fontFamily: 'Roboto-Light',
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: 0,
  },
  timelineSection: {
    gap: 16,
    paddingBottom: 8,
  },
  timelineTitle: {
    fontFamily: 'Roboto-Medium',
    fontSize: 17,
    lineHeight: 26,
    letterSpacing: 0,
  },
  timelineList: {
    gap: 12,
  },
  timelineCard: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timelineCardText: {
    flex: 1,
    gap: 4,
  },
  timelineLabel: {
    fontFamily: 'Roboto-Regular',
    fontSize: 17,
    lineHeight: 26,
    letterSpacing: 0,
  },
  timelineDate: {
    fontFamily: 'Roboto-Light',
    fontSize: 17,
    lineHeight: 26,
    letterSpacing: 0,
  },
  timelineEmoji: {
    fontSize: 22,
    marginLeft: 12,
  },
});
