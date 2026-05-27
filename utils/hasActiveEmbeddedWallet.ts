const MAGIC_LINK_EMBEDDED_PROVIDERS = new Set(['magic_link', 'thirdweb']);

export type UserWalletPayload = {
  activeAccount?: {
    blockchainWallets?: Array<{
      blockchain_provider?: string | null;
      status?: string | null;
    }>;
  };
};

export function hasMagicLinkWalletInResponse(payload: UserWalletPayload): boolean {
  const wallets = payload.activeAccount?.blockchainWallets ?? [];
  return wallets.some((wallet) => {
    const provider = String(wallet.blockchain_provider ?? '').toLowerCase();
    return MAGIC_LINK_EMBEDDED_PROVIDERS.has(provider);
  });
}
