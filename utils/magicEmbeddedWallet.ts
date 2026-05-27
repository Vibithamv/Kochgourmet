import { Magic } from '@magic-sdk/react-native-expo';
import * as ExpoLinking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { ethers } from 'ethers';
import { Linking as RNLinking } from 'react-native';

export type MagicEmbeddedChain = 'polygon' | 'sepolia';

export type MagicEmbeddedWallet = Magic;

export type MagicEmbeddedAccount = {
  address: string;
  signMessage: (args: { message: string }) => Promise<string>;
};

export type MagicEmailOtpHandle = ReturnType<Magic['auth']['loginWithEmailOTP']>;

type MagicRpcProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

/** Stable `Error.message` values — map to i18n in the UI via `getMagicTransferErrorKind`. */
export const MAGIC_TRANSFER_ERROR = {
  SEND_TIMEOUT: 'MAGIC_TRANSFER_SEND_TIMEOUT',
  RECEIPT_TIMEOUT: 'MAGIC_TRANSFER_RECEIPT_TIMEOUT',
  SEND_NETWORK: 'MAGIC_TRANSFER_SEND_NETWORK',
  USER_CANCELLED: 'MAGIC_TRANSFER_USER_CANCELLED',
  NOT_LOGGED_IN: 'MAGIC_TRANSFER_NOT_LOGGED_IN',
} as const;

export type MagicTransferErrorKind =
  (typeof MAGIC_TRANSFER_ERROR)[keyof typeof MAGIC_TRANSFER_ERROR];

const MAGIC_TRANSFER_SEND_TIMEOUT_MS = 180_000;
const MAGIC_TRANSFER_RECEIPT_TIMEOUT_MS = 420_000;
const MAGIC_EMAIL_OTP_SEND_TIMEOUT_MS = 15000;
const MAGIC_EMAIL_OTP_VERIFY_TIMEOUT_MS = 20000;
const MAGIC_EXTERNAL_BROWSER_FLAG = 'open_in_device_browser';

const MAGIC_LOG_PREFIX = '[MagicTransfer]';
function magicLog(step: string, data?: unknown) {
  if (data === undefined) {
    console.log(`${MAGIC_LOG_PREFIX} ${step}`);
  } else {
    try {
      console.log(`${MAGIC_LOG_PREFIX} ${step}`, data);
    } catch {
      console.log(`${MAGIC_LOG_PREFIX} ${step} <unserializable data>`);
    }
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, timeoutError: Error): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(timeoutError), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

function errorText(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object') {
    const o = err as Record<string, unknown>;
    for (const key of ['message', 'reason', 'shortMessage'] as const) {
      const v = o[key];
      if (typeof v === 'string' && v.trim()) return v.trim();
    }
  }
  return '';
}

function normalizeMagicSendError(err: unknown): Error {
  if (err instanceof Error && err.message === MAGIC_TRANSFER_ERROR.SEND_TIMEOUT) {
    return err;
  }
  if (err instanceof Error && err.message === MAGIC_TRANSFER_ERROR.USER_CANCELLED) {
    return err;
  }
  const msg = errorText(err);
  const lower = msg.toLowerCase();
  if (
    lower.includes('user denied') ||
    lower.includes('user rejected') ||
    lower.includes('closed by user') ||
    lower.includes('user cancel')
  ) {
    return new Error(MAGIC_TRANSFER_ERROR.USER_CANCELLED);
  }
  if (
    lower.includes('failed to fetch') ||
    lower.includes('-32603') ||
    lower.includes('network request failed') ||
    lower.includes('networkerror')
  ) {
    return new Error(MAGIC_TRANSFER_ERROR.SEND_NETWORK);
  }
  return err instanceof Error ? err : new Error(msg || 'Magic transfer failed.');
}

export function getMagicTransferErrorKind(err: unknown): MagicTransferErrorKind | null {
  if (!(err instanceof Error) || !err.message) return null;
  switch (err.message) {
    case MAGIC_TRANSFER_ERROR.SEND_TIMEOUT:
    case MAGIC_TRANSFER_ERROR.RECEIPT_TIMEOUT:
    case MAGIC_TRANSFER_ERROR.SEND_NETWORK:
    case MAGIC_TRANSFER_ERROR.USER_CANCELLED:
    case MAGIC_TRANSFER_ERROR.NOT_LOGGED_IN:
      return err.message;
    default:
      return null;
  }
}

