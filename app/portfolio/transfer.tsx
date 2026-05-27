import 'react-native-get-random-values';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
  BackHandler,
  ActivityIndicator,
  Linking,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import {
  ArrowRight,
  QrCode,
  X,
  Camera,
  Check,
  TriangleAlert as AlertTriangle,
  ArrowLeft,
} from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useGlobalAlert } from '@/contexts/AlertContext';
import {
  createThirdwebClient,
  getContract,
  sendTransaction,
  waitForReceipt,
  type ThirdwebClient,
} from 'thirdweb';
import { transfer } from 'thirdweb/extensions/erc20';
import { sepolia } from 'thirdweb/chains';
import { isAddress } from 'thirdweb/utils';
import { useSendTransaction } from 'thirdweb/react';
import { createWallet, type Account } from 'thirdweb/wallets';
import { userManagement } from '@/hooks/userManagement';
import {
  isMagicEmbeddedWalletFeatureEnabled,
  loadStoredMagicLinkPublicKey,
  loadStoredMagicEmbeddedWalletMode,
} from '@/constants/platformSignInOptions';
import { refreshPlatformValidateConfigFromRemote } from '@/utils/refreshPlatformValidateConfig';
import { isApiAuthSessionError } from '@/utils/authUtils';
import {
  createMagicEmbeddedWallet,
  getMagicEmbeddedAccount,
  getMagicTransferErrorKind,
  MAGIC_TRANSFER_ERROR,
  requestMagicEmailOtpCode,
  sendMagicErc20Transfer,
  startMagicEmailOtpLogin,
  verifyMagicEmailOtpLogin,
  type MagicEmailOtpHandle,
} from '@/utils/magicEmbeddedWallet';

const TRANSFER_CHAIN = 'sepolia' as const;

type ShowAlertFn = (
  title: string,
  message: string,
  options?: {
    buttonText?: string;
    buttonCallback?: () => void;
    secondaryButtonText?: string;
    secondaryButtonCallback?: () => void;
  }
) => void;

const TRANSFER_ERROR_TEXT_KEYS = [
  'message',
  'shortMessage',
  'reason',
  'details',
  'error',
] as const;

function transferErrorJsonSnippet(error: object): string {
  try {
    const s = JSON.stringify(error);
    if (s && s !== '{}') return s.length > 280 ? `${s.slice(0, 280)}…` : s;
  } catch {
    /* ignore */
  }
  return '';
}

