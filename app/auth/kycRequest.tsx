import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import {
  getColors,
  getShadows,
  Spacing,
} from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { kycRequest } from '@/hooks/kycRequest';
import { useGlobalAlert } from '@/contexts/AlertContext';
import { useAuth } from '@/contexts/AuthContext';
import { replaceLoginClearingAuthStack } from '@/utils/authNavigation';
import { useFocusEffect } from '@react-navigation/native';
import { useKycPostVerificationFlow } from '@/hooks/useKycPostVerificationFlow';

export default function VerifyIdentityScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const colors = getColors(theme);
  const shadows = getShadows(theme);
  const isDark = theme === 'dark' || theme === 'darkGreen';
  const primaryButtonTextColor = isDark ? '#0D1117' : '#FFFFFF';
  const { id, from } = useLocalSearchParams();
  const showBackButton = from === 'menu';
  const request = kycRequest();
  const { showAlert } = useGlobalAlert();
  const { signOut } = useAuth();
  const [submitting, setSubmitting] = React.useState(false);
  const [kycStatus, setKycStatus] = React.useState<string | null>(null);
  const [statusLoading, setStatusLoading] = React.useState(true);
  const initialLoadDoneRef = React.useRef(false);
  const { fetchActiveAccountKycStatus } = useKycPostVerificationFlow();

  const loadData = React.useCallback(async () => {
    const showLoader = !initialLoadDoneRef.current;
    try {
      if (showLoader) {
        setStatusLoading(true);
      }
      const status = await fetchActiveAccountKycStatus();
      setKycStatus(status);
      initialLoadDoneRef.current = true;
    } catch (error) {
      console.error('Error loading KYC status:', error);
    } finally {
      if (showLoader) {
        setStatusLoading(false);
      }
    }
  }, [fetchActiveAccountKycStatus]);

  useFocusEffect(
    React.useCallback(() => {
      void loadData();
    }, [loadData]),
  );

  const handleCompleteKYC = async () => {
    setSubmitting(true);
    const result = await request.request(Array.isArray(id) ? id[0] : id, 'INDIVIDUAL');
    setSubmitting(false);
    if (result.success) {
      if (result.data.data.verification_url !== '') {
        router.push({
          pathname: '/screens/KYCWebView',
          params: { url: result.data.data.verification_url },
        });
      }
    } else {
      showAlert(
        t('kycRequest.requestFailedTitle'),
        result.error.message || t('common.tryAgain'),
      );
    }
  };

  const handleLogout = async () => {
    await signOut();
    replaceLoginClearingAuthStack();
  };

  const handleCancel = () => {
    if (showBackButton) {
      router.back();
      return;
    }
    showAlert(t('common.logout'), t('common.logoutMsg'), {
      buttonText: t('common.logout'),
      buttonCallback: () => {
        void handleLogout();
      },
      secondaryButtonText: t('common.cancel'),
    });
  };

  const isKycSettled = kycStatus === 'CONFIRMED' || kycStatus === 'PENDING';
  let titleText: string;
  let subtitleText: string;
  let primaryLabel: string;
  if (kycStatus === 'CONFIRMED') {
    titleText = t('kycRequest.confirmedTitle');
    subtitleText = t('kycRequest.confirmedSubtitle');
    primaryLabel = t('kycRequest.backButton');
  } else if (kycStatus === 'PENDING') {
    titleText = t('kycRequest.pendingTitle');
    subtitleText = t('kycRequest.pendingSubtitle');
    primaryLabel = t('kycRequest.backButton');
  } else {
    titleText = t('kycRequest.title');
    subtitleText = t('kycRequest.subtitle');
    primaryLabel = t('kycRequest.completeButton');
  }

  const screenBackground = isDark ? colors.background.primary : colors.background.secondary;

  if (statusLoading) {
    return (
      <View style={[styles.screen, { backgroundColor: screenBackground }]}>
        {showBackButton ? (
          <TouchableOpacity
            style={[
              styles.headerBtn,
              { top: insets.top + 10, backgroundColor: colors.background.card },
            ]}
            onPress={() => router.back()}
            hitSlop={8}
            activeOpacity={0.7}
          >
            <ArrowLeft size={22} color={colors.text.primary} />
          </TouchableOpacity>
        ) : null}
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: screenBackground }]}>
      {showBackButton ? (
        <TouchableOpacity
          style={[
            styles.headerBtn,
            { top: insets.top + 10, backgroundColor: colors.background.card },
          ]}
          onPress={() => router.back()}
          hitSlop={8}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color={colors.text.primary} />
        </TouchableOpacity>
      ) : null}

      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: Math.max(insets.top, 44) + Spacing['2xl'],
            paddingBottom: Math.max(insets.bottom, 30),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={require('../../assets/images/kyc-identity-illustration.png')}
          style={styles.illustration}
          resizeMode="contain"
        />

        <Text
          style={[styles.title, { color: colors.text.primary }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
        >
          {titleText}
        </Text>

        <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
          {subtitleText}
        </Text>

        {isKycSettled ? (
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              styles.singleBtn,
              { backgroundColor: colors.primary, opacity: submitting ? 0.6 : 1 },
            ]}
            disabled={submitting}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Text style={[styles.primaryBtnText, { color: primaryButtonTextColor }]}>
              {primaryLabel}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                styles.rowBtn,
                { backgroundColor: colors.primary, opacity: submitting ? 0.6 : 1 },
              ]}
              disabled={submitting}
              onPress={handleCompleteKYC}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={primaryButtonTextColor} />
              ) : (
                <Text
                  style={[styles.primaryBtnText, { color: primaryButtonTextColor }]}
                  numberOfLines={1}
                >
                  {primaryLabel}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.secondaryBtn,
                styles.rowBtn,
                shadows.card,
                {
                  backgroundColor: isDark ? colors.background.card : colors.background.primary,
                  borderColor: colors.border.primary,
                },
              ]}
              disabled={submitting}
              onPress={handleCancel}
              activeOpacity={0.85}
            >
              <Text style={[styles.secondaryBtnText, { color: colors.text.primary }]}>
                {t('kycRequest.cancelButton')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtn: {
    position: 'absolute',
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  illustration: {
    width: 260,
    height: 248,
    marginBottom: Spacing['3xl'],
  },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 35,
    lineHeight: 44,
    letterSpacing: -0.3,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    width: '100%',
  },
  subtitle: {
    fontFamily: 'Roboto-Light',
    fontSize: 17,
    lineHeight: 24,
    textAlign: 'left',
    alignSelf: 'stretch',
    width: '100%',
    marginBottom: Spacing['4xl'],
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    width: '100%',
    maxWidth: 360,
  },
  primaryBtn: {
    minHeight: 48,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  singleBtn: {
    minWidth: 200,
    alignSelf: 'center',
  },
  rowBtn: {
    flex: 1,
  },
  primaryBtnText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  secondaryBtn: {
    minHeight: 48,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  secondaryBtnText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
});
