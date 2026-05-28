import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Building2, Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors, getTypography, Spacing, BorderRadius } from '@/constants/theme';

function decodeParam(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return '';
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

type BankNextStepsPayload = {
  providerType: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  bic: string;
};

function parseBankNextSteps(raw: string | string[] | undefined): BankNextStepsPayload | null {
  const decoded = decodeParam(raw);
  if (!decoded) return null;
  try {
    const o = JSON.parse(decoded) as Partial<BankNextStepsPayload>;
    if (o.providerType !== 'CUSTOMIBAN') return null;
    const has =
      (o.bankName && o.bankName.length > 0) ||
      (o.accountName && o.accountName.length > 0) ||
      (o.accountNumber && o.accountNumber.length > 0) ||
      (o.bic && o.bic.length > 0);
    if (!has) return null;
    return {
      providerType: o.providerType ?? '',
      bankName: o.bankName ?? '',
      accountName: o.accountName ?? '',
      accountNumber: o.accountNumber ?? '',
      bic: o.bic ?? '',
    };
  } catch {
    return null;
  }
}

export default function InvestmentSuccessScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    amount?: string;
    title?: string;
    bankDetails?: string;
    orderReference?: string;
  }>();
  const amountFormatted = decodeParam(params.amount);
  const projectTitle = decodeParam(params.title);
  const bankNext = useMemo(() => parseBankNextSteps(params.bankDetails), [params.bankDetails]);
  const orderReference = decodeParam(params.orderReference);
  const primaryBtnTextColor = colors.text.onPrimary;

  const summaryText = useMemo(() => {
    if (amountFormatted && projectTitle) {
      return t('investment.investmentSuccessSummary', {
        amount: amountFormatted,
        property: projectTitle,
      });
    }
    return t('investment.investmentSuccessGeneric');
  }, [amountFormatted, projectTitle, t]);

  const goPortfolio = () => {
    router.replace('/screens/portfolio');
  };

  const detailRows = useMemo(() => {
    if (!bankNext) return [];
    const rows: { label: string; value: string; rowKey: string }[] = [];
    if (bankNext.providerType) {
      rows.push({
        rowKey: 'providerType',
        label: t('investment.paymentProviderTypeLabel'),
        value: bankNext.providerType,
      });
    }
    if (bankNext.bankName) {
      rows.push({
        rowKey: 'bank',
        label: t('investment.bankNameLabel'),
        value: bankNext.bankName,
      });
    }
    if (bankNext.accountName) {
      rows.push({
        rowKey: 'accountName',
        label: t('investment.accountHolderLabel'),
        value: bankNext.accountName,
      });
    }
    if (bankNext.accountNumber) {
      rows.push({
        rowKey: 'iban',
        label: t('investment.accountNumberLabel'),
        value: bankNext.accountNumber,
      });
    }
    if (bankNext.bic) {
      rows.push({
        rowKey: 'bic',
        label: t('investment.bicLabel'),
        value: bankNext.bic,
      });
    }
    return rows;
  }, [bankNext, t]);

  const stylesMemo = useMemo(() => {
    const typo = getTypography(theme);
    /** Match `investment/[id].tsx` body copy (e.g. `investorValue`, `agreementText`). */
    const bodyLh = Math.round(typo.fontSize.base * typo.lineHeight.normal);

    return StyleSheet.create({
      container: { flex: 1 },
      header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.lg,
        borderBottomWidth: 1,
      },
      headerTitleWrap: {
        flex: 1,
        paddingHorizontal: 60,
        alignItems: 'center',
        justifyContent: 'center',
      },
      headerTitle: {
        fontSize: typo.fontSize.xl,
        fontFamily: typo.fontFamily.bold,
        letterSpacing: typo.letterSpacing.normal,
        textAlign: 'center',
      },
      scroll: { flex: 1 },
      scrollContent: {
        flexGrow: 1,
        paddingHorizontal: Spacing['2xl'],
        paddingTop: Spacing['2xl'],
        paddingBottom: Spacing['3xl'],
      },
      iconWrap: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: Spacing.lg,
      },
      body: {
        fontSize: typo.fontSize.base,
        fontFamily: typo.fontFamily.regular,
        textAlign: 'center',
        lineHeight: bodyLh,
        marginBottom: Spacing['2xl'],
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
      },
      nextStepsCard: {
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        padding: Spacing.xl,
        marginBottom: Spacing['2xl'],
      },
      nextStepsHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.sm,
      },
      nextStepsIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
      },
      nextStepsEyebrow: {
        fontSize: typo.fontSize.base,
        fontFamily: typo.fontFamily.semiBold,
        letterSpacing: typo.letterSpacing.normal,
      },
      nextStepsTitle: {
        fontSize: typo.fontSize.xl,
        fontFamily: typo.fontFamily.bold,
        letterSpacing: typo.letterSpacing.normal,
        marginBottom: Spacing.lg,
      },
      detailRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: Spacing.md,
        gap: Spacing.md,
      },
      detailLabel: {
        flex: 1,
        fontSize: typo.fontSize.base,
        fontFamily: typo.fontFamily.semiBold,
        letterSpacing: typo.letterSpacing.normal,
      },
      detailValue: {
        flex: 1,
        fontSize: typo.fontSize.base,
        fontFamily: typo.fontFamily.regular,
        textAlign: 'right',
      },
      referenceNote: {
        fontSize: typo.fontSize.base,
        fontFamily: typo.fontFamily.regular,
        lineHeight: bodyLh,
        marginTop: Spacing.md,
        textAlign: 'left',
      },
      cta: {
        paddingVertical: Spacing.lg,
        paddingHorizontal: Spacing['3xl'],
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        maxWidth: 400,
        width: '100%',
        alignSelf: 'center',
      },
      ctaText: {
        fontSize: typo.fontSize.lg,
        fontFamily: typo.fontFamily.semiBold,
      },
    });
  }, [theme]);

  return (
    <View style={[stylesMemo.container, { backgroundColor: colors.background.secondary }]}>
      <View
        style={[
          stylesMemo.header,
          {
            paddingTop: Math.max(insets.top, 44) + 16,
            backgroundColor: colors.background.primary,
            borderBottomColor: colors.border.primary,
          },
        ]}
      >
        <View style={stylesMemo.headerTitleWrap}>
          <Text style={[stylesMemo.headerTitle, { color: colors.text.primary }]}>
            {t('investment.investmentSuccessful')}
          </Text>
        </View>
      </View>

      <ScrollView
        style={stylesMemo.scroll}
        contentContainerStyle={stylesMemo.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[stylesMemo.iconWrap, { backgroundColor: `${colors.success}22` }]}>
          <Check size={40} color={colors.success} strokeWidth={2.5} />
        </View>
        <Text style={[stylesMemo.body, { color: colors.text.secondary }]}>{summaryText}</Text>

        {bankNext && detailRows.length > 0 ? (
          <View
            style={[
              stylesMemo.nextStepsCard,
              {
                backgroundColor: colors.background.card,
                borderColor: colors.border.primary,
              },
            ]}
          >
            <View style={stylesMemo.nextStepsHeaderRow}>
              <View
                style={[
                  stylesMemo.nextStepsIconCircle,
                  { backgroundColor: colors.background.tertiary },
                ]}
              >
                <Building2 size={22} color={colors.text.tertiary} />
              </View>
              <Text style={[stylesMemo.nextStepsEyebrow, { color: colors.text.tertiary }]}>
                {t('investment.bankNextStepsEyebrow')}
              </Text>
            </View>
            <Text style={[stylesMemo.nextStepsTitle, { color: colors.text.primary }]}>
              {t('investment.completeBankTransferTitle')}
            </Text>
            {detailRows.map((row) => (
              <View key={row.rowKey} style={stylesMemo.detailRow}>
                <Text style={[stylesMemo.detailLabel, { color: colors.text.tertiary }]}>
                  {row.label}
                </Text>
                <Text
                  style={[stylesMemo.detailValue, { color: colors.text.primary }]}
                  selectable
                >
                  {row.value}
                </Text>
              </View>
            ))}
            <Text
              style={[stylesMemo.referenceNote, { color: colors.text.tertiary }]}
              selectable
            >
              {orderReference
                ? t('investment.bankTransferReferenceNoteWithRef', {
                    reference: orderReference,
                  })
                : t('investment.bankTransferReferenceNote')}
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[stylesMemo.cta, { backgroundColor: colors.primary }]}
          onPress={goPortfolio}
          activeOpacity={0.85}
        >
          <Text style={[stylesMemo.ctaText, { color: primaryBtnTextColor }]}>
            {t('projectDetail.viewPortfolio')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