function formatTransferError(error: unknown): string {
  if (error == null) return '';
  if (typeof error === 'string') return error;
  if (error instanceof Error && error.message) return error.message;
  if (typeof error !== 'object') return '';

  const o = error as Record<string, unknown>;
  for (const key of TRANSFER_ERROR_TEXT_KEYS) {
    const v = o[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  if (o.cause != null) {
    const fromCause = formatTransferError(o.cause);
    if (fromCause) return fromCause;
  }
  return transferErrorJsonSnippet(error);
}

async function resolveSigningAccountForTransfer(options: {
  client: ThirdwebClient;
  showAlert: ShowAlertFn;
  t: (key: string) => string;
}): Promise<Account | null> {
  const { client, showAlert, t } = options;
  const metamaskWallet = createWallet('io.metamask');
  const canOpen = await Linking.canOpenURL('metamask://');
  if (!canOpen) {
    showAlert(t('transfer.metaMaskNotInstalled'), t('transfer.installMetaMaskDesc'), {
      buttonText: t('transfer.installMetaMask'),
      buttonCallback: () =>
        void Linking.openURL(
          Platform.OS === 'ios'
            ? 'https://apps.apple.com/app/metamask/id1438144202'
            : 'https://play.google.com/store/apps/details?id=io.metamask'
        ),
      secondaryButtonText: t('common.cancel'),
    });
    return null;
  }
  await metamaskWallet.connect({ client, chain: sepolia });
  const mm = metamaskWallet.getAccount();
  if (!mm) {
    showAlert(t('common.failed'), t('transfer.transferFailed'));
    return null;
  }
  return mm;
}

export default function TransferScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const isDark = theme === 'dark' || theme === 'darkGreen';
  const primaryBtnTextColor = isDark ? '#0D1117' : '#FFFFFF';
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const [transferAmount, setTransferAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [qrScannerVisible, setQrScannerVisible] = useState(false);
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const { showAlert } = useGlobalAlert();
  const userApi = React.useMemo(() => userManagement(), []);
  const { transferFromAddress, publicAddress, tokenBalance, symbol, transferSigner } =
    useLocalSearchParams();
  const signerParam = Array.isArray(transferSigner) ? transferSigner[0] : transferSigner;
  const isEmbeddedSigner = signerParam === 'embedded';
  const { data: txResult, error, isPending } = useSendTransaction();
  const [loading, setLoading] = useState(false);
  const [embeddedReauthVisible, setEmbeddedReauthVisible] = useState(false);
  const [embeddedReauthSessionMismatch, setEmbeddedReauthSessionMismatch] = useState(false);
  const [sessionUserEmail, setSessionUserEmail] = useState('');
  const [magicLinkPublicKey, setMagicLinkPublicKey] = useState<string | null>(null);
  const [reauthMagicCode, setReauthMagicCode] = useState('');
  const [reauthSendingCode, setReauthSendingCode] = useState(false);
  const [reauthConnecting, setReauthConnecting] = useState(false);
  const magicOtpHandleRef = React.useRef<MagicEmailOtpHandle | null>(null);
  const magicWallet = React.useMemo(
    () =>
      magicLinkPublicKey
        ? createMagicEmbeddedWallet(magicLinkPublicKey, TRANSFER_CHAIN)
        : null,
    [magicLinkPublicKey]
  );
  const client = createThirdwebClient({
    clientId: '42ec675f4a00a8f609dcf9cc17f8c1e9',
  });

  const fromAddressNormalized = React.useMemo(() => {
    const raw = Array.isArray(transferFromAddress)
      ? transferFromAddress[0]
      : transferFromAddress;
    return (raw ?? '').trim().toLowerCase();
  }, [transferFromAddress]);

  const loadSessionEmailForEmbedded = React.useCallback(async () => {
    if (!isEmbeddedSigner) return;
    try {
      const data = await userApi.getUser();
      if (data.success && data.data) {
        const userEmail = data.data.data.user?.email;
        setSessionUserEmail(typeof userEmail === 'string' ? userEmail : '');
      } else if (isApiAuthSessionError(data.status, data.error)) {
        showAlert(t('profile.sessionExpired'), t('profile.loginAgain'));
        router.replace('/auth/login');
      }
    } catch {
      /* ignore */
    }
  }, [isEmbeddedSigner, userApi, showAlert, t]);

  useFocusEffect(
    React.useCallback(() => {
      setTransferAmount('');
      setRecipientAddress('');
      setConfirmationChecked(false);
      setConfirmationVisible(false);
      setEmbeddedReauthVisible(false);
      setEmbeddedReauthSessionMismatch(false);
      setReauthMagicCode('');
      setReauthSendingCode(false);
      setReauthConnecting(false);
      void (async () => {
        await refreshPlatformValidateConfigFromRemote();
        const mode = await loadStoredMagicEmbeddedWalletMode();
        const publicKey = await loadStoredMagicLinkPublicKey();
        setMagicLinkPublicKey(publicKey);
        const sp = Array.isArray(transferSigner) ? transferSigner[0] : transferSigner;
        if (
          sp === 'embedded' &&
          !isMagicEmbeddedWalletFeatureEnabled(mode, publicKey)
        ) {
          showAlert(t('common.error'), t('transfer.embeddedWalletNotAvailable'));
          router.back();
          return;
        }
        void loadSessionEmailForEmbedded();
      })();
    }, [loadSessionEmailForEmbedded, transferSigner, showAlert, t])
  );

  React.useEffect(() => {
    if (embeddedReauthVisible && isEmbeddedSigner) {
      void loadSessionEmailForEmbedded();
    }
  }, [embeddedReauthVisible, isEmbeddedSigner, loadSessionEmailForEmbedded]);

  useEffect(() => {
    if (txResult) {
      showAlert(t('common.success'), t('transfer.transferSuccess'));
    }
  }, [isPending, txResult, error, showAlert, t]);

  const validateEvmAddress = (address: string) => isAddress(address);

  const handleCheckTransfer = async () => {
    if (!transferAmount || !recipientAddress) {
      showAlert(t('common.error'), t('auth.errors.fillAllFields'));
      return;
    }
    if (!validateEvmAddress(recipientAddress)) {
      showAlert(t('common.error'), t('transfer.validRecipientAddress'));
      return;
    }
    const amount = Number.parseFloat(transferAmount);
    if (amount > Number(tokenBalance)) {
      showAlert(
        t('common.error'),
        `${t('transfer.insufficientTokens')} ${tokenBalance} ${symbol}`
      );
      return;
    }
    setConfirmationVisible(true);
  };

  const executeErc20Transfer = React.useCallback(
    async (signingAccount: Account) => {
      const amount = Number.parseFloat(transferAmount);
      const contract = getContract({
        client,
        chain: sepolia,
        address: Array.isArray(publicAddress) ? publicAddress[0] : publicAddress,
      });
      const tx = transfer({ contract, to: recipientAddress, amount });
      const result = await sendTransaction({
        account: signingAccount,
        transaction: tx,
      });
      const receipt = await waitForReceipt(result);
      if (receipt.status === 'success') {
        showAlert(t('common.success'), t('transfer.tokenTransferredSuccessfully'), {
          buttonText: t('common.done'),
          buttonCallback: () => {
            router.back();
          },
        });
        setTransferAmount('');
        setRecipientAddress('');
      } else {
        showAlert(t('common.failed'), t('transfer.transactionFailed'));
      }
    },
    [transferAmount, recipientAddress, publicAddress, client, showAlert, t]
  );

  const closeEmbeddedReauthModal = () => {
    magicOtpHandleRef.current?.emit('cancel');
    magicOtpHandleRef.current = null;
    setEmbeddedReauthVisible(false);
    setEmbeddedReauthSessionMismatch(false);
    setReauthMagicCode('');
    setReauthSendingCode(false);
    setReauthConnecting(false);
  };

  const openEmbeddedReauthModal = React.useCallback(
    async (sessionMismatch = false) => {
      magicOtpHandleRef.current?.emit('cancel');
      magicOtpHandleRef.current = null;
      setReauthMagicCode('');
      setReauthSendingCode(false);
      setReauthConnecting(false);
      setEmbeddedReauthSessionMismatch(sessionMismatch);
      await magicWallet?.user.logout().catch(() => undefined);
      setEmbeddedReauthVisible(true);
    },
    [magicWallet]
  );

  const executeMagicErc20Transfer = React.useCallback(async () => {
    if (!magicWallet) {
      showAlert(t('common.error'), t('transfer.embeddedWalletNotAvailable'));
      return;
    }
    try {
      const receipt = await sendMagicErc20Transfer({
        magic: magicWallet,
        tokenAddress: Array.isArray(publicAddress) ? publicAddress[0] : publicAddress,
        recipientAddress,
        amount: transferAmount,
        chain: TRANSFER_CHAIN,
      });
      if (receipt.status === 1) {
        showAlert(t('common.success'), t('transfer.tokenTransferredSuccessfully'), {
          buttonText: t('common.done'),
          buttonCallback: () => {
            router.back();
          },
        });
        setTransferAmount('');
        setRecipientAddress('');
      } else {
        showAlert(t('common.failed'), t('transfer.transactionFailed'));
      }
    } catch (err: unknown) {
      const kind = getMagicTransferErrorKind(err);
      if (kind === MAGIC_TRANSFER_ERROR.NOT_LOGGED_IN) {
        await openEmbeddedReauthModal(false);
        return;
      }
      if (kind === MAGIC_TRANSFER_ERROR.USER_CANCELLED) {
        showAlert(t('common.failed'), t('transfer.magicTransferCancelled'));
        return;
      }
      if (kind === MAGIC_TRANSFER_ERROR.SEND_TIMEOUT) {
        showAlert(t('common.failed'), t('transfer.magicSendTimedOut'));
        return;
      }
      if (kind === MAGIC_TRANSFER_ERROR.RECEIPT_TIMEOUT) {
        showAlert(t('common.failed'), t('transfer.magicReceiptTimedOut'));
        return;
      }
      if (kind === MAGIC_TRANSFER_ERROR.SEND_NETWORK) {
        showAlert(t('common.failed'), t('transfer.magicSendNetworkError'));
        return;
      }
      const msg = formatTransferError(err);
      showAlert(t('common.failed'), msg || t('transfer.transferFailed'));
    }
  }, [
    magicWallet,
    publicAddress,
    recipientAddress,
    transferAmount,
    showAlert,
    t,
    openEmbeddedReauthModal,
  ]);

  const sendEmbeddedReauthCode = async () => {
    const email = sessionUserEmail.trim();
    if (!email) {
      showAlert(t('common.error'), t('transfer.embeddedWalletNoAccountEmail'));
      return;
    }
    if (!magicWallet) {
      showAlert(t('common.error'), t('transfer.embeddedWalletNotAvailable'));
      return;
    }
    setReauthSendingCode(true);
    try {
      const { handle } = await requestMagicEmailOtpCode(magicWallet, email);
      magicOtpHandleRef.current = handle;
      showAlert(t('common.success'), t('transfer.magicLinkCodeSent'));
    } catch (err: unknown) {
      showAlert(
        t('common.error'),
        formatTransferError(err) || t('transfer.connectingWalletFailed')
      );
      magicOtpHandleRef.current = null;
    } finally {
      setReauthSendingCode(false);
    }
  };

  const submitEmbeddedReauthAndTransfer = async () => {
    const email = sessionUserEmail.trim();
    const code = reauthMagicCode.trim();
    if (!email) {
      showAlert(t('common.error'), t('transfer.embeddedWalletNoAccountEmail'));
      return;
    }
    if (!code) {
      showAlert(t('common.error'), t('transfer.magicLinkCodeRequired'));
      return;
    }
    if (!magicWallet) {
      showAlert(t('common.error'), t('transfer.embeddedWalletNotAvailable'));
      return;
    }
    setReauthConnecting(true);
    setLoading(true);
    try {
      const handle =
        magicOtpHandleRef.current ?? startMagicEmailOtpLogin(magicWallet, email);
      magicOtpHandleRef.current = handle;
      await verifyMagicEmailOtpLogin(handle, code);
      magicOtpHandleRef.current = null;
      const account = await getMagicEmbeddedAccount(magicWallet, TRANSFER_CHAIN);
      if (!fromAddressNormalized) {
        showAlert(t('common.error'), t('transfer.missingTransferFromWallet'));
        return;
      }
      if (account.address.toLowerCase() !== fromAddressNormalized) {
        showAlert(t('common.failed'), t('transfer.embeddedWalletWrongAccount'));
        return;
      }
      closeEmbeddedReauthModal();
      await executeMagicErc20Transfer();
    } catch (err: unknown) {
      showAlert(
        t('common.failed'),
        formatTransferError(err) || t('transfer.connectingWalletFailed')
      );
    } finally {
      setReauthConnecting(false);
      setLoading(false);
    }
  };

  const handleConfirmTransfer = async () => {
    const confirmed = confirmationChecked;
    setLoading(true);
    setConfirmationVisible(false);
    setConfirmationChecked(false);
    if (!confirmed) {
      showAlert(t('common.error'), t('transfer.confirmationRequired'));
      setLoading(false);
      return;
    }

    try {
      if (isEmbeddedSigner) {
        try {
          if (!magicWallet) {
            throw new Error(t('transfer.embeddedWalletNotAvailable'));
          }
          if (!fromAddressNormalized) {
            showAlert(t('common.error'), t('transfer.missingTransferFromWallet'));
            return;
          }
          const account = await getMagicEmbeddedAccount(magicWallet, TRANSFER_CHAIN);
          if (account.address.toLowerCase() !== fromAddressNormalized) {
            await openEmbeddedReauthModal(true);
            return;
          }
          await executeMagicErc20Transfer();
        } catch {
          await openEmbeddedReauthModal(false);
        }
        return;
      }

      const signingAccount = await resolveSigningAccountForTransfer({
        client,
        showAlert,
        t,
      });
      if (!signingAccount) return;
      await executeErc20Transfer(signingAccount);
    } catch (err: unknown) {
      showAlert(
        t('common.failed'),
        formatTransferError(err) || t('transfer.transferFailed')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMaxTokens = () => {
    setTransferAmount(String(tokenBalance));
  };

  const formatAddress = (address: string) =>
    `${address.substring(0, 8)}...${address.substring(address.length - 8)}`;

  const handleQRScan = async () => {
    if (Platform.OS === 'web') {
      showAlert(t('transfer.qrNotSupported'), t('transfer.qrWebNotSupported'));
      return;
    }
    if (!permission) {
      showAlert(t('transfer.cameraPermission'), t('transfer.cameraPermissionRequired'));
      return;
    }
    if (!permission.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        showAlert(t('transfer.cameraPermission'), t('transfer.cameraPermissionDenied'));
        return;
      }
    }
    setQrScannerVisible(true);
  };

  const handleQRCodeScanned = ({ data }: { data: string }) => {
    setRecipientAddress(data);
    setQrScannerVisible(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        router.back();
        return true;
      };
      if (Platform.OS === 'android') {
        const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => subscription.remove();
      }
    }, [])
  );

  const rawFromAddress = Array.isArray(transferFromAddress)
    ? transferFromAddress[0]
    : transferFromAddress;

  return (
    <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      {magicWallet ? (
        <magicWallet.Relayer backgroundColor={colors.background.primary} />
      ) : null}
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
          style={[styles.backButton, { backgroundColor: colors.background.secondary }]}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            {t('transfer.title')}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.text.secondary }]}>
            {t('transfer.subtitle')} {t('transfer.details')}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.walletSection}>
          <View
            style={[
              styles.walletCard,
              { backgroundColor: colors.background.card, borderColor: colors.border.primary },
            ]}
          >
            <View style={styles.walletHeader}>
              <Text style={[styles.walletLabel, { color: colors.text.secondary }]}>
                {t('transfer.yourWalletAddress')}
              </Text>
            </View>
            <Text style={[styles.walletAddress, { color: colors.text.primary }]}>
              {rawFromAddress ? formatAddress(rawFromAddress) : '—'}
            </Text>
          </View>
        </View>

        <View style={styles.transferSection}>
          <View
            style={[
              styles.transferForm,
              { backgroundColor: colors.background.card, borderColor: colors.border.primary },
            ]}
          >
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text.primary }]}>
                {t('transfer.amount')}
              </Text>
              <View
                style={[
                  styles.amountInputContainer,
                  {
                    backgroundColor: colors.background.secondary,
                    borderColor: colors.border.primary,
                  },
                ]}
              >
                <TextInput
                  style={[styles.amountInput, { color: colors.text.primary }]}
                  value={transferAmount}
                  onChangeText={setTransferAmount}
                  placeholder={t('transfer.amountPlaceholder')}
                  keyboardType="numeric"
                  placeholderTextColor={colors.text.placeholder}
                />
                <Text style={[styles.currency, { color: colors.text.secondary }]}>
                  {symbol}
                </Text>
              </View>
              <View style={styles.maxTokensContainer}>
                <Text style={[styles.availableText, { color: colors.text.secondary }]}>
                  {t('transfer.available')}: {tokenBalance} {symbol}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.maxButton,
                    {
                      backgroundColor: colors.interactive.hover,
                      borderColor: colors.border.primary,
                    },
                  ]}
                  onPress={handleMaxTokens}
                >
                  <Text style={[styles.maxButtonText, { color: colors.primary }]}>
                    {t('transfer.max')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text.primary }]}>
                {t('transfer.recipientAddress')}
              </Text>
              <View
                style={[
                  styles.addressInputContainer,
                  {
                    backgroundColor: colors.background.secondary,
                    borderColor: colors.border.primary,
                  },
                ]}
              >
                <TextInput
                  style={[styles.addressInput, { color: colors.text.primary }]}
                  value={recipientAddress}
                  onChangeText={setRecipientAddress}
                  placeholder={t('transfer.addressPlaceholder')}
                  placeholderTextColor={colors.text.placeholder}
                />
                <TouchableOpacity
                  style={[
                    styles.qrButton,
                    {
                      backgroundColor: colors.interactive.hover,
                      borderColor: colors.border.primary,
                    },
                  ]}
                  onPress={() => void handleQRScan()}
                >
                  <QrCode size={20} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.transferButton, { backgroundColor: colors.primary }]}
              onPress={() => void handleCheckTransfer()}
            >
              <ArrowRight size={20} color={primaryBtnTextColor} />
              <Text style={[styles.transferButtonText, { color: primaryBtnTextColor }]}>
                {t('transfer.checkTransfer')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Modal
          animationType="slide"
          transparent={false}
          visible={qrScannerVisible}
          onRequestClose={() => setQrScannerVisible(false)}
        >
          <View style={[styles.qrContainer, { backgroundColor: colors.background.primary }]}>
            <View
              style={[
                styles.qrHeader,
                {
                  backgroundColor: colors.background.primary,
                  borderBottomColor: colors.border.primary,
                },
              ]}
            >
              <TouchableOpacity
                style={[styles.qrCloseButton, { backgroundColor: colors.background.secondary }]}
                onPress={() => setQrScannerVisible(false)}
              >
                <X size={24} color={colors.text.primary} />
              </TouchableOpacity>
              <Text style={[styles.qrTitle, { color: colors.text.primary }]}>
                {t('transfer.scanQRCode')}
              </Text>
              <View style={styles.qrHeaderSpacer} />
            </View>
            {Platform.OS !== 'web' && permission?.granted ? (
              <View style={styles.cameraContainer}>
                <CameraView
                  style={styles.camera}
                  facing="back"
                  onBarcodeScanned={handleQRCodeScanned}
                  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                >
                  <View style={styles.scannerOverlay}>
                    <View style={styles.scannerFrame} />
                    <Text style={styles.scannerText}>{t('transfer.pointCameraAtQR')}</Text>
                  </View>
                </CameraView>
              </View>
            ) : (
              <View
                style={[styles.qrPlaceholder, { backgroundColor: colors.background.secondary }]}
              >
                <Camera size={48} color={colors.text.tertiary} />
                <Text style={[styles.qrPlaceholderText, { color: colors.text.primary }]}>
                  {Platform.OS === 'web'
                    ? t('transfer.qrNotSupportedWeb')
                    : t('transfer.cameraPermissionRequired')}
                </Text>
                {Platform.OS !== 'web' && (
                  <TouchableOpacity
                    style={[styles.permissionButton, { backgroundColor: colors.primary }]}
                    onPress={() => void requestPermission()}
                  >
                    <Text style={[styles.permissionButtonText, { color: primaryBtnTextColor }]}>
                      {t('transfer.grantPermission')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </Modal>

        <Modal
          animationType="slide"
          transparent
          visible={confirmationVisible}
          onRequestClose={() => setConfirmationVisible(false)}
        >
          <View style={[styles.modalOverlay, { backgroundColor: colors.background.overlay }]}>
            <View
              style={[styles.confirmationModal, { backgroundColor: colors.background.primary }]}
            >
              <View style={styles.confirmationHeader}>
                <Text style={[styles.confirmationTitle, { color: colors.text.primary }]}>
                  {t('transfer.confirmTransfer')}
                </Text>
                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: colors.background.secondary }]}
                  onPress={() => setConfirmationVisible(false)}
                >
                  <X size={24} color={colors.text.primary} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.confirmationContent} showsVerticalScrollIndicator={false}>
                <View
                  style={[
                    styles.overviewCard,
                    {
                      backgroundColor: colors.background.card,
                      borderColor: colors.border.primary,
                    },
                  ]}
                >
                  <Text style={[styles.overviewTitle, { color: colors.text.primary }]}>
                    {t('transfer.transferOverview')}
                  </Text>
                  <View style={styles.overviewRow}>
                    <Text style={[styles.overviewLabel, { color: colors.text.secondary }]}>
                      {t('transfer.amount')}:
                    </Text>
                    <Text style={[styles.overviewValue, { color: colors.text.primary }]}>
                      {transferAmount} {symbol}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.overviewRow,
                      styles.totalRow,
                      { borderTopColor: colors.border.secondary },
                    ]}
                  >
                    <Text style={[styles.totalLabel, { color: colors.text.primary }]}>
                      {t('transfer.totalAmount')}:
                    </Text>
                    <Text style={[styles.totalValue, { color: colors.text.primary }]}>
                      {Number.parseFloat(transferAmount || '0').toFixed(2)} {symbol}
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.recipientCard,
                    {
                      backgroundColor: colors.background.card,
                      borderColor: colors.border.primary,
                    },
                  ]}
                >
                  <Text style={[styles.recipientTitle, { color: colors.text.primary }]}>
                    {t('transfer.recipientDetails')}
                  </Text>
                  <View style={styles.addressRow}>
                    <Text style={[styles.addressLabel, { color: colors.text.secondary }]}>
                      {t('transfer.recipientAddress')}:
                    </Text>
                    <Text
                      style={[styles.addressValue, { color: colors.text.primary }]}
                      numberOfLines={1}
                    >
                      {formatAddress(recipientAddress)}
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.warningCard,
                    {
                      backgroundColor: colors.background.card,
                      borderColor: colors.warning,
                    },
                  ]}
                >
                  <View style={styles.warningHeader}>
                    <AlertTriangle size={20} color={colors.warning} />
                    <Text style={[styles.warningTitle, { color: colors.warning }]}>
                      {t('transfer.importantNotice')}
                    </Text>
                  </View>
                  <Text style={[styles.warningText, { color: colors.text.primary }]}>
                    {t('transfer.irreversibleWarning')}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setConfirmationChecked(!confirmationChecked)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      { borderColor: colors.border.primary },
                      confirmationChecked && {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                      },
                    ]}
                  >
                    {confirmationChecked ? (
                      <Check size={16} color={primaryBtnTextColor} />
                    ) : null}
                  </View>
                  <Text style={[styles.checkboxText, { color: colors.text.primary }]}>
                    {t('transfer.confirmationText')}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
              <View
                style={[
                  styles.confirmationFooter,
                  {
                    backgroundColor: colors.background.primary,
                    borderTopColor: colors.border.primary,
                  },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    {
                      backgroundColor: confirmationChecked
                        ? colors.primary
                        : colors.interactive.disabled,
                    },
                  ]}
                  onPress={() => void handleConfirmTransfer()}
                  disabled={!confirmationChecked}
                >
                  <ArrowRight size={20} color={primaryBtnTextColor} />
                  <Text style={[styles.confirmButtonText, { color: primaryBtnTextColor }]}>
                    {t('transfer.sendTransfer')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent
        visible={embeddedReauthVisible}
        onRequestClose={closeEmbeddedReauthModal}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.background.overlay }]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, justifyContent: 'flex-end' }}
          >
            <View
              style={[styles.confirmationModal, { backgroundColor: colors.background.primary }]}
            >
              <View style={styles.confirmationHeader}>
                <Text style={[styles.confirmationTitle, { color: colors.text.primary }]}>
                  {t('transfer.embeddedWallet')}
                </Text>
                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: colors.background.secondary }]}
                  onPress={closeEmbeddedReauthModal}
                >
                  <X size={24} color={colors.text.primary} />
                </TouchableOpacity>
              </View>
              <Text
                style={[
                  styles.headerSubtitle,
                  {
                    color: colors.text.secondary,
                    paddingHorizontal: Spacing.xl,
                    marginBottom: Spacing.md,
                  },
                ]}
              >
                {t(
                  embeddedReauthSessionMismatch
                    ? 'transfer.embeddedReauthSessionMismatchSubtitle'
                    : 'transfer.embeddedReauthForTransferSubtitle'
                )}
              </Text>
              <ScrollView
                style={styles.confirmationContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Text
                  style={[
                    styles.label,
                    { color: colors.text.primary, paddingHorizontal: Spacing.xl },
                  ]}
                >
                  {t('transfer.magicLinkEmailLabel')}
                </Text>
                <TextInput
                  value={sessionUserEmail}
                  placeholder={t('profile.emailLabel')}
                  placeholderTextColor={colors.text.placeholder}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  editable={false}
                  style={{
                    marginHorizontal: Spacing.xl,
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
                    styles.maxButton,
                    {
                      marginLeft: Spacing.xl,
                      marginBottom: Spacing.xl,
                      alignSelf: 'flex-start',
                      backgroundColor: colors.interactive.hover,
                      opacity: reauthSendingCode ? 0.6 : 1,
                    },
                  ]}
                  onPress={() => void sendEmbeddedReauthCode()}
                  disabled={reauthSendingCode || reauthConnecting}
                >
                  {reauthSendingCode ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Text style={[styles.maxButtonText, { color: colors.primary }]}>
                      {t('transfer.magicLinkSendCode')}
                    </Text>
                  )}
                </TouchableOpacity>
                <Text
                  style={[
                    styles.label,
                    { color: colors.text.primary, paddingHorizontal: Spacing.xl },
                  ]}
                >
                  {t('transfer.magicLinkCodeLabel')}
                </Text>
                <TextInput
                  value={reauthMagicCode}
                  onChangeText={setReauthMagicCode}
                  placeholder="••••••"
                  placeholderTextColor={colors.text.placeholder}
                  keyboardType="number-pad"
                  editable={!reauthConnecting && !reauthSendingCode}
                  style={{
                    marginHorizontal: Spacing.xl,
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
                    marginHorizontal: Spacing.xl,
                    marginBottom: Spacing['2xl'],
                    backgroundColor: colors.primary,
                    paddingVertical: Spacing.lg,
                    borderRadius: BorderRadius.md,
                    alignItems: 'center',
                    opacity: reauthConnecting ? 0.7 : 1,
                  }}
                  onPress={() => void submitEmbeddedReauthAndTransfer()}
                  disabled={reauthConnecting}
                >
                  {reauthConnecting ? (
                    <ActivityIndicator size="small" color={primaryBtnTextColor} />
                  ) : (
                    <Text
                      style={{
                        fontSize: Typography.fontSize.base,
                        fontFamily: Typography.fontFamily.semiBold,
                        color: primaryBtnTextColor,
                      }}
                    >
                      {t('transfer.embeddedReauthSignInAndSend')}
                    </Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {loading ? (
        <View style={[styles.loadingOverlay, { backgroundColor: colors.background.overlay }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: { flex: 1 },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
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
    headerContent: { flex: 1, alignItems: 'center' },
    headerTitle: {
      fontSize: Spacing['2xl'],
      fontFamily: Typography.fontFamily.bold,
      textAlign: 'center',
    },
    content: { flex: 1 },
    headerSubtitle: {
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.regular,
      textAlign: 'center',
      marginTop: 2,
    },
    walletSection: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.xl },
    walletCard: {
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      borderWidth: 1,
      ...Shadows.md,
    },
    walletHeader: { marginBottom: Spacing.sm },
    walletLabel: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.medium,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    walletAddress: {
      fontSize: Typography.fontSize.xl,
      fontFamily: Typography.fontFamily.bold,
      letterSpacing: -0.2,
    },
    transferSection: { paddingHorizontal: Spacing.xl },
    transferForm: {
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      borderWidth: 1,
      ...Shadows.lg,
    },
    inputContainer: { marginBottom: Spacing.xl },
    label: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.semiBold,
      marginBottom: Spacing.md,
      letterSpacing: -0.1,
    },
    amountInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      ...Shadows.sm,
    },
    maxTokensContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: Spacing.sm,
    },
    availableText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
    },
    maxButton: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
    },
    maxButtonText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.semiBold,
    },
    amountInput: {
      flex: 1,
      padding: Spacing.xl,
      fontSize: Typography.fontSize.xl,
      fontFamily: Typography.fontFamily.semiBold,
      letterSpacing: -0.2,
    },
    currency: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.bold,
      paddingRight: Spacing.xl,
      letterSpacing: -0.1,
    },
    addressInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      ...Shadows.sm,
    },
    addressInput: {
      flex: 1,
      padding: Spacing.xl,
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.regular,
    },
    qrButton: {
      width: 48,
      height: 48,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.sm,
      borderWidth: 1,
      ...Shadows.xs,
    },
    transferButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: BorderRadius.xl,
      paddingVertical: Spacing.xl,
      paddingHorizontal: Spacing['2xl'],
      marginTop: Spacing.lg,
      ...Shadows.button,
    },
    transferButtonText: {
      fontSize: Typography.fontSize.xl,
      fontFamily: Typography.fontFamily.bold,
      marginLeft: Spacing.sm,
      letterSpacing: -0.2,
    },
    qrContainer: { flex: 1 },
    qrHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.xl,
      paddingTop: 60,
      paddingBottom: Spacing.xl,
      borderBottomWidth: 1,
    },
    qrCloseButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      ...Shadows.sm,
    },
    qrTitle: {
      flex: 1,
      fontSize: Typography.fontSize.xl,
      fontFamily: Typography.fontFamily.bold,
      textAlign: 'center',
      letterSpacing: -0.2,
    },
    qrHeaderSpacer: { width: 44 },
    cameraContainer: {
      flex: 1,
      margin: Spacing.xl,
      borderRadius: BorderRadius.xl,
      overflow: 'hidden',
      ...Shadows.lg,
    },
    camera: { flex: 1 },
    scannerOverlay: {
      flex: 1,
      backgroundColor: colors.background.overlay,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scannerFrame: {
      width: 250,
      height: 250,
      borderWidth: 3,
      borderColor: colors.success,
      borderRadius: BorderRadius.xl,
      backgroundColor: 'transparent',
      marginBottom: Spacing['4xl'],
    },
    scannerText: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.semiBold,
      color: colors.text.inverse,
      textAlign: 'center',
      paddingHorizontal: Spacing['4xl'],
      letterSpacing: -0.1,
    },
    qrPlaceholder: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      margin: Spacing.xl,
      borderRadius: BorderRadius.xl,
      padding: Spacing['4xl'],
    },
    qrPlaceholderText: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.semiBold,
      textAlign: 'center',
      marginTop: Spacing.xl,
      marginBottom: Spacing['3xl'],
      letterSpacing: -0.1,
    },
    permissionButton: {
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.lg,
      borderRadius: BorderRadius.lg,
      ...Shadows.button,
    },
    permissionButtonText: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.bold,
      letterSpacing: -0.1,
    },
    modalOverlay: { flex: 1, justifyContent: 'flex-end' },
    confirmationModal: {
      borderTopLeftRadius: BorderRadius.xl,
      borderTopRightRadius: BorderRadius.xl,
      paddingTop: Spacing.xl,
      maxHeight: '85%',
    },
    confirmationHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing.xl,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.primary,
    },
    confirmationTitle: {
      fontSize: Typography.fontSize.xl,
      fontFamily: Typography.fontFamily.bold,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    confirmationContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
    overviewCard: {
      borderRadius: BorderRadius.lg,
      padding: Spacing.xl,
      marginBottom: Spacing.xl,
      borderWidth: 1,
      ...Shadows.md,
    },
    overviewTitle: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.bold,
      marginBottom: Spacing.lg,
    },
    overviewRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    overviewLabel: {
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.medium,
    },
    overviewValue: {
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.semiBold,
    },
    totalRow: {
      borderTopWidth: 1,
      paddingTop: Spacing.md,
      marginTop: Spacing.sm,
      marginBottom: 0,
    },
    totalLabel: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.bold,
    },
    totalValue: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.bold,
    },
    recipientCard: {
      borderRadius: BorderRadius.lg,
      padding: Spacing.xl,
      marginBottom: Spacing.xl,
      borderWidth: 1,
      ...Shadows.sm,
    },
    recipientTitle: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.bold,
      marginBottom: Spacing.md,
    },
    addressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    addressLabel: {
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.medium,
      marginBottom: Spacing.xs,
    },
    addressValue: {
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.regular,
      flex: 1,
    },
    warningCard: {
      borderRadius: BorderRadius.lg,
      padding: Spacing.xl,
      marginBottom: Spacing.xl,
      borderWidth: 2,
      ...Shadows.sm,
    },
    warningHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    warningTitle: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.bold,
      marginLeft: Spacing.sm,
    },
    warningText: {
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.regular,
      lineHeight: 20,
    },
    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: Spacing.xl,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
      marginTop: 2,
    },
    checkboxText: {
      flex: 1,
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.regular,
      lineHeight: 20,
    },
    confirmationFooter: {
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.xl,
      borderTopWidth: 1,
      marginBottom: Spacing['2xl'],
    },
    confirmButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.xl,
      ...Shadows.button,
    },
    confirmButtonText: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.bold,
      marginLeft: Spacing.sm,
    },
  });
