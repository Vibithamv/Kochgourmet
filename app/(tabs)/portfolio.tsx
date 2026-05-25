import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
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
  Download,
  ChevronDown,
  Check,
  FileText,
  X,
  CheckCheck,
} from 'lucide-react-native';
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
import type { PortfolioActivity, Transaction } from '@/types';
import TransactionDetailsModal from '@/components/TransactionDetailsModal';
import { offeringDetails } from '@/hooks/offering_details';
import {
  findCustomIbanInPaymentProviderList,
  isOrderedTransactionStatus,
  type CustomIbanBankDetails,
} from '@/utils/customIbanBankDetails';
import { portfolio } from '@/hooks/portfolio';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useGlobalAlert } from '@/contexts/AlertContext';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { downloadReports } from '@/hooks/downloadReports';
import { useOfferingCheck } from '@/hooks/useOfferingCheck';
import {
  PortfolioChartShimmer,
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
    amount: Number(p.amount) || 0,
    amountInCurrency: Number(p.amountInCurrency) || 0,
    currency:
      transactionType === 'Order'
        ? String(p.currency ?? '')
        : String(offering.currency ?? p.currency ?? ''),
    status: String(p.status ?? ''),
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
    status:
      activity.transactionType === 'Send' || activity.transactionType === 'Receive'
        ? 'completed'
        : activity.status,
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

const PortfolioScreen = React.memo(() => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const shimmerAnim = useShimmerAnim();
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
  const [reportsModalVisible, setReportsModalVisible] = useState(false);
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
  const [totalInvestment, setTotalInvestment] = useState('');
  const [currency, setCurrency] = useState('');
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

      await Promise.all([loadTransaction(), loadInvestment(period)]);
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

  const loadInvestment = async (pg: string) => {
    portfolioDatas
      .getPortfolio(await AsyncStorage.getItem('AccountID'), 'ALL', pg)
      .then((res) => {
        setLoading(false);
        let i = 0;
        if (res.success && res.data) {
          setTotalInvestment(res.data.data.totalInvested);
          setCurrency(res.data.data.tenantCurrency);
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
      const fiatRaw = Number(transaction.amountInCurrency);
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

  const keyExtractorTransaction = React.useCallback(
    (item: Transaction, index: any) => item.id,
    []
  );

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
    <ScrollView
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
    >
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
                <View style={styles.performanceHeaderActions}>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      {
                        backgroundColor: colors.interactive.hover,
                        borderColor: colors.border.primary,
                      },
                    ]}
                    onPress={() => setReportsModalVisible(true)}
                    accessibilityLabel={t('portfolio.downloadReports')}
                  >
                    <BarChart3 size={16} color={colors.primary} />
                  </TouchableOpacity>
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
              </View>
              {renderPerformanceChartContent()}
            </View>
          </View>

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
    </ScrollView>
    </View>

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
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      minWidth: 0,
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
    performanceHeaderActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      flexShrink: 0,
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
  });
