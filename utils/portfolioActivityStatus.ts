import type { PortfolioActivity } from '@/types';

const STATUS_SOURCE_KEYS = [
  'status',
  'transactionStatus',
  'transaction_status',
  'orderStatus',
  'order_status',
] as const;

export function pickActivityStatusFromRecord(
  source: Record<string, unknown>
): string {
  for (const key of STATUS_SOURCE_KEYS) {
    const value = source[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return '';
}

/** Status shown in lists and transaction detail (matches list row rules). */
export function resolvePortfolioActivityDisplayStatus(
  activity: PortfolioActivity
): string {
  const raw = activity.status?.trim();
  if (raw) return raw;

  const type = activity.transactionType.trim();
  if (type === 'Send' || type === 'Receive') {
    return 'completed';
  }

  return '';
}
