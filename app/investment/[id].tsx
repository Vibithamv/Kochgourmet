import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { InvestmentShimmer } from '@/components/Shimmer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  getColors,
  Shadows,
} from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useGlobalAlert } from '@/contexts/AlertContext';
import { offeringDetails } from '@/hooks/offering_details';
import { userManagement } from '@/hooks/userManagement';
import { createPaymentOrder } from '@/hooks/createPayment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { docSign } from '@/hooks/docSign';
import WebView from 'react-native-webview';
import { useOfferingCheck } from '@/hooks/useOfferingCheck';
import InvestmentOrderStep from '@/components/InvestmentOrderStep';
import InvestmentOverviewStep from '@/components/InvestmentOverviewStep';
import { InvestmentFloatingBar } from '@/components/InvestmentCommunityUI';
import { formatInvestmentPrice } from '@/utils/investmentFormat';

type ProjectStatus =
  | 'PRIVATESALE'
  | 'PRESALE'
  | 'WHITELISTING'
  | 'ANNOUNCEMENT'
  | 'PRESALEANNOUNCEMENT'
  | 'PUBLIC'
  | 'FINISHED'
  | 'draft';

interface ExtendedProject {
  id: string;
  title: string;
  description: string;
  location: string;
  target_amount: number;
  raised_amount: number;
  minimum_investment: number;
  expected_return: number;
  duration_months: number;
  image_url: string;
  status: ProjectStatus;
  created_at: string;
  tenant_id: string;
  announcement_date?: string;
  presale_start_date?: string;
  is_whitelisted?: boolean;
  pricePerToken: string;
  currency: string;
  asset_symbol?: string;
  /** API offering access/type, e.g. `ACCESS_TRADITIONAL`. */
  offeringType?: string;
}

function readOfferingTypeFromApi(data: unknown): string {
  if (data == null || typeof data !== 'object' || Array.isArray(data)) return '';
  const o = data as Record<string, unknown>;
  const v =
    o.type ?? o.offering_type ?? o.offeringType ?? o.access_type ?? o.accessType;
  return typeof v === 'string' ? v : '';
}

const OFFERING_ACCESS_TRADITIONAL = 'ACCESS_TRADITIONAL';
const OFFERING_DEBT_TRADITIONAL = 'DEBT_TRADITIONAL';

interface PaymentMethod {
  id: string;
  type: string;
  /** Raw API value, e.g. `CUSTOMIBAN` for bank transfer. */
  providerType: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  /** BIC/SWIFT from API field `payment_bank_nr`. */
  bic?: string;
}

function bicFromPaymentProvider(p: {
  payment_bank_nr?: unknown;
  payment_bic?: unknown;
  bic?: unknown;
  swift?: unknown;
}): string {
  const tryStr = (v: unknown) =>
    typeof v === 'string' && v.trim().length > 0 ? v.trim() : '';
  return (
    tryStr(p.payment_bank_nr) ||
    tryStr(p.payment_bic) ||
    tryStr(p.bic) ||
    tryStr(p.swift) ||
    ''
  );
}

interface LegalDocs {
  document: string;
  index: string;
  isSignRequired: string;
  name: string;
}

type SigningItem = {
  envelopeId: string;
  name: string;
  signingUrl: string;
};

