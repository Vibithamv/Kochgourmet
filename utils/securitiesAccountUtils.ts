export interface SecuritiesAccountFields {
  securities_account_number: string;
  securities_bic_swift_code: string;
}

function readField(record: Record<string, unknown> | undefined, key: keyof SecuritiesAccountFields): string {
  const value = record?.[key];
  return typeof value === 'string' ? value : '';
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : undefined;
}

function userBankFromLevel(level: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!level) return undefined;
  return asRecord(level.user_bank) ?? asRecord(level.userBank);
}

export function readSecuritiesAccountFromUserResponse(data: unknown): SecuritiesAccountFields {
  const empty: SecuritiesAccountFields = {
    securities_account_number: '',
    securities_bic_swift_code: '',
  };

  if (!data || typeof data !== 'object') return empty;

  const root = data as Record<string, unknown>;
  const level1 = asRecord(root.data);
  const level2 = asRecord(level1?.data);

  const candidates = [
    userBankFromLevel(level1),
    userBankFromLevel(level2),
    userBankFromLevel(root),
    level2?.activeAccount && typeof level2.activeAccount === 'object'
      ? (level2.activeAccount as Record<string, unknown>)
      : undefined,
    level2?.active_account && typeof level2.active_account === 'object'
      ? (level2.active_account as Record<string, unknown>)
      : undefined,
    asRecord(level2?.user),
    level1,
    root,
  ].filter(Boolean) as Record<string, unknown>[];

  for (const record of candidates) {
    const securities_account_number = readField(record, 'securities_account_number');
    const securities_bic_swift_code = readField(record, 'securities_bic_swift_code');
    if (securities_account_number || securities_bic_swift_code) {
      return { securities_account_number, securities_bic_swift_code };
    }
  }

  return empty;
}
