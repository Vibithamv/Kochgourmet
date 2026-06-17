export function formatInvestmentPrice(value: number, currency?: string): string {
  const cur = (currency ?? 'EUR').toUpperCase();
  const formatted = new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

  if (cur === 'EUR') return `${formatted} €`;
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: cur,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPaymentTypeLabel(type: string): string {
  if (!type) return '';
  const upper = type.toUpperCase();
  if (upper === 'BANK TRANSFER' || upper === 'CUSTOMIBAN') return 'Bank Transfer';
  if (upper === 'STRIPE') return 'Stripe';
  return type
    .toLowerCase()
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