let magicExternalUrlHandlerInstalled = false;

const THIRDWEB_CLIENT_ID = '42ec675f4a00a8f609dcf9cc17f8c1e9';

const MAGIC_CHAIN_CONFIG: Record<
  MagicEmbeddedChain,
  { rpcUrl: string; chainId: number; readRpcUrl: string }
> = {
  polygon: {
    rpcUrl: `https://137.rpc.thirdweb.com/${THIRDWEB_CLIENT_ID}`,
    readRpcUrl: 'https://polygon-rpc.com',
    chainId: 137,
  },
  sepolia: {
    rpcUrl: `https://11155111.rpc.thirdweb.com/${THIRDWEB_CLIENT_ID}`,
    readRpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
    chainId: 11155111,
  },
};

function chainIdForEmbedded(chain: MagicEmbeddedChain): number {
  return MAGIC_CHAIN_CONFIG[chain].chainId;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function extractEthereumAddress(userInfo: unknown): string | null {
  if (!userInfo || typeof userInfo !== 'object') return null;
  const info = userInfo as Record<string, unknown>;
  const legacyAddress = readString(info.publicAddress);
  if (legacyAddress) return legacyAddress;

  const wallets = info.wallets;
  if (!wallets || typeof wallets !== 'object') return null;
  const ethereum = (wallets as Record<string, unknown>).ethereum;
  if (!ethereum || typeof ethereum !== 'object') return null;
  const ethWallet = ethereum as Record<string, unknown>;

  const mainnetAddress = readString(ethWallet.publicAddress);
  if (mainnetAddress) return mainnetAddress;

  const subAccounts = ethWallet.subAccounts;
  if (!Array.isArray(subAccounts)) return null;
  for (const subAccount of subAccounts) {
    if (subAccount && typeof subAccount === 'object') {
      const address = readString((subAccount as Record<string, unknown>).publicAddress);
      if (address) return address;
    }
  }
  return null;
}

function extractEmail(userInfo: unknown): string | null {
  if (!userInfo || typeof userInfo !== 'object') return null;
  return readString((userInfo as Record<string, unknown>).email);
}

function buildMagicEmbeddedAccount(
  magic: MagicEmbeddedWallet,
  address: string,
  chain: MagicEmbeddedChain
): MagicEmbeddedAccount {
  const provider = new ethers.providers.Web3Provider(
    magic.rpcProvider as unknown as ethers.providers.ExternalProvider,
    chainIdForEmbedded(chain)
  );
  const signer = provider.getSigner(address);
  return {
    address,
    signMessage: ({ message }) => signer.signMessage(message),
  };
}

function isMagicExternalBrowserUrl(url: string): boolean {
  if (!url.includes(MAGIC_EXTERNAL_BROWSER_FLAG)) return false;
  try {
    const parsed = new URL(url);
    return parsed.hostname.endsWith('magic.link');
  } catch {
    return false;
  }
}

function installMagicExternalUrlHandler() {
  if (magicExternalUrlHandlerInstalled) return;
  magicExternalUrlHandlerInstalled = true;
  const originalOpenUrl = RNLinking.openURL.bind(RNLinking);
  RNLinking.openURL = async (url: string) => {
    if (!isMagicExternalBrowserUrl(url)) {
      return originalOpenUrl(url);
    }
    await WebBrowser.openAuthSessionAsync(url, ExpoLinking.createURL('/'));
  };
}

export function createMagicEmbeddedWallet(
  publicKey: string,
  chain: MagicEmbeddedChain = 'polygon'
): MagicEmbeddedWallet {
  installMagicExternalUrlHandler();
  const magic = new Magic(publicKey, {
    network: {
      rpcUrl: MAGIC_CHAIN_CONFIG[chain].rpcUrl,
      chainId: MAGIC_CHAIN_CONFIG[chain].chainId,
    },
  });
  magic.preload().catch(() => undefined);
  return magic;
}

function timeoutAfter(ms: number, message: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });
}

