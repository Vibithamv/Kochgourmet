import type { PortfolioActivity } from '@/types';

const AMOUNT_IN_CURRENCY_KEYS = [
  'amountInCurrency',
  'amount_in_currency',
  'amountInCurreny',
  'amount_in_curreny',
] as const;

function parseOptionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function pickActivityAmountInCurrencyFromRecord(
  source: Record<string, unknown>
): number | null {
  for (const key of AMOUNT_IN_CURRENCY_KEYS) {
    const parsed = parseOptionalNumber(source[key]);
    if (parsed != null) {
      return parsed;
    }
  }
  return null;
}

export function parseActivityAmount(value: unknown): number {
  const parsed = parseOptionalNumber(value);
  return parsed ?? 0;
}

/** Fiat line in lists / detail: use API `amountInCurrency`, else token `amount`. */
export function resolvePortfolioActivityFiatAmount(
  activity: PortfolioActivity
): number {
  if (activity.amountInCurrency != null && Number.isFinite(activity.amountInCurrency)) {
    return activity.amountInCurrency;
  }
  return activity.amount;
}
