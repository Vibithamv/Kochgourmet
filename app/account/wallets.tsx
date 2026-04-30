import React, {
  useState,
  useEffect,
  type Dispatch,
  type SetStateAction,
} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ListRenderItem,
  ActivityIndicator,
  Image,
  Platform,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Wallet,
  Copy,
  Plus,
  X,
  Shield,
  Mail,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { WalletsShimmer } from '@/components/Shimmer';
import { useTheme } from '@/contexts/ThemeContext';
import {
  getColors,
  Typography,
  Spacing,
  BorderRadius,
} from '@/constants/theme';
import type { Wallet as WalletType } from '@/types';
import Clipboard from '@react-native-clipboard/clipboard';

function extractApiErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const m = (error as { message: unknown }).message;
    if (typeof m === 'string') return m;
  }
  if (typeof error === 'string') return error;
  return '';
}

/** Provider value sent to the portal API; must match backend-allowed blockchain providers. */
const EMBEDDED_WALLET_PROVIDER = 'MAGIC_LINK';

type WalletSigner = {
  signMessage: (args: { message: string }) => Promise<string>;
};

type CheckWalletSignatureFn = (
  id: string,
  provider: string,
  signature: string
) => Promise<{
  success: boolean;
  data?: unknown;
  error?: unknown;
  status?: number;
}>;

async function runWalletStatusToggleActiveInactive(options: {
  walletId: string;
  currentStatus: 'ACTIVE' | 'INACTIVE';
  wallets: WalletType[];
  updateWalletStatus: (
    id: string,
    status: string
  ) => Promise<{ success: boolean; error?: unknown }>;
  setWallets: Dispatch<SetStateAction<WalletType[]>>;
  setUpdatingWalletId: (id: string | null) => void;
  showAlert: (title: string, message: string) => void;
  t: (key: string) => string;
}): Promise<void> {
  const {
    walletId,
    currentStatus,
    wallets,
    updateWalletStatus,
    setWallets,
    setUpdatingWalletId,
    showAlert,
    t,
  } = options;

  setUpdatingWalletId(walletId);
  const nextStatus: WalletType['status'] =
    currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  const response = await updateWalletStatus(walletId, nextStatus);
  if (response.success) {
    const updatedWallets = wallets.map((w) =>
      w.id === walletId ? { ...w, status: nextStatus } : w
    );
    setWallets(updatedWallets);
    setUpdatingWalletId(null);
    return;
  }
  setUpdatingWalletId(null);
  const errMsg = extractApiErrorMessage(response.error);
  showAlert(t('common.failed'), errMsg || t('transfer.walletVerificationError'));
}

async function verifyPendingWalletListFlow(options: {
  walletId: string;
  pendingWallet: WalletType;
  connectWallet: () => Promise<{
    address: string;
    signMessage: WalletSigner['signMessage'];
  }>;
  checkWalletSignature: CheckWalletSignatureFn;
  setWallets: Dispatch<SetStateAction<WalletType[]>>;
  setUpdatingWalletId: (id: string | null) => void;
  showAlert: (title: string, message: string) => void;
  t: (key: string) => string;
}): Promise<void> {
  const {
    walletId,
    pendingWallet,
    connectWallet,
    checkWalletSignature,
    setWallets,
    setUpdatingWalletId,
    showAlert,
    t,
  } = options;

  setUpdatingWalletId(walletId);

  let timeoutReached = false;
  const timer = setTimeout(() => {
    timeoutReached = true;
    setUpdatingWalletId(null);
    showAlert(t('common.failed'), t('transfer.walletVerificationTimeout'));
  }, 60000);

  const wrongMetaMaskAccount = () => {
    clearTimeout(timer);
    setUpdatingWalletId(null);
    console.log('⚠️ Please connect to your correct MetaMask account!');
    showAlert('Alert', 'Please connect to your correct MetaMask account!');
  };

  try {
    if (timeoutReached) return;

    const metaWallet = await connectWallet();
    const connectedLower = metaWallet.address.toLowerCase();
    const expectedLower = pendingWallet.address.toLowerCase();
    if (connectedLower !== expectedLower) {
      wrongMetaMaskAccount();
      return;
    }

    const message = pendingWallet.sign_message || 'I am signing one time';
    const signature = await metaWallet.signMessage({ message });
    console.log('🖋️ Signature:', signature);

    const res = await checkWalletSignature(
      pendingWallet.id,
      pendingWallet.type,
      signature
    );
    if (timeoutReached) return;
    clearTimeout(timer);

    if (res.success) {
      setWallets((prev) =>
        prev.map((w) =>
          w.id === walletId ? { ...w, status: 'ACTIVE' } : w
        )
      );
      setUpdatingWalletId(null);
      showAlert(t('common.success'), t('transfer.walletVerified'));
      return;
    }

    setUpdatingWalletId(null);
    const failText =
      typeof res.error === 'string'
        ? res.error
        : extractApiErrorMessage(res.error);
    showAlert(
      t('common.failed'),
      failText || t('transfer.walletVerificationError')
    );
  } catch (error: unknown) {
    if (timeoutReached) return;
    clearTimeout(timer);
    setUpdatingWalletId(null);
    const msg = error instanceof Error ? error.message : String(error);
    showAlert(t('common.failed'), msg || t('transfer.walletVerificationError'));
  }
}

