import 'react-native-get-random-values';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Wallet, Mail, ShieldCheck, LogOut } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors, Typography } from '@/constants/theme';
import { userManagement } from '@/hooks/userManagement';
import { walletManagement } from '@/hooks/walletManagement';
import { platformValidation } from '@/hooks/platformValidation';
import { whitelistManagement } from '@/hooks/whitelistManagement';
import { useGlobalAlert } from '@/contexts/AlertContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  navigateAfterLoginSuccess,
  type LoginSuccessPayload,
} from '@/app/auth/authNavigation';
import { hasMagicLinkWalletInResponse } from '@/utils/hasActiveEmbeddedWallet';
import { useShimmerAnim, ShimmerBlock } from '@/components/Shimmer';
import AsseteraLogo from '@/components/AsseteraLogo';
import {
  isMagicEmbeddedWalletAutomaticMode,
  loadStoredMagicEmbeddedWalletMode,
  loadStoredMagicLinkPublicKey,
} from '@/constants/platformSignInOptions';
import {
  createMagicEmbeddedWallet,
  getMagicEmbeddedAccount,
  requestMagicEmailOtpCode,
  verifyMagicEmailOtpLogin,
  type MagicEmailOtpHandle,
} from '@/utils/magicEmbeddedWallet';

const EMBEDDED_WALLET_PROVIDER = 'MAGIC_LINK';

function extractApiErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const m = (error as { message: unknown }).message;
    if (typeof m === 'string') return m;
  }
  if (typeof error === 'string') return error;
  return '';
}

function errorToString(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    const m = (error as { message: unknown }).message;
    if (typeof m === 'string') return m;
  }
  return '';
}

export default function EmbeddedWalletRequiredScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const isDark = theme === 'dark' || theme === 'darkGreen';
  const primaryBtnTextColor = isDark ? '#0D1117' : '#FFFFFF';
  const insets = useSafeAreaInsets();
  const { showAlert } = useGlobalAlert();
  const { signOut } = useAuth();

  const userApiRef = useRef(userManagement());
  const walletServiceRef = useRef(walletManagement());
  const platformRef = useRef(platformValidation());
  const whitelistRef = useRef(whitelistManagement());
  const userApi = userApiRef.current;
  const walletService = walletServiceRef.current;
  const platform = platformRef.current;
  const whitelist = whitelistRef.current;

  const [sessionEmail, setSessionEmail] = useState('');
  const [accountId, setAccountId] = useState('');
  const [accountName, setAccountName] = useState('');
  const [magicLinkPublicKey, setMagicLinkPublicKey] = useState<string | null>(
    null
  );
  const [profileLoading, setProfileLoading] = useState(true);
  const [magicCode, setMagicCode] = useState('');
  const [showCodeStep, setShowCodeStep] = useState(false);
  const [magicCodeSent, setMagicCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [codeInputFocused, setCodeInputFocused] = useState(false);
  const magicOtpHandleRef = useRef<MagicEmailOtpHandle | null>(null);
  const magicWallet = useMemo(
    () =>
      magicLinkPublicKey
        ? createMagicEmbeddedWallet(magicLinkPublicKey, 'polygon')
        : null,
    [magicLinkPublicKey]
  );
  const shimmerAnim = useShimmerAnim();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        scrollContent: {
          flexGrow: 1,
          paddingBottom: 40,
        },
        hero: {
          alignItems: 'center',
          paddingTop: 24,
          paddingBottom: 28,
          paddingHorizontal: 24,
        },
        heroLogo: {
          width: '88%',
          maxWidth: 300,
          aspectRatio: 243 / 46,
        },
        tagline: {
          fontSize: Typography.fontSize.base,
          fontFamily: Typography.fontFamily.regular,
          marginTop: 12,
          textAlign: 'center',
        },
        card: {
          marginHorizontal: 20,
          borderRadius: 24,
          padding: 28,
          borderWidth: 1,
          alignItems: 'center',
        },
        iconBadge: {
          width: 64,
          height: 64,
          borderRadius: 32,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1.5,
          marginBottom: 20,
        },
        title: {
          fontSize: Typography.fontSize['3xl'],
          fontFamily: Typography.fontFamily.bold,
          letterSpacing: -0.3,
          textAlign: 'center',
          marginBottom: 8,
        },
        subtitle: {
          fontSize: Typography.fontSize.base,
          fontFamily: Typography.fontFamily.regular,
          textAlign: 'center',
          lineHeight: 20,
          paddingHorizontal: 4,
        },
        emailPill: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 999,
          borderWidth: 1,
          marginTop: 18,
          maxWidth: '100%',
        },
        emailPillText: {
          fontSize: Typography.fontSize.sm,
          fontFamily: Typography.fontFamily.medium,
          marginLeft: 6,
          flexShrink: 1,
        },
        primaryButton: {
          borderRadius: 12,
          paddingVertical: 15,
          paddingHorizontal: 20,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 50,
          minWidth: 220,
        },
        primaryButtonText: {
          fontSize: Typography.fontSize.lg,
          fontFamily: Typography.fontFamily.semiBold,
          letterSpacing: 0.2,
        },
        secondaryButton: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 12,
          borderWidth: 1.5,
          paddingVertical: 13,
          paddingHorizontal: 16,
          alignSelf: 'stretch',
        },
        secondaryButtonText: {
          fontSize: Typography.fontSize.base,
          fontFamily: Typography.fontFamily.semiBold,
          letterSpacing: 0.2,
        },
        label: {
          fontSize: Typography.fontSize.sm,
          fontFamily: Typography.fontFamily.medium,
          marginTop: 18,
          marginBottom: 8,
          alignSelf: 'flex-start',
        },
        inputRow: {
          flexDirection: 'row',
          alignItems: 'center',
          borderRadius: 12,
          borderWidth: 1.5,
          alignSelf: 'stretch',
        },
        inputIcon: {
          marginLeft: 14,
        },
        input: {
          flex: 1,
          paddingVertical: 14,
          paddingHorizontal: 10,
          fontSize: Typography.fontSize.lg,
          fontFamily: Typography.fontFamily.regular,
          letterSpacing: 1,
        },
        signOutRow: {
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: 24,
          paddingVertical: 6,
          paddingHorizontal: 10,
        },
        signOutText: {
          fontSize: Typography.fontSize.sm,
          fontFamily: Typography.fontFamily.medium,
        },
      }),
    []
  );

  const checkVisibilityStatus = useCallback(async () => {
    const result = await platform.validatePlatform();
    if (result.success && result.data) {
      await AsyncStorage.setItem(
        'offeringID',
        result.data.data.data.selected_offerings[0].id
      );
      const vis = result.data.data.data.visibilityStatus;
      if (vis === 'privatesale' || vis === 'whitelisting') {
        return false;
      }
      return true;
    }
    return undefined;
  }, [platform]);

  const checkStatus = useCallback(async () => {
    try {
      const offeringID = (await AsyncStorage.getItem('offeringID')) ?? '';
      const accountID = (await AsyncStorage.getItem('AccountID')) ?? '';
      const result = await whitelist.checkWhitelistStatus(accountID, offeringID);
      if (result.success && result.data) {
        if (result.data.data.whitelistRequestData.length > 0) {
          if (result.data.data.whitelistRequestData[0].status === 'APPROVED') {
            return 'APPROVED';
          }
          return 'PENDING';
        }
        return 'REQUEST';
      }
      showAlert(
        t('common.error'),
        result.error?.error?.message || t('common.tryAgain')
      );
    } catch {
      /* ignore */
    }
    return undefined;
  }, [whitelist, showAlert, t]);

  const continueAfterWalletReady = useCallback(
    async (payload: LoginSuccessPayload) => {
      await navigateAfterLoginSuccess(
        payload,
        checkVisibilityStatus,
        checkStatus,
        { skipEmbeddedGate: true }
      );
    },
    [checkVisibilityStatus, checkStatus]
  );

  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    try {
      const [publicKey, mode] = await Promise.all([
        loadStoredMagicLinkPublicKey(),
        loadStoredMagicEmbeddedWalletMode(),
      ]);
      setMagicLinkPublicKey(publicKey);
      const data = await userApi.getUser();
      if (!data.success || !data.data) {
        if (data.status === 401) {
          showAlert(t('profile.sessionExpired'), t('profile.loginAgain'));
          router.replace('/auth/login');
        }
        return;
      }
      const payload = data.data.data as LoginSuccessPayload;
      const email = payload.user?.email;
      setSessionEmail(typeof email === 'string' ? email : '');
      setAccountId(
        typeof payload.activeAccount?.id === 'string'
          ? payload.activeAccount.id
          : ''
      );
      setAccountName(
        typeof payload.activeAccount?.name === 'string'
          ? payload.activeAccount.name
          : ''
      );

      if (
        !isMagicEmbeddedWalletAutomaticMode(mode) ||
        hasMagicLinkWalletInResponse(payload)
      ) {
        await continueAfterWalletReady(payload);
      }
    } finally {
      setProfileLoading(false);
    }
  }, [userApi, showAlert, t, continueAfterWalletReady]);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile])
  );

  const registerEmbeddedWallet = useCallback(
    async (account: {
      address: string;
      signMessage: (args: { message: string }) => Promise<string>;
    }) => {
      if (!accountId) {
        showAlert(t('common.error'), t('common.tryAgain'));
        return;
      }
      const addr = account.address;
      const displayName = `${accountName || 'Account'} (${addr.substring(0, 6)}...${addr.substring(addr.length - 6)})`;
      const addRes = await walletService.addWallet(
        addr,
        EMBEDDED_WALLET_PROVIDER,
        displayName,
        accountId
      );
      if (!addRes.success) {
        showAlert(
          t('common.failed'),
          extractApiErrorMessage(addRes.error) || t('transfer.walletAddError')
        );
        return;
      }
      if (addRes.data?.meta?.message === 'Wallet already exists') {
        showAlert(t('transfer.alreadyExist'), t('transfer.walletAlreadyExists'));
        const refreshed = await userApi.getUser();
        if (refreshed.success && refreshed.data) {
          await continueAfterWalletReady(refreshed.data.data as LoginSuccessPayload);
        }
        return;
      }
      const newWalletId = addRes.data.data.wallet.id as string;
      const message = addRes.data.data.wallet.signature_message as string;
      let signature: string;
      try {
        signature = await account.signMessage({ message });
      } catch (e: unknown) {
        showAlert(
          t('common.failed'),
          errorToString(e) || t('transfer.walletVerificationError')
        );
        return;
      }
      const verifyRes = await walletService.checkWalletSignature(
        newWalletId,
        EMBEDDED_WALLET_PROVIDER,
        signature
      );
      if (!verifyRes.success) {
        showAlert(
          t('common.failed'),
          extractApiErrorMessage(verifyRes.error) ||
            t('transfer.walletVerificationError')
        );
        return;
      }
      showAlert(t('common.success'), t('transfer.walletVerified'));
      const refreshed = await userApi.getUser();
      if (refreshed.success && refreshed.data) {
        await continueAfterWalletReady(refreshed.data.data as LoginSuccessPayload);
      }
    },
    [
      accountId,
      accountName,
      walletService,
      showAlert,
      t,
      userApi,
      continueAfterWalletReady,
    ]
  );

  const handlePrimarySignIn = useCallback(() => {
    const email = sessionEmail.trim();
    if (!email) {
      showAlert(t('common.error'), t('auth.embeddedWalletGate.missingEmail'));
      return;
    }
    setMagicCode('');
    setMagicCodeSent(false);
    setShowCodeStep(true);
  }, [sessionEmail, showAlert, t]);

  const resetMagicCodeStep = () => {
    magicOtpHandleRef.current = null;
    setMagicCode('');
    setMagicCodeSent(false);
    setCodeInputFocused(false);
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

  const handleSendCode = async () => {
    const email = sessionEmail.trim();
    if (!email) {
      showAlert(t('common.error'), t('auth.embeddedWalletGate.missingEmail'));
      return;
    }
    if (!magicWallet) {
      showAlert(t('common.error'), t('transfer.embeddedWalletNotAvailable'));
      return;
    }
    setSendingCode(true);
    try {
      const { handle } = await requestMagicEmailOtpCode(magicWallet, email);
      magicOtpHandleRef.current = handle;
      setMagicCode('');
      setMagicCodeSent(true);
      showAlert(t('common.success'), t('transfer.magicLinkCodeSent'));
    } catch (err: unknown) {
      showAlert(
        t('common.error'),
        errorToString(err) || t('transfer.connectingWalletFailed')
      );
      resetMagicCodeStep();
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    const code = magicCode.trim();
    const email = sessionEmail.trim();
    if (!code) {
      showAlert(t('common.error'), t('transfer.magicLinkCodeRequired'));
      return;
    }
    if (!email) {
      showAlert(t('common.error'), t('auth.embeddedWalletGate.missingEmail'));
      return;
    }
    if (!magicWallet) {
      showAlert(t('common.error'), t('transfer.embeddedWalletNotAvailable'));
      return;
    }
    setConnecting(true);
    try {
      const handle = magicOtpHandleRef.current;
      if (!handle || !magicCodeSent) {
        showAlert(t('common.error'), t('transfer.magicLinkFillBoth'));
        return;
      }
      await verifyMagicEmailOtpLogin(handle, code);
      resetMagicCodeStep();
      const account = await getMagicEmbeddedAccount(magicWallet, 'polygon');
      await registerEmbeddedWallet(account);
    } catch (err: unknown) {
      if (isMagicCanceledError(err)) {
        resetMagicCodeStep();
      }
      const msg = err instanceof Error ? err.message : String(err);
      showAlert(
        t('common.failed'),
        msg.includes('User canceled action')
          ? t('transfer.magicOtpCanceledRetry')
          : msg
      );
    } finally {
      setConnecting(false);
    }
  };

  const handleSignOut = () => {
    showAlert(t('account.signOut'), t('account.signOutConfirm'), {
      buttonText: t('account.signOut'),
      buttonCallback: async () => {
        await signOut();
        router.replace('/auth/login');
      },
      secondaryButtonText: t('common.cancel'),
      secondaryButtonCallback: () => {},
    });
  };

  const gradientColors = isDark
    ? ([colors.background.primary, colors.background.secondary, colors.background.tertiary] as const)
    : ([colors.background.secondary, colors.background.primary, colors.background.secondary] as const);
  const activeGradient = [colors.primary, colors.primaryDark] as const;
  const verifyDisabled = connecting || !magicCodeSent;

  if (profileLoading) {
    return (
      <LinearGradient colors={gradientColors} style={{ flex: 1 }}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 24,
            paddingTop: insets.top,
          }}
        >
          <ShimmerBlock anim={shimmerAnim} width={100} height={100} borderRadius={50} />
          <ShimmerBlock
            anim={shimmerAnim}
            width="80%"
            height={26}
            borderRadius={6}
            style={{ marginTop: 28 }}
          />
          <ShimmerBlock
            anim={shimmerAnim}
            width="65%"
            height={16}
            borderRadius={6}
            style={{ marginTop: 12 }}
          />
          <ShimmerBlock
            anim={shimmerAnim}
            width="100%"
            height={48}
            borderRadius={12}
            style={{ marginTop: 32, maxWidth: 320 }}
          />
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={gradientColors} style={{ flex: 1 }}>
      {magicWallet ? (
        <magicWallet.Relayer backgroundColor={colors.background.primary} />
      ) : null}
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 24 },
        ]}
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        extraScrollHeight={Platform.OS === 'ios' ? 24 : 64}
      >
        <View style={styles.hero}>
          <View style={styles.heroLogo}>
            <AsseteraLogo width="100%" height="100%" />
          </View>
          <Text style={[styles.tagline, { color: colors.text.tertiary }]}>
            {t('auth.embeddedWalletGate.tagline')}
          </Text>
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.background.card,
              borderColor: colors.border.primary,
            },
          ]}
        >
          <View
            style={[
              styles.iconBadge,
              {
                backgroundColor: colors.background.tertiary,
                borderColor: colors.primary,
              },
            ]}
          >
            <Wallet size={32} color={colors.primary} strokeWidth={1.8} />
          </View>

          <Text style={[styles.title, { color: colors.text.primary }]}>
            {t('auth.embeddedWalletGate.title')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            {t('auth.embeddedWalletGate.subtitle')}
          </Text>

          {sessionEmail ? (
            <View
              style={[
                styles.emailPill,
                {
                  backgroundColor: colors.background.secondary,
                  borderColor: colors.border.primary,
                },
              ]}
            >
              <Mail size={14} color={colors.text.tertiary} />
              <Text
                style={[styles.emailPillText, { color: colors.text.secondary }]}
                numberOfLines={1}
              >
                {sessionEmail}
              </Text>
            </View>
          ) : null}

          {!showCodeStep ? (
            <TouchableOpacity
              onPress={handlePrimarySignIn}
              disabled={connecting}
              activeOpacity={0.85}
              style={{ marginTop: 24 }}
            >
              <LinearGradient
                colors={activeGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButton}
              >
                <Text
                  style={[styles.primaryButtonText, { color: primaryBtnTextColor }]}
                >
                  {t('auth.embeddedWalletGate.cta')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : null}

          {showCodeStep ? (
            <>
              <TouchableOpacity
                onPress={() => void handleSendCode()}
                disabled={sendingCode}
                activeOpacity={0.85}
                style={[
                  styles.secondaryButton,
                  {
                    backgroundColor: colors.background.secondary,
                    borderColor: colors.border.primary,
                    marginTop: 24,
                  },
                ]}
              >
                {sendingCode ? (
                  <>
                    <Mail
                      size={16}
                      color={colors.text.tertiary}
                      style={{ marginRight: 8 }}
                    />
                    <Text
                      style={[
                        styles.secondaryButtonText,
                        { color: colors.text.secondary },
                      ]}
                      numberOfLines={1}
                    >
                      {t('auth.embeddedWalletGate.sendingCode')}
                    </Text>
                  </>
                ) : (
                  <>
                    <Mail size={16} color={colors.primary} style={{ marginRight: 8 }} />
                    <Text
                      style={[
                        styles.secondaryButtonText,
                        { color: colors.text.primary },
                      ]}
                    >
                      {t('auth.embeddedWalletGate.sendCode')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {magicCodeSent ? (
                <>
                  <Text
                    style={[
                      styles.label,
                      { color: colors.text.primary, marginTop: 20 },
                    ]}
                  >
                    {t('auth.embeddedWalletGate.codeLabel')}
                  </Text>
                  <View
                    style={[
                      styles.inputRow,
                      {
                        backgroundColor: colors.background.secondary,
                        borderColor: codeInputFocused
                          ? colors.primary
                          : colors.border.primary,
                      },
                    ]}
                  >
                    <ShieldCheck
                      size={18}
                      color={codeInputFocused ? colors.primary : colors.text.tertiary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, { color: colors.text.primary }]}
                      placeholder={t('auth.embeddedWalletGate.codePlaceholder')}
                      placeholderTextColor={colors.text.placeholder}
                      value={magicCode}
                      onChangeText={setMagicCode}
                      keyboardType="number-pad"
                      autoCapitalize="none"
                      editable={!connecting}
                      onFocus={() => setCodeInputFocused(true)}
                      onBlur={() => setCodeInputFocused(false)}
                    />
                  </View>
                </>
              ) : null}

              <TouchableOpacity
                onPress={() => void handleVerifyCode()}
                disabled={verifyDisabled}
                activeOpacity={0.85}
                style={{ marginTop: 16, opacity: verifyDisabled ? 0.7 : 1 }}
              >
                <LinearGradient
                  colors={activeGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryButton}
                >
                  <Text
                    style={[styles.primaryButtonText, { color: primaryBtnTextColor }]}
                    numberOfLines={1}
                  >
                    {connecting
                      ? t('auth.embeddedWalletGate.verifying')
                      : t('auth.embeddedWalletGate.verify')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : null}

          <TouchableOpacity
            onPress={handleSignOut}
            activeOpacity={0.7}
            style={styles.signOutRow}
          >
            <LogOut size={14} color={colors.text.tertiary} style={{ marginRight: 6 }} />
            <Text style={[styles.signOutText, { color: colors.text.tertiary }]}>
              {t('account.signOut')}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </LinearGradient>
  );
}
