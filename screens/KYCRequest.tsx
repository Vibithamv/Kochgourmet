import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { CheckCircle } from "lucide-react-native";
import { getColors, Typography, Spacing, BorderRadius, Shadows } from "../constants/theme";
import { useTheme } from "../contexts/ThemeContext";
import { useTranslation } from "react-i18next";

export default function VerifyIdentityScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const colors = getColors(theme);

  const handleCompleteKYC = () => {
   // router.push("/kyc/start");
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
        {/* Step Progress */}
        <Text style={[styles.stepText, { color: colors.text.secondary }]}>
          STEP 1 of 3
        </Text>

        {/* Check Icon */}
        <View style={styles.iconContainer}>
          <CheckCircle size={56} color={colors.primary} />
        </View>

        {/* Title */}
        <Text style={[styles.welcomeText, { color: colors.text.primary }]}>
          Welcome Fahad,
        </Text>

        <Text style={[styles.title, { color: colors.text.primary }]}>
          Verify Your Identity
        </Text>

        {/* Subtitle */}
        <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
          We need to verify your identity before you access full features.{"\n"}
          This will only take 2 minutes.
        </Text>

        {/* Button */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleCompleteKYC}
        >
          <Text style={[styles.buttonText, { color: colors.text.inverse }]}>
            Complete KYC Now
          </Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.text.secondary }]}>
            Powered by{" "}
          </Text>
          <Text style={[styles.brandText, { color: colors.primary }]}>
            SimplyTokenized
          </Text>
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
  welcomeText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.medium,
    marginBottom: Spacing.sm,
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
