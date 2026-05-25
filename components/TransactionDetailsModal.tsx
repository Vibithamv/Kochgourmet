import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors, getTypography, Spacing, BorderRadius } from '@/constants/theme';
import type { PortfolioActivity } from '@/types';
import {
  isOrderedTransactionStatus,
  type CustomIbanBankDetails,
} from '@/utils/customIbanBankDetails';
import { ShimmerBlock, useShimmerAnim } from '@/components/Shimmer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type DetailRow = { key: string; label: string; value: string };

function formatActivityDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatStatusLabel(status: string): string {
  if (!status) return '—';
  const lower = status.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function buildBankRowsFromDetails(
  details: CustomIbanBankDetails,
  t: (key: string) => string
): DetailRow[] {
  const rows: DetailRow[] = [];
  if (details.providerType) {
    rows.push({
      key: 'provider',
      label: t('investment.paymentProviderTypeLabel'),
      value: details.providerType,
    });
  }
  if (details.bankName) {
    rows.push({
      key: 'bank',
      label: t('investment.bankNameLabel'),
      value: details.bankName,
    });
  }
  if (details.accountName) {
    rows.push({
      key: 'holder',
      label: t('investment.accountHolderLabel'),
      value: details.accountName,
    });
  }
  if (details.accountNumber) {
    rows.push({
      key: 'iban',
      label: t('investment.accountNumberLabel'),
      value: details.accountNumber,
    });
  }
  if (details.bic) {
    rows.push({
      key: 'bic',
      label: t('investment.bicLabel'),
      value: details.bic,
    });
  }
  return rows;
}

function buildBankRows(
  activity: PortfolioActivity,
  t: (key: string) => string
): DetailRow[] {
  const rows: DetailRow[] = [];
  if (activity.paymentProviderType) {
    rows.push({
      key: 'provider',
      label: t('investment.paymentProviderTypeLabel'),
      value: activity.paymentProviderType,
    });
  }
  if (activity.paymentBankingName) {
    rows.push({
      key: 'bank',
      label: t('investment.bankNameLabel'),
      value: activity.paymentBankingName,
    });
  }
  if (activity.paymentAccountName) {
    rows.push({
      key: 'holder',
      label: t('investment.accountHolderLabel'),
      value: activity.paymentAccountName,
    });
  }
  if (activity.paymentAccountNr) {
    rows.push({
      key: 'iban',
      label: t('investment.accountNumberLabel'),
      value: activity.paymentAccountNr,
    });
  }
  if (activity.paymentBic) {
    rows.push({
      key: 'bic',
      label: t('investment.bicLabel'),
      value: activity.paymentBic,
    });
  }
  return rows;
}

function shouldShowBankSection(activity: PortfolioActivity): boolean {
  const provider = (activity.paymentProviderType ?? '').toUpperCase();
  if (provider === 'CUSTOMIBAN') return true;
  return Boolean(
    activity.paymentBankingName ||
      activity.paymentAccountName ||
      activity.paymentAccountNr ||
      activity.paymentBic
  );
}

type TransactionDetailsModalProps = Readonly<{
  visible: boolean;
  activity: PortfolioActivity | null;
  formatCurrency: (amount: number, currencyCode: string) => string;
  bankDetails?: CustomIbanBankDetails | null;
  bankLoading?: boolean;
  onClose: () => void;
}>;

export default function TransactionDetailsModal({
  visible,
  activity,
  formatCurrency,
  bankDetails = null,
  bankLoading = false,
  onClose,
}: TransactionDetailsModalProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const typo = useMemo(() => getTypography(theme), [theme]);
  const shimmerAnim = useShimmerAnim();
  const insets = useSafeAreaInsets();
  const isOrdered = activity ? isOrderedTransactionStatus(activity.status) : false;
  const scrollBottomPadding = insets.bottom + Spacing['3xl'];

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: colors.background.overlay,
          justifyContent: 'flex-end',
        },
        sheet: {
          borderTopLeftRadius: BorderRadius.xl,
          borderTopRightRadius: BorderRadius.xl,
          maxHeight: '88%',
          paddingTop: Spacing.xl,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: Spacing.xl,
          paddingBottom: Spacing.lg,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.primary,
        },
        title: {
          flex: 1,
          fontSize: typo.fontSize.xl,
          fontFamily: typo.fontFamily.bold,
          letterSpacing: typo.letterSpacing.normal,
        },
        closeButton: {
          width: 32,
          height: 32,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background.secondary,
        },
        scroll: {
          paddingHorizontal: Spacing.xl,
          paddingTop: Spacing.lg,
        },
        detailBlock: {
          borderBottomWidth: 1,
          borderBottomColor: colors.border.primary,
          paddingBottom: Spacing.lg,
          marginBottom: Spacing.lg,
        },
        detailRow: {
          paddingVertical: Spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.primary,
        },
        detailRowLast: {
          paddingVertical: Spacing.md,
          borderBottomWidth: 0,
        },
        detailLabel: {
          fontSize: typo.fontSize.sm,
          fontFamily: typo.fontFamily.regular,
          marginBottom: Spacing.xs,
        },
        detailValue: {
          fontSize: typo.fontSize.lg,
          fontFamily: typo.fontFamily.semiBold,
          letterSpacing: typo.letterSpacing.normal,
        },
        bankSection: {
          marginTop: Spacing.xs,
        },
        bankTitle: {
          fontSize: typo.fontSize.lg,
          fontFamily: typo.fontFamily.bold,
          marginBottom: Spacing.sm,
        },
        bankHint: {
          fontSize: typo.fontSize.sm,
          fontFamily: typo.fontFamily.regular,
          lineHeight: Math.round(typo.fontSize.sm * typo.lineHeight.relaxed),
          marginBottom: Spacing.lg,
        },
        bankRow: {
          marginBottom: Spacing.lg,
        },
        bankLabel: {
          fontSize: typo.fontSize.sm,
          fontFamily: typo.fontFamily.regular,
          marginBottom: Spacing.xs,
        },
        bankValue: {
          fontSize: typo.fontSize.base,
          fontFamily: typo.fontFamily.regular,
        },
        bankShimmerRow: {
          marginBottom: Spacing.lg,
        },
        bankShimmerLabel: {
          height: 12,
          width: '45%',
          borderRadius: BorderRadius.xs,
          marginBottom: Spacing.xs,
        },
        bankShimmerValue: {
          height: 16,
          width: '70%',
          borderRadius: BorderRadius.xs,
        },
      }),
    [colors, typo]
  );

  const transactionRows = useMemo((): DetailRow[] => {
    if (!activity) return [];
    const symbol = activity.offering?.symbol ?? '';
    const tokenLabel = symbol
      ? `${activity.amount} ${symbol}`.trim()
      : String(activity.amount);
    const fiatCurrency = (activity.currency || activity.offering?.currency || 'EUR').trim();
    const offeringCode = symbol || activity.offeringName;

    return [
      {
        key: 'type',
        label: t('portfolio.transactionDetailType'),
        value: activity.transactionType,
      },
      {
        key: 'status',
        label: t('portfolio.transactionDetailStatus'),
        value: formatStatusLabel(activity.status),
      },
      {
        key: 'date',
        label: t('portfolio.transactionDetailDate'),
        value: formatActivityDate(activity.transactionDate),
      },
      {
        key: 'offering',
        label: t('portfolio.transactionDetailOffering'),
        value: offeringCode,
      },
      {
        key: 'tokenAmount',
        label: t('portfolio.transactionDetailTokenAmount'),
        value: tokenLabel,
      },
      {
        key: 'amount',
        label: t('portfolio.transactionDetailAmount'),
        value: formatCurrency(activity.amountInCurrency, fiatCurrency),
      },
      {
        key: 'numberOfTokens',
        label: t('portfolio.transactionDetailNumberOfTokens'),
        value: tokenLabel,
      },
    ];
  }, [activity, formatCurrency, t]);

  const bankRows = useMemo(() => {
    if (!activity) return [];
    if (isOrdered) {
      return bankDetails ? buildBankRowsFromDetails(bankDetails, t) : [];
    }
    return buildBankRows(activity, t);
  }, [activity, bankDetails, isOrdered, t]);

  const showBank = useMemo(() => {
    if (!activity) return false;
    if (isOrdered) {
      return bankLoading || bankRows.length > 0;
    }
    return shouldShowBankSection(activity) && bankRows.length > 0;
  }, [activity, bankLoading, bankRows.length, isOrdered]);

  if (!activity) {
    return null;
  }

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.background.primary }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text.primary }]}>
              {t('portfolio.transactionDetails')}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t('common.cancel')}
            >
              <X size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={{ paddingBottom: scrollBottomPadding }}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.detailBlock}>
              {transactionRows.map((row, index) => (
                <View
                  key={row.key}
                  style={
                    index === transactionRows.length - 1
                      ? styles.detailRowLast
                      : styles.detailRow
                  }
                >
                  <Text style={[styles.detailLabel, { color: colors.text.secondary }]}>
                    {row.label}
                  </Text>
                  <Text
                    style={[styles.detailValue, { color: colors.text.primary }]}
                    selectable
                  >
                    {row.value}
                  </Text>
                </View>
              ))}
            </View>

            {showBank ? (
              <View style={styles.bankSection}>
                <Text style={[styles.bankTitle, { color: colors.text.primary }]}>
                  {t('investment.bankTransferDetails')}
                </Text>
                <Text style={[styles.bankHint, { color: colors.text.secondary }]}>
                  {t('investment.bankTransferDetailsHint')}
                </Text>
                {bankLoading ? (
                  <>
                    {[0, 1, 2].map((i) => (
                      <View key={`bank-shimmer-${i}`} style={styles.bankShimmerRow}>
                        <ShimmerBlock
                          anim={shimmerAnim}
                          style={[
                            styles.bankShimmerLabel,
                            { backgroundColor: colors.background.secondary },
                          ]}
                        />
                        <ShimmerBlock
                          anim={shimmerAnim}
                          style={[
                            styles.bankShimmerValue,
                            { backgroundColor: colors.background.secondary },
                          ]}
                        />
                      </View>
                    ))}
                  </>
                ) : null}
                {!bankLoading
                  ? bankRows.map((row) => (
                  <View key={row.key} style={styles.bankRow}>
                    <Text style={[styles.bankLabel, { color: colors.text.secondary }]}>
                      {row.label}
                    </Text>
                    <Text
                      style={[styles.bankValue, { color: colors.text.primary }]}
                      selectable
                    >
                      {row.value}
                    </Text>
                  </View>
                    ))
                  : null}
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