export function startMagicEmailOtpLogin(
  magic: MagicEmbeddedWallet,
  email: string,
  handlers?: {
    onCodeSent?: () => void;
    onInvalidCode?: () => void;
    onError?: (error: unknown) => void;
  }
): MagicEmailOtpHandle {
  const handle = magic.auth.loginWithEmailOTP({
    email,
    showUI: false,
    deviceCheckUI: false,
  });
  handle
    .on('email-otp-sent', () => handlers?.onCodeSent?.())
    .on('invalid-email-otp', () => handlers?.onInvalidCode?.())
    .on('expired-email-otp', () => handlers?.onInvalidCode?.())
    .on('error', (error) => handlers?.onError?.(error));
  Promise.resolve(handle).catch(() => undefined);
  return handle;
}

export function requestMagicEmailOtpCode(
  magic: MagicEmbeddedWallet,
  email: string
): Promise<{ handle: MagicEmailOtpHandle }> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let handle: MagicEmailOtpHandle | null = null;
    const resolveOnce = (otpHandle: MagicEmailOtpHandle) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ handle: otpHandle });
    };
    const rejectOnce = (error: unknown) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      handle?.emit('cancel');
      reject(error);
    };
    const timer = setTimeout(() => {
      rejectOnce(new Error('Timed out while sending Magic verification code.'));
    }, MAGIC_EMAIL_OTP_SEND_TIMEOUT_MS);

    handle = magic.auth.loginWithEmailOTP({
      email,
      showUI: false,
      deviceCheckUI: false,
    });
    handle
      .on('email-otp-sent', () => resolveOnce(handle!))
      .on('login-throttled', () =>
        rejectOnce(new Error('Too many verification code requests. Please try again later.'))
      )
      .on('error', (error) => rejectOnce(error));
    Promise.resolve(handle).catch((error) => rejectOnce(error));
  });
}

export async function verifyMagicEmailOtpLogin(
  handle: MagicEmailOtpHandle,
  code: string
): Promise<void> {
  const invalidCode = new Promise<never>((_, reject) => {
    handle
      .on('invalid-email-otp', () => {
        reject(new Error('Invalid verification code.'));
      })
      .on('expired-email-otp', () => {
        reject(new Error('Verification code expired.'));
      })
      .on('error', (error) => {
        reject(error);
      });
  });
  handle.emit('verify-email-otp', code);
  try {
    await Promise.race([
      handle.then(() => undefined),
      invalidCode,
      timeoutAfter(
        MAGIC_EMAIL_OTP_VERIFY_TIMEOUT_MS,
        'Timed out while verifying Magic code.'
      ),
    ]);
  } catch (error) {
    handle.emit('cancel');
    throw error;
  }
}

export async function getMagicEmbeddedAccount(
  magic: MagicEmbeddedWallet,
  chain: MagicEmbeddedChain = 'polygon'
): Promise<MagicEmbeddedAccount> {
  const userInfo = await magic.user.getInfo();
  const address = extractEthereumAddress(userInfo);
  if (!address) {
    throw new Error('Magic wallet address was not returned.');
  }
  return buildMagicEmbeddedAccount(magic, address, chain);
}

export async function getLoggedInMagicEmbeddedAccount(
  magic: MagicEmbeddedWallet,
  expectedEmail?: string,
  chain: MagicEmbeddedChain = 'polygon'
): Promise<MagicEmbeddedAccount | null> {
  const isLoggedIn = await magic.user.isLoggedIn();
  if (!isLoggedIn) return null;
  const userInfo = await magic.user.getInfo();
  const email = extractEmail(userInfo);
  if (
    expectedEmail &&
    email &&
    email.toLowerCase() !== expectedEmail.trim().toLowerCase()
  ) {
    return null;
  }
  const address = extractEthereumAddress(userInfo);
  return address ? buildMagicEmbeddedAccount(magic, address, chain) : null;
}

