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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ArrowRight, QrCode, X, Camera, Check, TriangleAlert as AlertTriangle, ArrowLeft } from 'lucide-react-native';
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
} from 'thirdweb';
import { transfer, balanceOf } from "thirdweb/extensions/erc20";
import { sepolia, defineChain } from 'thirdweb/chains';
import { isAddress } from "thirdweb/utils";
import { useSendTransaction } from 'thirdweb/react';
import { createWallet } from 'thirdweb/wallets';



const CLIENT_ID = "42ec675f4a00a8f609dcf9cc17f8c1e9"; // your Thirdweb client ID
const TOKEN_CONTRACT_ADDRESS = "0xdd666711e0e51abee057083cdc87517a5f82dee8"; // your ERC20 token
const CUSTOM_SEPOLIA = defineChain({
  id: 11155111,
  name: "Sepolia Testnet",
  testnet: true,
});

export default function TransferScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const [transferAmount, setTransferAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [qrScannerVisible, setQrScannerVisible] = useState(false);
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const { showAlert } = useGlobalAlert();
  const { transferFromAddress, publicAddress, tokenBalance, symbol } = useLocalSearchParams();
  const { data: txResult, error, isPending } = useSendTransaction();
  const [loading, setLoading] = useState(false);
  const client = createThirdwebClient({
    clientId: "42ec675f4a00a8f609dcf9cc17f8c1e9",
  });

  useFocusEffect(
    React.useCallback(() => {
      // Clear fields every time screen comes into focus
      setTransferAmount('');
      setRecipientAddress('');
      setConfirmationChecked(false);
      setConfirmationVisible(false);
    }, [])
  );

  useEffect(() => {
    console.log("txResult...", publicAddress);
    if (isPending) {
      console.log("⏳ Transaction is being signed…");
    }

    if (txResult) {
      console.log("✅ TX Success!");
      console.log("TX HASH:", txResult.transactionHash);
      showAlert(t('common.success'), t('transfer.transferSuccess'));
    }

    if (error) {
      console.log("❌ TX Failed:", error.message);
    }
  }, [isPending, txResult, error]);

  const validateEvmAddress = (address: string) => {
    return isAddress(address); // returns true / false
  };

  const handleCheckTransfer = async () => {
    const contract = getContract({
      client,
      chain: sepolia,
      address: Array.isArray(publicAddress) ? publicAddress[0] : publicAddress,
    });
    const balance = await balanceOf({
      contract,
      address: '0xEEB15F9d8e49eabeE464971d5a909999EeA6cf39',
    });
    console.log("BALANCE...", balance);
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
      showAlert(t('common.error'), `${t('transfer.insufficientTokens')} ${tokenBalance} ${symbol}`);
      return;
    }

    setConfirmationVisible(true);
  };

  const handleConfirmTransfer = async () => {
    setLoading(true)
    setConfirmationVisible(false);
    setConfirmationChecked(false);
    if (!confirmationChecked) {
      showAlert(t('common.error'), t('transfer.confirmationRequired'));
      return;
    }
    const amount = Number.parseFloat(transferAmount);

    try {
      const metamaskWallet = createWallet('io.metamask');
      const canOpen = await Linking.canOpenURL('metamask://');
      if (!canOpen) {
        showAlert(
          t('transfer.metaMaskNotInstalled'),
          t('transfer.installMetaMaskDesc'),
          {
            buttonText: t('transfer.installMetaMask'),
            buttonCallback: () =>
              void Linking.openURL(
                Platform.OS === 'ios'
                  ? 'https://apps.apple.com/app/metamask/id1438144202'
                  : 'https://play.google.com/store/apps/details?id=io.metamask'
              ),
            secondaryButtonText: t('common.cancel'),
          }
        );
        return;
      }
      await metamaskWallet.connect({
        client, chain: sepolia
      });

      console.log("METAMASK WALLET:", publicAddress);

      const contract = getContract({
        client,
        chain: sepolia,
        address: Array.isArray(publicAddress) ? publicAddress[0] : publicAddress,
      });
      
      const tx = transfer({
        contract,
        to: recipientAddress,
        amount,
      });

      const result = await sendTransaction({
        account: metamaskWallet.getAccount()!,
        transaction: tx,
      });

      const receipt = await waitForReceipt(result);

      console.log("RECEIPT:", receipt);

      if (receipt.status === "success") {
        showAlert(
          t('common.success'),
          t('transfer.tokenTransferredSuccessfully'),
          {
            buttonText: t('common.done'),
            buttonCallback: () => {
              router.back();
            },
          }
        );
      } else {
        showAlert(
          t('common.failed'),
          t('transfer.transactionFailed')
        );
      }

      setLoading(false)
      setTransferAmount('');
      setRecipientAddress('');
    } catch (err: any) {
      console.error("❌ Transfer failed:", err.message);
      showAlert(t('common.failed'), err.message || t('transfer.transferFailed'));
    }
    finally {
      setLoading(false)
    }

  };

  const handleMaxTokens = () => {
    setTransferAmount(tokenBalance.toString());
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 8)}...${address.substring(address.length - 8)}`;
  };

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

  // Handle hardware back button on Android
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        router.back();
        return true; // Prevent default behavior
      };

      if (Platform.OS === 'android') {
        const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => subscription?.remove();
      }
    }, [])
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 44) + 16, backgroundColor: colors.background.primary, borderBottomColor: colors.border.primary }]}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.background.secondary }]} onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>{t('transfer.title')}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.text.secondary }]}>{t('transfer.subtitle')} {t('transfer.details')}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >

        {/* Wallet Address Display */}
        <View style={styles.walletSection}>
          <View style={[styles.walletCard, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}>
            <View style={styles.walletHeader}>
              <Text style={[styles.walletLabel, { color: colors.text.secondary }]}>{t('transfer.yourWalletAddress')}</Text>
            </View>
            <Text style={[styles.walletAddress, { color: colors.text.primary }]}>
              {formatAddress(Array.isArray(transferFromAddress) ? transferFromAddress[0] : transferFromAddress)}
            </Text>
          </View>
        </View>

        {/* Transfer Form */}
        <View style={styles.transferSection}>
          <View style={[styles.transferForm, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text.primary }]}>{t('transfer.amount')}</Text>
              <View style={[styles.amountInputContainer, { backgroundColor: colors.background.secondary, borderColor: colors.border.primary }]}>
                <TextInput
                  style={[styles.amountInput, { color: colors.text.primary }]}
                  value={transferAmount}
                  onChangeText={setTransferAmount}
                  placeholder={t('transfer.amountPlaceholder')}
                  keyboardType="numeric"
                  placeholderTextColor={colors.text.placeholder}
                />
                <Text style={[styles.currency, { color: colors.text.secondary }]}>{symbol}</Text>
              </View>
              <View style={styles.maxTokensContainer}>
                <Text style={[styles.availableText, { color: colors.text.secondary }]}>
                  {t('transfer.available')}: {tokenBalance} {symbol}
                </Text>
                <TouchableOpacity
                  style={[styles.maxButton, { backgroundColor: colors.interactive.hover, borderColor: colors.border.primary }]}
                  onPress={handleMaxTokens}
                >
                  <Text style={[styles.maxButtonText, { color: colors.primary }]}>{t('transfer.max')}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.text.primary }]}>{t('transfer.recipientAddress')}</Text>
              <View style={[styles.addressInputContainer, { backgroundColor: colors.background.secondary, borderColor: colors.border.primary }]}>
                <TextInput
                  style={[styles.addressInput, { color: colors.text.primary }]}
                  value={recipientAddress}
                  onChangeText={setRecipientAddress}
                  placeholder={t('transfer.addressPlaceholder')}
                  placeholderTextColor={colors.text.placeholder}
                />
                <TouchableOpacity style={[styles.qrButton, { backgroundColor: colors.interactive.hover, borderColor: colors.border.primary }]} onPress={handleQRScan}>
                  <QrCode size={20} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.transferButton, { backgroundColor: colors.primary }]}
              onPress={handleCheckTransfer}
            >
              <ArrowRight size={20} color={colors.text.inverse} />
              <Text style={[styles.transferButtonText, { color: colors.text.inverse }]}>
                {t('transfer.checkTransfer')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* QR Scanner Modal */}
        <Modal
          animationType="slide"
          transparent={false}
          visible={qrScannerVisible}
          onRequestClose={() => setQrScannerVisible(false)}
        >
          <View style={[styles.qrContainer, { backgroundColor: colors.background.primary }]}>
            <View style={[styles.qrHeader, { backgroundColor: colors.background.primary, borderBottomColor: colors.border.primary }]}>
              <TouchableOpacity
                style={[styles.qrCloseButton, { backgroundColor: colors.background.secondary }]}
                onPress={() => setQrScannerVisible(false)}
              >
                <X size={24} color={colors.text.primary} />
              </TouchableOpacity>
              <Text style={[styles.qrTitle, { color: colors.text.primary }]}>{t('transfer.scanQRCode')}</Text>
              <View style={styles.qrHeaderSpacer} />
            </View>

            {Platform.OS !== 'web' && permission?.granted ? (
              <View style={styles.cameraContainer}>
                <CameraView
                  style={styles.camera}
                  facing="back"
                  onBarcodeScanned={handleQRCodeScanned}
                  barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                  }}
                >
                  <View style={styles.scannerOverlay}>
                    <View style={styles.scannerFrame} />
                    <Text style={styles.scannerText}>{t('transfer.pointCameraAtQR')}</Text>
                  </View>
                </CameraView>
              </View>
            ) : (
              <View style={[styles.qrPlaceholder, { backgroundColor: colors.background.secondary }]}>
                <Camera size={48} color={colors.text.tertiary} />
                <Text style={[styles.qrPlaceholderText, { color: colors.text.primary }]}>
                  {Platform.OS === 'web' ? t('transfer.qrNotSupportedWeb') : t('transfer.cameraPermissionRequired')}
                </Text>
                {Platform.OS !== 'web' && (
                  <TouchableOpacity
                    style={[styles.permissionButton, { backgroundColor: colors.primary }]}
                    onPress={requestPermission}
                  >
                    <Text style={[styles.permissionButtonText, { color: colors.text.inverse }]}>
                      {t('transfer.grantPermission')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </Modal>

        {/* Transfer Confirmation Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={confirmationVisible}
          onRequestClose={() => setConfirmationVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.confirmationModal, { backgroundColor: colors.background.primary }]}>
              <View style={styles.confirmationHeader}>
                <Text style={[styles.confirmationTitle, { color: colors.text.primary }]}>{t('transfer.confirmTransfer')}</Text>
                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: colors.background.secondary }]}
                  onPress={() => setConfirmationVisible(false)}
                >
                  <X size={24} color={colors.text.primary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.confirmationContent} showsVerticalScrollIndicator={false}>
                {/* Transfer Overview */}
                <View style={[styles.overviewCard, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}>
                  <Text style={[styles.overviewTitle, { color: colors.text.primary }]}>{t('transfer.transferOverview')}</Text>

                  <View style={styles.overviewRow}>
                    <Text style={[styles.overviewLabel, { color: colors.text.secondary }]}>{t('transfer.amount')}:</Text>
                    <Text style={[styles.overviewValue, { color: colors.text.primary }]}>{transferAmount} {symbol}</Text>
                  </View>

                  {/* <View style={styles.overviewRow}>
                    <Text style={[styles.overviewLabel, { color: colors.text.secondary }]}>{t('transfer.networkFee')}:</Text>
                    <Text style={[styles.overviewValue, { color: colors.text.primary }]}>{estimatedFee} {symbol}</Text>
                  </View> */}

                  <View style={[styles.overviewRow, styles.totalRow, { borderTopColor: colors.border.secondary }]}>
                    <Text style={[styles.totalLabel, { color: colors.text.primary }]}>{t('transfer.totalAmount')}:</Text>
                    <Text style={[styles.totalValue, { color: colors.text.primary }]}>
                      {(Number.parseFloat(transferAmount)).toFixed(2)} {symbol}
                    </Text>
                  </View>
                </View>

                {/* Recipient Details */}
                <View style={[styles.recipientCard, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}>
                  <Text style={[styles.recipientTitle, { color: colors.text.primary }]}>{t('transfer.recipientDetails')}</Text>
                  <View style={styles.addressRow}>
                    <Text style={[styles.addressLabel, { color: colors.text.secondary }]}>{t('transfer.recipientAddress')}:</Text>
                    <Text style={[styles.addressValue, { color: colors.text.primary }]} numberOfLines={1}>
                      {formatAddress(recipientAddress)}
                    </Text>
                  </View>
                </View>

                {/* Warning Section */}
                <View style={[styles.warningCard, { backgroundColor: colors.background.card, borderColor: colors.warning }]}>
                  <View style={styles.warningHeader}>
                    <AlertTriangle size={20} color={colors.warning} />
                    <Text style={[styles.warningTitle, { color: colors.warning }]}>{t('transfer.importantNotice')}</Text>
                  </View>
                  <Text style={[styles.warningText, { color: colors.text.primary }]}>
                    {t('transfer.irreversibleWarning')}
                  </Text>
                </View>

                {/* Confirmation Checkbox */}
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setConfirmationChecked(!confirmationChecked)}
                >
                  <View style={[
                    styles.checkbox,
                    { borderColor: colors.border.primary },
                    confirmationChecked && { backgroundColor: colors.primary, borderColor: colors.primary }
                  ]}>
                    {confirmationChecked && <Check size={16} color={colors.text.inverse} />}
                  </View>
                  <Text style={[styles.checkboxText, { color: colors.text.primary }]}>
                    {t('transfer.confirmationText')}
                  </Text>
                </TouchableOpacity>
              </ScrollView>

              {/* Confirmation Footer */}
              <View style={[styles.confirmationFooter, { backgroundColor: colors.background.primary, borderTopColor: colors.border.primary }]}>
                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    { backgroundColor: confirmationChecked ? colors.primary : colors.interactive.disabled }
                  ]}
                  onPress={handleConfirmTransfer}
                  disabled={!confirmationChecked}
                >
                  <ArrowRight size={20} color={colors.text.inverse} />
                  <Text style={[styles.confirmButtonText, { color: colors.text.inverse }]}>
                    {t('transfer.sendTransfer')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)', // optional dim
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
    // marginRight: Spacing.md,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Spacing['2xl'],
    fontFamily: Typography.fontFamily.bold,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    textAlign: 'center',
    marginTop: 2,
  },
  walletSection: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
  },
  walletCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    ...Shadows.md,
  },
  walletHeader: {
    marginBottom: Spacing.sm,
  },
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
  transferSection: {
    paddingHorizontal: Spacing.xl,
  },
  transferForm: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    ...Shadows.lg,
  },
  inputContainer: {
    marginBottom: Spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.medium,
    marginTop: 16,
  },
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
  // QR Scanner Styles
  qrContainer: {
    flex: 1,
  },
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
  qrHeaderSpacer: {
    width: 44,
  },
  cameraContainer: {
    flex: 1,
    margin: Spacing.xl,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: '#10B981',
    borderRadius: BorderRadius.xl,
    backgroundColor: 'transparent',
    marginBottom: Spacing['4xl'],
  },
  scannerText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
    color: '#FFFFFF',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
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
  confirmationContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
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