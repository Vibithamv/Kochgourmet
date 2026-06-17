import React from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PaymentProviderDropdown from '@/components/paymentProviderDropdown';
import {
  INVESTMENT_CONTENT_PADDING,
  InvestmentScreenTitle,
  InvestmentSummaryRow,
  InvestmentTokenStepper,
} from '@/components/InvestmentCommunityUI';
import { formatInvestmentPrice } from '@/utils/investmentFormat';
import type { getColors } from '@/constants/theme';

type PaymentMethod = {
  id: string;
  type: string;
  providerType?: string;
};

type InvestmentOrderStepProps = Readonly<{
  projectTitle: string;
  tokenAmount: number;
  minimumTokenCount: number;
  tokenPrice: number;
  totalAmount: number;
  currency: string;
  paymentMethods: PaymentMethod[];
  onPaymentChange: (type: string, id: string) => void;
  onDecrementTokens: () => void;
  onIncrementTokens: () => void;
  colors: ReturnType<typeof getColors>;
  floatingBottom: number;
}>;

export default function InvestmentOrderStep({
  projectTitle,
  tokenAmount,
  minimumTokenCount,
  tokenPrice,
  totalAmount,
  currency,
  paymentMethods,
  onPaymentChange,
  onDecrementTokens,
  onIncrementTokens,
  colors,
  floatingBottom,
}: InvestmentOrderStepProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  const topInset = Math.max(insets.top, 16);
  const bottomReserve = floatingBottom + 72;
  const contentMinHeight = windowHeight - topInset - bottomReserve;

  return (
    <ScrollView
      style={styles.fill}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.scrollContent,
        {
          minHeight: contentMinHeight,
          paddingTop: topInset,
          paddingBottom: bottomReserve,
        },
      ]}
    >
      <InvestmentScreenTitle
        line1={t('investment.orderTitle')}
        line2={projectTitle}
        colors={colors}
      />

      <View style={styles.summaryBlock}>
        <InvestmentSummaryRow
          label={t('investment.tokenAmount')}
          colors={colors}
          right={
            <InvestmentTokenStepper
              value={tokenAmount}
              minimum={minimumTokenCount}
              onDecrement={onDecrementTokens}
              onIncrement={onIncrementTokens}
              colors={colors}
            />
          }
        />
        <InvestmentSummaryRow
          label={t('investment.pricePerToken')}
          value={formatInvestmentPrice(tokenPrice, currency)}
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

      <View style={styles.paymentSection}>
        <Text style={[styles.paymentLabel, { color: colors.text.primary }]}>
          {t('investment.selectPaymentRequired')}
        </Text>
        <PaymentProviderDropdown
          payment={paymentMethods}
          onChange={onPaymentChange}
          variant="community"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: INVESTMENT_CONTENT_PADDING,
  },
  summaryBlock: {
    marginBottom: 28,
  },
  paymentSection: {
    gap: 10,
  },
  paymentLabel: {
    fontFamily: 'Roboto-Light',
    fontSize: 15,
    lineHeight: 23,
    letterSpacing: 0,
  },
});
