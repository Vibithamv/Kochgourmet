function readHydraErrorMessage(record: Record<string, unknown>): string | undefined {
  const description = record['hydra:description'];
  if (typeof description === 'string' && description.trim()) {
    return description.trim();
  }

  const hydraTitle = record['hydra:title'];
  if (typeof hydraTitle === 'string' && hydraTitle.trim()) {
    return hydraTitle.trim();
  }

  const title = record.title;
  if (typeof title === 'string' && title.trim()) {
    return title.trim();
  }

  return undefined;
}

function readHydraErrorCode(record: Record<string, unknown>): number | undefined {
  const code = record['hydra:code'];
  if (typeof code === 'number') return code;
  if (typeof code === 'string' && code.trim()) {
    const parsed = Number(code);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function extractErrorRecord(error: unknown): Record<string, unknown> | undefined {
  if (!error || typeof error !== 'object') return undefined;

  const record = error as Record<string, unknown>;
  const nested = record.error;
  if (nested && typeof nested === 'object') {
    return nested as Record<string, unknown>;
  }
  return record;
}

export function messageFromApiError(error: unknown, fallback: string): string {
  const record = extractErrorRecord(error);
  if (record) {
    const hydraMessage = readHydraErrorMessage(record);
    if (hydraMessage) return hydraMessage;

    if (typeof record.message === 'string' && record.message.trim()) {
      return record.message.trim();
    }
  }

  if (typeof error === 'string') return error;
  return fallback;
}

const AUTH_ERROR_I18N_KEYS: Record<string, string> = {
  'User is not confirmed.': 'auth.errors.userNotConfirmed',
  'Email not confirmed': 'auth.errors.userNotConfirmed',
  'Account is not yet activated': 'auth.errors.userNotConfirmed',
  'User not found.': 'auth.errors.userNotFound',
  'Invalid or expired code.': 'auth.forgotPassword.invalidOrExpiredCode',
  'User already exists': 'auth.register.userAlreadyExists',
  'An account with this email already exists. Please try logging in instead.':
    'auth.register.userAlreadyExists',
};

const AUTH_ERROR_CODE_I18N_KEYS: Record<number, string> = {
  1748000002: 'auth.errors.userNotConfirmed',
};

export function getAuthErrorI18nKey(error: unknown): string | undefined {
  const record = extractErrorRecord(error);
  if (record) {
    const code = readHydraErrorCode(record);
    if (code !== undefined && AUTH_ERROR_CODE_I18N_KEYS[code]) {
      return AUTH_ERROR_CODE_I18N_KEYS[code];
    }
  }

  const raw = messageFromApiError(error, '');
  return AUTH_ERROR_I18N_KEYS[raw];
}

export function localizedAuthErrorMessage(
  error: unknown,
  t: (key: string) => string,
  fallbackKey: string,
): string {
  const i18nKey = getAuthErrorI18nKey(error);
  if (i18nKey) return t(i18nKey);

  const raw = messageFromApiError(error, '');
  if (raw) return raw;
  return t(fallbackKey);
}