function applyMagicTxFeeFloors(
  chain: MagicEmbeddedChain,
  baseFee: ethers.BigNumber | null,
  maxFeePerGas: ethers.BigNumber,
  maxPriorityFeePerGas: ethers.BigNumber
): { maxFeePerGas: ethers.BigNumber; maxPriorityFeePerGas: ethers.BigNumber } {
  let maxFee = maxFeePerGas;
  let maxPrio = maxPriorityFeePerGas;

  if (chain === 'sepolia') {
    const minPrio = ethers.utils.parseUnits('2', 'gwei');
    const minMax = ethers.utils.parseUnits('25', 'gwei');
    if (maxPrio.lt(minPrio)) maxPrio = minPrio;
    if (maxFee.lt(minMax)) maxFee = minMax;
    const base = baseFee ?? ethers.utils.parseUnits('15', 'gwei');
    const networkFloor = base.mul(2).add(maxPrio);
    if (maxFee.lt(networkFloor)) maxFee = networkFloor;
  } else {
    const minPrio = ethers.utils.parseUnits('30', 'gwei');
    const minMax = ethers.utils.parseUnits('35', 'gwei');
    if (maxPrio.lt(minPrio)) maxPrio = minPrio;
    if (maxFee.lt(minMax)) maxFee = minMax;
    const base = baseFee ?? ethers.utils.parseUnits('30', 'gwei');
    const networkFloor = base.mul(2).add(maxPrio);
    if (maxFee.lt(networkFloor)) maxFee = networkFloor;
  }

  if (maxFee.lte(maxPrio)) {
    maxFee = maxPrio.mul(2).add(baseFee ?? ethers.utils.parseUnits('16', 'gwei'));
  }
  return { maxFeePerGas: maxFee, maxPriorityFeePerGas: maxPrio };
}

async function resolveEip1559TxFees(
  readProvider: ethers.providers.JsonRpcProvider,
  chain: MagicEmbeddedChain
): Promise<{ maxFeePerGas: ethers.BigNumber; maxPriorityFeePerGas: ethers.BigNumber }> {
  const [feeData, latestBlock] = await Promise.all([
    readProvider.getFeeData(),
    readProvider.getBlock('latest'),
  ]);
  const baseFee = latestBlock?.baseFeePerGas ?? null;
  const minPriority = ethers.utils.parseUnits('1.5', 'gwei');

  let maxPriorityFeePerGas =
    feeData.maxPriorityFeePerGas != null && !feeData.maxPriorityFeePerGas.isZero()
      ? feeData.maxPriorityFeePerGas
      : minPriority;

  let maxFeePerGas =
    feeData.maxFeePerGas != null && !feeData.maxFeePerGas.isZero()
      ? feeData.maxFeePerGas
      : null;

  if (maxFeePerGas == null) {
    if (baseFee) {
      maxFeePerGas = baseFee.mul(2).add(maxPriorityFeePerGas);
    } else if (feeData.gasPrice != null && !feeData.gasPrice.isZero()) {
      maxFeePerGas = feeData.gasPrice;
      maxPriorityFeePerGas = minPriority;
    } else {
      maxFeePerGas = ethers.utils.parseUnits('35', 'gwei');
    }
  }

  if (baseFee) {
    const floor = baseFee.mul(2).add(maxPriorityFeePerGas);
    if (maxFeePerGas.lt(floor)) maxFeePerGas = floor;
  }

  const minBump = ethers.utils.parseUnits('1', 'gwei');
  if (maxPriorityFeePerGas.lt(minBump)) {
    maxPriorityFeePerGas = minBump;
  }
  if (maxFeePerGas.lte(maxPriorityFeePerGas)) {
    maxFeePerGas = maxPriorityFeePerGas.mul(2).add(baseFee ?? ethers.utils.parseUnits('16', 'gwei'));
  }

  return applyMagicTxFeeFloors(chain, baseFee, maxFeePerGas, maxPriorityFeePerGas);
}

