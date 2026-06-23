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

export function readHydraErrorCode(record: Record<string, unknown>): number | undefined {
  const code = record['hydra:code'];
  if (typeof code === 'number') return code;
  if (typeof code === 'string' && code.trim()) {
    const parsed = Number(code);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

export function extractErrorRecord(error: unknown): Record<string, unknown> | undefined {
  if (!error || typeof error !== 'object') return undefined;

  const record = error as Record<string, unknown>;
  const nested = record.error;
  if (nested && typeof nested === 'object') {
    return nested as Record<string, unknown>;
  }
  return record;
}

export type HydraViolation = {
  propertyPath?: string;
  message?: string;
  code?: number | string;
};

export function extractHydraViolations(error: unknown): HydraViolation[] {
  const record = extractErrorRecord(error);
  if (!record || !Array.isArray(record.violations)) return [];

  return record.violations.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const violation = item as Record<string, unknown>;
    return [{
      propertyPath:
        typeof violation.propertyPath === 'string' ? violation.propertyPath : undefined,
      message: typeof violation.message === 'string' ? violation.message : undefined,
      code:
        typeof violation.code === 'number' || typeof violation.code === 'string'
          ? violation.code
          : undefined,
    }];
  });
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

/** Kochgourmet login: account exists but email not confirmed yet. */
export const ACCOUNT_NOT_ACTIVATED_HYDRA_CODE = 1748000002;

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

/** Login-specific mapping — never surface API hints about which credential failed. */
export function localizedLoginErrorMessage(
  error: unknown,
  status: number | undefined,
  t: (key: string) => string,
): string {
  if (status === 401) {
    return t('auth.errors.invalidEmailOrPassword');
  }

  if (status === 403) {
    const record = extractErrorRecord(error);
    const code = record ? readHydraErrorCode(record) : undefined;
    if (code === ACCOUNT_NOT_ACTIVATED_HYDRA_CODE) {
      return t('auth.errors.userNotConfirmed');
    }
  }

  const i18nKey = getAuthErrorI18nKey(error);
  if (i18nKey) return t(i18nKey);

  return t('auth.errors.loginFailed');
}
