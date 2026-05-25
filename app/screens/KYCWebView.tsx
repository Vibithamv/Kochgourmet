import { WebView } from 'react-native-webview';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Text,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { getColors, Typography, BorderRadius, Spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import { useKycPostVerificationFlow } from '@/hooks/useKycPostVerificationFlow';
import { useGlobalAlert } from '@/contexts/AlertContext';

export default function KYCWebView() {
  const { t } = useTranslation();
  const { url } = useLocalSearchParams();
  const kycUrl = Array.isArray(url) ? url[0] : url;
  const { theme } = useTheme();
  const colors = getColors(theme);
  const primaryBtnTextColor = colors.text.onPrimary;
  const insets = useSafeAreaInsets();
  const { showAlert } = useGlobalAlert();
  const { syncKycStatusAndNavigate, fetchActiveAccountKycStatus } =
    useKycPostVerificationFlow();
  const [webLoading, setWebLoading] = useState(false);
  const [continueLoading, setContinueLoading] = useState(false);
  const [kycConfirmed, setKycConfirmed] = useState(false);

  const handleNavigationChange = (navState: { loading?: boolean }) => {
    setWebLoading(navState.loading ?? false);
  };

  const handleBackAction = useCallback(() => {
    router.back();
    return true;
  }, []);

  const handleContinue = useCallback(async () => {
    setContinueLoading(true);
    try {
      await syncKycStatusAndNavigate();
    } catch (error) {
      console.error('KYC continue sync error:', error);
      showAlert(t('common.error'), t('common.errorMessage'));
    } finally {
      setContinueLoading(false);
    }
  }, [syncKycStatusAndNavigate, showAlert, t]);

  const pollKycStatus = useCallback(async () => {
    const status = await fetchActiveAccountKycStatus();
    if (status === 'CONFIRMED') {
      setKycConfirmed(true);
    }
  }, [fetchActiveAccountKycStatus]);

  useFocusEffect(
    useCallback(() => {
      void pollKycStatus();
      const intervalId = setInterval(() => {
        void pollKycStatus();
      }, 10_000);
      return () => clearInterval(intervalId);
    }, [pollKycStatus])
  );

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackAction
    );

    return () => subscription.remove();
  }, [handleBackAction]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        headerContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          zIndex: 20,
          borderBottomWidth: 1,
          borderBottomColor: colors.border.primary,
          backgroundColor: colors.background.primary,
        },
        backButton: {
          padding: 8,
          zIndex: 10,
        },
        headerTitle: {
          flex: 1,
          fontSize: Typography.fontSize.xl,
          fontFamily: 'Inter-Bold',
          textAlign: 'center',
          marginRight: 40,
          color: colors.text.primary,
        },
        footer: {
          paddingHorizontal: Spacing.xl,
          paddingTop: Spacing.md,
          borderTopWidth: 1,
          borderTopColor: colors.border.primary,
          backgroundColor: colors.background.primary,
        },
        continueButton: {
          borderRadius: BorderRadius.md,
          paddingVertical: Spacing.lg,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 48,
        },
        continueButtonText: {
          fontSize: Typography.fontSize.lg,
          fontFamily: 'Inter-SemiBold',
        },
      }),
    [colors]
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <View style={[styles.headerContainer, { paddingTop: insets.top + 5 }]}>
        <TouchableOpacity onPress={handleBackAction} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('account.kycVerification')}</Text>
      </View>
      <View style={{ flex: 1, position: 'relative' }}>
        <WebView
          source={{ uri: kycUrl ?? '' }}
          onNavigationStateChange={handleNavigationChange}
          androidHardwareAccelerationDisabled={true}
          style={{ flex: 1, backgroundColor: colors.background.secondary }}
        />
        {webLoading && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: colors.background.overlay,
            }}
          >
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
      </View>
      {kycConfirmed ? (
        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, Spacing.lg) },
          ]}
        >
          <TouchableOpacity
            style={[styles.continueButton, { backgroundColor: colors.primary }]}
            onPress={() => void handleContinue()}
            disabled={continueLoading}
            activeOpacity={0.85}
          >
            {continueLoading ? (
              <ActivityIndicator size="small" color={primaryBtnTextColor} />
            ) : (
              <Text style={[styles.continueButtonText, { color: primaryBtnTextColor }]}>
                {t('kycRequest.continueAfterWebView')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}
