import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ListRenderItem,
  Platform,
  Modal,
  ScrollView,
  RefreshControl,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import {
  ArrowUpRight,
  ArrowDownRight,
  ChartBar as BarChart3,
  Activity,
  Wallet,
  Send,
  Download,
  ChevronDown,
  Check,
  QrCode,
  FileText,
  X,
  CheckCheck,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import {
  getColors,
  getTypography,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from '@/constants/theme';
import type { Investment, PortfolioActivity, Transaction } from '@/types';
import OptimizedImage from '@/components/OptimizedImage';
import TransactionDetailsModal from '@/components/TransactionDetailsModal';
import { offeringDetails } from '@/hooks/offering_details';
import {
  findCustomIbanInPaymentProviderList,
  isOrderedTransactionStatus,
  type CustomIbanBankDetails,
} from '@/utils/customIbanBankDetails';
import {
  pickActivityAmountInCurrencyFromRecord,
  parseActivityAmount,
  resolvePortfolioActivityFiatAmount,
} from '@/utils/portfolioActivityAmount';
import {
  pickActivityStatusFromRecord,
  resolvePortfolioActivityDisplayStatus,
} from '@/utils/portfolioActivityStatus';
import { portfolio } from '@/hooks/portfolio';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useGlobalAlert } from '@/contexts/AlertContext';
import QRCode from 'react-native-qrcode-svg';
import { userManagement } from '@/hooks/userManagement';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { downloadReports } from '@/hooks/downloadReports';
import { useOfferingCheck } from '@/hooks/useOfferingCheck';
import Clipboard from '@react-native-clipboard/clipboard';
import {
  PortfolioChartShimmer,
  PortfolioInvestmentRowShimmer,
  PortfolioOverviewShimmer,
  PortfolioTransactionRowShimmer,
  useShimmerAnim,
} from '@/components/Shimmer';
import AsseteraLogo from '@/components/AsseteraLogo';

const screenWidth = Dimensions.get('window').width;

const PORTFOLIO_PERFORMANCE_CHART_SEGMENTS = 4;
/** Default Y-axis max when all performance values are equal (e.g. all zero). */
const PORTFOLIO_PERFORMANCE_CHART_EMPTY_Y_MAX = 5;
const PORTFOLIO_PERFORMANCE_CHART_EMPTY_SEGMENTS = 5;

const EVM_EXTERNAL_WALLET_PROVIDERS = new Set([
  'metamask',
  'walletconnect',
  'wallet_connect',
  'fireblocks',
]);

const EMBEDDED_WALLET_PROVIDERS = new Set(['thirdweb']);

function receiveModalAddressForWalletTab(
  walletId: string,
  evmAddress: string,
  embeddedAddress: string,
  concordiumAddress: string,
): string {
  if (walletId === 'metamask') return evmAddress;
  if (walletId === 'embedded') return embeddedAddress;
  return concordiumAddress;
}

function pickActivityString(source: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const v = source[key];
    if (typeof v === 'string' && v.trim().length > 0) return v.trim();
  }
  return '';
}

function toPortfolioActivity(p: Record<string, unknown>, index: number): PortfolioActivity {
  const offering = (p.offering as Record<string, unknown> | undefined) ?? {};
  const transactionType = String(p.transactionType ?? '');
  return {
    id: `${String(p.id ?? index)}-${index}`,
    offeringId: p.offeringId != null ? String(p.offeringId) : undefined,
    transactionType,
    amount: parseActivityAmount(p.amount),
    amountInCurrency: pickActivityAmountInCurrencyFromRecord(p),
    currency:
      transactionType === 'Order'
        ? String(p.currency ?? '')
        : String(offering.currency ?? p.currency ?? ''),
    status: pickActivityStatusFromRecord(p),
    transactionDate: String(p.transactionDate ?? ''),
    offeringName: String(p.offeringName ?? ''),
    offering: {
      symbol: String(offering.symbol ?? ''),
      currency: offering.currency != null ? String(offering.currency) : undefined,
    },
    paymentProviderType: pickActivityString(p, ['paymentProviderType', 'payment_provider_type']),
    paymentBankingName: pickActivityString(p, ['paymentBankingName', 'payment_banking_name']),
    paymentAccountName: pickActivityString(p, ['paymentAccountName', 'payment_account_name']),
    paymentAccountNr: pickActivityString(p, [
      'paymentAccountNr',
      'payment_account_nr',
      'payment_bank_nr',
    ]),
    paymentBic: pickActivityString(p, ['paymentBic', 'payment_bic', 'bic']),
  };
}

function toTransaction(activity: PortfolioActivity): Transaction {
  return {
    id: activity.id,
    type: activity.transactionType as Transaction['type'],
    amount: activity.amount,
    amountInCurrency: activity.amountInCurrency,
    symbol: activity.offering.symbol,
    status: resolvePortfolioActivityDisplayStatus(activity),
    created_at: activity.transactionDate,
    description: activity.offeringName,
    currency: activity.currency,
    activity,
  };
}

/**
 * react-native-chart-kit Y labels use (range/segments)*i + min then toFixed(decimalPlaces).
 * With decimalPlaces 0 and a small range, fractional steps round to duplicate labels (e.g. 0,1,1,2,2).
 */
function performanceChartYAxisDecimalPlaces(
  values: number[],
  segmentCount: number
): number {
  if (values.length === 0 || segmentCount <= 0) return 0;
  const finite = values.filter((v) => Number.isFinite(v));
  if (finite.length === 0) return 0;
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  if (min === max) return 0;
  const range = max - min;
  const step = range / segmentCount;
  if (step <= 0) return 0;
  if (step < 0.01) return 4;
  if (step < 0.1) return 3;
  if (step < 1) return 2;
  if (step < 10) return 1;
  return 0;
}

/** True when CSV is empty, whitespace-only, or only a header row (no data to export). */
function isEmptyCsvForDownload(csvText: string): boolean {
  const trimmed = csvText.trim();
  if (!trimmed) return true;
  const lines = trimmed
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  return lines.length <= 1;
}

function createStyledListSeparator(
  separatorStyle: StyleProp<ViewStyle>
): React.FC {
  function StyledListSeparator() {
    return <View style={separatorStyle} />;
  }
  StyledListSeparator.displayName = 'StyledListSeparator';
  return StyledListSeparator;
}

function InvestmentsFlatListSeparator() {
  return <View style={{ height: Spacing.md }} />;
}

type PortfolioColors = ReturnType<typeof getColors>;

function PortfolioListEmptyComponent({
  loading,
  colors,
}: Readonly<{
  loading: boolean;
  colors: PortfolioColors;
}>) {
  const { t } = useTranslation();
  const shimmerAnim = useShimmerAnim();
  if (loading) {
    return (
      <View style={{ padding: Spacing.xl, gap: 12 }}>
        <PortfolioInvestmentRowShimmer anim={shimmerAnim} />
        <PortfolioInvestmentRowShimmer anim={shimmerAnim} />
        <PortfolioInvestmentRowShimmer anim={shimmerAnim} />
      </View>
    );
  }
  return (
    <View style={{ padding: Spacing.xl, alignItems: 'center' }}>
      <Text style={{ color: colors.text.primary }}>{t('portfolio.noDataAvailable')}</Text>
    </View>
  );
}

