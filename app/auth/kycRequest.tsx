import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle, LogOut } from 'lucide-react-native';
import {
  getColors,
  getTypography,
  Typography,
  Spacing,
  Colors,
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
  const typography = getTypography(theme);
  const isDark = theme === 'dark' || theme === 'darkGreen';
  const primaryButtonTextColor = isDark ? '#0D1117' : '#FFFFFF';
  const { name, id } = useLocalSearchParams();
  const request = kycRequest();
  const { showAlert } = useGlobalAlert();
  const { signOut } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [kycStatus, setKycStatus] = React.useState<string | null>(null);
  // `fetchActiveAccountKycStatus` reads the status without redirecting,
  // so users entering from the Menü don't get bounced when already verified.
  const { fetchActiveAccountKycStatus } = useKycPostVerificationFlow();

  const loadData = async () => {
    setLoading(true);
    try {
      const status = await fetchActiveAccountKycStatus();
      setKycStatus(status);
    } catch (error) {
      console.error('Error loading KYC status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      void loadData();
    }, [])
  );

  const handleCompleteKYC = async () => {
    setLoading(true);
    const result = await request.request(Array.isArray(id) ? id[0] : id, 'INDIVIDUAL');
    setLoading(false);
    if (result.success) {
      console.log('Kyc Request Result:', result.data);
      if (result.data.data.verification_url !== '') {
        router.push({
          pathname: '/screens/KYCWebView',
          params: { url: result.data.data.verification_url },
        });
      }

      //   router.replace("/screens/kycWaiting")
    } else {
      //  router.replace("/screens/kycWaiting")
      showAlert(
        t('kycRequest.requestFailedTitle'),
        result.error.message || t('common.tryAgain')
      );
    }
  };

  const handleLogout = async () => {
    await signOut();
    replaceLoginClearingAuthStack();
  };

  // Derive content from kycStatus so the JSX has no nested ternaries.
  const isKycSettled = kycStatus === 'CONFIRMED' || kycStatus === 'PENDING';
  let titleText: string;
  let subtitleText: string;
  let buttonLabel: string;
  if (kycStatus === 'CONFIRMED') {
    titleText = 'KYC abgeschlossen';
    subtitleText = 'Deine Identität wurde erfolgreich verifiziert.';
    buttonLabel = 'Zurück';
  } else if (kycStatus === 'PENDING') {
    titleText = 'KYC wird überprüft';
    subtitleText = 'Wir prüfen deine Angaben. Das dauert in der Regel 24–48 Stunden.';
    buttonLabel = 'Zurück';
  } else {
    titleText = t('kycRequest.title');
    subtitleText = t('kycRequest.subtitle');
    buttonLabel = t('kycRequest.completeButton');
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <TouchableOpacity
        style={[
          styles.logoutBtn,
          { top: insets.top + 10, backgroundColor: colors.background.secondary },
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
        <View style={[styles.iconContainer, { backgroundColor: colors.interactive.hover }]}>
          <CheckCircle size={56} color={colors.success} />
        </View>

        <Text style={[styles.welcomeText, { color: colors.text.primary, fontFamily: typography.fontFamily.medium }]}>
          {name}
        </Text>

        <Text style={[styles.title, { color: colors.text.primary, fontFamily: typography.fontFamily.display }]}>
          {titleText}
        </Text>

        <Text style={[styles.subtitle, { color: colors.text.secondary, fontFamily: typography.fontFamily.regular }]}>
          {subtitleText}
        </Text>

        <TouchableOpacity
          style={[
            styles.primaryBtn,
            { backgroundColor: colors.primary, opacity: loading ? 0.6 : 1 },
          ]}
          disabled={loading}
          onPress={isKycSettled ? () => router.back() : handleCompleteKYC}
        >
          {loading ? (
            <ActivityIndicator size="small" color={primaryButtonTextColor} />
          ) : (
            <Text
              style={[
                styles.primaryBtnText,
                {
                  color: primaryButtonTextColor,
                  fontFamily: typography.fontFamily.regular,
                },
              ]}
            >
              {buttonLabel}
            </Text>
          )}
        </TouchableOpacity>

        {/* <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.text.secondary }]}>
            {t('common.poweredBy')}{' '}
          </Text>
          <Text style={[styles.brandText, { color: colors.primary }]}>
            {t('common.brandName')}
          </Text>
        </View> */}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  logoutBtn: {
    position: 'absolute',
    right: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    zIndex: 999,
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['3xl'],
    paddingTop: Spacing['5xl'],
  },
  stepText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    marginBottom: Spacing['3xl'],
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  iconContainer: {
    borderRadius: 100,
    padding: Spacing['2xl'],
    marginBottom: Spacing['3xl'],
    alignSelf: 'center',
  },
  welcomeText: {
    fontSize: Typography.fontSize.lg,
    marginBottom: Spacing.sm,
    textAlign: 'center',
    width: '100%',
  },
  title: {
    fontSize: Typography.fontSize['5xl'],
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing['4xl'],
  },
  primaryBtn: {
    minWidth: 200,
    maxWidth: '100%',
    minHeight: 45,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  primaryBtnText: {
    fontSize: 17,
    lineHeight: 23,
    letterSpacing: 0,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing['5xl'],
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
  circleBtn: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  alertModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalBox: {
    width: "80%",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
  },



  modalMessage: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },

  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },

  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 10,
    alignItems: "center",
  },

  okBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginLeft: 10,
  },

  cancelText: {
    fontSize: 16,
    fontWeight: "600",
  },

  okText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.secondary,
  },
});
