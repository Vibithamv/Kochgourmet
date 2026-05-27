import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Hourglass, LogOut } from "lucide-react-native";
import { getColors, Typography, Spacing, BorderRadius, Shadows, Colors } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { whitelistManagement } from "@/hooks/whitelistManagement";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useGlobalAlert } from "@/contexts/AlertContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

export default function WhitelistResponseWaiting() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const colors = getColors(theme);
  const request = whitelistManagement();
  const { showAlert } = useGlobalAlert();
  const { signOut } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);

  const checkStatus = async () => {
    setIsLoading(true);
    try {
      const offeringID = (await AsyncStorage.getItem('offeringID')) ?? "";
      const accountID = (await AsyncStorage.getItem('AccountID')) ?? "";
      const result = await request.checkWhitelistStatus(accountID,
        offeringID);
      if (result.success) {
        if (result.data.data.whitelistRequestData.length > 0) {

          if (result.data.data.whitelistRequestData[0].status === 'APPROVED') {
            router.replace('/(tabs)');
          } else {
            setIsLoading(false);
            showAlert(t('common.notice'), t('whitelistWaiting.pendingMessage'));
          }
        } else {
          setIsLoading(false);
        }

      } else if (result.status === 401) {
        setIsLoading(false);
        showAlert(t('whitelistWaiting.sessionExpired'), t('whitelistWaiting.loginAgain'));
        router.replace("/auth/login");
      } else {
        setIsLoading(false);
        showAlert(t('common.error'), result.error.message || t('common.tryAgain'));
      }

    } catch (error) {
      setIsLoading(false);
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
            {t('whitelistWaiting.title')}
          </Text>

          {/* Description */}
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            {t('whitelistWaiting.subtitle')}
          </Text>

          {/* Button */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={checkStatus}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.text.inverse} />
            ) : (
              <Text style={[styles.buttonText, { color: colors.text.inverse }]}>
                {t('whitelistWaiting.checkStatus')}
              </Text>
            )}
          </TouchableOpacity>

          {/* Footer */}
          {/* <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.text.secondary }]}>
              {t('common.poweredBy')}{" "}
            </Text>
            <Text style={[styles.brandText, { color: colors.primary }]}>
              {t('common.brandName')}
            </Text>
          </View> */}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
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
  logoutBtn: {
    position: 'absolute',
    right: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    zIndex: 999,
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary
  },
});
