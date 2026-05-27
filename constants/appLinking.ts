/**
 * Deep-link URL scheme for this app only.
 * Must match `expo.scheme` in app.json and native intent filters.
 * Do not reuse generic template schemes (e.g. `myapp`) — other white-label
 * builds on the same device would trigger Android's "Open with" dialog.
 */
export const APP_LINK_SCHEME = 'com.assetra.stapp';

export const OAUTH_CALLBACK_PATH = 'auth/callback';

export const GOOGLE_OAUTH_REDIRECT_URI = `${APP_LINK_SCHEME}://${OAUTH_CALLBACK_PATH}`;
