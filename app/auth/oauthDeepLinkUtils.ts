/** Written when starting Google/Facebook browser auth; read in `/auth/callback` (and login) to pass `oauthUiProvider`. */
export const OAUTH_UI_PROVIDER_PENDING_KEY = 'oauthUiProviderPending';

/**
 * Parses OAuth redirect URLs (e.g. myapp://auth/callback?code=...).
 * Uses query string parsing so custom-scheme URLs behave consistently on iOS/Android.
 */
export type OAuthCallbackParse =
  | { kind: 'code'; code: string }
  | { kind: 'error'; error: string };

export function parseOAuthCallbackUrl(url: string): OAuthCallbackParse | null {
  if (!url || !url.includes('auth/callback')) return null;
  try {
    const qIndex = url.indexOf('?');
    const hIndex = url.indexOf('#');
    const queryString =
      qIndex >= 0 ? url.slice(qIndex + 1, hIndex >= 0 ? hIndex : undefined) : '';
    const params = new URLSearchParams(queryString);
    const error = params.get('error');
    if (error) return { kind: 'error', error };
    const code = params.get('code');
    if (code) return { kind: 'code', code };
  } catch {
    /* ignore */
  }
  return null;
}