const PortfolioScreen = React.memo(() => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const shimmerAnim = useShimmerAnim();
  const flatListRef = React.useRef<FlatList>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<PortfolioActivity | null>(null);
  const [transactionDetailVisible, setTransactionDetailVisible] = useState(false);
  const [transactionBankDetails, setTransactionBankDetails] =
    useState<CustomIbanBankDetails | null>(null);
  const [transactionBankLoading, setTransactionBankLoading] = useState(false);
  const transactionBankCacheRef = React.useRef<
    Map<string, CustomIbanBankDetails | null>
  >(new Map());
  const offeringDetailsApi = offeringDetails();
  const [selectedPeriod, setSelectedPeriod] = useState<'3m' | '6m' | '1y'>(
    '6m'
  );
  const [periodDropdownVisible, setPeriodDropdownVisible] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [reportsModalVisible, setReportsModalVisible] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<string>('fireblocks');
  const { showAlert } = useGlobalAlert();

  const showNoDownloadDataAlert = () => {
    showAlert(t('portfolio.noDataAvailable'), t('portfolio.noDataToShowRightNow'), {
      buttonText: t('common.ok'),
    });
  };
  const colors = getColors(theme);
  const portfolioDatas = portfolio();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const TransactionsListSeparator = React.useMemo(
    () =>
      createStyledListSeparator([
        styles.separator,
        { backgroundColor: colors.border.secondary },
      ]),
    [styles.separator, colors.border.secondary]
  );
  const [walletAddress, setWalletAddress] = useState('');
  const [embeddedWalletAddress, setEmbeddedWalletAddress] = useState('');
  const [concordiumWalletAddress, setConcordiumWalletAddress] = useState('');
  const [walletPopupVisible, setWalletPopupVisible] = React.useState(false);
  const [totalInvestment, setTotalInvestment] = useState('');
  const [currency, setCurrency] = useState('');
  const [wallets, setWallets] = React.useState<{ address: string }[]>([]);
  const [embeddedWallets, setEmbeddedWallets] = React.useState<{ address: string }[]>([]);
  const [concordiumWallets, setConcordiumWallets] = React.useState([]);
  const user = userManagement();
  const [months, setMonths] = React.useState<string[]>([]);
  const [performance, setPerformance] = React.useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const downloadReportsData = downloadReports();
  const { performOfferingCheck } = useOfferingCheck();

  const periodOptions = React.useMemo(() => [
    { key: '3m', label: t('portfolio.months3') },
    { key: '6m', label: t('portfolio.months6') },
    { key: '1y', label: t('portfolio.year1') },
  ] as const, [t]);

  const getLocalizedMonths = () => {
    return months;
  };

  const getLocalizedChartData = () => {
    return performance;
  };

  let portfolioInvestment: Investment[] = [];
  let portfolioTransaction: Transaction[] = [];

  useFocusEffect(
    React.useCallback(() => {
      loadData();
      return () => { };
    }, [])
  );

  const loadData = async () => {
    setLoading(true);

    try {
      await performOfferingCheck();
      const period = (await AsyncStorage.getItem("period")) || "6m";

      await Promise.all([
        getUser(),
        loadTransaction(),
        loadInvestment(period),
      ]);
    } catch (error) {
      console.error("Load data error:", error);
    }
  };

  useEffect(() => {
    saveItems();
    loadData();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadData()
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const saveItems = async () => {
    await AsyncStorage.setItem('period', '6m');
  };

  const getUser = async () => {
    user.getUser().then((data) => {
      if (data.success && data.data) {
        const activeWallets = data.data.data.activeAccount.blockchainWallets.filter(
          (wallet: any) => wallet.status === 'ACTIVE'
        );
        const metawallets = activeWallets
          .filter((wallet: any) =>
            EVM_EXTERNAL_WALLET_PROVIDERS.has(
              String(wallet.blockchain_provider ?? '').toLowerCase()
            )
          )
          .map((wallet: any) => ({
            address: wallet.public_address,
          }));
        const embeddedList = activeWallets
          .filter((wallet: any) =>
            EMBEDDED_WALLET_PROVIDERS.has(
              String(wallet.blockchain_provider ?? '').toLowerCase()
            )
          )
          .map((wallet: any) => ({
            address: wallet.public_address,
          }));
        setWallets([]);
        setWallets(metawallets);
        setEmbeddedWallets([]);
        setEmbeddedWallets(embeddedList);
        const concordiumWallets = data.data.data.activeAccount.blockchainWallets
          .filter(
            (wallet: any) =>
              wallet.status === 'ACTIVE' &&
              wallet.blockchain_provider.toLowerCase() === 'concordium'
          )
          .map((wallet: any) => ({
            address: wallet.public_address,
          }));
        setConcordiumWallets([]);
        setConcordiumWallets(concordiumWallets);
      } else if (data.status === 401) {
        showAlert(t('profile.sessionExpired'), t('profile.loginAgain'));
        router.replace("/auth/login");
      }
    });
  };

  const loadInvestment = async (pg: string) => {
    portfolioDatas
      .getPortfolio(await AsyncStorage.getItem('AccountID'), 'ALL', pg)
      .then((res) => {
        setLoading(false);
        let i = 0;
        if (res.success && res.data) {
          setTotalInvestment(res.data.data.totalInvested);
          setCurrency(res.data.data.tenantCurrency);
          if (res.data.data.portfolio.length > 0) {
            portfolioInvestment = res.data.data.portfolio.map(
              (p: any, index: number) => ({
                id: p.id,
                offering_id: p.offering_id,
                name: p.offering_name,
                image: p.hero_image === null ? '' : p.hero_image,
                invested: p.amount,
                tokenBalance: p.token_balance,
                decimal: p.decimals,
                transaction_date: p.transaction_date,
                walletAddress: p.blockchain_wallet_address,
                publicAddress: p.public_address,
                symbol: p.offering_symbol,
                invested_amount: p.invested_amount,
              })
            );
            setInvestments(portfolioInvestment);
          }
          const months = Object.keys(res.data.data.performance_data.data);
          const values = Object.values(
            res.data.data.performance_data.data
          ).map(Number);
          setMonths(months);
          setPerformance(values);
        } else {
          showAlert(t('common.failed'), t('portfolio.failedFetchPortfolio'));
          console.log('Failed to fetch portfolio:', res.error);
        }
      });
  };

  const loadTransaction = async () => {
    portfolioDatas
      .portfolioActivities(await AsyncStorage.getItem('AccountID'), 1, 30)
      .then((res) => {
        let i = 0;
        if (res.success && res.data) {
          if (res.data.data.activities.length > 0) {
            portfolioTransaction = res.data.data.activities
              .filter(
                (p: any) =>
                  p.transactionType === 'Send' ||
                  p.transactionType === 'Receive' ||
                  p.transactionType === 'Order' || p.transactionType === 'Payment'
              )
              .map((p: any, index: number) =>
                toTransaction(toPortfolioActivity(p as Record<string, unknown>, index))
              );

            setTransactions(portfolioTransaction);
          }
        } else {
          showAlert(t('common.failed'), t('portfolio.failedFetchActivities'));
          console.log('Failed to fetch portfolio activities:', res.error);
        }
      });
  };

  const buildRecentActivitiesCsv = (activities: any[]) => {
    const headers = ['Date', 'Type', 'Description', 'Amount', 'Currency', 'Status'];
    const rows = activities.map((item: any) => [
      new Date(item.transactionDate).toLocaleDateString(),
      item.transactionType,
      `"${item.offeringName}"`,
      item.amount,
      item.currency,
      'Completed',
    ]);
    return [headers.join(','), ...rows.map((row: any[]) => row.join(','))].join('\n');
  };

  /** iOS has no direct download folder; share sheet is shown. Alert runs after dismiss so it is visible. */
  const shareCsvOnIosWithSuccessAlert = async (tempFilePath: string) => {
    if (!(await Sharing.isAvailableAsync())) {
      showAlert(t('common.alert'), t('portfolio.sharingNotAvailable'));
      return;
    }
    try {
      await Sharing.shareAsync(tempFilePath, {
        mimeType: 'text/csv',
        UTI: 'public.comma-separated-values-text',
      });
    } catch (e) {
      console.log(e);
      showAlert(t('common.alert'), t('portfolio.failedToDownload'));
      return;
    }
  };

  const saveCsvFileWithPlatformHandling = async (fileName: string, csvContent: string) => {
    const tempFilePath = `${(FileSystem as any).documentDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(tempFilePath, csvContent, { encoding: 'utf8' });

    if (Platform.OS === 'android') {
      try {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (permissions.granted) {
          const uri = await FileSystem.StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            fileName,
            'text/csv'
          );
          await FileSystem.writeAsStringAsync(uri, csvContent, { encoding: 'utf8' });
          showAlert(t('common.success'), t('portfolio.fileDownloadedSuccessfully'));
        }
      } catch (e) {
        console.log(e);
      }
      return;
    }

    await shareCsvOnIosWithSuccessAlert(tempFilePath);
  };

  const downloadRecentTransactions = async () => {
    try {
      if (transactions.length === 0) {
        showNoDownloadDataAlert();
        return;
      }

      setLoading(true);
      const res = await portfolioDatas.portfolioActivities(await AsyncStorage.getItem('AccountID'), 1, 30);

      if (!res.success || !res.data || res.data.data.activities.length === 0) {
        showNoDownloadDataAlert();
        return;
      }
      console.log('res.data.data.activities', JSON.stringify(res.data.data.activities, null, 2));
      const csvContent = buildRecentActivitiesCsv(res.data.data.activities);
      if (isEmptyCsvForDownload(csvContent)) {
        showNoDownloadDataAlert();
        return;
      }
      console.log(csvContent);
      const fileName = `transactions_${Date.now()}.csv`;
      await saveCsvFileWithPlatformHandling(fileName, csvContent);
    } catch (error) {
      console.error('downloadRecentTransactions failed:', error);
      showAlert(t('common.alert'), t('portfolio.failedToDownload'));
    } finally {
      setLoading(false);
    }
  };

  const downloadTransactionHistory = async () => {
    setReportsModalVisible(false)
    downloadReportsData.downloadTransactionHistory(await AsyncStorage.getItem('AccountID')).then(async (res) => {
      if (!res.success || res.data == null) {
        showAlert(t('common.alert'), t('portfolio.failedToDownload'));
        return;
      }
      const csvText = typeof res.data === 'string' ? res.data : '';
      if (isEmptyCsvForDownload(csvText)) {
        showNoDownloadDataAlert();
        return;
      }
      const fileName = `transaction_history_${Date.now()}.csv`;

      const tempFilePath = `${(FileSystem as any).documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(tempFilePath, csvText, {
        encoding: 'utf8',
      });

      if (Platform.OS === 'android') {
        try {
          const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
          if (permissions.granted) {
            const uri = await FileSystem.StorageAccessFramework.createFileAsync(
              permissions.directoryUri,
              fileName,
              'text/csv'
            );
            await FileSystem.writeAsStringAsync(uri, csvText, { encoding: 'utf8' });
            showAlert(t('common.success'), t('portfolio.fileDownloadedSuccessfully'));
          }
        } catch (e) {
          console.log(e);
        }
      } else {
        await shareCsvOnIosWithSuccessAlert(tempFilePath);
      }
    })
  }

  const downloadPortfolio = async () => {
    setReportsModalVisible(false)
    downloadReportsData.downloadPortfolioReport(await AsyncStorage.getItem('AccountID')).then(async (res) => {
      if (!res.success || res.data == null) {
        showAlert(t('common.alert'), t('portfolio.failedToDownload'));
        return;
      }
      const csvText = typeof res.data === 'string' ? res.data : '';
      if (isEmptyCsvForDownload(csvText)) {
        showNoDownloadDataAlert();
        return;
      }

      const fileName = `portfolio_${Date.now()}.csv`;

      const tempFilePath = `${(FileSystem as any).documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(tempFilePath, csvText, {
        encoding: 'utf8',
      });

      if (Platform.OS === 'android') {
        try {
          const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
          if (permissions.granted) {
            const uri = await FileSystem.StorageAccessFramework.createFileAsync(
              permissions.directoryUri,
              fileName,
              'text/csv'
            );
            await FileSystem.writeAsStringAsync(uri, csvText, { encoding: 'utf8' });
            showAlert(t('common.success'), t('portfolio.fileDownloadedSuccessfully'));
          }
        } catch (e) {
          console.log(e);
        }
      } else {
        await shareCsvOnIosWithSuccessAlert(tempFilePath);
      }
    })
  }

  const downloadPerformance = async () => {
    setReportsModalVisible(false)
    downloadReportsData.downloadPerformanceReport(await AsyncStorage.getItem('AccountID')).then(async (res) => {
      console.log('downloadPerformance report response:', res);
      if (!res.success || res.data == null) {
        showAlert(t('common.alert'), t('portfolio.failedToDownload'));
        return;
      }
      const csvText = typeof res.data === 'string' ? res.data : '';
      if (isEmptyCsvForDownload(csvText)) {
        showNoDownloadDataAlert();
        return;
      }

      const fileName = `performance_report_${Date.now()}.csv`;

      const tempFilePath = `${(FileSystem as any).documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(tempFilePath, csvText, {
        encoding: 'utf8',
      });

      if (Platform.OS === 'android') {
        try {
          const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
          if (permissions.granted) {
            const uri = await FileSystem.StorageAccessFramework.createFileAsync(
              permissions.directoryUri,
              fileName,
              'text/csv'
            );
            await FileSystem.writeAsStringAsync(uri, csvText, { encoding: 'utf8' });
            showAlert(t('common.success'), t('portfolio.fileDownloadedSuccessfully'));
          }
        } catch (e) {
          console.log(e);
        }
      } else {
        await shareCsvOnIosWithSuccessAlert(tempFilePath);
      }
    })
  }

  const performanceChartFlat = React.useMemo(() => {
    if (performance.length === 0) return false;
    const finite = performance.filter((v) => Number.isFinite(v));
    if (finite.length === 0) return true;
    return Math.min(...finite) === Math.max(...finite);
  }, [performance]);

  const performanceYDecimals = React.useMemo(
    () =>
      performanceChartFlat
        ? 0
        : performanceChartYAxisDecimalPlaces(performance, PORTFOLIO_PERFORMANCE_CHART_SEGMENTS),
    [performance, performanceChartFlat]
  );

  const primaryRgb = React.useMemo(() => {
    const hex = colors.primary.replace('#', '');
    const r = Number.parseInt(hex.substring(0, 2), 16);
    const g = Number.parseInt(hex.substring(2, 4), 16);
    const b = Number.parseInt(hex.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  }, [colors.primary]);

  const portfolioData = React.useMemo(
    () => ({
      labels: getLocalizedMonths(),
      datasets: [
        {
          data: getLocalizedChartData(),
          strokeWidth: 3,
          color: (opacity = 1) => `rgba(${primaryRgb}, ${opacity})`,
        },
      ],
    }),
    [months, performance, primaryRgb]
  );

  const chartConfig = React.useMemo(
    () => ({
      backgroundColor: colors.background.card,
      backgroundGradientFrom: colors.background.card,
      backgroundGradientTo: colors.background.card,
      decimalPlaces: performanceYDecimals,
      color: (opacity = 1) => `rgba(${primaryRgb}, ${opacity})`,
      labelColor: (opacity = 1) => (theme === 'light' ? '#6B7280' : '#94A3B8'),
      style: { borderRadius: 0 },
      propsForLabels: {
        fontFamily: Typography.fontFamily.medium,
        fontSize: 9,
      },
      propsForBackgroundLines: {
        strokeWidth: 0.1,
        stroke: colors.text.primary,
        strokeDasharray: '6,6',
      },
      withHorizontalLines: true,
      withVerticalLines: false,
      withDots: true,
      withShadow: false,
      fillShadowGradient: colors.primary,
      fillShadowGradientFrom: colors.primary,
      fillShadowGradientTo: 'transparent',
      fillShadowGradientOpacity: 0.3,
      useShadowColorFromDataset: false,
    }),
    [colors, theme, primaryRgb, performanceYDecimals]
  );

  const renderPerformanceChartContent = () => {
    if (loading) {
      return <PortfolioChartShimmer anim={shimmerAnim} />;
    }
    if (months.length === 0 || performance.length === 0) {
      return (
        <Text style={{ textAlign: 'center', color: colors.text.primary }}>
          {t('portfolio.noDataAvailable')}
        </Text>
      );
    }
    return (
      <View style={styles.chartContainer}>
        <LineChart
          data={portfolioData}
          width={screenWidth - 55}
          height={180}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          withDots={true}
          withShadow={false}
          withInnerLines={true}
          withOuterLines={false}
          withVerticalLabels={true}
          withHorizontalLabels={true}
          withVerticalLines={false}
          withHorizontalLines={true}
          segments={
            performanceChartFlat
              ? PORTFOLIO_PERFORMANCE_CHART_EMPTY_SEGMENTS
              : PORTFOLIO_PERFORMANCE_CHART_SEGMENTS
          }
          {...(performanceChartFlat
            ? {
                fromZero: true,
                fromNumber: PORTFOLIO_PERFORMANCE_CHART_EMPTY_Y_MAX,
              }
            : {})}
          formatYLabel={(label) => {
            const n = Number.parseFloat(label);
            if (!Number.isFinite(n)) return label;
            if (Math.abs(n - Math.round(n)) < 1e-6) return String(Math.round(n));
            return n.toString();
          }}
        />
      </View>
    );
  };

  const closeTransactionDetail = () => {
    setTransactionDetailVisible(false);
    setSelectedTransaction(null);
    setTransactionBankDetails(null);
    setTransactionBankLoading(false);
  };

  const loadOrderedTransactionBankDetails = async (activity: PortfolioActivity) => {
    const offeringId = activity.offeringId?.trim();
    if (!offeringId) {
      setTransactionBankDetails(null);
      setTransactionBankLoading(false);
      return;
    }

    if (transactionBankCacheRef.current.has(offeringId)) {
      setTransactionBankDetails(transactionBankCacheRef.current.get(offeringId) ?? null);
      setTransactionBankLoading(false);
      return;
    }

    setTransactionBankLoading(true);
    setTransactionBankDetails(null);

    try {
      await performOfferingCheck();
      const res = await offeringDetailsApi.details(offeringId);
      let bank: CustomIbanBankDetails | null = null;
      if (res.success && res.data?.data?.paymentProviderList) {
        bank = findCustomIbanInPaymentProviderList(res.data.data.paymentProviderList);
      }
      transactionBankCacheRef.current.set(offeringId, bank);
      setTransactionBankDetails(bank);
    } catch (error) {
      console.error('Failed to load offering bank details:', error);
      transactionBankCacheRef.current.set(offeringId, null);
      setTransactionBankDetails(null);
    } finally {
      setTransactionBankLoading(false);
    }
  };

  const openTransactionDetail = (activity: PortfolioActivity) => {
    setSelectedTransaction(activity);
    setTransactionDetailVisible(true);
    setTransactionBankDetails(null);
    setTransactionBankLoading(false);

    if (isOrderedTransactionStatus(activity.status)) {
      void loadOrderedTransactionBankDetails(activity);
    }
  };

  const renderReceiveQrGraphic = () => {
    if (embeddedWalletAddress) {
      return (
        <QRCode
          value={embeddedWalletAddress}
          size={160}
          color={colors.shadow.primary}
          backgroundColor="#fff"
        />
      );
    }
    if (walletAddress) {
      return (
        <QRCode
          value={walletAddress}
          size={160}
          color={colors.shadow.primary}
          backgroundColor="#fff"
        />
      );
    }
    if (concordiumWalletAddress) {
      return (
        <QRCode
          value={concordiumWalletAddress}
          size={160}
          color={colors.shadow.primary}
          backgroundColor="#fff"
        />
      );
    }
    return <QrCode size={120} color={colors.text.tertiary} />;
  };

  const renderReceiveAddressSection = () => {
    const addressContainerStyle = [
      styles.addressContainer,
      {
        backgroundColor: colors.background.secondary,
        borderColor: colors.border.primary,
      },
    ];
    if (embeddedWalletAddress) {
      return (
        <View style={addressContainerStyle}>
          <Text
            style={[styles.addressLabel, { color: colors.text.secondary }]}
          >
            {t('portfolio.walletAddress')}
          </Text>
          <Text style={[styles.addressText, { color: colors.text.primary }]}>
            {embeddedWalletAddress}
          </Text>
          <TouchableOpacity
            style={[
              styles.copyAddressButton,
              { backgroundColor: colors.primary },
            ]}
            onPress={() => copyAddress(embeddedWalletAddress)}
          >
            <Text
              style={[
                styles.copyAddressText,
                { color: colors.text.inverse },
              ]}
            >
              {t('portfolio.copyAddress')}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (walletAddress) {
      return (
        <View style={addressContainerStyle}>
          <Text
            style={[styles.addressLabel, { color: colors.text.secondary }]}
          >
            {t('portfolio.walletAddress')}
          </Text>
          <Text style={[styles.addressText, { color: colors.text.primary }]}>
            {walletAddress}
          </Text>
          <TouchableOpacity
            style={[
              styles.copyAddressButton,
              { backgroundColor: colors.primary },
            ]}
            onPress={() => copyAddress(walletAddress)}
          >
            <Text
              style={[
                styles.copyAddressText,
                { color: colors.text.inverse },
              ]}
            >
              {t('portfolio.copyAddress')}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (concordiumWalletAddress) {
      return (
        <View style={addressContainerStyle}>
          <Text
            style={[styles.addressLabel, { color: colors.text.secondary }]}
          >
            {t('portfolio.walletAddress')}
          </Text>
          <Text style={[styles.addressText, { color: colors.text.primary }]}>
            {concordiumWalletAddress}
          </Text>
          <TouchableOpacity
            style={[
              styles.copyAddressButton,
              { backgroundColor: colors.primary },
            ]}
            onPress={() => copyAddress(concordiumWalletAddress)}
          >
            <Text
              style={[
                styles.copyAddressText,
                { color: colors.text.inverse },
              ]}
            >
              {t('portfolio.copyAddress')}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  };

  const renderWalletPickerScrollContent = () => {
    const emptyWalletsTextStyle = [
      {
        fontSize: 15,
        fontFamily: Typography.fontFamily.semiBold,
        marginTop: 10,
        marginBottom: 15,
        textAlign: 'center' as const,
      },
      { color: colors.error },
    ];

    if (selectedWallet === 'metamask') {
      if (wallets.length === 0) {
        return (
          <Text style={emptyWalletsTextStyle}>
            {t('portfolio.noWalletsConnected')}
          </Text>
        );
      }
      return wallets.map((item, index: number) => (
        <TouchableOpacity
          key={`${item.address}-${index}`}
          style={styles.addressRow}
          onPress={() => {
            setWalletAddress(item.address);
            setEmbeddedWalletAddress('');
            setConcordiumWalletAddress('');
            setWalletPopupVisible(false);
          }}
        >
          <Text
            style={[styles.copyAddressText, { color: colors.text.primary }]}
          >
            {item.address}
          </Text>
        </TouchableOpacity>
      ));
    }

    if (selectedWallet === 'embedded') {
      if (embeddedWallets.length === 0) {
        return (
          <Text style={emptyWalletsTextStyle}>
            {t('portfolio.noEmbeddedWalletsConnected')}
          </Text>
        );
      }
      return embeddedWallets.map((item, index: number) => (
        <TouchableOpacity
          key={`embedded-${item.address}-${index}`}
          style={styles.addressRow}
          onPress={() => {
            setEmbeddedWalletAddress(item.address);
            setWalletAddress('');
            setConcordiumWalletAddress('');
            setWalletPopupVisible(false);
          }}
        >
          <Text
            style={[styles.copyAddressText, { color: colors.text.primary }]}
          >
            {item.address}
          </Text>
        </TouchableOpacity>
      ));
    }

    if (concordiumWallets.length === 0) {
      return (
        <Text style={emptyWalletsTextStyle}>
          {t('portfolio.noWalletsConnected')}
        </Text>
      );
    }
    return concordiumWallets.map((item: any, index: number) => (
      <TouchableOpacity
        key={`${item.address}-${index}`}
        style={styles.addressRow}
        onPress={() => {
          setConcordiumWalletAddress(item.address);
          setWalletAddress('');
          setEmbeddedWalletAddress('');
          setWalletPopupVisible(false);
        }}
      >
        <Text
          style={[styles.copyAddressText, { color: colors.text.primary }]}
        >
          {item.address}
        </Text>
      </TouchableOpacity>
    ));
  };

  const formatCurrency = (amount: number, currency: string) => {
    const symbols: Record<string, string> = {
      BTC: '₿',
      ETH: 'Ξ',
      USDT: '₮',
      BNB: '🟡',
    };
    const upper = currency.toUpperCase();
    const symbol = symbols[upper] || upper;

    // Crypto: show up to 8 decimals
    const isCrypto = ['BTC', 'ETH', 'USDT', 'BNB'].includes(upper);

    if (isCrypto) {
      return `${symbol}${Number.parseFloat(amount.toFixed(2))}`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getDuration = (date: string) => {
    const transactionDate = new Date(date);
    const now = new Date();

    const diffMs = now.getTime() - transactionDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 1) return t('portfolio.today');
    if (diffDays === 1) return t('portfolio.dayAgo');
    if (diffDays < 30) return t('portfolio.daysAgo', { count: diffDays });

    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths === 1) return t('portfolio.monthAgo');
    return t('portfolio.monthsAgo', { count: diffMonths });
  };
  const renderInvestment: ListRenderItem<Investment> = React.useCallback(
    ({ item: investment, index }) => (
      <TouchableOpacity
        style={[
          styles.investmentCard,
          {
            backgroundColor: colors.background.card,
            borderColor: colors.border.primary,
          },
        ]}
        onPress={() => router.push(`/project/${investment.offering_id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.investmentHeader}>
          <View style={styles.investmentImageContainer}>
            {investment.image ? (
              <OptimizedImage
                source={{ uri: investment.image }}
                style={styles.investmentImage}
                resizeMode="cover"
              />
            ) : <OptimizedImage
              source={{ uri: 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800' }}
              style={styles.investmentImage}
              resizeMode="cover"
            />}
          </View>
          <View style={styles.investmentInfo}>
            <Text
              style={[styles.investmentTitle, { color: colors.text.primary }]}
              numberOfLines={1}
            >
              {investment.name}
            </Text>
            {/* <Text style={[styles.investmentLocation, { color: colors.text.secondary }]} numberOfLines={1}>
            {investment.project?.location}
          </Text> */}
            <View style={styles.investmentMetrics}>
              {/* <Text style={[styles.investmentReturn, { color: colors.success }]}>
              +{investment.project?.expected_return}%
            </Text> */}
              <Text
                style={[
                  styles.investmentDuration,
                  { color: colors.text.tertiary },
                ]}
              >
                {/* {investment.project?.duration_months}m */}
                {getDuration(investment.transaction_date)}
              </Text>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.investmentFooter,
            { borderTopColor: colors.border.secondary },
          ]}
        >
          <View style={styles.investmentAmounts}>
            <View style={styles.amountItem}>
              <Text
                style={[styles.amountLabel, { color: colors.text.secondary }]}
              >
                {t('portfolio.invested')}
              </Text>
              <Text
                style={[styles.amountValue, { color: colors.text.primary }]}
              >
                {formatCurrency(Number(investment.invested_amount), currency)}
              </Text>
            </View>
            <View style={styles.amountItem}>
              <Text
                style={[styles.amountLabel, { color: colors.text.secondary }]}
              >
                {t('portfolio.tokensOwned')}
              </Text>
              <Text
                style={[styles.amountValue, { color: colors.text.primary }]}
              >
                {' '}
                {(
                  Number(investment.tokenBalance) /
                  10 ** Number(investment.decimal)
                ).toFixed(2)}{' '}
                {investment.symbol}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: colors.interactive.hover,
                borderColor: colors.border.primary,
              },
            ]}
            onPress={() =>
              router.push({
                pathname: '/portfolio/transfer',
                params: {
                  transferFromAddress: investment.walletAddress,
                  publicAddress: investment.publicAddress,
                  tokenBalance: (
                    Number(investment.tokenBalance) /
                    10 ** Number(investment.decimal)
                  ).toFixed(2),
                  symbol: investment.symbol,
                },
              })
            }
          >
            <Send size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    ),
    [formatCurrency, colors, theme]
  );

  const getTransactionRowVisuals = (type: Transaction['type']) => {
    if (type === 'Receive') {
      return {
        icon: <ArrowDownRight size={16} color={colors.success} />,
        amountColor: colors.success,
        amountPrefix: '+',
      };
    }
    if (type === 'Send') {
      return {
        icon: <ArrowUpRight size={16} color={colors.error} />,
        amountColor: colors.error,
        amountPrefix: '-',
      };
    }
    return {
      icon: <CheckCheck size={16} color={colors.warning} />,
      amountColor: colors.warning,
      amountPrefix: '',
    };
  };

  const renderTransaction: ListRenderItem<Transaction> = React.useCallback(
    ({ item: transaction, index }) => {
      const rowVisuals = getTransactionRowVisuals(transaction.type);
      const fiatRaw = resolvePortfolioActivityFiatAmount(transaction.activity);
      const curr = (transaction.currency || currency || 'USD').trim();
      const showFiatRow = Number.isFinite(fiatRaw) && curr.length > 0;
      let signedFiat = fiatRaw;
      if (showFiatRow) {
        if (rowVisuals.amountPrefix === '-') {
          signedFiat = -Math.abs(fiatRaw);
        } else if (rowVisuals.amountPrefix === '+') {
          signedFiat = Math.abs(fiatRaw);
        }
      }

      return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => openTransactionDetail(transaction.activity)}
        style={[
          styles.transactionItem,
          { borderBottomColor: colors.border.secondary },
        ]}
      >
        <View
          style={[
            styles.transactionIcon,
            {
              backgroundColor:
                transaction.amount > 0 ? colors.interactive.hover : `${colors.error}20`,
            },
          ]}
        >
          {rowVisuals.icon}
        </View>
        <View style={styles.transactionContent}>
          <Text
            style={[
              styles.transactionDescription,
              { color: colors.text.primary },
            ]}
            numberOfLines={1}
          >
            {transaction.description}
          </Text>
          <Text
            style={[styles.transactionDate, { color: colors.text.secondary }]}
          >
            {new Date(transaction.created_at).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.transactionRight}>
          <Text
            style={[
              styles.transactionAmount,
              {
                color: rowVisuals.amountColor,
              },
            ]}
          >
            {rowVisuals.amountPrefix}
            {transaction.amount + ' ' + transaction.symbol}
          </Text>
          {showFiatRow ? (
            <Text
              style={[
                styles.transactionAmountCurrency,
                { color: colors.text.secondary },
              ]}
              numberOfLines={1}
            >
              {formatCurrency(signedFiat, curr)}
            </Text>
          ) : null}
          <Text
            style={[styles.transactionStatus, { color: colors.text.tertiary }]}
          >
            {transaction.status}
          </Text>
        </View>
      </TouchableOpacity>
      );
    },
    [formatCurrency, colors, currency]
  );

  const keyExtractorInvestment = React.useCallback(
    (item: Investment) => item.id,
    []
  );
  const keyExtractorTransaction = React.useCallback(
    (item: Transaction, index: any) => item.id,
    []
  );

  const copyAddress = (address: string) => {
    Clipboard.setString(address);
    showAlert(t('transfer.copied'), t('transfer.addressCopied'));
  };

  type WalletOption = {
    id: string;
    name: string;
    address: string;
    image: WalletImageKey; // <-- important!
  };

  const walletOptions: WalletOption[] = [
    // {
    //   id: 'concordium',
    //   name: 'Concordium',
    //   address: '0x742d35Cc6641C8532936f1234567890abcdef123',
    //   image: 'concordium',
    // },
    {
      id: 'metamask',
      name: t('transfer.metaMask'),
      address: '0x8ba1f109551bD432803012345678901234567890',
      image: 'metamask',
    },
    // {
    //   id: 'embedded',
    //   name: t('transfer.embeddedWallet'),
    //   address: '',
    //   image: 'embedded',
    // },
    // {
    //   id: 'walletconnect',
    //   name: 'WalletConnect',
    //   address: '0x1a2b3c4d5e6f7890abcdef1234567890abcdef12',
    // },
  ];

  type WalletImageKey = 'metamask' | 'concordium' | 'embedded';

  const walletIcons: Record<WalletImageKey, any> = {
    metamask: require('../../assets/images/metamask_icon.png'),
    concordium: require('../../assets/images/concordium_icon.jpeg'),
    embedded: require('../../assets/images/embedded-wallet.jpeg'),
  };

  const getCurrentPeriodLabel = () => {
    return (
      periodOptions.find((option) => option.key === selectedPeriod)?.label ||
      t('portfolio.months6')
    );
  };

  return (
    <>
    <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, 50),
            backgroundColor: colors.background.primary,
            borderBottomColor: colors.border.primary,
          },
        ]}
      >
        <View style={styles.headerInner}>
          <View style={styles.headerLogoWrap}>
            <AsseteraLogo width={130} height={25} />
          </View>
          <View style={styles.headerContent}>
            <Text
              style={[
                styles.headerTitle,
                {
                  color: colors.text.primary,
                  fontFamily: getTypography(theme).fontFamily.display,
                },
              ]}
            >
              {t('portfolio.title')}
            </Text>
            <Text
              style={[
                styles.headerSubtitle,
                { color: colors.text.secondary },
              ]}
            >
              {t('portfolio.subtitle')}
            </Text>
          </View>
        </View>
      </View>
    <FlatList
      ref={flatListRef}
      style={[
        styles.listBody,
        { backgroundColor: colors.background.secondary },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <PortfolioListEmptyComponent loading={loading} colors={colors} />
      }
      ListHeaderComponent={
        <>
          {/* Portfolio Overview Cards */}
          <View style={styles.overviewSection}>
            <View style={styles.overviewGrid}>
              {loading ? (
                <PortfolioOverviewShimmer anim={shimmerAnim} />
              ) : (
              <View
                style={[
                  styles.overviewCard,
                  {
                    backgroundColor: colors.background.card,
                    borderColor: colors.border.primary,
                  },
                ]}
              >
                <View style={styles.overviewHeader}>
                  <Wallet size={20} color={colors.text.secondary} />
                  <Text
                    style={[
                      styles.overviewLabel,
                      { color: colors.text.secondary },
                    ]}
                  >
                    {t('portfolio.totalInvested')}
                  </Text>
                </View>
                <Text
                  style={[styles.overviewValue, { color: colors.text.primary }]}
                >
                  {formatCurrency(Number(totalInvestment), currency)}
                </Text>
                <Text
                  style={[
                    styles.overviewChange,
                    { color: colors.text.tertiary },
                  ]}
                >
                  {t('portfolio.principalAmount')}
                </Text>
              </View>
              )}

              {/* <View style={[styles.overviewCard, { backgroundColor: colors.background.card, borderColor: colors.border.primary }]}>
                <View style={styles.overviewHeader}>
                  <TrendingUp size={20} color={colors.success} />
                  <Text style={[styles.overviewLabel, { color: colors.text.secondary }]}>{t('portfolio.currentValue')}</Text>
                </View>
                <Text style={[styles.overviewValue, { color: colors.text.primary }]}>{formatCurrency(currentValue)}</Text>
                <Text style={[styles.overviewChange, { color: colors.success }]}>
                  +{formatCurrency(totalReturn)} ({returnPercentage.toFixed(1)}%)
                </Text>
              </View> */}
            </View>

            <View
              style={[
                styles.performanceCard,
                {
                  backgroundColor: colors.background.card,
                  borderColor: colors.border.primary,
                },
              ]}
            >
              <View style={styles.performanceHeader}>
                <View style={styles.performanceTitle}>
                  <Activity size={20} color={colors.primary} />
                  <Text
                    style={[
                      styles.performanceLabel,
                      { color: colors.text.primary },
                    ]}
                  >
                    {t('portfolio.performance')}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.periodDropdown,
                    {
                      backgroundColor: colors.background.secondary,
                      borderColor: colors.border.primary,
                    },
                  ]}
                  onPress={() => setPeriodDropdownVisible(true)}
                >
                  <Text
                    style={[
                      styles.periodDropdownText,
                      { color: colors.text.primary },
                    ]}
                  >
                    {getCurrentPeriodLabel()}
                  </Text>
                  <ChevronDown size={16} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>
              {renderPerformanceChartContent()}
            </View>
          </View>

          {/* Investments Section Header */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Text
                style={[styles.sectionTitle, { color: colors.text.primary }]}
              >
                {t('portfolio.myWallet')}
              </Text>
              <Text
                style={[
                  styles.sectionSubtitle,
                  { color: colors.text.secondary },
                ]}
              >
                {investments.length} {t('portfolio.activePositions')}
              </Text>
            </View>
            <View style={styles.walletActions}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: colors.interactive.hover,
                    borderColor: colors.border.primary,
                  },
                ]}
                onPress={() => setReportsModalVisible(true)}
              >
                <BarChart3 size={16} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: colors.interactive.hover,
                    borderColor: colors.border.primary,
                  },
                ]}
                onPress={() => setQrModalVisible(true)}
              >
                <QrCode size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </>
      }
      ListFooterComponent={
        <>
          {/* Recent Transactions */}
          <View style={styles.transactionsSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Text
                  style={[styles.sectionTitle, { color: colors.text.primary }]}
                >
                  {t('portfolio.recentTransactions')}
                </Text>
                <Text
                  style={[
                    styles.sectionSubtitle,
                    { color: colors.text.secondary },
                  ]}
                >
                  {t('portfolio.last30Days')}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: colors.interactive.hover,
                    borderColor: colors.border.primary,
                  },
                ]}
                onPress={downloadRecentTransactions}
              >
                <Download size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.transactionsCard,
                {
                  backgroundColor: colors.background.card,
                  borderColor: colors.border.primary,
                },
              ]}
            >
              <FlatList
                data={transactions}
                renderItem={renderTransaction}
                keyExtractor={keyExtractorTransaction}
                scrollEnabled={false}
                ListEmptyComponent={
                  loading ? (
                    <View>
                      <PortfolioTransactionRowShimmer anim={shimmerAnim} />
                      <PortfolioTransactionRowShimmer anim={shimmerAnim} />
                      <PortfolioTransactionRowShimmer anim={shimmerAnim} />
                    </View>
                  ) : (
                    <View style={{ padding: Spacing.xl, alignItems: 'center' }}>
                      <Text style={{ color: colors.text.secondary }}>
                        {t('portfolio.noRecentTransactions')}
                      </Text>
                    </View>
                  )
                }
                removeClippedSubviews={true}
                ItemSeparatorComponent={TransactionsListSeparator}
              />
            </View>
          </View>

        </>
      }
      data={investments}
      renderItem={renderInvestment}
      keyExtractor={keyExtractorInvestment}
      ItemSeparatorComponent={InvestmentsFlatListSeparator}
    />
    </View>

      {/* Modals at screen root (iOS: Modal inside VirtualizedList header is unreliable) */}
    {/* Period Selection Modal */}
    <Modal
      animationType="slide"
      transparent={true}
      visible={periodDropdownVisible}
      onRequestClose={() => setPeriodDropdownVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: colors.background.primary },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text
              style={[styles.modalTitle, { color: colors.text.primary }]}
            >
              {t('portfolio.selectTimePeriod')}
            </Text>
            <TouchableOpacity
              style={[
                styles.closeButton,
                { backgroundColor: colors.background.secondary },
              ]}
              onPress={() => setPeriodDropdownVisible(false)}
            >
              <Text
                style={[
                  styles.closeButtonText,
                  { color: colors.text.secondary },
                ]}
              >
                ×
              </Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={periodOptions}
            keyExtractor={(item) => item.key}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.periodOption,
                  { borderBottomColor: colors.border.secondary },
                ]}
                onPress={async () => {
                  setSelectedPeriod(item.key);
                  setPeriodDropdownVisible(false);
                  await AsyncStorage.setItem('period', item.key);
                  loadInvestment(item.key);
                }}
              >
                <Text
                  style={[
                    styles.periodOptionText,
                    { color: colors.text.primary },
                  ]}
                >
                  {item.label}
                </Text>
                {selectedPeriod === item.key && (
                  <Check size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>

    {/* QR Code Modal */}
    <Modal
      animationType="slide"
      transparent={true}
      visible={qrModalVisible}
      presentationStyle="overFullScreen"
      onRequestClose={() => {
        setWalletPopupVisible(false);
        setQrModalVisible(false);
      }}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.qrModalContent,
            { backgroundColor: colors.background.primary },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text
              style={[styles.modalTitle, { color: colors.text.primary }]}
            >
              {t('portfolio.receiveTokens')}
            </Text>
            <TouchableOpacity
              style={[
                styles.closeButton,
                { backgroundColor: colors.background.secondary },
              ]}
              onPress={() => {
                setWalletPopupVisible(false);
                setQrModalVisible(false);
              }}
            >
              <X size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.qrContent}
            showsVerticalScrollIndicator={false}
            scrollEnabled={!walletPopupVisible}
          >
            {/* Wallet Selection */}
            <View style={styles.selectionSection}>
              <Text
                style={[
                  styles.selectionTitle,
                  { color: colors.text.primary },
                ]}
              >
                {t('portfolio.selectWallet')}
              </Text>
              <View style={styles.optionsList}>
                {walletOptions.map((wallet) => {
                  const address = receiveModalAddressForWalletTab(
                    wallet.id,
                    walletAddress,
                    embeddedWalletAddress,
                    concordiumWalletAddress
                  );

                  const formattedAddress = address
                    ? address.substring(0, 6) +
                    '...' +
                    address.substring(address.length - 4)
                    : '';
                  const isSelected = Boolean(address);
                  return (
                    <TouchableOpacity
                      key={wallet.id}
                      style={[
                        styles.optionItem,
                        {
                          backgroundColor: isSelected
                            ? colors.interactive.hover
                            : colors.background.secondary,
                          borderColor: isSelected ? colors.primary : colors.border.primary,
                        },
                      ]}
                      onPress={() => {
                        setSelectedWallet(wallet.id);
                        setWalletPopupVisible(true);
                      }}
                    >
                      <View
                        style={[
                          styles.optionIcon,
                          { backgroundColor: `${colors.primary}20` },
                        ]}
                      >
                        <Image
                          source={walletIcons[wallet.image]}
                          style={{ width: 15, height: 15 }} // adjust as needed
                          resizeMode="contain"
                        />
                      </View>
                      <View style={styles.optionInfo}>
                        <Text
                          style={[
                            styles.optionName,
                            { color: colors.text.primary },
                          ]}
                        >
                          {wallet.name}
                        </Text>

                        {!!address && (
                          <Text
                            style={[
                              styles.optionAddress,
                              { color: colors.text.secondary },
                            ]}
                          >
                            {formattedAddress}
                          </Text>
                        )}
                      </View>
                      {isSelected && <Check size={20} color={colors.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Blockchain Selection */}
            {/* <View style={styles.selectionSection}>
              <Text
                style={[
                  styles.selectionTitle,
                  { color: colors.text.primary },
                ]}
              >
                {t('portfolio.selectNetwork')}
              </Text>
              <View style={styles.optionsList}>
                {blockchainOptions.map((blockchain) => (
                  <TouchableOpacity
                    key={blockchain.id}
                    style={[
                      styles.optionItem,
                      {
                        backgroundColor:
                          selectedBlockchain === blockchain.id
                            ? colors.interactive.hover
                            : colors.background.secondary,
                        borderColor:
                          selectedBlockchain === blockchain.id
                            ? colors.primary
                            : colors.border.primary,
                      },
                    ]}
                    onPress={() => setSelectedBlockchain(blockchain.id)}
                  >
                    <View
                      style={[
                        styles.optionIcon,
                        { backgroundColor: `${blockchain.color}20` },
                      ]}
                    >
                      <View
                        style={[
                          styles.blockchainDot,
                          { backgroundColor: blockchain.color },
                        ]}
                      />
                    </View>
                    <View style={styles.optionInfo}>
                      <Text
                        style={[
                          styles.optionName,
                          { color: colors.text.primary },
                        ]}
                      >
                        {blockchain.name}
                      </Text>
                      <Text
                        style={[
                          styles.optionAddress,
                          { color: colors.text.secondary },
                        ]}
                      >
                        {blockchain.symbol}
                      </Text>
                    </View>
                    {selectedBlockchain === blockchain.id && (
                      <Check size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View> */}

            <View style={styles.qrCodeContainer}>
              <View
                style={[
                  styles.qrCodePlaceholder,
                  {
                    backgroundColor: colors.background.secondary,
                    borderColor: colors.border.primary,
                  },
                ]}
              >
                {renderReceiveQrGraphic()}
                <Text
                  style={[
                    styles.qrCodeText,
                    { color: colors.text.secondary },
                  ]}
                >
                  {t('portfolio.qrCode')}
                </Text>
              </View>
            </View>
            {renderReceiveAddressSection()}
          </ScrollView>
        </View>
        {walletPopupVisible ? (
          <View style={styles.walletPickerOverlay} pointerEvents="box-none">
            <TouchableOpacity
              style={StyleSheet.absoluteFillObject}
              activeOpacity={1}
              onPress={() => setWalletPopupVisible(false)}
              accessibilityRole="button"
              accessibilityLabel={t('common.cancel')}
            />
            <View
              style={[
                styles.popupContainer,
                {
                  backgroundColor: colors.background.card,
                  zIndex: 1,
                  elevation: 12,
                },
              ]}
            >
              <Text
                style={[styles.popupTitle, { color: colors.text.primary }]}
              >
                {t('portfolio.selectWalletAddress')}
              </Text>
              <ScrollView
                style={{ maxHeight: 220 }}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
              >
                {renderWalletPickerScrollContent()}
              </ScrollView>
              <TouchableOpacity
                style={[styles.popupClose]}
                onPress={() => setWalletPopupVisible(false)}
              >
                <X size={20} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </View>
    </Modal>

    {/* Reports Modal */}
    <Modal
      animationType="slide"
      transparent={true}
      visible={reportsModalVisible}
      onRequestClose={() => setReportsModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.reportsModalContent,
            { backgroundColor: colors.background.primary },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text
              style={[styles.modalTitle, { color: colors.text.primary }]}
            >
              {t('portfolio.downloadReports')}
            </Text>
            <TouchableOpacity
              style={[
                styles.closeButton,
                { backgroundColor: colors.background.secondary },
              ]}
              onPress={() => setReportsModalVisible(false)}
            >
              <X size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.reportsContent}
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity
              style={[
                styles.reportItem,
                {
                  backgroundColor: colors.background.card,
                  borderColor: colors.border.primary,
                },
              ]}
              onPress={() =>
                downloadPortfolio()
              }
            >
              <View
                style={[
                  styles.reportIcon,
                  { backgroundColor: colors.interactive.hover },
                ]}
              >
                <FileText size={24} color={colors.primary} />
              </View>
              <View style={styles.reportInfo}>
                <Text
                  style={[
                    styles.reportTitle,
                    { color: colors.text.primary },
                  ]}
                >
                  {t('portfolio.portfolioSummary')}
                </Text>
                <Text
                  style={[
                    styles.reportDescription,
                    { color: colors.text.secondary },
                  ]}
                >
                  {t('portfolio.portfolioSummaryDesc')}
                </Text>
              </View>
              <Download size={20} color={colors.text.tertiary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.reportItem,
                {
                  backgroundColor: colors.background.card,
                  borderColor: colors.border.primary,
                },
              ]}
              onPress={() =>
                downloadPerformance()
              }
            >
              <View
                style={[
                  styles.reportIcon,
                  { backgroundColor: colors.interactive.hover },
                ]}
              >
                <Activity size={24} color={colors.primary} />
              </View>
              <View style={styles.reportInfo}>
                <Text
                  style={[
                    styles.reportTitle,
                    { color: colors.text.primary },
                  ]}
                >
                  {t('portfolio.performanceReport')}
                </Text>
                <Text
                  style={[
                    styles.reportDescription,
                    { color: colors.text.secondary },
                  ]}
                >
                  {t('portfolio.performanceReportDesc')}
                </Text>
              </View>
              <Download size={20} color={colors.text.tertiary} />
            </TouchableOpacity>

            {/* <TouchableOpacity
              style={[
                styles.reportItem,
                {
                  backgroundColor: colors.background.card,
                  borderColor: colors.border.primary,
                },
              ]}
              onPress={() =>
                showAlert(
                  'Notice',
                  'Tax report download will be available soon'
                )
              }
            >
              <View
                style={[
                  styles.reportIcon,
                  { backgroundColor: colors.interactive.hover },
                ]}
              >
                <TrendingUp size={24} color={colors.primary} />
              </View>
              <View style={styles.reportInfo}>
                <Text
                  style={[
                    styles.reportTitle,
                    { color: colors.text.primary },
                  ]}
                >
                  {t('portfolio.taxReport')}
                </Text>
                <Text
                  style={[
                    styles.reportDescription,
                    { color: colors.text.secondary },
                  ]}
                >
                  {t('portfolio.taxReportDesc')}
                </Text>
              </View>
              <Download size={20} color={colors.text.tertiary} />
            </TouchableOpacity> */}

            <TouchableOpacity
              style={[
                styles.reportItem,
                {
                  backgroundColor: colors.background.card,
                  borderColor: colors.border.primary,
                },
              ]}
              onPress={() =>
                downloadTransactionHistory()

              }
            >
              <View
                style={[
                  styles.reportIcon,
                  { backgroundColor: colors.interactive.hover },
                ]}
              >
                <Wallet size={24} color={colors.primary} />
              </View>
              <View style={styles.reportInfo}>
                <Text
                  style={[
                    styles.reportTitle,
                    { color: colors.text.primary },
                  ]}
                >
                  {t('portfolio.transactionHistory')}
                </Text>
                <Text
                  style={[
                    styles.reportDescription,
                    { color: colors.text.secondary },
                  ]}
                >
                  {t('portfolio.transactionHistoryDesc')}
                </Text>
              </View>
              <Download size={20} color={colors.text.tertiary} />
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>

    <TransactionDetailsModal
      visible={transactionDetailVisible}
      activity={selectedTransaction}
      formatCurrency={formatCurrency}
      bankDetails={transactionBankDetails}
      bankLoading={transactionBankLoading}
      onClose={closeTransactionDetail}
    />
    </>
  );
});

PortfolioScreen.displayName = 'PortfolioScreen';

export default PortfolioScreen;

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    listBody: {
      flex: 1,
    },

    // Header
    header: {
      paddingHorizontal: 24,
      paddingBottom: 16,
      borderBottomWidth: 1,
    },
    headerInner: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerLogoWrap: {
      height: 28,
      marginRight: 16,
      justifyContent: 'center',
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      fontSize: Typography.fontSize['2xl'],
      letterSpacing: -0.3,
      marginBottom: 2,
    },
    headerSubtitle: {
      fontSize: Typography.fontSize.sm,
      fontFamily: 'Inter-Regular',
    },

    // Overview Section
    overviewSection: {
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.xl,
    },
    overviewGrid: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginBottom: Spacing.xl,
    },
    overviewCard: {
      flex: 1,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      borderWidth: 1,
      ...Shadows.sm,
    },
    overviewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    overviewLabel: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.medium,
      marginLeft: Spacing.xs,
      letterSpacing: -0.1,
    },
    overviewValue: {
      fontSize: Typography.fontSize.xl,
      fontFamily: Typography.fontFamily.bold,
      letterSpacing: -0.3,
      marginBottom: Spacing.xs,
    },
    overviewChange: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
    },

    // Performance Chart Card
    performanceCard: {
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      borderWidth: 1,
      ...Shadows.sm,
    },
    performanceHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.lg,
    },
    performanceTitle: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    performanceLabel: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.semiBold,
      marginLeft: Spacing.sm,
      letterSpacing: -0.2,
    },
    periodDropdown: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      minWidth: 100,
      justifyContent: 'space-between',
      ...Shadows.xs,
    },
    periodDropdownText: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.semiBold,
      marginRight: Spacing.xs,
      letterSpacing: -0.1,
    },

    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
      bottom: 20,
    },
    modalContent: {
      borderTopLeftRadius: BorderRadius.xl,
      borderTopRightRadius: BorderRadius.xl,
      paddingTop: Spacing.xl,
      maxHeight: '40%',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing.xl,
      borderBottomWidth: 1,
    },
    modalTitle: {
      fontSize: Typography.fontSize.xl,
      fontFamily: Typography.fontFamily.bold,
    },
    closeButton: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeButtonText: {
      fontSize: Typography.fontSize.xl,
      fontWeight: 'bold',
    },
    periodOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.lg,
      borderBottomWidth: 1,
    },
    periodOptionText: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.semiBold,
      letterSpacing: -0.1,
    },

    // QR Modal Styles
    qrModalContent: {
      borderTopLeftRadius: BorderRadius.xl,
      borderTopRightRadius: BorderRadius.xl,
      paddingTop: Spacing.xl,
      minHeight: '90%',
    },
    qrContent: {
      paddingHorizontal: Spacing.xl,
    },
    selectionSection: {
      marginBottom: Spacing.xl,
      marginTop: Spacing.sm,
    },
    selectionTitle: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.semiBold,
      marginBottom: Spacing.md,
    },
    optionsList: {
      gap: Spacing.sm,
    },
    optionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
    },
    optionIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
    },
    optionInfo: {
      flex: 1,
      justifyContent: 'center',
    },
    optionName: {
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.semiBold,
      // marginBottom: 2,
    },
    optionAddress: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
    },
    blockchainDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    qrCodeContainer: {
      alignItems: 'center',
      paddingVertical: Spacing['3xl'],
    },
    qrCodePlaceholder: {
      width: 200,
      height: 200,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderStyle: 'dashed',
      marginBottom: Spacing.lg,
      paddingTop: 10,
    },
    qrCodeText: {
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.medium,
      marginTop: Spacing.sm,
    },
    addressContainer: {
      borderRadius: BorderRadius.lg,
      padding: Spacing.xl,
      borderWidth: 1,
      marginBottom: Spacing.xl,
    },
    addressLabel: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.medium,
      marginBottom: Spacing.sm,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    addressText: {
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.regular,
      marginBottom: Spacing.lg,
      lineHeight: 20,
    },
    copyAddressButton: {
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    copyAddressText: {
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.semiBold,
    },

    // Reports Modal Styles
    reportsModalContent: {
      borderTopLeftRadius: BorderRadius.xl,
      borderTopRightRadius: BorderRadius.xl,
      paddingTop: Spacing.xl,
      maxHeight: '80%',
    },
    reportsContent: {
      paddingHorizontal: Spacing.xl,
      marginTop: Spacing.md,
      marginBottom: Spacing.xl,
    },
    reportItem: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      borderWidth: 1,
      ...Shadows.sm,
    },
    reportIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.lg,
    },
    reportInfo: {
      flex: 1,
    },
    reportTitle: {
      fontSize: Typography.fontSize.lg,
      fontFamily: Typography.fontFamily.semiBold,
      marginBottom: 2,
      letterSpacing: -0.1,
    },
    reportDescription: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
    },
    chartContainer: {
      alignItems: 'center',
      marginTop: -Spacing.sm,
      marginHorizontal: -Spacing.sm,
    },
    chart: {
      borderRadius: 0,
      marginVertical: 0,
    },

    // Section Headers
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.lg,
    },
    sectionTitleContainer: {
      flex: 1,
    },
    sectionTitle: {
      fontSize: Typography.fontSize.xl,
      fontFamily: Typography.fontFamily.bold,
      letterSpacing: -0.2,
      marginBottom: 2,
    },
    sectionSubtitle: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
    },
    actionButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },
    walletActions: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },

    // Finance App Style Investment Cards
    investmentCard: {
      marginHorizontal: Spacing.xl,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      overflow: 'hidden',
      ...Shadows.sm,
    },
    investmentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.lg,
    },
    investmentImageContainer: {
      width: 48,
      height: 48,
      borderRadius: BorderRadius.md,
      overflow: 'hidden',
      marginRight: Spacing.md,
    },
    investmentImage: {
      width: '100%',
      height: '100%',
    },
    investmentInfo: {
      flex: 1,
    },
    investmentTitle: {
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.semiBold,
      letterSpacing: -0.1,
      marginBottom: 2,
    },
    investmentLocation: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
      marginBottom: Spacing.xs,
    },
    investmentMetrics: {
      flexDirection: 'row',
      gap: Spacing.md,
    },
    investmentReturn: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.semiBold,
    },
    investmentDuration: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
    },
    moreButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    investmentFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderTopWidth: 1,
    },
    investmentAmounts: {
      flexDirection: 'row',
      flex: 1,
      gap: Spacing.xl,
    },
    amountItem: {
      flex: 1,
    },
    amountLabel: {
      fontSize: Typography.fontSize.xs,
      fontFamily: Typography.fontFamily.medium,
      marginBottom: 2,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    amountValue: {
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.semiBold,
      letterSpacing: -0.1,
    },
    transferButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
    },

    // Transactions Section
    transactionsSection: {
      paddingTop: Spacing.xl,
    },
    transactionsCard: {
      marginHorizontal: Spacing.xl,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      overflow: 'hidden',
      ...Shadows.sm,
    },
    transactionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    },
    transactionIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
    },
    transactionContent: {
      flex: 1,
    },
    transactionDescription: {
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.medium,
      letterSpacing: -0.1,
      marginBottom: 2,
    },
    transactionDate: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.regular,
    },
    transactionRight: {
      alignItems: 'flex-end',
    },
    transactionAmount: {
      fontSize: Typography.fontSize.base,
      fontFamily: Typography.fontFamily.semiBold,
      letterSpacing: -0.2,
      marginBottom: 2,
    },
    transactionAmountCurrency: {
      fontSize: Typography.fontSize.sm,
      fontFamily: Typography.fontFamily.medium,
      letterSpacing: -0.1,
      marginBottom: 2,
    },
    transactionStatus: {
      fontSize: Typography.fontSize.xs,
      fontFamily: Typography.fontFamily.regular,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    separator: {
      height: 1,
      marginHorizontal: Spacing.lg,
    },
    walletPickerOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    popupOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
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

    addressRow: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(0,0,0,0.1)',
      flexDirection: 'row',
    },
    popupClose: {
      position: 'absolute',
      top: 12,
      right: 12,
      padding: 10,
      zIndex: 999,
      borderRadius: 15,
    },
  });
