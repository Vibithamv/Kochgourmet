import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Hourglass, LogOut } from "lucide-react-native";
import { getColors, Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { userManagement } from "@/hooks/userManagement";
import { useGlobalAlert } from "@/contexts/AlertContext";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { platformValidation } from "@/hooks/platformValidation";
import { whitelistManagement } from "@/hooks/whitelistManagement";
import { useAuth } from "@/contexts/AuthContext";

export default function KycResponseWaiting() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const colors = getColors(theme);
  const user = userManagement();
  const { showAlert } = useGlobalAlert();
  const platform = platformValidation();
  const whiteListRequest = whitelistManagement();
  const { signOut } = useAuth();

  const checkVisibilityStatus = async () => {
    const result = await platform.validatePlatform();
    if (result.success && result.data) {
      await AsyncStorage.setItem('offeringID', result.data.data.data.selected_offerings[0].id)
      if (
        result.data.data.data.visibilityStatus === 'privatesale' ||
        result.data.data.data.visibilityStatus === 'whitelisting'
      ) {
        return false;
      } else {
        return true;
      }
    }
  };

  const checkWhitelistStatus = async () => {
    try {
      const offeringID = (await AsyncStorage.getItem('offeringID')) ?? '';
      const accountID = (await AsyncStorage.getItem('AccountID')) ?? '';
      const result = await whiteListRequest.checkWhitelistStatus(accountID, offeringID);
      if (result.success && result.data) {
        if (result.data.data.whitelistRequestData.length > 0) {
          if (result.data.data.whitelistRequestData[0].status === 'APPROVED') {
            return 'APPROVED';
          } else {
            return 'PENDING';
          }
        } else {
          return 'REQUEST';
        }
      } else if (result.status === 401) {
        showAlert(t('whitelistWaiting.sessionExpired'), t('whitelistWaiting.loginAgain'));
        router.replace("/auth/login");
      } else {
        showAlert(t('common.error'), result.error.message || t('common.tryAgain'));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const routeAfterKycConfirmed = async () => {
    if (await checkVisibilityStatus()) {
      router.replace('/(tabs)');
      return;
    }
    const wl = await checkWhitelistStatus();
    if (wl === 'APPROVED') {
      router.replace('/(tabs)');
    } else if (wl === 'PENDING') {
      router.replace('/screens/whitelistResponseWaiting');
    } else {
      router.replace('/auth/whitelistRequest');
    }
  };

  const processGetUserResponse = async (data: any) => {
    if (data.success && data.data) {
      if (data.data.accounts.length === 0) {
        return;
      }
      if (data.data.accounts[0].kyc_status === 'CONFIRMED') {
        await routeAfterKycConfirmed();
        return;
      }
      showAlert(t('kycWaiting.requestStatusTitle'), t('kycWaiting.pendingMessage'));
      return;
    }
    if (data.status === 401) {
      showAlert(t('whitelistWaiting.sessionExpired'), t('whitelistWaiting.loginAgain'));
      router.replace('/auth/login');
      return;
    }
    showAlert(t('common.error'), t('common.errorMessage'));
  };

  const checkStatus = async () => {
    try {
      const data = await user.getUser();
      await processGetUserResponse(data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleLogout = async () => {
    await signOut(); // or the correct logout method you have
    router.replace('/auth/login');
  };

  return (
    <LinearGradient colors={colors.gradient.secondary} style={styles.gradient}>
      <TouchableOpacity
        style={[styles.logoutBtn, { top: insets.top + 10, backgroundColor: colors.background.card }]}
        onPress={() => showAlert(
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
        )}
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
            styles.card,
            { backgroundColor: colors.background.card },
          ]}
        >
          {/* Step Text
          <Text style={[styles.stepText, { color: colors.text.secondary }]}>
            STEP 3 of 3
          </Text> */}

          {/* Icon */}
          <View style={styles.iconContainer}>
            <Hourglass size={56} color={colors.primary} />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text.primary }]}>
            {t('kycWaiting.title')}
          </Text>

          {/* Description */}
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            {t('kycWaiting.submittedMessage')}
          </Text>

          {/* Button */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => {
              void checkStatus();
            }}
          >
            <Text style={[styles.buttonText, { color: colors.text.inverse }]}>
              {t('kycWaiting.checkStatus')}
            </Text>
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.text.secondary }]}>
              {t('common.poweredBy')}{" "}
            </Text>
            <Text style={[styles.brandText, { color: colors.primary }]}>
              {t('common.brandName')}
            </Text>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  logoutBtn: {
    position: 'absolute',
    right: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    zIndex: 999,
  },
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing["3xl"],
    paddingTop: Spacing["5xl"],
  },
  card: {
    borderRadius: Spacing["3xl"],
    padding: Spacing["3xl"],
    width: "100%",
    ...Shadows.lg,
    alignItems: "center",
  },
  stepText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    marginBottom: Spacing["3xl"],
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  iconContainer: {
    backgroundColor: "rgba(0,0,0,0.03)",
    borderRadius: 100,
    padding: Spacing["2xl"],
    marginBottom: Spacing["3xl"],
  },
  title: {
    fontSize: Typography.fontSize["5xl"],
    fontFamily: Typography.fontFamily.bold,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing["4xl"],
  },
  button: {
    width: "100%",
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    alignItems: "center",
    ...Shadows.button,
  },
  buttonText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing["5xl"],
  },
  footerText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
  },
  brandText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
  },
});
