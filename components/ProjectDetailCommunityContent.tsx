import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Clock, Coins, Share2, Plus } from 'lucide-react-native';
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
  investors: string;
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
          />
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

        {project.hardcap >= project.minimum_investment ? (
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
                count: Math.round(project.minimum_investment),
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
                <Text style={styles.timelineEmoji}>🎉</Text>
              </View>
            </View>
          </View>
        ) : null}
      </View>
      </ScrollView>

      <View
        style={[styles.floatingActions, { bottom: floatingBottom }]}
        pointerEvents="box-none"
      >
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

        <TouchableOpacity
          style={[
            styles.closeButton,
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
  sheet: {
    borderTopLeftRadius: HERO_RADIUS,
    borderTopRightRadius: HERO_RADIUS,
    paddingHorizontal: CONTENT_PADDING,
    paddingTop: 24,
    gap: 20,
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
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: CONTENT_PADDING,
  },
  buyButton: {
    flex: 1,
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
    flex: 1,
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
  },
  moreInfoSection: {
    gap: 16,
  },
  moreInfoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 45,
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
    fontFamily: 'Roboto-Regular',
    fontSize: 17,
    lineHeight: 23,
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
    fontFamily: 'Roboto-Light',
    fontSize: 17,
    lineHeight: 23,
    letterSpacing: 0,
  },
  timelineDate: {
    fontFamily: 'Roboto-Regular',
    fontSize: 17,
    lineHeight: 23,
    letterSpacing: 0,
  },
  timelineEmoji: {
    fontSize: 22,
    marginLeft: 12,
  },
});
