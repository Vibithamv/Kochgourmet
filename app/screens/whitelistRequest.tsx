import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { getColors, Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { whitelistManagement } from "@/hooks/whitelistManagement";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useGlobalAlert } from "@/contexts/AlertContext";

export default function KycWaitingScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const colors = getColors(theme);
  const request = whitelistManagement();
  const { showAlert } = useGlobalAlert();

  const handleRequest = async () => {
    const offeringID = (await AsyncStorage.getItem('offeringID')) ?? "";
    const result = await request.whiteListRequest(await AsyncStorage.getItem('AccountID'),
      offeringID);
    if (result.success) {
      router.replace("/screens/whitelistResponseWaiting");
      //   router.replace("/screens/kycWaiting")
    } else if (result.status === 401) {
      showAlert("Session Expired", "Please login again....");
      router.replace("/auth/login");
    } else {
      showAlert('Error', result.error.message || 'An error occurred. Please try again.');
    }
  };

  return (
    <LinearGradient colors={colors.gradient.secondary} style={styles.gradient}>
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


          {/* Title */}
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Request for Whitelist
          </Text>

          {/* Subtitle */}
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            Now you need to request to whitelist your account to start transactions.
            Meantime you can add your wallet
          </Text>

          {/* Buttons */}
          <TouchableOpacity
            style={[styles.buttonPrimary, { backgroundColor: colors.primary }]}
            onPress={() => {
              handleRequest()
            }
              //  router.replace("/(tabs)/home")
            }
          >
            <Text style={[styles.buttonText, { color: colors.text.inverse }]}>
              Request Access
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.buttonSecondary,
              { borderColor: colors.border.primary },
            ]}
            onPress={() => router.push('/account/wallets')}
          >
            <Text style={[styles.buttonText, { color: colors.text.primary }]}>
              Add Wallet
            </Text>
          </TouchableOpacity>

          {/* Footer Note */}
          <View style={styles.footerNote}>
            <View style={styles.dot} />
            <Text
              style={[styles.noteText, { color: colors.text.secondary }]}
            >
              Your request will be reviewed by the administrator within 24–48 hours
            </Text>
          </View>

          {/* Footer Branding */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.text.secondary }]}>
              Powered by{" "}
            </Text>
            <Text style={[styles.brandText, { color: colors.primary }]}>
              SimplyTokenized
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
    ...Shadows.lg,
    width: "100%",
  },
  stepText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    marginBottom: Spacing["3xl"],
    textTransform: "uppercase",
    letterSpacing: 1,
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
  buttonPrimary: {
    width: "100%",
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    alignItems: "center",
    marginBottom: Spacing.lg,
    ...Shadows.button,
  },
  buttonSecondary: {
    width: "100%",
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    marginBottom: Spacing["4xl"],
  },
  buttonText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
  },
  footerNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing["5xl"],
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#aaa",
    marginRight: 8,
  },
  noteText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
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
