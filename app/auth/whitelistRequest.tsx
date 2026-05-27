import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  ActivityIndicator,
  Platform,
  Image,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  getColors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { whitelistManagement } from '@/hooks/whitelistManagement';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGlobalAlert } from '@/contexts/AlertContext';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Plus, Shield, Wallet, X } from 'lucide-react-native';
import { userManagement } from '@/hooks/userManagement';
import 'react-native-get-random-values';
import { createThirdwebClient } from 'thirdweb';
import { polygon } from 'thirdweb/chains';
import { createWallet } from 'thirdweb/wallets';
import * as Linking from 'expo-linking';
import { walletManagement } from '@/hooks/walletManagement';
import { useFocusEffect } from '@react-navigation/native';
import {
  filterBlockchainWalletsForDisplayedList,
  isMagicEmbeddedWalletAddEnabled,
  loadStoredMagicLinkPublicKey,
  loadStoredMagicEmbeddedWalletMode,
  type MagicEmbeddedWalletMode,
} from '@/constants/platformSignInOptions';
import { refreshPlatformValidateConfigFromRemote } from '@/utils/refreshPlatformValidateConfig';
import {
  createMagicEmbeddedWallet,
  getLoggedInMagicEmbeddedAccount,
  getMagicEmbeddedAccount,
  requestMagicEmailOtpCode,
  verifyMagicEmailOtpLogin,
  type MagicEmailOtpHandle,
} from '@/utils/magicEmbeddedWallet';

/** Provider value for embedded wallet API — must match backend (same as account wallets). */
const EMBEDDED_WALLET_PROVIDER = 'MAGIC_LINK';

type WalletSigner = {
  address: string;
  signMessage: (args: { message: string }) => Promise<string>;
};

type WhitelistWallet = {
  address: string;
  provider: string;
};

function extractApiErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const m = (error as { message: unknown }).message;
    if (typeof m === 'string') return m;
  }
  if (typeof error === 'string') return error;
  return '';
}

