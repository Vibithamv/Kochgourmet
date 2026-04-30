import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ShieldAlert, Mail, Phone } from "lucide-react-native";
import { getColors, Typography, Spacing, Shadows, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "react-i18next";

export default function PlatformErrorScreen() {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const colors = getColors(theme);
    const { t } = useTranslation();

    const handleEmailSupport = () => {
        Linking.openURL('mailto:someone@example.com');
    };

    const handlePhoneSupport = () => {
        Linking.openURL('tel:+1-555-INVEST');
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
                    {/* Icon */}
                    <View style={styles.iconContainer}>
                        <ShieldAlert size={56} color={colors.error || '#EF4444'} />
                    </View>

                    {/* Title */}
                    <Text style={[styles.title, { color: colors.text.primary }]}>
                        {t('common.platformValidationFailedTitle')}
                    </Text>

                    {/* Description */}
                    <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
                        {t('common.platformValidationFailedDesc')}
                    </Text>

                    {/* Phone Support Button */}
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: colors.primary, marginBottom: Spacing.md }]}
                        onPress={handlePhoneSupport}
                    >
                        <Phone size={20} color={colors.text.inverse} style={styles.buttonIcon} />
                        <Text style={[styles.buttonText, { color: colors.text.inverse }]}>
                            {t('helpSupport.phoneSupport.title')}
                        </Text>
                    </TouchableOpacity>

                    {/* Email Support Button */}
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: colors.background.card, borderWidth: 1, borderColor: colors.primary }]}
                        onPress={handleEmailSupport}
                    >
                        <Mail size={20} color={colors.primary} style={styles.buttonIcon} />
                        <Text style={[styles.buttonText, { color: colors.primary }]}>
                            {t('helpSupport.emailSupport.title')}
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
    },
    card: {
        borderRadius: Spacing["3xl"],
        padding: Spacing["3xl"],
        width: "100%",
        ...Shadows.lg,
        alignItems: "center",
    },
    iconContainer: {
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        borderRadius: 100,
        padding: Spacing["2xl"],
        marginBottom: Spacing["3xl"],
    },
    title: {
        fontSize: Typography.fontSize["3xl"],
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xl,
        borderRadius: BorderRadius.md,
        width: '100%',
        ...Shadows.button,
    },
    buttonIcon: {
        marginRight: Spacing.sm,
    },
    buttonText: {
        fontSize: Typography.fontSize.base,
        fontFamily: Typography.fontFamily.semiBold,
    },
    footer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: Spacing.xl,
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