export async function sendMagicErc20Transfer(options: {
  magic: MagicEmbeddedWallet;
  tokenAddress: string;
  recipientAddress: string;
  amount: string;
  chain?: MagicEmbeddedChain;
}): Promise<ethers.providers.TransactionReceipt> {
  const chain = options.chain ?? 'polygon';
  const network = MAGIC_CHAIN_CONFIG[chain];
  magicLog('1) start', {
    chain,
    chainId: network.chainId,
    tokenAddress: options.tokenAddress,
    recipientAddress: options.recipientAddress,
    amount: options.amount,
  });

  const readProvider = new ethers.providers.JsonRpcProvider(network.readRpcUrl, {
    chainId: network.chainId,
    name: chain === 'sepolia' ? 'sepolia' : 'matic',
  });

  let isLoggedIn = false;
  try {
    isLoggedIn = await options.magic.user.isLoggedIn();
  } catch (err) {
    magicLog('3) isLoggedIn failed', errorText(err));
  }
  if (!isLoggedIn) {
    throw new Error(MAGIC_TRANSFER_ERROR.NOT_LOGGED_IN);
  }

  const tokenRead = new ethers.Contract(
    options.tokenAddress,
    [
      'function decimals() view returns (uint8)',
      'function transfer(address to, uint256 amount) returns (bool)',
    ],
    readProvider
  );
  const decimals = await tokenRead.decimals();

  const data = tokenRead.interface.encodeFunctionData('transfer', [
    options.recipientAddress,
    ethers.utils.parseUnits(options.amount, decimals),
  ]);

  const userInfo = await options.magic.user.getInfo();
  const from = extractEthereumAddress(userInfo);
  if (!from) {
    throw new Error('Magic wallet address was not returned.');
  }

  try {
    options.magic.thirdPartyWallets.resetThirdPartyWalletState();
  } catch {
    /* expected in RN */
  }
  try {
    (options.magic.thirdPartyWallets as { isConnected: boolean }).isConnected = false;
  } catch {
    /* ignore */
  }

  const fromChecksummed = ethers.utils.getAddress(from);
  const tokenChecksummed = ethers.utils.getAddress(options.tokenAddress);

  const txPayload: Record<string, string> = {
    from: fromChecksummed,
    to: tokenChecksummed,
    data,
    value: '0x0',
  };

  const rpc = options.magic.rpcProvider as unknown as MagicRpcProvider;
  const sendStartedAt = Date.now();
  const sendPromise = rpc.request({
    method: 'eth_sendTransaction',
    params: [txPayload],
  });

  type CancellableEmitter = {
    once?: (event: string, listener: (...args: unknown[]) => void) => CancellableEmitter;
    emit?: (event: string, ...args: unknown[]) => boolean;
  };
  const emitter = sendPromise as unknown as CancellableEmitter;

  const cancelSignal = new Promise<never>((_, reject) => {
    const onCancel = () => reject(new Error(MAGIC_TRANSFER_ERROR.USER_CANCELLED));
    try {
      emitter.once?.('closed-by-user', onCancel);
      emitter.once?.('closed-by-user-on-received', onCancel);
    } catch {
      /* ignore */
    }
  });

  let txHash: unknown;
  try {
    txHash = await withTimeout(
      Promise.race([sendPromise, cancelSignal]),
      MAGIC_TRANSFER_SEND_TIMEOUT_MS,
      new Error(MAGIC_TRANSFER_ERROR.SEND_TIMEOUT)
    );
    magicLog('12) eth_sendTransaction returned hash', txHash);
  } catch (err) {
    magicLog('12) eth_sendTransaction failed', errorText(err));
    throw normalizeMagicSendError(err);
  }

  const hash = readString(txHash);
  if (!hash) {
    throw new Error('Magic transfer transaction hash was not returned.');
  }

  const receipt = await withTimeout(
    readProvider.waitForTransaction(hash, 1),
    MAGIC_TRANSFER_RECEIPT_TIMEOUT_MS,
    new Error(MAGIC_TRANSFER_ERROR.RECEIPT_TIMEOUT)
  );
  if (!receipt) {
    throw new Error('Magic transfer did not return a receipt.');
  }
  magicLog('14) receipt received', {
    status: receipt.status,
    blockNumber: receipt.blockNumber,
    tMs: Date.now() - sendStartedAt,
  });
  return receipt;
}
