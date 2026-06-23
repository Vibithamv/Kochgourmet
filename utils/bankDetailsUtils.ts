export interface BankDetailsFields {
  account_holder_name: string;
  bank_name: string;
  iban: string;
  bic: string;
  is_bank_payout: boolean;
}

function readString(record: Record<string, unknown> | undefined, ...keys: string[]): string {
  if (!record) return '';
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string') return value;
  }
  return '';
}

function readBoolean(record: Record<string, unknown> | undefined, ...keys: string[]): boolean {
  if (!record) return false;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'boolean') return value;
  }
  return false;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : undefined;
}

function userBankFromLevel(level: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!level) return undefined;
  return asRecord(level.user_bank) ?? asRecord(level.userBank);
}

function readFieldsFromRecord(record: Record<string, unknown>): BankDetailsFields {
  return {
    account_holder_name: readString(record, 'account_holder_name', 'accountHolderName'),
    bank_name: readString(record, 'bank_name', 'bankName'),
    iban: readString(record, 'iban', 'account_number', 'accountNumber'),
    bic: readString(record, 'bic', 'ibc', 'bic_swift_code', 'bicSwiftCode'),
    is_bank_payout: readBoolean(record, 'is_bank_payout', 'isBankPayout'),
  };
}

export function readBankDetailsFromUserResponse(data: unknown): BankDetailsFields {
  const empty: BankDetailsFields = {
    account_holder_name: '',
    bank_name: '',
    iban: '',
    bic: '',
    is_bank_payout: false,
  };

  if (!data || typeof data !== 'object') return empty;

  const root = data as Record<string, unknown>;
  const level1 = asRecord(root.data);
  const level2 = asRecord(level1?.data);

  const candidates = [
    userBankFromLevel(level1),
    userBankFromLevel(level2),
    userBankFromLevel(root),
    asRecord(level2?.activeAccount),
    asRecord(level2?.active_account),
    asRecord(level2?.user),
    level1,
    root,
  ].filter(Boolean) as Record<string, unknown>[];

  for (const record of candidates) {
    const fields = readFieldsFromRecord(record);
    if (fields.account_holder_name || fields.bank_name || fields.iban || fields.bic) {
      return fields;
    }
  }

  return empty;
}
