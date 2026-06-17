export function messageFromApiError(error: unknown, fallback: string): string {
  if (error && typeof error === 'object') {
    const e = error as Record<string, unknown>;
    const nested = e.error as Record<string, unknown> | undefined;
    if (nested && typeof nested.message === 'string') return nested.message;
    if (typeof e.message === 'string') return e.message;
  }
  if (typeof error === 'string') return error;
  return fallback;
}

const AUTH_ERROR_I18N_KEYS: Record<string, string> = {
  'User is not confirmed.': 'auth.errors.userNotConfirmed',
  'User already exists': 'auth.register.userAlreadyExists',
  'An account with this email already exists. Please try logging in instead.':
    'auth.register.userAlreadyExists',
};

export function getAuthErrorI18nKey(error: unknown): string | undefined {
  const raw = messageFromApiError(error, '');
  return AUTH_ERROR_I18N_KEYS[raw];
}

export function localizedAuthErrorMessage(
  error: unknown,
  t: (key: string) => string,
  fallbackKey: string,
): string {
  const raw = messageFromApiError(error, '');
  const i18nKey = AUTH_ERROR_I18N_KEYS[raw];
  if (i18nKey) return t(i18nKey);
  if (raw) return raw;
  return t(fallbackKey);
}
