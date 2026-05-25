import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import { InvestmentShimmer } from '@/components/Shimmer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import {
  ArrowLeft,
  Plus,
  Minus,
  Check,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import {
  getColors,
  Typography,
  Shadows,
} from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useGlobalAlert } from '@/contexts/AlertContext';
import { offeringDetails } from '@/hooks/offering_details';
import PaymentProviderDropdown from '@/components/paymentProviderDropdown';
import { userManagement } from '@/hooks/userManagement';
import { createPaymentOrder } from '@/hooks/createPayment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { docSign } from '@/hooks/docSign';
import WebView from 'react-native-webview';
import { useOfferingCheck } from '@/hooks/useOfferingCheck';

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Derived state for steps
  const hasSignableDocs = documentsArray.length > 0;
  const totalSteps = hasSignableDocs ? 3 : 2;

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
        if (data.success && data.data) {
          setTotalAmount(Number.parseInt(data.data.data.paymentAmount, 10));
        } else {
          showAlert(t('common.error'), data.error.message || t('common.errorMessage'));
        }
      });
    } catch (error: any) {
      showAlert(t('common.error'), error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: project?.currency,
      minimumFractionDigits: 0,
    }).format(value);
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
                  amount: encodeURIComponent(formatCurrency(totalAmount)),
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

  const paymentConfirmCtaLabel =
    project?.offeringType === OFFERING_ACCESS_TRADITIONAL
      ? t('projectDetail.backThisProject')
      : t('investment.toPayment');

  const step1PrimaryTitle = useMemo(() => {
    const name = project?.title ?? '';
    const ot = project?.offeringType;
    if (ot === OFFERING_ACCESS_TRADITIONAL) {
      return t('investment.step1TitleParticipateIn', { name });
    }
    if (ot === OFFERING_DEBT_TRADITIONAL) {
      return t('investment.step1TitleInvestIn', { name });
    }
    return t('investment.subscriptionCertificate');
  }, [project?.offeringType, project?.title, t]);

  /** Step 1 "Investment details" — property row: merged phrase for traditional access/debt types. */
  const investmentDetailsPropertyLine = useMemo(() => {
    const name = project?.title ?? '';
    const ot = project?.offeringType;
    if (ot === OFFERING_ACCESS_TRADITIONAL) {
      return {
        kind: 'merged' as const,
        text: t('investment.step1TitleParticipateIn', { name }),
      };
    }
    if (ot === OFFERING_DEBT_TRADITIONAL) {
      return { kind: 'merged' as const, text: t('investment.step1TitleInvestIn', { name }) };
    }
    return { kind: 'split' as const };
  }, [project?.offeringType, project?.title, t]);

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

  const renderFooterAction = () => {
    if (currentStep === 1) {
      return (
        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: colors.primary }]}
          onPress={handleNextStep}
        >
          <Text
            style={[styles.nextButtonText, { color: colors.text.inverse }]}
          >
            {hasSignableDocs ? t('investment.signDocument') : paymentConfirmCtaLabel}
          </Text>
        </TouchableOpacity>
      );
    }
    if (currentStep === totalSteps) {
      return (
        <TouchableOpacity
          style={[
            styles.finalizeButton,
            { backgroundColor: confirmSubscription ? colors.primary : colors.border.primary },
          ]}
          onPress={handleInvestment}
          disabled={!confirmSubscription}
        >
          <Text
            style={[
              styles.finalizeButtonText,
              {
                color: confirmSubscription ? colors.text.inverse : colors.text.tertiary,
              },
            ]}
          >
            {paymentConfirmCtaLabel}
          </Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  const renderStepIndicator = () => (
    <View
      style={[
        styles.stepIndicator,
        {
          backgroundColor: colors.background.primary,
          borderBottomColor: colors.border.primary,
        },
      ]}
    >
      <Text style={[styles.stepText, { color: colors.text.secondary }]}>
        {t('investment.step')} {currentStep} {t('investment.of')} {totalSteps}
      </Text>
      <View
        style={[styles.progressBar, { backgroundColor: colors.border.primary }]}
      >
        <View
          style={[
            styles.progressFill,
            {
              width: `${(currentStep / totalSteps) * 100}%`,
              backgroundColor: colors.primary,
            },
          ]}
        />
      </View>
    </View>
  );

  const renderStep1 = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <View style={styles.headerSection}>
        <Text style={[styles.stepTitle, { color: colors.text.primary }]}>
          {step1PrimaryTitle}
        </Text>
      </View>

      {/* <View style={styles.documentSection}>
        <View style={styles.documentPlaceholder}>
          <FileText size={48} color="#94A3B8" />
          <Text style={styles.documentText}>
            {t('investment.documentPreview')}
          </Text>
        </View>
      </View> */}

      <FlatList
        data={docs}
        keyExtractor={(item) => item.index.toString()}
        scrollEnabled={false}
        renderItem={({ item }) => (
          item.isSignRequired ?
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.primary, borderColor: colors.primary }]}
              onPress={() =>
                router.push({
                  pathname: "/screens/docWebview",
                  params: {
                    title: item.name,
                    pdfUrl: item.document,
                  },
                })
              }
            >
              <Text style={[styles.title, { color: colors.text.inverse }]}>{item.name}</Text>
            </TouchableOpacity> : null
        )}
      />

      <View style={[styles.investmentDetails, { backgroundColor: colors.background.primary, borderColor: colors.border.primary, borderWidth: 1 }]}>
        <Text style={[styles.detailsTitle, { color: colors.text.primary }]}>
          {project?.offeringType === OFFERING_ACCESS_TRADITIONAL
            ? t('investment.details')
            : t('investment.investmentDetails')}
        </Text>

        {investmentDetailsPropertyLine.kind === 'merged' ? (
          <View style={styles.detailRow}>
            <Text
              style={[styles.detailValue, { color: colors.text.primary, flex: 1 }]}
            >
              {investmentDetailsPropertyLine.text}
            </Text>
          </View>
        ) : (
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.text.primary }]}>
              {t('investment.property')}:
            </Text>
            <Text style={[styles.detailValue, { color: colors.text.primary }]}>
              {project?.title}
            </Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.text.primary }]}>{t('investment.tokenAmount')}:</Text>
          <View style={styles.tokenSelector}>
            <TouchableOpacity
              style={styles.tokenButton}
              onPress={() => {
                const next = Math.max(minimumTokenCount, tokenAmount - 1);
                setTokenAmount(next);
                calculateTotalAmount(
                  next,
                  project?.currency || '',
                  project?.id || ''
                );
              }}
            >
              <Minus size={16} color={colors.text.tertiary} />
            </TouchableOpacity>
            <Text style={[styles.tokenValue, { color: colors.text.primary }]}>{tokenAmount}</Text>
            <TouchableOpacity
              style={styles.tokenButton}
              onPress={() => {
                setTokenAmount(tokenAmount + 1);
                calculateTotalAmount(
                  tokenAmount + 1,
                  project?.currency || '',
                  project?.id || ''
                );
              }}
            >
              <Plus size={16} color={colors.text.tertiary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.text.primary }]}>
            {t('investment.pricePerToken')}:
          </Text>
          <Text style={[styles.detailValue, { color: colors.text.primary }]}>{formatCurrency(tokenPrice)}</Text>
        </View>

        <View style={[styles.detailRow, styles.totalRow, { borderTopColor: colors.border.primary }]}>
          <Text style={[styles.totalLabel, { color: colors.text.primary }]}>{t('investment.totalAmount')}: </Text>
          <Text style={[styles.totalValue, { color: colors.text.primary }]}>{formatCurrency(totalAmount)}</Text>
        </View>
      </View>

      <View style={styles.formSection}>
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: colors.text.primary }]}>
            {t('investment.paymentProvider')} <Text style={{ color: 'red' }}>*</Text>
          </Text>
          <PaymentProviderDropdown
            payment={paymentMethods}
            onChange={(type, id) => {
              setPaymentTypeID(id);
              setPaymentType(type);
            }}
          />
        </View>
      </View>
    </ScrollView>
  );

  const [isSigned, setIsSigned] = useState(false);

  useEffect(() => {
    let interval: any;
    if (currentStep === 2 && signingUrl[urlArrayIndex]?.envelopeId) {
      // Check immediately
      checkStatus();

      // Then poll every 15 seconds
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
      {/* Full screen loader overlay */}
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
          {/* <Text style={{ marginTop: 10, color: "#000" }}>Loading PDF…</Text> */}
        </View>
      )}

      {/* WebView */}
      <WebView
        originWhitelist={["*"]}
        javaScriptEnabled={true}
        source={{ uri: signingUrl[urlArrayIndex].signingUrl }}
        //  onLoadStart={() => setIsPdfLoading(true)}
        onLoadEnd={() => setIsPdfLoading(false)}
        style={{ flex: 1 }}
      />

      {/* Bottom Button */}
      <TouchableOpacity
        style={[
          styles.nextButton,
          {
            backgroundColor: isSigned ? colors.primary : colors.border.primary,
            marginBottom: 10,
            marginHorizontal: 20,
          },
        ]}
        disabled={!isSigned}
        onPress={() => {
          signingUrl.length > urlArrayIndex + 1
            ? setUrlArrayIndex(urlArrayIndex + 1)
            : setCurrentStep(3);

          setIsSigned(false); // Reset for next document
        }}
      >
        <Text style={[styles.nextButtonText, { color: isSigned ? colors.text.inverse : colors.text.tertiary }]}>
          {`(${urlArrayIndex + 1}/${signingUrl.length}) ${
            isSigned ? t('projectDetail.next') : 'Processing.....'
          }`}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep3 = () => {
    const selectedPayment = paymentMethods.find((p) => p.id === paymentTypeID);
    const showBankDetails =
      selectedPayment?.providerType === 'CUSTOMIBAN' &&
      Boolean(
        (selectedPayment.bankName && selectedPayment.bankName.length > 0) ||
          (selectedPayment.accountName && selectedPayment.accountName.length > 0) ||
          (selectedPayment.accountNumber && selectedPayment.accountNumber.length > 0) ||
          (selectedPayment.bic && selectedPayment.bic.length > 0)
      );

    return (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <View style={[styles.summarySection, { backgroundColor: colors.background.primary, borderColor: colors.border.primary }]}>
        <Text style={[styles.summaryTitle, { color: colors.text.primary }]}>
          {project?.offeringType === OFFERING_ACCESS_TRADITIONAL
            ? t('investment.overviewShort')
            : t('investment.investmentOverview')}
        </Text>

        {investmentDetailsPropertyLine.kind === 'merged' ? (
          <View style={styles.summaryRow}>
            <Text
              style={[styles.summaryValue, { color: colors.text.primary, flex: 1 }]}
            >
              {investmentDetailsPropertyLine.text}
            </Text>
          </View>
        ) : (
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.text.primary }]}>
              {t('investment.property')}:
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text.primary }]}>
              {project?.title}
            </Text>
          </View>
        )}

        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.text.primary }]}>
            {t('investment.tokenAmount')}:
          </Text>
          <Text style={[styles.summaryValue, { color: colors.text.primary }]}>{tokenAmount}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.text.primary }]}>{t('investment.tokenPrice')}:</Text>
          <Text style={[styles.summaryValue, { color: colors.text.primary }]}>{formatCurrency(tokenPrice)}</Text>
        </View>

        <View style={[styles.summaryRow, styles.totalSummaryRow, { borderTopColor: colors.border.primary }]}>
          <Text style={[styles.totalSummaryLabel, { color: colors.text.primary }]}>
            {t('investment.totalAmount')}:
          </Text>
          <Text style={[styles.totalSummaryValue, { color: colors.text.primary }]}>
            {formatCurrency(totalAmount)}
          </Text>
        </View>
      </View>

      <View style={[styles.investorSection, { backgroundColor: colors.background.primary, borderColor: colors.border.primary }]}>
        <Text style={[styles.investorTitle, { color: colors.text.primary }]}>
          {t('investment.investorDetails')}
        </Text>

        {/* <View style={styles.investorDetail}>
          <Text style={styles.investorLabel}>{t('investment.fullName')} *</Text>
          <Text style={styles.investorValue}>{fullName}</Text>
        </View>

        <View style={styles.investorDetail}>
          <Text style={styles.investorLabel}>
            {t('investment.fullAddress')} *
          </Text>
          <Text style={styles.investorValue}>{address}</Text>
        </View> */}

        <View style={styles.investorDetail}>
          <Text style={[styles.investorLabel, { color: colors.text.primary }]}>
            {t('investment.paymentType')} *
          </Text>
          <Text style={[styles.investorValue, { color: colors.text.primary }]}>{paymentType}</Text>
        </View>

        {/* <View style={[styles.investorDetail]}>
          <Text style={styles.investorLabel}>
            {t('investment.digitalSignature')} *
          </Text>
          <Image
            source={{ uri: signature }}
            style={{ width: '100%', height: 100 }}
            resizeMode="contain"
          />
        </View> */}
      </View>

      <View style={[styles.orderSummary, { backgroundColor: colors.background.primary, borderColor: colors.border.primary }]}>
        <Text style={[styles.orderTitle, { color: colors.text.primary }]}>{t('investment.orderSummary')}</Text>

        {investmentDetailsPropertyLine.kind === 'merged' ? (
          <View style={styles.orderRow}>
            <Text style={[styles.orderValue, { color: colors.text.primary, flex: 1 }]}>
              {investmentDetailsPropertyLine.text}
            </Text>
          </View>
        ) : (
          <View style={styles.orderRow}>
            <Text style={[styles.orderLabel, { color: colors.text.primary }]}>
              {t('investment.property')}:
            </Text>
            <Text style={[styles.orderValue, { color: colors.text.primary }]}>
              {project?.title}
            </Text>
          </View>
        )}

        <View style={styles.orderRow}>
          <Text style={[styles.orderLabel, { color: colors.text.primary }]}>{t('investment.tokenAmount')}:</Text>
          <Text style={[styles.orderValue, { color: colors.text.primary }]}>{tokenAmount}</Text>
        </View>

        <View style={styles.orderRow}>
          <Text style={[styles.orderLabel, { color: colors.text.primary }]}>
            {t('investment.pricePerToken')}:
          </Text>
          <Text style={[styles.orderValue, { color: colors.text.primary }]}>{formatCurrency(tokenPrice)}</Text>
        </View>

        <View style={[styles.orderRow, styles.orderTotalRow, { borderTopColor: colors.border.primary }]}>
          <Text style={[styles.orderTotalLabel, { color: colors.text.primary }]}>
            {t('investment.totalSum')}:
          </Text>
          <Text style={[styles.orderTotalValue, { color: colors.text.primary }]}>
            {formatCurrency(totalAmount)}
          </Text>
        </View>

        {/* <View style={[styles.projectDetails]}>
          <View style={styles.projectDetail}>
            <Text style={styles.projectDetailText}>
              📈 {project?.expected_return}% {t('investment.annualReturn')}
            </Text>
          </View>
          <View style={styles.projectDetail}>
            <Text style={styles.projectDetailText}>
              ⏱️ {project?.duration_months} {t('investment.monthsRuntime')}
            </Text>
          </View>
          <View style={styles.projectDetail}>
            <Text style={styles.projectDetailText}>
              📋 {t('investment.landRegisterRank')}
            </Text>
          </View>
        </View> */}
      </View>

      {showBankDetails && selectedPayment ? (
        <View
          style={[
            styles.investorSection,
            { backgroundColor: colors.background.primary, borderColor: colors.border.primary },
          ]}
        >
          <Text style={[styles.investorTitle, { color: colors.text.primary }]}>
            {t('investment.bankTransferDetails')}
          </Text>
          <Text
            style={[
              styles.investorValue,
              { color: colors.text.secondary, marginBottom: 16 },
            ]}
          >
            {t('investment.bankTransferDetailsHint')}
          </Text>
          {selectedPayment.bankName ? (
            <View style={styles.investorDetail}>
              <Text style={[styles.investorLabel, { color: colors.text.primary }]}>
                {t('investment.bankNameLabel')}
              </Text>
              <Text style={[styles.investorValue, { color: colors.text.primary }]}>
                {selectedPayment.bankName}
              </Text>
            </View>
          ) : null}
          {selectedPayment.accountName ? (
            <View style={styles.investorDetail}>
              <Text style={[styles.investorLabel, { color: colors.text.primary }]}>
                {t('investment.accountHolderLabel')}
              </Text>
              <Text style={[styles.investorValue, { color: colors.text.primary }]}>
                {selectedPayment.accountName}
              </Text>
            </View>
          ) : null}
          {selectedPayment.accountNumber ? (
            <View style={styles.investorDetail}>
              <Text style={[styles.investorLabel, { color: colors.text.primary }]}>
                {t('investment.accountNumberLabel')}
              </Text>
              <Text
                style={[styles.investorValue, { color: colors.text.primary }]}
                selectable
              >
                {selectedPayment.accountNumber}
              </Text>
            </View>
          ) : null}
          {selectedPayment.bic ? (
            <View style={styles.investorDetail}>
              <Text style={[styles.investorLabel, { color: colors.text.primary }]}>
                {t('investment.bicLabel')}
              </Text>
              <Text
                style={[styles.investorValue, { color: colors.text.primary }]}
                selectable
              >
                {selectedPayment.bic}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.confirmationSection}>
        <TouchableOpacity
          style={styles.confirmationBox}
          onPress={() => setConfirmSubscription(!confirmSubscription)}
          activeOpacity={0.7}
        >
          <View style={[
            styles.checkboxBox,
            { borderColor: colors.primary },
            confirmSubscription && { backgroundColor: colors.primary }
          ]}>
            {confirmSubscription && <Check size={14} color={colors.text.inverse} />}
          </View>
          <Text style={[styles.confirmationText, { color: colors.text.primary }]}>
            {confirmSubscriptionText}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    );
  };

  if (loading) {
    return <InvestmentShimmer />;
  }

  if (!project) {
    return (
      <View
        style={[
          styles.errorContainer,
          { backgroundColor: colors.background.secondary },
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
            styles.backIcon,
            { backgroundColor: colors.background.secondary },
          ]}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          {currentStep === 2 ? null : (
            <>
              <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
                {t('investment.tokenPurchase')}
              </Text>
              <Text
                style={[styles.headerSubtitle, { color: colors.text.secondary }]}
              >
                {project.title}
              </Text>
            </>
          )}
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Step Content */}
      <View style={styles.content}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && hasSignableDocs && renderStep2()}
        {(currentStep === 3 || (currentStep === 2 && !hasSignableDocs)) && renderStep3()}
      </View>

      {/* Footer */}
      <View
        style={[
          styles.footer,
          {
            paddingBottom: Math.max(insets.bottom, 20),
            backgroundColor: colors.background.primary,
            borderTopColor: colors.border.primary,
          },
        ]}
      >
        {renderFooterAction()}
      </View>
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
    fontFamily: Typography.fontFamily.medium,
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
    fontFamily: Typography.fontFamily.semiBold,
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
    fontFamily: Typography.fontFamily.semiBold,
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
    fontFamily: Typography.fontFamily.bold,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.regular,
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
    fontFamily: Typography.fontFamily.medium,
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
    fontFamily: Typography.fontFamily.bold,
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
    fontFamily: Typography.fontFamily.regular,
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
  title: { fontSize: 16, fontWeight: "600", alignSelf: 'center' },
  detailsTitle: {
    fontSize: 18,
    fontFamily: Typography.fontFamily.bold,
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
    fontFamily: Typography.fontFamily.regular,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.semiBold,
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
    fontFamily: Typography.fontFamily.bold,
    marginHorizontal: 16,
  },
  totalRow: {
    borderTopWidth: 1,
    paddingTop: 16,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.bold,
  },
  totalValue: {
    fontSize: 18,
    fontFamily: Typography.fontFamily.bold,
  },
  formSection: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.semiBold,
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: Typography.fontFamily.regular,
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
    fontFamily: Typography.fontFamily.regular,
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
    fontFamily: Typography.fontFamily.semiBold,
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
    fontFamily: Typography.fontFamily.regular,
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
    fontFamily: Typography.fontFamily.semiBold,
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
    fontFamily: Typography.fontFamily.bold,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.regular,
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.semiBold,
  },
  totalSummaryRow: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 8,
  },
  totalSummaryLabel: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.bold,
  },
  totalSummaryValue: {
    fontSize: 18,
    fontFamily: Typography.fontFamily.bold,
  },
  investorSection: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },
  investorTitle: {
    fontSize: 18,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: 20,
  },
  investorDetail: {
    marginBottom: 16,
  },
  investorLabel: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.semiBold,
    marginBottom: 4,
  },
  investorValue: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.regular,
  },
  investorSignature: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.regular,
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
    fontFamily: Typography.fontFamily.regular,
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
    fontFamily: Typography.fontFamily.bold,
    marginBottom: 20,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderLabel: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.regular,
  },
  orderValue: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.semiBold,
  },
  orderTotalRow: {
    borderTopWidth: 1,
    paddingTop: 16,
    marginTop: 16,
    marginBottom: 20,
  },
  orderTotalLabel: {
    fontSize: 18,
    fontFamily: Typography.fontFamily.bold,
  },
  orderTotalValue: {
    fontSize: 20,
    fontFamily: Typography.fontFamily.bold,
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
    fontFamily: Typography.fontFamily.regular,
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
    fontFamily: Typography.fontFamily.semiBold,
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
    fontFamily: Typography.fontFamily.semiBold,
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
  },
});