import { getCurrentEnvironmentConfig } from './environment';

// Tenant headers, sourced from the active environment config so dev/stage/prod can diverge.
// `Api-Key` and `Invest-Key` are tenant identifiers, not authentication secrets — real auth is
// Bearer IDToken / x-refresh-token, attached per-call inside each hook.
const tenant = getCurrentEnvironmentConfig().tenant;

export const API_HEADER_CONFIG = {
  'Api-Key': tenant.apiKey,
  'Invest-Key': tenant.investKey,
  'X-Iframe-Page': tenant.iframePage,
  'Content-Type': 'application/json',
};