export default function WhitelistRequestScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const colors = getColors(theme);
  const isDark = theme === 'dark' || theme === 'darkGreen';
  const primaryBtnTextColor = isDark ? '#0D1117' : '#FFFFFF';
  const request = whitelistManagement();
  const { showAlert } = useGlobalAlert();
  const { signOut } = useAuth();
  const userApi = useMemo(() => userManagement(), []);
  const walletService = useMemo(() => walletManagement(), []);
  const [walletPopupVisible, setWalletPopupVisible] = useState(false);
  const [addWalletModalVisible, setAddWalletModalVisible] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);
  const [verifyingWallet, setVerifyingWallet] = useState(false);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [activeId, setActiveId] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeName, setActiveName] = useState('');
  const [wallets, setWallets] = useState<WhitelistWallet[]>([]);
  const client = createThirdwebClient({
    clientId: '42ec675f4a00a8f609dcf9cc17f8c1e9',
  });
  const [magicLinkModalVisible, setMagicLinkModalVisible] = useState(false);
  const [sessionUserEmail, setSessionUserEmail] = useState('');
  const [magicCode, setMagicCode] = useState('');
  const [magicCodeStepVisible, setMagicCodeStepVisible] = useState(false);
  const [magicSendingCode, setMagicSendingCode] = useState(false);
  const [magicConnecting, setMagicConnecting] = useState(false);
  const [magicEmbeddedWalletMode, setMagicEmbeddedWalletMode] =
    useState<MagicEmbeddedWalletMode | null>(null);
  const [magicLinkPublicKey, setMagicLinkPublicKey] = useState<string | null>(
    null
  );
  const magicOtpHandleRef = useRef<MagicEmailOtpHandle | null>(null);
  const magicWallet = useMemo(
    () =>
      magicLinkPublicKey
        ? createMagicEmbeddedWallet(magicLinkPublicKey, 'polygon')
        : null,
    [magicLinkPublicKey]
  );

  const walletTypes = useMemo(() => {
    const base: Array<{
      type: string;
      label: string;
      available: boolean;
      description: string;
    }> = [
      {
        type: 'METAMASK',
        label: t('transfer.metaMask'),
        available: true,
        description: t('whitelistRequest.metamaskDesc'),
      },
    ];
    if (isMagicEmbeddedWalletAddEnabled(magicEmbeddedWalletMode, magicLinkPublicKey)) {
      base.push({
        type: EMBEDDED_WALLET_PROVIDER,
        label: t('transfer.embeddedWallet'),
        available: true,
        description: t('transfer.embeddedWalletDescription'),
      });
    }
    return base;
  }, [t, magicEmbeddedWalletMode, magicLinkPublicKey]);

  const getUser = useCallback(async () => {
    await refreshPlatformValidateConfigFromRemote();
    const mode = await loadStoredMagicEmbeddedWalletMode();
    const publicKey = await loadStoredMagicLinkPublicKey();
    setMagicEmbeddedWalletMode(mode);
    setMagicLinkPublicKey(publicKey);
    const data = await userApi.getUser();
    if (data.success && data.data) {
      await AsyncStorage.setItem('AccountID', data.data.data.activeAccount.id);
      const rawList = data.data.data.activeAccount.blockchainWallets ?? [];
      const filtered = filterBlockchainWalletsForDisplayedList(rawList, mode);
      const metawallets = filtered
        .map((wallet) => ({
          address: String((wallet as { public_address?: string }).public_address ?? ''),
          provider: String(wallet.blockchain_provider ?? ''),
        }))
        .filter((wallet) => wallet.address.length > 0);
      setWallets(metawallets);
      setActiveId(data.data.data.activeAccount.id);
      setActiveName(data.data.data.activeAccount.name);
      const userEmail = data.data.data.user?.email;
      setSessionUserEmail(typeof userEmail === 'string' ? userEmail : '');
    } else if (data.status === 401) {
      showAlert(t('profile.sessionExpired'), t('profile.loginAgain'));
      router.replace('/auth/login');
    }
  }, [showAlert, t, userApi]);

  useFocusEffect(
    useCallback(() => {
      void getUser();
    }, [getUser])
  );

  useEffect(() => {
    void getUser();
  }, [getUser]);

  const handleRequest = async () => {
    setLoading(true);
    const offeringID = (await AsyncStorage.getItem('offeringID')) ?? '';
    const result = await request.whiteListRequest(
      await AsyncStorage.getItem('AccountID'),
      offeringID
    );
    setLoading(false);
    if (result.success) {
      router.replace('/screens/whitelistResponseWaiting');
    } else {
      showAlert(t('common.error'), result.error.message || t('common.tryAgain'));
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.replace('/auth/login');
  };

  const closeMagicLinkModal = () => {
    magicOtpHandleRef.current?.emit('cancel');
    magicOtpHandleRef.current = null;
    setMagicLinkModalVisible(false);
    setMagicConnecting(false);
    setMagicSendingCode(false);
    setMagicCode('');
    setMagicCodeStepVisible(false);
  };

  const resetMagicCodeStep = () => {
    magicOtpHandleRef.current = null;
    setMagicCode('');
    setMagicCodeStepVisible(false);
  };

  const isMagicCanceledError = (error: unknown): boolean => {
    if (!error || typeof error !== 'object') return false;
    const record = error as Record<string, unknown>;
    const code =
      typeof record.code === 'string' || typeof record.code === 'number'
        ? String(record.code).toLowerCase()
        : '';
    let messageValue = '';
    if (typeof record.message === 'string') {
      messageValue = record.message;
    } else if (typeof record.rawMessage === 'string') {
      messageValue = record.rawMessage;
    }
    const message = messageValue.toLowerCase();
    return code.includes('cancel') || message.includes('cancel');
  };

  const addWalletApi = async (
    address: string,
    provider: string,
    name: string,
    accountId: string,
    wallet: WalletSigner
  ) => {
    closeMagicLinkModal();
    setAddWalletModalVisible(false);
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
        clearTimerAndFinish();
        showAlert(
          t('common.failed'),
          extractApiErrorMessage(response.error) || t('transfer.walletAddError')
        );
        return;
      }

      if (response.data.meta.message === 'Wallet already exists') {
        clearTimerAndFinish();
        showAlert(
          t('transfer.alreadyExist'),
          t('transfer.walletAlreadyExists')
        );
        await getUser();
        return;
      }

      const walletId = response.data.data.wallet.id;
      const message = response.data.data.wallet.signature_message;
      const signature = await wallet.signMessage({ message });
      if (timeoutReached) return;

      const res = await walletService.checkWalletSignature(
        walletId,
        provider,
        signature
      );
      if (timeoutReached) return;
      clearTimerAndFinish();

      if (res.success) {
        showAlert(t('common.success'), t('transfer.walletVerified'));
        await getUser();
        return;
      }

      showAlert(
        t('common.failed'),
        extractApiErrorMessage(res.error) || t('transfer.walletVerificationError')
      );
      await getUser();
    } catch (error: unknown) {
      if (timeoutReached) return;
      clearTimerAndFinish();
      const msg = error instanceof Error ? error.message : String(error);
      showAlert(
        t('common.failed'),
        msg.includes('User rejected the request.')
          ? t('transfer.walletVerificationError')
          : msg || t('transfer.connectingWalletFailed')
      );
    }
  };

  const addWallet = async (type: string) => {
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
      setMagicCode('');
      setMagicCodeStepVisible(false);
      const email = sessionUserEmail.trim();
      if (!email) {
        showAlert(t('common.error'), t('transfer.embeddedWalletNoAccountEmail'));
        return;
      }
      if (!magicWallet) {
        showAlert(t('common.error'), t('transfer.embeddedWalletNotAvailable'));
        return;
      }
      try {
        const loggedInAccount = await getLoggedInMagicEmbeddedAccount(
          magicWallet,
          email,
          'polygon'
        );
        if (loggedInAccount) {
          await addWalletApi(
            loggedInAccount.address,
            EMBEDDED_WALLET_PROVIDER,
            `${activeName} (${loggedInAccount.address.substring(0, 6)}...${loggedInAccount.address.substring(loggedInAccount.address.length - 6)})`,
            activeId,
            loggedInAccount
          );
          return;
        }
      } catch {
        /* Fall back to OTP modal. */
      }
      setMagicLinkModalVisible(true);
      return;
    }

    connectWallet(type as 'METAMASK' | 'walletconnect');
  };

  const sendMagicLinkCode = async () => {
    const email = sessionUserEmail.trim();
    if (!email) {
      showAlert(t('common.error'), t('transfer.embeddedWalletNoAccountEmail'));
      return;
    }
    if (!magicWallet) {
      showAlert(t('common.error'), t('transfer.embeddedWalletNotAvailable'));
      return;
    }
    setMagicSendingCode(true);
    try {
      const loggedInAccount = await getLoggedInMagicEmbeddedAccount(
        magicWallet,
        email,
        'polygon'
      );
      if (loggedInAccount) {
        setMagicSendingCode(false);
        closeMagicLinkModal();
        await addWalletApi(
          loggedInAccount.address,
          EMBEDDED_WALLET_PROVIDER,
          `${activeName} (${loggedInAccount.address.substring(0, 6)}...${loggedInAccount.address.substring(loggedInAccount.address.length - 6)})`,
          activeId,
          loggedInAccount
        );
        return;
      }
      const { handle } = await requestMagicEmailOtpCode(magicWallet, email);
      magicOtpHandleRef.current = handle;
      setMagicCode('');
      setMagicCodeStepVisible(true);
      showAlert(t('common.success'), t('transfer.magicLinkCodeSent'));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showAlert(t('common.error'), msg || t('transfer.connectingWalletFailed'));
      resetMagicCodeStep();
    } finally {
      setMagicSendingCode(false);
    }
  };

  const submitMagicLinkWallet = async () => {
    const email = sessionUserEmail.trim();
    const code = magicCode.trim();
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
    setMagicConnecting(true);
    try {
      const handle = magicOtpHandleRef.current;
      if (!handle || !magicCodeStepVisible) {
        showAlert(t('common.error'), t('transfer.magicLinkFillBoth'));
        return;
      }
      await verifyMagicEmailOtpLogin(handle, code);
      resetMagicCodeStep();
      const account = await getMagicEmbeddedAccount(magicWallet, 'polygon');
      closeMagicLinkModal();
      await addWalletApi(
        account.address,
        EMBEDDED_WALLET_PROVIDER,
        `${activeName} (${account.address.substring(0, 6)}...${account.address.substring(account.address.length - 6)})`,
        activeId,
        account
      );
    } catch (err: unknown) {
      if (isMagicCanceledError(err)) {
        resetMagicCodeStep();
      }
      const msg = err instanceof Error ? err.message : String(err);
      showAlert(
        t('common.failed'),
        msg.includes('User canceled action')
          ? t('transfer.magicOtpCanceledRetry')
          : msg || t('transfer.connectingWalletFailed')
      );
    } finally {
      setMagicConnecting(false);
    }
  };

  const getWalletTypeLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case 'fireblocks':
        return t('transfer.fireblocks');
      case 'metamask':
        return t('transfer.metaMask');
      case 'thirdweb':
      case 'magic_link':
        return t('transfer.embeddedWallet');
      case 'walletconnect':
        return t('transfer.walletConnect');
      default:
        return type;
    }
  };

  const connectWallet = async (type: 'METAMASK' | 'walletconnect') => {
    setConnectingWallet(type);
    if (type === 'METAMASK') {
      connectMetaMask(type);
    } else {
      setTimeout(() => {
        showAlert(
          t('transfer.comingSoon'),
          `${getWalletTypeLabel(type)} ${t('transfer.integrationSoon')}`
        );
        setConnectingWallet(null);
      }, 2000);
    }
  };

  const getWalletTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'fireblocks':
        return colors.success;
      case 'metamask':
        return colors.warning;
      case 'thirdweb':
      case 'magic_link':
        return colors.primary;
      case 'walletconnect':
        return colors.info;
      default:
        return colors.text.tertiary;
    }
  };

  const renderWalletTypeIcon = (type: string) => {
    const lower = type.toLowerCase();
    if (lower === 'metamask') {
      return (
        <Image
          source={require('../../assets/images/metamask_icon.png')}
          style={{ width: 28, height: 28 }}
          resizeMode="contain"
        />
      );
    }
    if (lower === 'thirdweb' || lower === 'magic_link') {
      return (
        <Image
          source={require('../../assets/images/embedded-wallet.jpeg')}
          style={{ width: 28, height: 28 }}
          resizeMode="contain"
        />
      );
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

  const connectMetaMask = async (type: string) => {
    try {
      const metamaskWallet = createWallet('io.metamask');
      const canOpen = await Linking.canOpenURL('metamask://');
      if (!canOpen) {
        showAlert(
          t('whitelistRequest.metamaskNotInstalled'),
          t('whitelistRequest.installMetaMaskDesc'),
          {
            buttonText: t('whitelistRequest.installMetaMaskButton'),
            buttonCallback: () => {
              void Linking.openURL(
                Platform.OS === 'ios'
                  ? 'https://apps.apple.com/app/metamask/id1438144202'
                  : 'https://play.google.com/store/apps/details?id=io.metamask'
              );
            },
            secondaryButtonText: t('common.cancel'),
          }
        );
        setAddWalletModalVisible(false);
        setConnectingWallet(null);
        return;
      }

      const wallet = await metamaskWallet.connect({
        client,
        chain: polygon,
      });

      setAddWalletModalVisible(false);
      setConnectingWallet(null);

      await addWalletApi(
        wallet.address,
        type,
        `${activeName} (${wallet.address.substring(0, 6)}...${wallet.address.substring(wallet.address.length - 6)})`,
        activeId,
        wallet
      );
    } catch (err: unknown) {
      setAddWalletModalVisible(false);
      setConnectingWallet(null);
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes('is the app installed')) {
        showAlert(
          t('whitelistRequest.metamaskNotInstalled'),
          t('whitelistRequest.installMetaMaskDesc'),
          {
            buttonText: t('whitelistRequest.installMetaMaskButton'),
            buttonCallback: () => {
              void Linking.openURL(
                Platform.OS === 'ios'
                  ? 'https://apps.apple.com/app/metamask/id1438144202'
                  : 'https://play.google.com/store/apps/details?id=io.metamask'
              );
            },
            secondaryButtonText: t('common.cancel'),
          }
        );
      } else {
        showAlert(
          t('common.error'),
          errorMessage || t('transfer.connectingWalletFailed')
        );
      }
    }
  };

  return (
    <LinearGradient colors={colors.gradient.secondary} style={styles.gradient}>
      {magicWallet ? (
        <magicWallet.Relayer backgroundColor={colors.background.primary} />
      ) : null}
      <TouchableOpacity
        style={[
          styles.logoutBtn,
          { top: insets.top + 10, backgroundColor: colors.background.card },
        ]}
        onPress={() =>
          showAlert(t('common.logout'), t('common.logoutMsg'), {
            buttonText: t('common.logout'),
            buttonCallback: () => {
              void handleLogout();
            },
            secondaryButtonText: t('common.cancel'),
          })
        }
      >
        <LogOut size={22} color={colors.text.primary} />
      </TouchableOpacity>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingBottom: Math.max(insets.bottom, 30) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[styles.card, { backgroundColor: colors.background.card }]}
        >
          <Text style={[styles.title, { color: colors.text.primary }]}>
            {t('whitelistRequest.title')}
          </Text>

          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            {t('whitelistRequest.subtitle')}
          </Text>

          <TouchableOpacity
            style={[styles.buttonPrimary, { backgroundColor: colors.primary }]}
            disabled={loading || verifyingWallet}
            onPress={() => {
              void handleRequest();
            }}
          >
            {loading ? (
              <ActivityIndicator size="small" color={primaryBtnTextColor} />
            ) : (
              <Text style={[styles.buttonText, { color: primaryBtnTextColor }]}>
                {t('whitelistRequest.requestAccess')}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.buttonPrimary, { backgroundColor: colors.primary }]}
            disabled={verifyingWallet}
            onPress={() => {
              setAddWalletModalVisible(true);
            }}
          >
            <Text style={[styles.buttonText, { color: primaryBtnTextColor }]}>
              {t('whitelistRequest.addWallet')}
            </Text>
          </TouchableOpacity>

          {wallets.length > 0 ? (
            <TouchableOpacity
              style={[
                styles.buttonSecondary,
                { borderColor: colors.border.primary },
              ]}
              onPress={() => {
                setWalletPopupVisible(true);
              }}
            >
              <Text style={[styles.buttonText, { color: colors.text.primary }]}>
                {t('whitelistRequest.showWallets')}
              </Text>
            </TouchableOpacity>
          ) : null}

          <Modal
            visible={walletPopupVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setWalletPopupVisible(false)}
          >
            <View
              style={[
                styles.popupOverlay,
                { backgroundColor: colors.background.overlay },
              ]}
            >
              <View
                style={[
                  styles.popupContainer,
                  { backgroundColor: colors.background.card },
                ]}
              >
                <Text
                  style={[styles.popupTitle, { color: colors.text.primary }]}
                >
                  {t('whitelistRequest.walletAddress')}
                </Text>

                <ScrollView style={{ maxHeight: 220 }}>
                  {wallets.map((item) => (
                    <TouchableOpacity
                      key={`${item.provider}-${item.address}`}
                      style={[
                        styles.addressRow,
                        { borderBottomColor: colors.border.primary },
                      ]}
                      onPress={() => {
                        setWalletPopupVisible(false);
                      }}
                    >
                      {(() => {
                        const prov = String(item.provider ?? '').toLowerCase();
                        const iconBg = `${colors.primary}20`;
                        if (prov === 'metamask') {
                          return (
                            <View
                              style={[
                                styles.optionIcon,
                                { backgroundColor: iconBg },
                              ]}
                            >
                              <Image
                                source={require('../../assets/images/metamask_icon.png')}
                                style={{ width: 15, height: 15 }}
                                resizeMode="contain"
                              />
                            </View>
                          );
                        }
                        if (prov === 'magic_link' || prov === 'thirdweb') {
                          return (
                            <View
                              style={[
                                styles.optionIcon,
                                { backgroundColor: iconBg },
                              ]}
                            >
                              <Image
                                source={require('../../assets/images/embedded-wallet.jpeg')}
                                style={{ width: 15, height: 15 }}
                                resizeMode="contain"
                              />
                            </View>
                          );
                        }
                        return (
                          <View
                            style={[
                              styles.optionIcon,
                              { backgroundColor: iconBg },
                            ]}
                          >
                            <Image
                              source={require('../../assets/images/concordium_icon.jpeg')}
                              style={{ width: 15, height: 15 }}
                              resizeMode="contain"
                            />
                          </View>
                        );
                      })()}
                      <Text
                        style={[
                          styles.copyAddressText,
                          { color: colors.text.primary },
                        ]}
                      >
                        {item.address}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <TouchableOpacity
                  style={styles.popupClose}
                  onPress={() => setWalletPopupVisible(false)}
                >
                  <X size={20} color={colors.text.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Modal
            animationType="slide"
            transparent
            visible={addWalletModalVisible}
            onRequestClose={() => {
              setAddWalletModalVisible(false);
              setConnectingWallet(null);
            }}
          >
            <View
              style={[
                styles.modalOverlay,
                { backgroundColor: colors.background.overlay },
              ]}
            >
              <View
                style={[
                  styles.modalContent,
                  { backgroundColor: colors.background.primary },
                ]}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {t('transfer.addWallet')}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.closeButton,
                      { backgroundColor: colors.background.secondary },
                    ]}
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
                        {
                          backgroundColor: colors.background.secondary,
                          borderColor: colors.border.primary,
                        },
                        !walletType.available && styles.walletTypeDisabled,
                        connectingWallet === walletType.type &&
                          styles.walletTypeConnecting,
                      ]}
                      onPress={() =>
                        walletType.available
                          ? void addWallet(walletType.type)
                          : undefined
                      }
                      disabled={
                        !walletType.available || connectingWallet !== null
                      }
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
                        {connectingWallet === walletType.type ? (
                          <ActivityIndicator
                            size="small"
                            color={getWalletTypeColor(walletType.type)}
                          />
                        ) : (
                          renderWalletTypeIcon(walletType.type)
                        )}
                      </View>
                      <View style={styles.walletTypeInfo}>
                        <Text
                          style={[
                            styles.walletTypeName,
                            !walletType.available &&
                              styles.walletTypeNameDisabled,
                          ]}
                        >
                          {walletType.label}
                        </Text>
                        {walletType.description && walletType.available ? (
                          <Text style={styles.walletTypeDescription}>
                            {walletType.description}
                          </Text>
                        ) : null}
                        {!walletType.available ? (
                          <Text style={styles.comingSoonText}>
                            {t('transfer.comingSoon')}
                          </Text>
                        ) : null}
                        {connectingWallet === walletType.type ? (
                          <Text style={styles.connectingText}>
                            {t('common.loading')}
                          </Text>
                        ) : null}
                      </View>
                      {walletType.available &&
                        connectingWallet !== walletType.type && (
                          <Plus size={20} color={colors.success} />
                        )}
                    </TouchableOpacity>
                  ))}
                </View>

                {verifyingWallet ? (
                  <View
                    style={[
                      styles.verificationOverlay,
                      { backgroundColor: colors.background.overlay },
                    ]}
                  >
                    <View
                      style={[
                        styles.verificationCard,
                        { backgroundColor: colors.background.card },
                      ]}
                    >
                      <Shield size={32} color={colors.success} />
                      <Text style={styles.verificationTitle}>
                        {t('whitelistRequest.verifyingWallet')}
                      </Text>
                      <Text style={styles.verificationText}>
                        {t('whitelistRequest.signMessageDesc')}
                      </Text>
                      <ActivityIndicator
                        size="large"
                        color={colors.primary}
                        style={styles.verificationLoader}
                      />
                    </View>
                  </View>
                ) : null}
              </View>
            </View>
          </Modal>

          <Modal
            animationType="slide"
            transparent
            visible={magicLinkModalVisible}
            onRequestClose={closeMagicLinkModal}
          >
            <View
              style={[
                styles.modalOverlay,
                { backgroundColor: colors.background.overlay },
              ]}
            >
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1, justifyContent: 'flex-end' }}
              >
                <View
                  style={[
                    styles.modalContent,
                    { backgroundColor: colors.background.primary },
                  ]}
                >
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>
                      {t('transfer.embeddedWallet')}
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.closeButton,
                        { backgroundColor: colors.background.secondary },
                      ]}
                      onPress={closeMagicLinkModal}
                    >
                      <X size={24} color={colors.text.secondary} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.modalSubtitle}>
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
                    style={{
                      alignSelf: 'flex-start',
                      marginBottom: Spacing.xl,
                      opacity: magicSendingCode ? 0.6 : 1,
                    }}
                    onPress={() => void sendMagicLinkCode()}
                    disabled={magicSendingCode || magicConnecting}
                  >
                    {magicSendingCode ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Text
                        style={{
                          fontSize: Typography.fontSize.base,
                          fontFamily: Typography.fontFamily.semiBold,
                          color: colors.primary,
                        }}
                      >
                        {t('transfer.magicLinkSendCode')}
                      </Text>
                    )}
                  </TouchableOpacity>
                  {magicCodeStepVisible ? (
                    <>
                      <Text style={styles.modalSubtitle}>
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
                    </>
                  ) : null}
                  <TouchableOpacity
                    style={{
                      backgroundColor: colors.primary,
                      paddingVertical: Spacing.lg,
                      borderRadius: BorderRadius.md,
                      alignItems: 'center',
                      opacity:
                        magicConnecting || !magicCodeStepVisible ? 0.7 : 1,
                    }}
                    onPress={() => void submitMagicLinkWallet()}
                    disabled={magicConnecting || !magicCodeStepVisible}
                  >
                    {magicConnecting ? (
                      <ActivityIndicator
                        size="small"
                        color={primaryBtnTextColor}
                      />
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

          <View style={styles.footerNote}>
            <View
              style={[styles.dot, { backgroundColor: colors.text.tertiary }]}
            />
            <Text style={[styles.noteText, { color: colors.text.secondary }]}>
              {t('whitelistRequest.reviewNotice')}
            </Text>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.text.secondary }]}>
              {t('common.poweredBy')}{' '}
            </Text>
            <Text style={[styles.brandText, { color: colors.primary }]}>
              {t('common.brandName')}
            </Text>
          </View>
        </View>
      </ScrollView>

      {verifyingWallet ? (
        <View
          style={[
            styles.verificationOverlay,
            { backgroundColor: colors.background.overlay },
          ]}
        >
          <View
            style={[
              styles.verificationCard,
              { backgroundColor: colors.background.card },
            ]}
          >
            <Shield size={32} color={colors.success} />
            <Text style={styles.verificationTitle}>
              {t('whitelistRequest.verifyingWallet')}
            </Text>
            <Text style={styles.verificationText}>
              {t('whitelistRequest.signMessageDesc')}
            </Text>
            <ActivityIndicator
              size="large"
              color={colors.primary}
              style={styles.verificationLoader}
            />
          </View>
        </View>
      ) : null}
    </LinearGradient>
  );
};

