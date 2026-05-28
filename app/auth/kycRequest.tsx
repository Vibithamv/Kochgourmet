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
import { CheckCircle, LogOut, ArrowLeft } from 'lucide-react-native';
import {
  getColors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  Colors,
} from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { kycRequest } from '@/hooks/kycRequest';
import { useGlobalAlert } from '@/contexts/AlertContext';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/contexts/AuthContext';
import { useKycPostVerificationFlow } from '@/hooks/useKycPostVerificationFlow';

export default function VerifyIdentityScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const colors = getColors(theme);
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

  const handleLogout = async () => {
    await signOut(); // or the correct logout method you have
    router.replace('/auth/login');
  };

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
    <View style={[styles.gradient, { backgroundColor: colors.background.secondary }]}>
      <TouchableOpacity
        style={[styles.circleBtn, {
          top: insets.top + 10,
          left: 20,
          backgroundColor: colors.background.card,
          borderColor: colors.border.primary,
        }]}
        onPress={() => router.back()}
        hitSlop={8}
        activeOpacity={0.7}
      >
        <ArrowLeft size={20} color={colors.text.primary} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.circleBtn, {
          top: insets.top + 10,
          right: 20,
          backgroundColor: colors.background.card,
          borderColor: colors.border.primary,
        }]}
        onPress={() => {
          showAlert(
            t('common.logout'),
            t('common.logoutMsg'),
            {
              buttonText: t('common.logout'),
              buttonCallback: () => {
                void handleLogout();
              },
              secondaryButtonText: t('common.cancel'),
              // secondaryButtonCallback: handleCancel,
            }
          )
        }
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
          style={[
            {
              borderRadius: Spacing['3xl'],
              padding: Spacing['3xl'],
              ...Shadows.lg,
              alignSelf: 'stretch',
            },
            { backgroundColor: colors.background.card },
          ]}
        >
          {/* Step Progress */}
          {/* <Text style={[styles.stepText, { color: colors.text.secondary }]}>
          STEP 1 of 3
        </Text> */}

          {/* Check Icon */}
          <View style={styles.iconContainer}>
            <CheckCircle size={56} color={colors.primary} />
          </View>

          {/* Title */}
          <Text style={[styles.welcomeText, { color: colors.text.primary }]}>
            {name}
          </Text>

          <Text style={[styles.title, { color: colors.text.primary }]}>
            {titleText}
          </Text>

          {/* Subtitle */}
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            {subtitleText}
          </Text>

          {/* Button */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            disabled={loading || isKycSettled}
            onPress={isKycSettled ? () => router.back() : handleCompleteKYC}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.text.inverse} />
            ) : (
              <Text style={[styles.buttonText, { color: colors.text.inverse }]}>
                {buttonLabel}
              </Text>
            )}
          </TouchableOpacity>

          {/* Footer */}
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
    </View>
  );
}

const styles = StyleSheet.create({
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
  stepText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    marginBottom: Spacing['3xl'],
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  iconContainer: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 100,
    padding: Spacing['2xl'],
    marginBottom: Spacing['3xl'],
    alignSelf: 'center',
  },
  welcomeText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.medium,
    marginBottom: Spacing.sm,
    textAlign: 'center',
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
  button: {
    width: 200,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    ...Shadows.button,
    padding: 10,
    alignSelf: 'center',
  },
  buttonText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
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
