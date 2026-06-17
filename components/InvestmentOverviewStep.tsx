import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  INVESTMENT_CONTENT_PADDING,
  InvestmentScreenTitle,
  InvestmentSummaryRow,
  investmentRowLabelStyle,
  investmentRowValueStyle,
} from '@/components/InvestmentCommunityUI';
import {
  formatInvestmentPrice,
  formatPaymentTypeLabel,
} from '@/utils/investmentFormat';
import type { getColors } from '@/constants/theme';

type PaymentMethod = {
  id: string;
  type: string;
  providerType?: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  bic?: string;
};

type InvestmentOverviewStepProps = Readonly<{
  projectTitle: string;
  tokenAmount: number;
  tokenPrice: number;
  totalAmount: number;
  currency: string;
  paymentType: string;
  selectedPayment?: PaymentMethod;
  confirmSubscription: boolean;
  confirmText: string;
  onToggleConfirm: () => void;
  colors: ReturnType<typeof getColors>;
  floatingBottom: number;
}>;

function BankDetailRow({
  label,
  value,
  colors,
}: Readonly<{
  label: string;
  value: string;
  colors: ReturnType<typeof getColors>;
}>) {
  return (
    <View style={styles.bankRow}>
      <Text style={[investmentRowLabelStyle(), styles.bankLabel, { color: colors.text.primary }]}>
        {label}
      </Text>
      <Text
        selectable
        style={[investmentRowValueStyle(), { color: colors.text.primary, flex: 1 }]}
      >
        {value}
      </Text>
    </View>
  );
}

export default function InvestmentOverviewStep({
  projectTitle,
  tokenAmount,
  tokenPrice,
  totalAmount,
  currency,
  paymentType,
  selectedPayment,
  confirmSubscription,
  confirmText,
  onToggleConfirm,
  colors,
  floatingBottom,
}: InvestmentOverviewStepProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const showBankDetails =
    selectedPayment?.providerType === 'CUSTOMIBAN' &&
    Boolean(
      selectedPayment.bankName ||
        selectedPayment.accountName ||
        selectedPayment.accountNumber ||
        selectedPayment.bic,
    );

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingTop: Math.max(insets.top, 16) + 16,
        paddingHorizontal: INVESTMENT_CONTENT_PADDING,
        paddingBottom: floatingBottom + 120,
      }}
    >
      <InvestmentScreenTitle
        line1={t('investment.overviewOrderTitle')}
        line2={projectTitle}
        colors={colors}
      />

      <View style={styles.summaryBlock}>
        <InvestmentSummaryRow
          label={t('investment.tokenAmount')}
          value={String(tokenAmount)}
          colors={colors}
        />
        <InvestmentSummaryRow
          label={t('investment.pricePerToken')}
          value={formatInvestmentPrice(tokenPrice, currency)}
          colors={colors}
        />
        <InvestmentSummaryRow
          label={t('investment.paymentType')}
          value={formatPaymentTypeLabel(paymentType)}
          colors={colors}
        />
        <InvestmentSummaryRow
          label={t('investment.totalAmount')}
          value={formatInvestmentPrice(totalAmount, currency)}
          colors={colors}
          valueMedium
          divider={false}
        />
      </View>

      {showBankDetails && selectedPayment ? (
        <View style={styles.bankSection}>
          <Text style={[styles.bankTitle, { color: colors.text.primary }]}>
            {t('investment.bankTransferTitle')}
          </Text>
          <Text style={[styles.bankHint, { color: colors.text.primary }]}>
            {t('investment.bankTransferInstruction')}
          </Text>
          {selectedPayment.bankName ? (
            <BankDetailRow
              label={t('investment.bankNameLabel')}
              value={selectedPayment.bankName}
              colors={colors}
            />
          ) : null}
          {selectedPayment.accountName ? (
            <BankDetailRow
              label={t('investment.accountHolderLabel')}
              value={selectedPayment.accountName}
              colors={colors}
            />
          ) : null}
          {selectedPayment.accountNumber ? (
            <BankDetailRow
              label={t('investment.accountNumberLabel')}
              value={selectedPayment.accountNumber}
              colors={colors}
            />
          ) : null}
          {selectedPayment.bic ? (
            <BankDetailRow
              label={t('investment.bicLabel')}
              value={selectedPayment.bic}
              colors={colors}
            />
          ) : null}
        </View>
      ) : null}

      <TouchableOpacity
        style={styles.confirmRow}
        onPress={onToggleConfirm}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.checkbox,
            { borderColor: colors.primary },
            confirmSubscription && { backgroundColor: colors.primary },
          ]}
        >
          {confirmSubscription ? (
            <Check size={14} color={colors.text.inverse} />
          ) : null}
        </View>
        <Text style={[styles.confirmText, { color: colors.text.primary }]}>
          {confirmText}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  summaryBlock: {
    marginBottom: 28,
  },
  bankSection: {
    marginBottom: 28,
    gap: 12,
  },
  bankTitle: {
    fontFamily: 'Roboto-Medium',
    fontSize: 17,
    lineHeight: 23,
    letterSpacing: 0,
  },
  bankHint: {
    fontFamily: 'Roboto-Light',
    fontSize: 15,
    lineHeight: 23,
    letterSpacing: 0,
  },
  bankRow: {
    gap: 4,
  },
  bankLabel: {
    fontFamily: 'Roboto-Medium',
  },
  confirmRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  confirmText: {
    flex: 1,
    fontFamily: 'Roboto-Light',
    fontSize: 15,
    lineHeight: 23,
    letterSpacing: 0,
  },
});
