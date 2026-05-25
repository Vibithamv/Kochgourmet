export type OfferingTokenMetrics = {
  annualIncome: number;
  monthlyIncome: number;
  projected5Year: number;
  ownershipPercent: number;
};

export function parseOfferingNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function computeOfferingTokenMetrics(
  tokens: number,
  annualIncomeBase: number,
  maxTokens: number
): OfferingTokenMetrics {
  const safeTokens = Math.max(0, tokens);
  const annualIncome =
    annualIncomeBase > 0 ? (annualIncomeBase * safeTokens) / 12 : 0;
  const monthlyIncome = annualIncome / 12;
  const projected5Year = annualIncome * 5;
  const ownershipPercent =
    maxTokens > 0 ? (safeTokens / maxTokens) * 100 : 0;

  return {
    annualIncome,
    monthlyIncome,
    projected5Year,
    ownershipPercent,
  };
}

/** Scale tick values: 0, 25%, 50%, 75%, 100% of max. */
export function offeringSliderScaleLabels(maxTokens: number): number[] {
  const max = Math.max(0, maxTokens);
  if (max <= 0) return [0];
  return [0, max * 0.25, max * 0.5, max * 0.75, max];
}

export function formatSliderScaleLabel(value: number): string {
  if (value >= 1000) {
    const thousands = value / 1000;
    return Number.isInteger(thousands)
      ? `${thousands}k`
      : `${thousands.toFixed(1)}k`;
  }
  return String(Math.round(value));
}

export function formatOwnershipPercent(percent: number): string {
  return `${percent.toFixed(4)}%`;
}

export function formatOfferingCurrency(
  amount: number,
  currencyCode: string,
  locale?: string
): string {
  const code = (currencyCode || 'EUR').trim().toUpperCase();
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${code} ${Math.round(amount).toLocaleString(locale)}`;
  }
}
