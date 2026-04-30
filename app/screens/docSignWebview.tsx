import React, { useState } from "react";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { WebView } from "react-native-webview";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";
import { getColors } from "@/constants/themes";

export default function ViewPDFScreen() {
  const { pdfUrl, title } = useLocalSearchParams();
  const pdfUrl1 = Array.isArray(pdfUrl) ? pdfUrl[0] : pdfUrl;
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = getColors(theme);

  const [loading, setLoading] = useState(true);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <Text style={[styles.header, { color: colors.text.primary }]}>{title}</Text>

      {loading && (
        <View style={[styles.loader, { backgroundColor: colors.background.secondary }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.text.secondary }}>{t('common.loadingPDF')}</Text>
        </View>
      )}

      <WebView
        originWhitelist={["*"]}
        javaScriptEnabled={true}
        source={{
          uri: `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(
            pdfUrl1
          )}`,
        }}
        onLoadEnd={() => setLoading(false)}
        style={{ flex: 1 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { fontSize: 18, fontWeight: "700", padding: 16 },
  loader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
});
