import type { TFunction } from 'i18next';

const STATUS_I18N_KEYS: Record<string, string> = {
  nopayment: 'portfolio.transactionStatus.noPayment',
};

function normalizeStatusKey(status: string): string {
  return status.trim().toLowerCase().replace(/[\s_-]+/g, '');
}

function defaultStatusLabel(status: string): string {
  return status
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function formatTransactionStatusLabel(status: string, t: TFunction): string {
  if (!status.trim()) return '—';

  const normalized = normalizeStatusKey(status);
  const i18nKey = STATUS_I18N_KEYS[normalized];
  if (i18nKey) {
    return t(i18nKey);
  }

  return defaultStatusLabel(status);
}