export default function InvestmentScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [project, setProject] = useState<ExtendedProject | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [tokenAmount, setTokenAmount] = useState(1);
  const [signature] = useState('');
  const [agreementChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useGlobalAlert();
  const [totalAmount, setTotalAmount] = useState(1);
  const colors = getColors(theme);
  const isDark = theme === 'dark' || theme === 'darkGreen';
  const floatingBottom = Math.max(insets.bottom, 12) + 16;
  const offering = offeringDetails();
  const { performOfferingCheck } = useOfferingCheck();
  let projectData: ExtendedProject;
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  let paymentMethodData: PaymentMethod[] = [];
  let documents: LegalDocs[] = [];
  const user = userManagement();
  const [walletID, setWalletID] = React.useState('');
  const [paymentTypeID, setPaymentTypeID] = React.useState('');
  const [paymentType, setPaymentType] = React.useState('');
  const [docs, setDocs] = useState<LegalDocs[]>([]);
  const [address1, setAddress1] = React.useState('');
  const [address2, setAddress2] = React.useState('');
  const createPayment = createPaymentOrder();
  const docuSign = docSign();
  const [documentsArray, setDocumentsArray] = useState([]);
  const [urlArrayIndex, setUrlArrayIndex] = React.useState(0);
  const [signingUrl, setSigningUrl] = useState<SigningItem[]>([]);
  const [envelopeIds, setEnvelopeIds] = useState([]);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [confirmSubscription, setConfirmSubscription] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derived state for steps
  const hasSignableDocs = documentsArray.length > 0;

  useEffect(() => {
    loadProject();
    getUser();
  }, [id]);

  const loadProject = async () => {
    await performOfferingCheck();
    offering.details(id).then((data) => {
       console.log('offering details data', JSON.stringify(data.data.data.paymentProviderList));
      if (data.success && data.data) {
        projectData = {
          id: data.data.data.id,
          title: data.data.data.asset_name,
          description: data.data.data.asset_description,
          location: 'Baden bei Wien, AT',
          target_amount: 14000000,
          raised_amount: data.data.data.raised_amount,
          minimum_investment: data.data.data.minimum_investment,
          expected_return: 4,
          duration_months: 36,
          image_url:
            'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800',
          status: data.data.data.visibility_status,
          created_at: data.data.data.created_at,
          tenant_id: data.data.data.tenant_id,
          announcement_date: '',
          presale_start_date: '',
          is_whitelisted: false,
          pricePerToken: data.data.data.price_per_token,
          currency: data.data.data.main_currency,
          offeringType: readOfferingTypeFromApi(data.data.data),
        };

        setDocumentsArray((data.data.data.legal_documents ?? []).filter((documents: any) => documents.is_sign_required === true))
        paymentMethodData = data.data.data.paymentProviderList.map(
          (p: any) => ({
            id: p.id,
            type:
              p.payment_provider_type === 'CUSTOMIBAN'
                ? 'BANK TRANSFER'
                : p.payment_provider_type,
            providerType: p.payment_provider_type ?? '',
            bankName:
              typeof p.payment_banking_name === 'string'
                ? p.payment_banking_name
                : '',
            accountName:
              typeof p.payment_account_name === 'string'
                ? p.payment_account_name
                : '',
            accountNumber:
              typeof p.payment_account_nr === 'string'
                ? p.payment_account_nr
                : '',
            bic: bicFromPaymentProvider(p),
          })
        );
        setPaymentMethods(paymentMethodData);

        documents = (data.data.data.legal_documents ?? []).map(
          (p: any, index: number) => ({
            isSignRequired: p.is_sign_required,
            index:
              p.index,
            document: p.document,
            name:
              typeof p.name === 'string' && p.name.length > 0
                ? p.name.charAt(0).toUpperCase() + p.name.slice(1)
                : p.name,
          })
        );
        setDocs(documents);
        setProject(projectData);
        const minimumTokenCount = Math.max(
          1,
          Number(projectData.minimum_investment) || 0
        );
        setTokenAmount(minimumTokenCount);
        calculateTotalAmount(
          minimumTokenCount,
          projectData.currency,
          projectData.id
        );
        setLoading(false);
      } else {
        setLoading(false);
      }
    });
  };

  const getUser = async () => {
    user.getUser().then(async (data) => {
      if (data.success && data.data) {
        //console.log('....',data.data.activeAccount)
        const metawallets = data.data.data.activeAccount.blockchainWallets
          .filter((wallet: any) => wallet.status === 'ACTIVE')
          .map((wallet: any) => ({
            id: wallet.id,
          }));
        const first = metawallets[0];
        if (first) {
          setWalletID(first.id);
        } else {
          setWalletID('');
        }
        setAddress1(data.data.data.activeAccount.address.country || '');
        setAddress2(data.data.data.activeAccount.address.city || '');
        await AsyncStorage.setItem("AccountID", data.data.data.activeAccount.id);
      } else if (data.status === 401) {
        showAlert(t('profile.sessionExpired'), t('profile.loginAgain'));
        router.replace("/auth/login");
      } else {
        showAlert(t('common.error'), data.error.error.message || t('common.errorMessage'));
      }
    });
  };

  const tokenPrice = Number.parseInt(project?.pricePerToken || '0', 10);
  /** API field `minimum_investment` is enforced as minimum token count on this screen. */
  const minimumTokenCount = Math.max(
    1,
    Number(project?.minimum_investment) || 0
  );

  const calculateTotalAmount = (
    tokenAmount: number,
    currency: string,
    id: string
  ) => {
    try {
      offering.calculateTokenAmt(tokenAmount, currency, id, 0).then((data) => {
        if (!data) return;
        if (data.success && data.data) {
          setTotalAmount(Number.parseInt(data.data.data.paymentAmount, 10));
        } else {
          showAlert(t('common.error'), data.error?.message || t('common.errorMessage'));
        }
      });
    } catch (error: any) {
      showAlert(t('common.error'), error);
    }
  };

  const handleNextStep = async () => {
    if (currentStep === 1) {
      if (tokenAmount < (project?.minimum_investment || 0)) {
        showAlert(t('common.alert'), `${t('investment.tokenAlert')} (${project?.minimum_investment})`);
        return;
      }
      if (!paymentTypeID) {
        showAlert(t('common.alert'), t('auth.errors.fillAllFields'));
        return;
      }
      if (hasSignableDocs) {
        setIsSubmitting(true)
        docuSign.docuSignature(documentsArray, id, await AsyncStorage.getItem("AccountID")).then((data) => {
          setIsSubmitting(false)
          if (data.success && data.data) {
            setIsPdfLoading(true);
            console.log('documents details data', data.data.data.docusign.documents);
            const ids = data.data.data.docusign.documents.map((document: { envelopeId: string }) => document.envelopeId);
            setEnvelopeIds(ids);
            setSigningUrl(data.data.data.docusign.documents)
            setCurrentStep(2);
          } else {
            showAlert(t('common.error'), data.error.message || t('common.errorMessage'));
          }
        });
      }
      else {
        setCurrentStep(2);
      }

    } else if (currentStep === 2 && hasSignableDocs) {
      if (!signature || !agreementChecked) {
        showAlert(t('common.error'), t('investment.completeSignature'));
        return;
      }
      setCurrentStep(3);
    }
  };

  const showErrorAlert = (message: string) => {
    const show = () => showAlert(t('common.error'), message);
    if (Platform.OS === 'ios') {
      // Defer so loading overlay is dismissed first; avoids "present while a presentation is in progress".
      setTimeout(show, 400);
    } else {
      show();
    }
  };

  const handleInvestment = async () => {
    setIsSubmitting(true);
    createPayment
      .payment({
        typeID: paymentTypeID,
        amount: tokenAmount + '',
        currency: project?.currency || '',
        address1,
        address2,
        offeringID: project?.id || '',
        walletID,
        accountID: (await AsyncStorage.getItem('AccountID')) || '',
        envelopeIds,
      })
      .then((data) => {
        try {
          if (data?.success && data?.data) {
            if (paymentType === 'BANK TRANSFER') {
              const selected = paymentMethods.find((p) => p.id === paymentTypeID);
              const order = data?.data?.data?.order as
                | { id?: string; reference?: string }
                | undefined;
              const orderReference =
                (order?.reference != null && String(order.reference).trim()) ||
                (order?.id != null && String(order.id).trim()) ||
                '';
              router.replace({
                pathname: '/investment/success',
                params: {
                  amount: encodeURIComponent(
                    formatInvestmentPrice(totalAmount, project?.currency)
                  ),
                  title: encodeURIComponent(project?.title || ''),
                  bankDetails: encodeURIComponent(
                    JSON.stringify({
                      providerType: selected?.providerType ?? '',
                      bankName: selected?.bankName ?? '',
                      accountName: selected?.accountName ?? '',
                      accountNumber: selected?.accountNumber ?? '',
                      bic: selected?.bic ?? '',
                    })
                  ),
                  ...(orderReference
                    ? { orderReference: encodeURIComponent(orderReference) }
                    : {}),
                },
              });
            } else if (paymentType === 'STRIPE') {
              router.push({
                pathname: '/screens/paymentWebView',
                params: { url: data.data.data.paymentLink.url, orderId: data.data.data.order.id },
              });
            }
          } else {
            const err = data?.error;
            const message =
              typeof err === 'string'
                ? err
                : err?.message ?? err?.error?.message ?? t('common.errorMessage');
            showErrorAlert(message);
          }
        } catch (error) {
          console.error('handleInvestment: payment response handling', error);
          showErrorAlert(t('common.errorMessage'));
        }
      })
      .catch(() => {
        showErrorAlert(t('common.errorMessage'));
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const paymentConfirmCtaLabel = t('investment.buyNow');

  const isOverviewStep =
    currentStep === 3 || (currentStep === 2 && !hasSignableDocs);

  const selectedPayment = paymentMethods.find((p) => p.id === paymentTypeID);

  const confirmSubscriptionText = useMemo(() => {
    const count = tokenAmount;
    const name = project?.title ?? '';
    const ot = project?.offeringType;
    if (ot === OFFERING_ACCESS_TRADITIONAL) {
      return t('investment.confirmSubscriptionParticipate', { count, name });
    }
    if (ot === OFFERING_DEBT_TRADITIONAL) {
      return t('investment.confirmSubscriptionInvest', { count, name });
    }
    return t('investment.confirmSubscription', { count });
  }, [project?.offeringType, project?.title, tokenAmount, t]);

  const decrementTokens = () => {
    const next = Math.max(minimumTokenCount, tokenAmount - 1);
    setTokenAmount(next);
    calculateTotalAmount(next, project?.currency || '', project?.id || '');
  };

  const incrementTokens = () => {
    const next = tokenAmount + 1;
    setTokenAmount(next);
    calculateTotalAmount(next, project?.currency || '', project?.id || '');
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (currentStep === 2 && signingUrl[urlArrayIndex]?.envelopeId) {
      checkStatus();
      interval = setInterval(() => {
        checkStatus();
      }, 15000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentStep, urlArrayIndex, signingUrl]);

  const checkStatus = () => {
    docuSign.signStatus(signingUrl[urlArrayIndex].envelopeId).then((data) => {
      if (data.success && data.data?.data?.status === 'SIGNED') {
        setIsSigned(true);
      }
    });
  };

  const renderStep2 = () => (
    <View style={{ flex: 1 }}>
      {isPdfLoading && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: colors.background.secondary,
            justifyContent: "center",
            alignItems: "center",
            zIndex: 999,
          }}
        >
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      <WebView
        originWhitelist={["*"]}
        javaScriptEnabled={true}
        source={{ uri: signingUrl[urlArrayIndex].signingUrl }}
        onLoadEnd={() => setIsPdfLoading(false)}
        style={{ flex: 1 }}
      />

      <TouchableOpacity
        style={[
          styles.nextButton,
          {
            backgroundColor: isSigned ? colors.primary : colors.border.primary,
            marginBottom: 10,
          },
        ]}
        disabled={!isSigned}
        onPress={() => setCurrentStep(3)}
      >
        <Text style={[styles.nextButtonText, { color: colors.text.inverse }]}>
          {t('common.next')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return <InvestmentShimmer />;
  }

  if (!project) {
    return (
      <View
        style={[
          styles.errorContainer,
          { backgroundColor: colors.background.primary },
        ]}
      >
        <Text style={[styles.errorText, { color: colors.text.primary }]}>
          {t('projectDetail.projectNotFound')}
        </Text>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.backButtonText, { color: colors.text.inverse }]}>
            {t('projectDetail.goBack')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background.secondary },
      ]}
    >
      <View style={styles.content}>
        {currentStep === 1 ? (
          <InvestmentOrderStep
            projectTitle={project.title}
            tokenAmount={tokenAmount}
            minimumTokenCount={minimumTokenCount}
            tokenPrice={tokenPrice}
            totalAmount={totalAmount}
            currency={project.currency}
            paymentMethods={paymentMethods}
            onPaymentChange={(type, id) => {
              setPaymentTypeID(id);
              setPaymentType(type);
            }}
            onDecrementTokens={decrementTokens}
            onIncrementTokens={incrementTokens}
            colors={colors}
            floatingBottom={floatingBottom}
          />
        ) : null}
        {currentStep === 2 && hasSignableDocs ? renderStep2() : null}
        {isOverviewStep ? (
          <InvestmentOverviewStep
            projectTitle={project.title}
            tokenAmount={tokenAmount}
            tokenPrice={tokenPrice}
            totalAmount={totalAmount}
            currency={project.currency}
            paymentType={paymentType}
            selectedPayment={selectedPayment}
            confirmSubscription={confirmSubscription}
            confirmText={confirmSubscriptionText}
            onToggleConfirm={() => setConfirmSubscription(!confirmSubscription)}
            colors={colors}
            floatingBottom={floatingBottom}
          />
        ) : null}
      </View>

      {currentStep === 1 ? (
        <InvestmentFloatingBar
          primaryLabel={t('common.next')}
          cancelLabel={t('common.cancel')}
          onPrimary={handleNextStep}
          onCancel={() => router.back()}
          bottom={floatingBottom}
          colors={colors}
          isDark={isDark}
        />
      ) : null}

      {isOverviewStep ? (
        <InvestmentFloatingBar
          primaryLabel={paymentConfirmCtaLabel}
          cancelLabel={t('common.cancel')}
          onPrimary={handleInvestment}
          primaryDisabled={!confirmSubscription || isSubmitting}
          onCancel={() => router.back()}
          bottom={floatingBottom}
          colors={colors}
          isDark={isDark}
        />
      ) : null}

      {/* Loading Modal */}
      <Modal
        transparent={true}
        visible={isSubmitting}
        animationType="fade"
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.3)'
        }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Roboto-Light',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Roboto-Regular',
    marginBottom: 24,
    textAlign: 'center',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backIcon: {
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
    fontSize: 18,
    fontFamily: 'Roboto-Regular',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Roboto-Light',
    textAlign: 'center',
    marginTop: 2,
  },
  headerSpacer: {
    width: 40,
  },
  stepIndicator: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  stepText: {
    fontSize: 14,
    fontFamily: 'Roboto-Light',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  stepTitle: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay_700Bold',
    letterSpacing: 0,
    lineHeight: 30,
    marginTop: 0,
    marginBottom: 8,
    textAlign: 'center',
  },
  documentSection: {
    marginBottom: 32,
  },
  documentPlaceholder: {
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentText: {
    fontSize: 14,
    fontFamily: 'Roboto-Light',
    marginTop: 8,
  },
  investmentDetails: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  card: {
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
    letterSpacing: 0,
    alignSelf: 'center',
  },
  detailsTitle: {
    fontSize: 18,
    fontFamily: 'Roboto-Regular',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'Roboto-Light',
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
  },
  tokenSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 4,
  },
  tokenButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenValue: {
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
    marginHorizontal: 16,
  },
  totalRow: {
    borderTopWidth: 1,
    paddingTop: 16,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
  },
  totalValue: {
    fontSize: 18,
    fontFamily: 'Roboto-Regular',
  },
  formSection: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Roboto-Light',
    borderWidth: 1,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  inputIcon: {
    marginLeft: 16,
  },
  inputWithIconField: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Roboto-Light',
  },
  signatureSection: {
    marginBottom: 20,
  },
  signatureBox: {
    borderRadius: 12,
    borderWidth: 2,
    // borderStyle: 'dashed',
  },
  clearButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
  },
  clearButtonText: {
    fontSize: 12,
    fontFamily: 'Roboto-Regular',
  },
  agreementSection: {
    marginBottom: 32,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {},
  agreementText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Roboto-Light',
    lineHeight: 20,
  },
  signDocumentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 16,
    ...Shadows.button,
  },
  signDocumentText: {
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
    marginLeft: 8,
  },
  summarySection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  summaryTitle: {
    fontSize: 18,
    fontFamily: 'Roboto-Regular',
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: 'Roboto-Light',
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
  },
  totalSummaryRow: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 8,
  },
  totalSummaryLabel: {
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
  },
  totalSummaryValue: {
    fontSize: 18,
    fontFamily: 'Roboto-Regular',
  },
  investorSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  investorTitle: {
    fontSize: 18,
    fontFamily: 'Roboto-Regular',
    marginBottom: 20,
  },
  investorDetail: {
    marginBottom: 16,
  },
  investorLabel: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    marginBottom: 4,
  },
  investorValue: {
    fontSize: 14,
    fontFamily: 'Roboto-Light',
  },
  investorSignature: {
    fontSize: 16,
    fontFamily: 'Roboto-Light',
    fontStyle: 'italic',
  },
  confirmationSection: {
    marginBottom: 24,
  },
  confirmationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
  },
  confirmationText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Roboto-Light',
    lineHeight: 20,
    marginLeft: 12,
    textAlign: 'justify',
  },
  orderSummary: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    marginBottom: 15,
  },
  orderTitle: {
    fontSize: 18,
    fontFamily: 'Roboto-Regular',
    marginBottom: 20,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderLabel: {
    fontSize: 14,
    fontFamily: 'Roboto-Light',
  },
  orderValue: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
  },
  orderTotalRow: {
    borderTopWidth: 1,
    paddingTop: 16,
    marginTop: 16,
    marginBottom: 20,
  },
  orderTotalLabel: {
    fontSize: 18,
    fontFamily: 'Roboto-Regular',
  },
  orderTotalValue: {
    fontSize: 20,
    fontFamily: 'Roboto-Regular',
  },
  projectDetails: {
    gap: 8,
  },
  projectDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  projectDetailText: {
    fontSize: 14,
    fontFamily: 'Roboto-Light',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    borderTopWidth: 1,
  },
  nextButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    ...Shadows.button,
  },
  nextButtonText: {
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
  },
  finalizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 16,
    ...Shadows.button,
  },
  finalizeButtonText: {
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
    marginLeft: 8,
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 15,
    fontFamily: 'Roboto-Light',
    letterSpacing: 0,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  listBox: {
    borderRadius: 10,
    maxHeight: '55%',
    overflow: 'hidden',
  },
  item: {
    padding: 14,
    borderBottomWidth: 1,
  },
  itemText: {
    fontSize: 15,
    fontFamily: 'Roboto-Light',
    letterSpacing: 0,
  },
});