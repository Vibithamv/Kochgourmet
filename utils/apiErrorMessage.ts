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