const createStyles = (colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    gradient: {
      flex: 1,
    },
    container: {
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing['3xl'],
      paddingTop: Spacing['5xl'],
    },
    card: {
      borderRadius: Spacing['3xl'],
      padding: Spacing['3xl'],
      ...Shadows.lg,
      width: '100%',
    },
    title: {
      fontSize: Typography.fontSize['5xl'],
      fontFamily: Typography.fontFamily.bold,
      textAlign: 'center',
      marginBottom: Spacing.lg,
    },
    subtitle: {
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.regular,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: Spacing['4xl'],
    },
    buttonPrimary: {
      width: '100%',
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.lg,
      alignItems: 'center',
      marginBottom: Spacing.md,
      ...Shadows.button,
    },
    buttonSecondary: {
      width: '100%',
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.lg,
      alignItems: 'center',
      borderWidth: 1,
      marginBottom: Spacing.xs,
    },
    buttonText: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.semiBold,
    },
    footerNote: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing['5xl'],
      marginTop: Spacing.lg,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginRight: 8,
    },
    noteText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      textAlign: 'center',
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'center',
    },
    footerText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
    },
    brandText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.medium,
    },
    logoutBtn: {
      position: 'absolute',
      right: 20,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 10,
      zIndex: 999,
    },
    addressRow: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    popupClose: {
      position: 'absolute',
      top: 12,
      right: 12,
      padding: 10,
      zIndex: 999,
      borderRadius: 15,
    },
    optionIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
    },
    copyAddressText: {
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.semiBold,
      flex: 1,
    },
    popupOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    popupContainer: {
      width: '85%',
      borderRadius: 20,
      padding: 20,
    },
    popupTitle: {
      fontSize: 18,
      fontFamily: Typography.fontFamily.semiBold,
      marginBottom: 15,
      textAlign: 'left',
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    modalContent: {
      borderTopLeftRadius: BorderRadius.xl,
      borderTopRightRadius: BorderRadius.xl,
      paddingTop: Spacing.xl,
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing['3xl'],
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
      padding: Spacing.lg,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
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
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      paddingHorizontal: Spacing.xl,
    },
    verificationCard: {
      borderRadius: BorderRadius.xl,
      padding: Spacing['3xl'],
      alignItems: 'center',
      margin: Spacing.xl,
      maxWidth: 340,
      width: '100%',
    },
    verificationTitle: {
      fontSize: Typography.fontSize.xl,
      fontFamily: Typography.fontFamily.bold,
      color: colors.text.primary,
      marginTop: Spacing.lg,
      marginBottom: Spacing.sm,
      textAlign: 'center',
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
  });