function scheduleWalletActiveStatusUpdate(
  walletId: string,
  setWallets: Dispatch<SetStateAction<WalletType[]>>
) {
  setTimeout(() => {
    setWallets((prev) =>
      prev.map((w) =>
        w.id === walletId ? { ...w, status: 'ACTIVE' } : w
      )
    );
    console.log('✅ Wallet status updated after delay');
  }, 2000);
}

function applyAddWalletSignatureResult(options: {
  res: { success: boolean; error?: unknown };
  walletId: string;
  setWallets: Dispatch<SetStateAction<WalletType[]>>;
  showAlert: (title: string, message: string) => void;
  t: (key: string) => string;
}): void {
  const { res, walletId, setWallets, showAlert, t } = options;
  if (res.success) {
    setWallets((prev) => [...prev]);
    scheduleWalletActiveStatusUpdate(walletId, setWallets);
    showAlert(t('common.success'), t('transfer.walletVerified'));
    return;
  }
  setWallets((prev) => [...prev]);
  const errText = extractApiErrorMessage(res.error);
  showAlert(
    t('common.failed'),
    errText || t('transfer.walletVerificationError')
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing.lg,
      borderBottomWidth: 1,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerContent: {
      flex: 1,
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: Typography.fontSize['2xl'],
      fontFamily: Typography.fontFamily.bold,
    },
    headerSubtitle: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      marginTop: 2,
    },
    addButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      ...colors.shadows.md,
    },
    walletsList: {
      padding: Spacing.xl,
    },
    walletCard: {
      backgroundColor: colors.background.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.xl,
      marginBottom: Spacing.lg,
      ...colors.shadows.md,
      borderWidth: 1,
      borderColor: colors.border.primary,
    },
    walletHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: Spacing.lg,
    },
    walletIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.lg,
    },
    walletInfo: {
      flex: 1,
    },
    walletTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.xs,
    },
    walletType: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.semiBold,
      color: colors.text.primary,
      marginRight: Spacing.sm,
    },
    primaryBadge: {
      backgroundColor: colors.warning,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: BorderRadius.sm,
    },
    primaryText: {
      fontSize: Typography.fontSize.xs,
      fontFamily: Typography.fontFamily.bold,
      color: colors.text.inverse,
    },
    addressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.xs,
    },
    walletAddress: {
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.regular,
      color: colors.text.secondary,
      marginRight: Spacing.sm,
    },
    copyButton: {
      padding: Spacing.xs,
    },
    walletDate: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      color: colors.text.tertiary,
    },
    walletActions: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background.secondary,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: colors.border.primary,
    },
    removeButton: {
      borderColor: `${colors.error}40`,
      backgroundColor: `${colors.error}10`,
    },
    actionButtonText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.semiBold,
      color: colors.text.primary,
      marginLeft: Spacing.xs,
    },
    removeButtonText: {
      color: colors.error,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: Spacing['5xl'],
    },
    emptyTitle: {
      fontSize: Typography.fontSize.xl,
      fontFamily: Typography.fontFamily.bold,
      color: colors.text.primary,
      marginTop: Spacing.lg,
      marginBottom: Spacing.sm,
    },
    emptySubtitle: {
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.regular,
      color: colors.text.secondary,
      textAlign: 'center',
      marginBottom: Spacing['3xl'],
    },
    emptyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.md,
      ...colors.shadows.md,
    },
    emptyButtonText: {
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.semiBold,
      color: colors.text.inverse,
      marginLeft: Spacing.sm,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.background.overlay,
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.background.primary,
      borderTopLeftRadius: BorderRadius.xl,
      borderTopRightRadius: BorderRadius.xl,
      paddingTop: Spacing.xl,
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing['4xl'],
      minHeight: '40%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    modalTitle: {
      fontSize: Typography.fontSize.xl,
      fontFamily: Typography.fontFamily.bold,
      color: colors.text.primary,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.background.secondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalSubtitle: {
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.regular,
      color: colors.text.secondary,
      marginBottom: Spacing.xl,
    },
    walletTypesList: {
      gap: Spacing.md,
    },
    walletTypeOption: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background.secondary,
      padding: Spacing.lg,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: colors.border.primary,
    },
    walletTypeDisabled: {
      opacity: 0.5,
    },
    walletTypeIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.lg,
    },
    walletTypeInfo: {
      flex: 1,
    },
    walletTypeName: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.semiBold,
      color: colors.text.primary,
    },
    walletTypeNameDisabled: {
      color: colors.text.tertiary,
    },
    walletTypeDescription: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      color: colors.text.secondary,
      marginTop: 2,
    },
    walletTypeConnecting: {
      opacity: 0.7,
    },
    comingSoonText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      color: colors.text.tertiary,
      marginTop: 2,
    },
    connectingText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.medium,
      color: colors.primary,
      marginTop: 2,
    },
    verificationOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.background.overlay,
      alignItems: 'center',
      justifyContent: 'center',
    },
    verificationCard: {
      backgroundColor: colors.background.primary,
      borderRadius: BorderRadius.xl,
      padding: Spacing['3xl'],
      alignItems: 'center',
      margin: Spacing.xl,
      ...colors.shadows.lg,
    },
    verificationTitle: {
      fontSize: Typography.fontSize.xl,
      fontFamily: Typography.fontFamily.bold,
      color: colors.text.primary,
      marginTop: Spacing.lg,
      marginBottom: Spacing.sm,
    },
    verificationText: {
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.regular,
      color: colors.text.secondary,
      textAlign: 'center',
      marginBottom: Spacing.xl,
    },
    verificationLoader: {
      marginTop: Spacing.lg,
    },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  });
