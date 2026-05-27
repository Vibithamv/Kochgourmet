import AsyncStorage from '@react-native-async-storage/async-storage';

/** Persisted after `/validate-platform` succeeds (see `app/_layout.tsx`). */
export const PLATFORM_SIGN_IN_OPTIONS_STORAGE_KEY = 'platformSignInOptions';

export const PLATFORM_MAGIC_LINK_PUBLIC_KEY_STORAGE_KEY = 'platformMagicLinkPublicKey';
export const PLATFORM_MAGIC_EMBEDDED_WALLET_MODE_STORAGE_KEY =
  'platformMagicEmbeddedWalletMode';

export type PlatformSignInOptions = {
  google?: boolean;
  facebook?: boolean;
  linkedIn?: boolean;
  wallet?: boolean;
};

export type MagicEmbeddedWalletMode = string | null;

type ValidatePlatformPayload = {
  data: {
    data: {
      sign_in_options?: PlatformSignInOptions;
      magic_link_public_key?: string | null;
      magic_embedded_wallet_mode?: string | null;
    };
  };
};

const DISABLED_MODES = new Set(['disabled', 'off', 'false', 'none']);

/** `null` from API or storage → embedded wallet hidden everywhere. */
export function normalizeMagicEmbeddedWalletMode(
  mode: MagicEmbeddedWalletMode | undefined
): 'manual' | 'automatic' | null {
  if (mode == null) return null;
  const normalized = mode.trim().toLowerCase();
  if (!normalized || DISABLED_MODES.has(normalized)) return null;
  if (normalized === 'manual') return 'manual';
  if (normalized === 'automatic') return 'automatic';
  return null;
}

export function isMagicEmbeddedWalletManualMode(
  mode: MagicEmbeddedWalletMode | null | undefined
): boolean {
  return normalizeMagicEmbeddedWalletMode(mode) === 'manual';
}

export function isMagicEmbeddedWalletAutomaticMode(
  mode: MagicEmbeddedWalletMode | null | undefined
): boolean {
  return normalizeMagicEmbeddedWalletMode(mode) === 'automatic';
}

/** Embedded wallet exists for this tenant (manual add or automatic gate). Requires public key. */
export function isMagicEmbeddedWalletFeatureEnabled(
  mode: MagicEmbeddedWalletMode | null | undefined,
  publicKey: string | null | undefined
): boolean {
  const normalized = normalizeMagicEmbeddedWalletMode(mode);
  return Boolean(
    publicKey?.trim() && (normalized === 'manual' || normalized === 'automatic')
  );
}

/** Show "add embedded wallet" alongside MetaMask in wallets / whitelist pickers (manual or automatic). */
export function isMagicEmbeddedWalletAddEnabled(
  mode: MagicEmbeddedWalletMode | null | undefined,
  publicKey?: string | null
): boolean {
  return isMagicEmbeddedWalletFeatureEnabled(mode, publicKey);
}

/** Same nesting as `persistOfferingAndTenantFromPlatform` (`result.data` from validate). */
export async function persistPlatformSignInOptionsFromValidateResponse(
  data: ValidatePlatformPayload
): Promise<void> {
  const opts = data.data?.data?.sign_in_options;
  if (opts && typeof opts === 'object') {
    await AsyncStorage.setItem(
      PLATFORM_SIGN_IN_OPTIONS_STORAGE_KEY,
      JSON.stringify(opts)
    );
  }
}

export async function persistPlatformMagicFromValidateResponse(
  data: ValidatePlatformPayload
): Promise<void> {
  const publicKey = data.data?.data?.magic_link_public_key;
  if (typeof publicKey === 'string' && publicKey.trim().length > 0) {
    await AsyncStorage.setItem(
      PLATFORM_MAGIC_LINK_PUBLIC_KEY_STORAGE_KEY,
      publicKey.trim()
    );
  } else {
    await AsyncStorage.removeItem(PLATFORM_MAGIC_LINK_PUBLIC_KEY_STORAGE_KEY);
  }

  const mode = data.data?.data?.magic_embedded_wallet_mode;
  if (typeof mode === 'string' && mode.trim().length > 0) {
    await AsyncStorage.setItem(
      PLATFORM_MAGIC_EMBEDDED_WALLET_MODE_STORAGE_KEY,
      mode.trim()
    );
  } else {
    await AsyncStorage.removeItem(PLATFORM_MAGIC_EMBEDDED_WALLET_MODE_STORAGE_KEY);
  }
}

export async function loadStoredPlatformSignInOptions(): Promise<PlatformSignInOptions | null> {
  const raw = await AsyncStorage.getItem(PLATFORM_SIGN_IN_OPTIONS_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PlatformSignInOptions;
  } catch {
    return null;
  }
}

export async function loadStoredMagicLinkPublicKey(): Promise<string | null> {
  const raw = await AsyncStorage.getItem(PLATFORM_MAGIC_LINK_PUBLIC_KEY_STORAGE_KEY);
  if (!raw) return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function loadStoredMagicEmbeddedWalletMode(): Promise<MagicEmbeddedWalletMode> {
  const raw = await AsyncStorage.getItem(PLATFORM_MAGIC_EMBEDDED_WALLET_MODE_STORAGE_KEY);
  if (!raw) return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function filterBlockchainWalletsForDisplayedList<
  T extends { blockchain_provider?: string | null }
>(wallets: T[], mode: MagicEmbeddedWalletMode | null): T[] {
  const normalized = normalizeMagicEmbeddedWalletMode(mode);
  if (!normalized) {
    return wallets.filter((wallet) => {
      const provider = String(wallet.blockchain_provider ?? '').toLowerCase();
      return provider !== 'magic_link' && provider !== 'thirdweb';
    });
  }
  if (normalized === 'manual' || normalized === 'automatic') {
    return wallets.filter((wallet) => {
      const provider = String(wallet.blockchain_provider ?? '').toUpperCase();
      return provider !== 'THIRDWEB';
    });
  }
  return wallets;
}
