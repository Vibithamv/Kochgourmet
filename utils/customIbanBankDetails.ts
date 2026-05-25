export type CustomIbanBankDetails = {
  providerType: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  bic: string;
};

function tryString(value: unknown): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : '';
}

/** BIC/SWIFT from API field `payment_bank_nr` (and fallbacks). */
export function bicFromPaymentProvider(p: {
  payment_bank_nr?: unknown;
  payment_bic?: unknown;
  bic?: unknown;
  swift?: unknown;
}): string {
  return (
    tryString(p.payment_bank_nr) ||
    tryString(p.payment_bic) ||
    tryString(p.bic) ||
    tryString(p.swift) ||
    ''
  );
}

export function customIbanFromPaymentProvider(
  provider: Record<string, unknown>
): CustomIbanBankDetails | null {
  const providerType = tryString(provider.payment_provider_type ?? provider.paymentProviderType);
  if (providerType.toUpperCase() !== 'CUSTOMIBAN') {
    return null;
  }

  const status = tryString(provider.status);
  if (status.length > 0 && status.toUpperCase() !== 'ACTIVE') {
    return null;
  }

  const bankName = tryString(provider.payment_banking_name ?? provider.paymentBankingName);
  const accountName = tryString(provider.payment_account_name ?? provider.paymentAccountName);
  const accountNumber = tryString(provider.payment_account_nr ?? provider.paymentAccountNr);
  const bic = bicFromPaymentProvider(provider);

  if (!bankName && !accountName && !accountNumber && !bic) {
    return null;
  }

  return {
    providerType: 'CUSTOMIBAN',
    bankName,
    accountName,
    accountNumber,
    bic,
  };
}

export function findCustomIbanInPaymentProviderList(
  list: unknown
): CustomIbanBankDetails | null {
  if (!Array.isArray(list)) {
    return null;
  }
  for (const item of list) {
    if (item && typeof item === 'object') {
      const details = customIbanFromPaymentProvider(item as Record<string, unknown>);
      if (details) {
        return details;
      }
    }
  }
  return null;
}

export function isOrderedTransactionStatus(status: string): boolean {
  return status.trim().toLowerCase() === 'ordered';
}