import 'react-native-get-random-values';
import { createThirdwebClient } from 'thirdweb';
import { polygon } from 'thirdweb/chains';
import {
  Account,
  createWallet,
  inAppWallet,
  preAuthenticate,
} from 'thirdweb/wallets';
import * as Linking from 'expo-linking';
import { walletManagement } from '@/hooks/walletManagement';
import { userManagement } from '@/hooks/userManagement';
import { useGlobalAlert } from '@/contexts/AlertContext';

export default function WalletsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const primaryBtnTextColor = colors.text.onPrimary;
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const { showAlert } = useGlobalAlert();
  const [wallets, setWallets] = useState<WalletType[]>([
    //   {
    //   id: "9c0debf8-c341-44fd-aaa2-d01ff9440099",
    //   user_id: "60a0781a-f446-4cd5-97a4-f1ff9bcff26c",
    //   address: "0xfb7265c38f2957dd9518e7c6855e3e578213eea9",
    //   type: "metamask",
    //   is_primary: false,
    //   created_at: "2025-10-06T06:43:20.386Z",
    //   status: "ACTIVE",
    // },
    // {
    //   id: "4849b202-2e6a-45d5-8dd3-6b02242104a2",
    //   user_id: "60a0781a-f446-4cd5-97a4-f1ff9bcff26c",
    //   address: "4CQTJqkjezD1H8Dbsh5fWw3rA7SzSR6PV71ieErvB7L9TVigoS",
    //   type: "metamask",
    //   is_primary: false,
    //   created_at: "2025-10-08T10:42:53.302Z",
    //   status: "ACTIVE",
    // },
  ]);
  const [addWalletModalVisible, setAddWalletModalVisible] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);
  const [verifyingWallet, setVerifyingWallet] = useState(false);
  const walletService = walletManagement();
  const [loading, setLoading] = useState(true);
  const user = userManagement();
  const [activeId, setActiveId] = useState('');
  const [showEmptyState, setShowEmptyState] = useState(false);
  const [activeName, setActiveName] = useState('');
  const [updatingWalletId, setUpdatingWalletId] = useState<string | null>(null);
  const client = createThirdwebClient({
    clientId: '42ec675f4a00a8f609dcf9cc17f8c1e9', // from https://thirdweb.com/dashboard
  });
  const metamaskWallet = createWallet('io.metamask');
  const embeddedWallet = React.useMemo(() => inAppWallet(), []);
  const [magicLinkModalVisible, setMagicLinkModalVisible] = useState(false);
  const [magicEmail, setMagicEmail] = useState('');
  const [magicCode, setMagicCode] = useState('');
  const [magicSendingCode, setMagicSendingCode] = useState(false);
  const [magicConnecting, setMagicConnecting] = useState(false);
  const [pendingEmbeddedVerifyWalletId, setPendingEmbeddedVerifyWalletId] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadWallets = async () => {
      setLoading(true);
      try {
        const data = await user.getUser();
        if (cancelled) return;
        if (data.success && data.data) {
          const jsonObject =
            data.data.data.activeAccount.blockchainWallets ?? [];
          const mappedWallets: WalletType[] = jsonObject.map((wallet: any) => ({
            id: wallet.id,
            user_id: wallet.account_id,
            address: wallet.public_address,
            type: wallet.blockchain_provider,
            is_primary: false,
            created_at: wallet.created_at,
            status: wallet.status,
            sign_message: wallet.signature_message,
          }));
          setWallets(mappedWallets);
          setActiveId(data.data.data.activeAccount.id);
          setActiveName(data.data.data.activeAccount.name);
        } else if (data.status === 401) {
          showAlert("Session Expired", "Please login again....");
          router.replace("/auth/login");
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error loading wallets:', error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadWallets();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (wallets.length === 0) {
      const timer = setTimeout(() => {
        setShowEmptyState(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
    setShowEmptyState(false);
  }, [wallets]);

  if (loading) {
    return <WalletsShimmer />;
  }

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  };

  const getWalletTypeLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case 'fireblocks':
        return t('transfer.fireblocks');
      case 'metamask':
        return t('transfer.metaMask');
      case 'thirdweb':
        return t('transfer.embeddedWallet');
      case 'walletconnect':
        return t('transfer.walletConnect');
      default:
        return type;
    }
  };

  const getWalletTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'fireblocks':
        return colors.success;
      case 'metamask':
        return colors.warning;
      case 'thirdweb':
        return colors.primary;
      case 'walletconnect':
        return colors.info;
      default:
        return colors.text.tertiary;
    }
  };

  const copyAddress = (address: string) => {
    Clipboard.setString(address);
    showAlert(t('transfer.copied'), t('transfer.addressCopied'));
  };

  const closeMagicLinkModal = () => {
    setMagicLinkModalVisible(false);
    setMagicConnecting(false);
    setMagicSendingCode(false);
    setPendingEmbeddedVerifyWalletId(null);
    setMagicEmail('');
    setMagicCode('');
  };

  const verifyEmbeddedWalletSignature = async (
    walletId: string,
    pendingWallet: WalletType,
    account: Account
  ) => {
    setUpdatingWalletId(walletId);
    try {
      if (account.address.toLowerCase() !== pendingWallet.address.toLowerCase()) {
        showAlert(t('common.failed'), t('transfer.embeddedWalletWrongAccount'));
        return;
      }
      const message = pendingWallet.sign_message || 'I am signing one time';
      const signature = await account.signMessage({ message });
      const res = await walletService.checkWalletSignature(
        walletId,
        EMBEDDED_WALLET_PROVIDER,
        signature
      );
      if (res.success) {
        setWallets((prev) =>
          prev.map((w) =>
            w.id === walletId ? { ...w, status: 'ACTIVE' } : w
          )
        );
        showAlert(t('common.success'), t('transfer.walletVerified'));
        return;
      }
      const failText =
        typeof res.error === 'string'
          ? res.error
          : extractApiErrorMessage(res.error);
      showAlert(
        t('common.failed'),
        failText || t('transfer.walletVerificationError')
      );
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      showAlert(
        t('common.failed'),
        msg || t('transfer.walletVerificationError')
      );
    } finally {
      setUpdatingWalletId(null);
    }
  };

  const sendMagicLinkCode = async () => {
    const email = magicEmail.trim();
    if (!email) {
      showAlert(t('common.error'), t('transfer.magicLinkFillBoth'));
      return;
    }
    setMagicSendingCode(true);
    try {
      await preAuthenticate({
        client,
        strategy: 'email',
        email,
      });
      showAlert(t('common.success'), t('transfer.magicLinkCodeSent'));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showAlert(t('common.error'), msg || t('transfer.connectingWalletFailed'));
    } finally {
      setMagicSendingCode(false);
    }
  };

  const submitMagicLinkWallet = async () => {
    const email = magicEmail.trim();
    const code = magicCode.trim();
    if (!email || !code) {
      showAlert(t('common.error'), t('transfer.magicLinkFillBoth'));
      return;
    }
    setMagicConnecting(true);
    try {
      const account = await embeddedWallet.connect({
        client,
        chain: polygon,
        strategy: 'email',
        email,
        verificationCode: code,
      });
      const verifyId = pendingEmbeddedVerifyWalletId;
      closeMagicLinkModal();

      if (verifyId) {
        const pendingWallet = wallets.find((w) => w.id === verifyId);
        if (pendingWallet) {
          await verifyEmbeddedWalletSignature(verifyId, pendingWallet, account);
        }
        return;
      }

      addWalletApi(
        account.address,
        EMBEDDED_WALLET_PROVIDER,
        `${activeName} (${account.address.substring(0, 6)}...${account.address.substring(account.address.length - 6)})`,
        activeId,
        account
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showAlert(
        t('common.failed'),
        msg || t('transfer.connectingWalletFailed')
      );
    } finally {
      setMagicConnecting(false);
    }
  };

  const updateStatus = async (walletId: string) => {
    const wallet = wallets.find((w) => w.id === walletId);
    if (!wallet) {
      showAlert(t('common.error'), 'Wallet not found.');
      return;
    }

    if (wallet.status === 'ACTIVE' || wallet.status === 'INACTIVE') {
      await runWalletStatusToggleActiveInactive({
        walletId,
        currentStatus: wallet.status,
        wallets,
        updateWalletStatus: walletService.updateWalletStatus,
        setWallets,
        setUpdatingWalletId,
        showAlert,
        t,
      });
      return;
    }

    if (wallet.status === 'PENDING') {
      if (wallet.type.toUpperCase() === EMBEDDED_WALLET_PROVIDER) {
        try {
          const account = await embeddedWallet.autoConnect({
            client,
            chain: polygon,
          });
          await verifyEmbeddedWalletSignature(walletId, wallet, account);
        } catch {
          setMagicEmail('');
          setMagicCode('');
          setPendingEmbeddedVerifyWalletId(walletId);
          setMagicLinkModalVisible(true);
        }
        return;
      }
      await verifyPendingWalletListFlow({
        walletId,
        pendingWallet: wallet,
        connectWallet: () =>
          metamaskWallet.connect({ client, chain: polygon }),
        checkWalletSignature: walletService.checkWalletSignature,
        setWallets,
        setUpdatingWalletId,
        showAlert,
        t,
      });
    }
  };

  const addWallet = (type: string) => {
    if (type === 'fireblocks') {
      setAddWalletModalVisible(false);
      showAlert(
        t('transfer.comingSoon'),
        `${getWalletTypeLabel(type)} ${t('transfer.integrationSoon')}`
      );
      return;
    }

    if (type === EMBEDDED_WALLET_PROVIDER) {
      setAddWalletModalVisible(false);
      setConnectingWallet(null);
      setPendingEmbeddedVerifyWalletId(null);
      setMagicEmail('');
      setMagicCode('');
      setMagicLinkModalVisible(true);
      return;
    }

    connectWallet(type as 'METAMASK' | 'walletconnect');
  };

  const connectMetaMask = async (type: string) => {
    console.log('Connecting to MetaMask...');
    try {
      const metamaskWallet = createWallet('io.metamask');
      const canOpen = await Linking.canOpenURL('metamask://');
      if (!canOpen) {
        showAlert(
          'MetaMask not installed',
          'Please install MetaMask to connect your wallet.',
          {
            buttonText: "Install MetaMask",
            buttonCallback: () =>
              void Linking.openURL(
                Platform.OS === 'ios'
                  ? 'https://apps.apple.com/app/metamask/id1438144202'
                  : 'https://play.google.com/store/apps/details?id=io.metamask'
              ),
            secondaryButtonText: "Cancel",
          }
        );
        setAddWalletModalVisible(false);
        setConnectingWallet(null);
        return;
      }
      const wallet = await metamaskWallet.connect({
        client, chain: polygon
      });

      setAddWalletModalVisible(false);
      setConnectingWallet(null);

      console.log('sliced wallet address:', `${activeName} ${wallet.address.substring(0, 6)}...${wallet.address.substring(wallet.address.length - 6)}`);
      addWalletApi(
        wallet.address,
        type,
        `${activeName} (${wallet.address.substring(0, 6)}...${wallet.address.substring(wallet.address.length - 6)})`,
        activeId,
        wallet
      );
    } catch (err: any) {
      setAddWalletModalVisible(false);
      setConnectingWallet(null);
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('❌ Failed to connect:', err);
      if (errorMessage.includes('is the app installed')) {
        showAlert(
          'MetaMask not installed',
          'Please install MetaMask to connect your wallet.',
          {
            buttonText: "Install MetaMask",
            buttonCallback: () =>
              void Linking.openURL(
                Platform.OS === 'ios'
                  ? 'https://apps.apple.com/app/metamask/id1438144202'
                  : 'https://play.google.com/store/apps/details?id=io.metamask'
              ),
            secondaryButtonText: "Cancel",
          }
        );
      } else {
        showAlert(t('common.error'), err.message || t('transfer.connectingWalletFailed'));
      }
    }
  };

  const addWalletApi = async (
    address: string,
    provider: string,
    name: string,
    accountId: string,
    wallet: Account
  ) => {
    setVerifyingWallet(true);

    let timeoutReached = false;
    const timer = setTimeout(() => {
      timeoutReached = true;
      setVerifyingWallet(false);
      showAlert(t('common.failed'), t('transfer.walletVerificationTimeout'));
    }, 30000);

    const clearTimerAndFinish = () => {
      clearTimeout(timer);
      setVerifyingWallet(false);
    };

    try {
      const response = await walletService.addWallet(
        address,
        provider,
        name,
        accountId
      );
      if (timeoutReached) return;

      if (!response.success) {
        if (timeoutReached) return;
        console.log(
          'add wallet api error',
          extractApiErrorMessage(response.error)
        );
        clearTimerAndFinish();
        showAlert(
          t('common.failed'),
          extractApiErrorMessage(response.error) || t('transfer.walletAddError')
        );
        return;
      }

      console.log('Wallet added successfully:', response.data);
      if (response.data.meta.message === 'Wallet already exists') {
        clearTimerAndFinish();
        showAlert(
          t('transfer.alreadyExist'),
          t('transfer.walletAlreadyExists')
        );
        return;
      }

      const newWalletId = response.data.data.wallet.id;
      let listType: string = 'WALLETCONNECT';
      if (provider === 'METAMASK') listType = 'METAMASK';
      if (provider === EMBEDDED_WALLET_PROVIDER) {
        listType = EMBEDDED_WALLET_PROVIDER;
      }
      setWallets((prevWallets) => [
        ...prevWallets,
        {
          id: newWalletId,
          user_id: 'user1',
          address: response.data.data.wallet.public_address,
          type: listType,
          is_primary: false,
          created_at: new Date().toISOString().split('T')[0],
          status: 'PENDING',
        },
      ]);

      const message = response.data.data.wallet.signature_message;
      showAlert(t('common.success'), t('transfer.walletAdded'));

      if (timeoutReached) return;
      const signature = await wallet.signMessage({ message });
      if (timeoutReached) return;
      console.log('🖋️ Signature:', signature);

      const res = await walletService.checkWalletSignature(
        newWalletId,
        provider,
        signature
      );
      if (timeoutReached) return;
      clearTimerAndFinish();

      applyAddWalletSignatureResult({
        res,
        walletId: newWalletId,
        setWallets,
        showAlert,
        t,
      });
    } catch (error: unknown) {
      console.log('addWalletApi error', error);
      if (timeoutReached) return;
      clearTimerAndFinish();
      const msg = error instanceof Error ? error.message : String(error);
      showAlert(
        t('common.failed'),
        msg.includes('User rejected the request.')
          ? 'User rejected signature verification request.'
          : msg
      );
    }
  };

  const connectWallet = async (type: 'METAMASK' | 'walletconnect') => {
    setConnectingWallet(type);
    if (type === 'METAMASK') {
      connectMetaMask(type);
    } else {
      //Simulate connection delay
      setTimeout(() => {
        showAlert(
          t('transfer.comingSoon'),
          `${getWalletTypeLabel(type)} ${t('transfer.integrationSoon')}`
        );
        setConnectingWallet(null);
      }, 2000);
    }
  };

  const renderAddWalletOptionIcon = (
    walletType: {
      type: string;
      label: string;
      available: boolean;
      description?: string;
    },
    connecting: boolean
  ) => {
    if (connecting) {
      return (
        <ActivityIndicator
          size="small"
          color={getWalletTypeColor(walletType.type)}
        />
      );
    }
    if (walletType.type === EMBEDDED_WALLET_PROVIDER) {
      return (
        // <Mail size={22} color={getWalletTypeColor(walletType.type)} />
        <Image
        source={require('../../assets/images/embedded-wallet.jpeg')}
        style={{ width: 18, height: 18 }}
        resizeMode="contain"
      />
      );
    }
    return (
      <Image
        source={require('../../assets/images/metamask_icon.png')}
        style={{ width: 18, height: 18 }}
        resizeMode="contain"
      />
    );
  };

  const renderWalletTypeIcon = (type: string) => {
    const lower = type.toLowerCase();
    if (lower === 'metamask') {
      return (
        <Image
          source={require('../../assets/images/metamask_icon.png')}
          style={{ width: 18, height: 18 }}
          resizeMode="contain"
        />
      );
    }
    if (lower === 'thirdweb') {
      // return <Mail size={22} color={getWalletTypeColor(type)} />;
      return <Image
      source={require('../../assets/images/embedded-wallet.jpeg')}
      style={{ width: 18, height: 18 }}
      resizeMode="contain"
    />
    }
    if (lower === 'concordium') {
      return (
        <Image
          source={require('../../assets/images/concordium_icon.jpeg')}
          style={{ width: 18, height: 18 }}
          resizeMode="contain"
        />
      );
    }
    return <Wallet size={24} color={getWalletTypeColor(type)} />;
  };

  const getWalletActionButtonAppearance = (status: string) => {
    if (status === 'ACTIVE') {
      return { color: 'red' as const, label: 'DEACTIVATE' };
    }
    if (status === 'INACTIVE') {
      return { color: 'green' as const, label: 'ACTIVATE' };
    }
    if (status === 'PENDING') {
      return { color: 'orange' as const, label: 'SIGNATURE VERIFY' };
    }
    return { color: 'gray' as const, label: status };
  };

  const renderWallet: ListRenderItem<WalletType> = ({ item: wallet }) => {
    const walletAction = getWalletActionButtonAppearance(wallet.status);
    return (
    <View style={styles.walletCard}>
      <View style={styles.walletHeader}>
        <View
          style={[
            styles.walletIcon,
            { backgroundColor: `${getWalletTypeColor(wallet.type)}20` },
          ]}
        >
          {renderWalletTypeIcon(wallet.type)}
        </View>
        <View style={styles.walletInfo}>
          <View style={styles.walletTitleRow}>
            <Text style={styles.walletType}>
              {getWalletTypeLabel(wallet.type)}
            </Text>
            {wallet.is_primary && (
              <View style={styles.primaryBadge}>
                <Text style={styles.primaryText}>{t('transfer.primary')}</Text>
              </View>
            )}
          </View>
          <View style={styles.addressRow}>
            <Text style={styles.walletAddress}>
              {formatAddress(wallet.address)}
            </Text>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={() => copyAddress(wallet.address)}
            >
              <Copy size={16} color={colors.text.tertiary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.walletDate}>
            Connected {new Date(wallet.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View style={styles.walletActions}>
        {/* <TouchableOpacity 
          style={[styles.actionButton, styles.removeButton]}
          onPress={() => removeWallet(wallet.id)}
        >
          <Trash2 size={16} color="#EF4444" />
          <Text style={[styles.actionButtonText, styles.removeButtonText]}>Remove</Text>
        </TouchableOpacity> */}

        <TouchableOpacity
          style={[styles.actionButton, styles.removeButton]}
          onPress={() => updateStatus(wallet.id)}
          disabled={updatingWalletId === wallet.id}
        >
          {/* <Trash2 size={16} color="#5973f4ff" /> */}

          {updatingWalletId === wallet.id ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text
              style={[
                styles.actionButtonText,
                { color: walletAction.color },
              ]}
            >
              {walletAction.label}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
    );
  };

  const walletTypes = [
    // {
    //   type: 'walletconnect',
    //   label: t('transfer.walletConnect'),
    //   available: true,
    //   description: 'Connect any wallet via WalletConnect',
    // },
    {
      type: 'METAMASK',
      label: t('transfer.metaMask'),
      available: true,
      description: 'Browser extension wallet',
    },
    {
      type: EMBEDDED_WALLET_PROVIDER,
      label: t('transfer.embeddedWallet'),
      available: true,
      description: t('transfer.embeddedWalletDescription'),
    },
    // { type: 'fireblocks', label: t('transfer.fireblocks'), available: false },
  ];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background.secondary },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, 44) + 16,
            backgroundColor: colors.background.primary,
            borderBottomColor: colors.border.primary,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.backButton,
            { backgroundColor: colors.background.secondary },
          ]}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            {t('transfer.myWallets')}
          </Text>
          <Text
            style={[styles.headerSubtitle, { color: colors.text.secondary }]}
          >
            {wallets.length} {wallets.length === 1 ? 'wallet' : 'wallets'}{' '}
            connected
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => setAddWalletModalVisible(true)}
        >
          <Plus size={24} color={primaryBtnTextColor} />
        </TouchableOpacity>
      </View>

      {/* Wallets List */}
      <FlatList
        data={wallets}
        renderItem={renderWallet}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.walletsList,
          { paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          showEmptyState ? (
            <View style={styles.emptyState}>
              <Wallet size={48} color={colors.text.tertiary} />
              <Text style={styles.emptyTitle}>No Wallets Connected</Text>
              <Text style={styles.emptySubtitle}>
                Connect your first wallet to start managing your tokens
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setAddWalletModalVisible(true)}
              >
                <Plus size={20} color={primaryBtnTextColor} />
                <Text style={styles.emptyButtonText}>
                  {t('transfer.addWallet')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View
              style={[
                styles.center,
                { backgroundColor: colors.background.secondary },
              ]}
            >
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )
        }
      />

      {/* Add Wallet Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={addWalletModalVisible}
        onRequestClose={() => {
          setAddWalletModalVisible(false);
          setConnectingWallet(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('transfer.addWallet')}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setAddWalletModalVisible(false);
                  setConnectingWallet(null);
                }}
              >
                <X size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              {t('transfer.chooseWalletType')}
            </Text>

            <View style={styles.walletTypesList}>
              {walletTypes.map((walletType) => (
                <TouchableOpacity
                  key={walletType.type}
                  style={[
                    styles.walletTypeOption,
                    !walletType.available && styles.walletTypeDisabled,
                    connectingWallet === walletType.type &&
                    styles.walletTypeConnecting,
                  ]}
                  onPress={() =>
                    walletType.available ? addWallet(walletType.type) : null
                  }
                  disabled={!walletType.available || connectingWallet !== null}
                >
                  <View
                    style={[
                      styles.walletTypeIcon,
                      {
                        backgroundColor: `${getWalletTypeColor(
                          walletType.type
                        )}20`,
                      },
                    ]}
                  >
                    {renderAddWalletOptionIcon(
                      walletType,
                      connectingWallet === walletType.type
                    )}
                  </View>
                  <View style={styles.walletTypeInfo}>
                    <Text
                      style={[
                        styles.walletTypeName,
                        !walletType.available && styles.walletTypeNameDisabled,
                      ]}
                    >
                      {walletType.label}
                    </Text>
                    {walletType.description && walletType.available ? (
                      <Text style={styles.walletTypeDescription}>
                        {walletType.description}
                      </Text>
                    ) : null}
                    {!walletType.available && (
                      <Text style={styles.comingSoonText}>
                        {t('transfer.comingSoon')}
                      </Text>
                    )}
                    {connectingWallet === walletType.type && (
                      <Text style={styles.connectingText}>Connecting...</Text>
                    )}
                  </View>
                  {walletType.available &&
                    connectingWallet !== walletType.type && (
                      <Plus size={20} color={colors.success} />
                    )}
                </TouchableOpacity>
              ))}
            </View>

            {verifyingWallet && (
              <View style={styles.verificationOverlay}>
                <View style={styles.verificationCard}>
                  <Shield size={32} color={colors.success} />
                  <Text style={styles.verificationTitle}>Verifying Wallet</Text>
                  <Text style={styles.verificationText}>
                    Please sign the message in your wallet to verify ownership
                  </Text>
                  <ActivityIndicator
                    size="large"
                    color={colors.success}
                    style={styles.verificationLoader}
                  />
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={magicLinkModalVisible}
        onRequestClose={closeMagicLinkModal}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, justifyContent: 'flex-end' }}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {t('transfer.embeddedWallet')}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={closeMagicLinkModal}
                >
                  <X size={24} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>
              {pendingEmbeddedVerifyWalletId ? (
                <Text style={styles.modalSubtitle}>
                  {t('transfer.embeddedWalletVerifySubtitle')}
                </Text>
              ) : null}
              <Text
                style={[
                  styles.modalSubtitle,
                  { marginBottom: Spacing.sm, fontFamily: Typography.fontFamily.semiBold },
                ]}
              >
                {t('transfer.magicLinkEmailLabel')}
              </Text>
              <TextInput
                value={magicEmail}
                onChangeText={setMagicEmail}
                placeholder={t('profile.emailLabel')}
                placeholderTextColor={colors.text.placeholder}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                editable={!magicConnecting && !magicSendingCode}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border.primary,
                  borderRadius: BorderRadius.md,
                  paddingHorizontal: Spacing.lg,
                  paddingVertical: Spacing.md,
                  fontSize: Typography.fontSize.base,
                  fontFamily: Typography.fontFamily.regular,
                  color: colors.text.primary,
                  backgroundColor: colors.background.secondary,
                  marginBottom: Spacing.lg,
                }}
              />
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  {
                    alignSelf: 'flex-start',
                    marginBottom: Spacing.xl,
                    opacity: magicSendingCode ? 0.6 : 1,
                  },
                ]}
                onPress={() => void sendMagicLinkCode()}
                disabled={magicSendingCode || magicConnecting}
              >
                {magicSendingCode ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={styles.actionButtonText}>
                    {t('transfer.magicLinkSendCode')}
                  </Text>
                )}
              </TouchableOpacity>
              <Text
                style={[
                  styles.modalSubtitle,
                  { marginBottom: Spacing.sm, fontFamily: Typography.fontFamily.semiBold },
                ]}
              >
                {t('transfer.magicLinkCodeLabel')}
              </Text>
              <TextInput
                value={magicCode}
                onChangeText={setMagicCode}
                placeholder="••••••"
                placeholderTextColor={colors.text.placeholder}
                keyboardType="number-pad"
                editable={!magicConnecting && !magicSendingCode}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border.primary,
                  borderRadius: BorderRadius.md,
                  paddingHorizontal: Spacing.lg,
                  paddingVertical: Spacing.md,
                  fontSize: Typography.fontSize.base,
                  fontFamily: Typography.fontFamily.regular,
                  color: colors.text.primary,
                  backgroundColor: colors.background.secondary,
                  marginBottom: Spacing.xl,
                }}
              />
              <TouchableOpacity
                style={{
                  backgroundColor: colors.primary,
                  paddingVertical: Spacing.lg,
                  borderRadius: BorderRadius.md,
                  alignItems: 'center',
                  opacity: magicConnecting ? 0.7 : 1,
                }}
                onPress={() => void submitMagicLinkWallet()}
                disabled={magicConnecting}
              >
                {magicConnecting ? (
                  <ActivityIndicator size="small" color={primaryBtnTextColor} />
                ) : (
                  <Text
                    style={{
                      fontSize: Typography.fontSize.base,
                      fontFamily: Typography.fontFamily.semiBold,
                      color: primaryBtnTextColor,
                    }}
                  >
                    {t('transfer.magicLinkVerifyConnect')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}