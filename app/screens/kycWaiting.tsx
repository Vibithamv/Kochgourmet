import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Hourglass, LogOut } from "lucide-react-native";
import { getColors, Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { userManagement } from "@/hooks/userManagement";
import { useGlobalAlert } from "@/contexts/AlertContext";
import { useTranslation } from "react-i18next";
import { replaceLoginClearingAuthStack } from '@/utils/authNavigation';
import { useAuth } from "@/contexts/AuthContext";

export default function KycResponseWaiting() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const colors = getColors(theme);
  const user = userManagement();
  const { showAlert } = useGlobalAlert();
  const { signOut } = useAuth();

  const routeAfterKycConfirmed = () => {
    router.replace('/(tabs)');
  };

  const processGetUserResponse = async (data: any) => {
    if (data.success && data.data) {
      if (data.data.accounts.length === 0) {
        return;
      }
      if (data.data.accounts[0].kyc_status === 'CONFIRMED') {
        routeAfterKycConfirmed();
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
    await signOut();
    replaceLoginClearingAuthStack();
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <TouchableOpacity
        style={[styles.logoutBtn, { top: insets.top + 10, backgroundColor: colors.background.secondary }]}
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
        <View style={[styles.iconContainer, { backgroundColor: colors.interactive.hover }]}>
          <Hourglass size={56} color={colors.primary} />
        </View>

        <Text style={[styles.title, { color: colors.text.primary }]}>
          {t('kycWaiting.title')}
        </Text>

        <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
          {t('kycWaiting.submittedMessage')}
        </Text>

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

        {/* <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.text.secondary }]}>
            {t('common.poweredBy')}{" "}
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
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing["3xl"],
    paddingTop: Spacing["5xl"],
  },
  stepText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    marginBottom: Spacing["3xl"],
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  iconContainer: {
    borderRadius: 100,
    padding: Spacing["2xl"],
    marginBottom: Spacing["3xl"],
    alignSelf: "center",
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
