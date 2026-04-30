import React, { useState } from "react";
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { WebView } from "react-native-webview";
import { ArrowLeft } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getColors } from "@/constants/themes";
import { useTheme } from "@/contexts/ThemeContext";

export default function ViewPDFScreen() {
  const { pdfUrl, title } = useLocalSearchParams();
  const pdfUrl1 = Array.isArray(pdfUrl) ? pdfUrl[0] : pdfUrl;

  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const colors = getColors(theme);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <View style={[styles.headerContainer, { paddingTop: insets.top + 5 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>{title}</Text>
      </View>

      {loading && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: colors.background.secondary,
            zIndex: 10,
          }}
        >
          <ActivityIndicator size="large" />
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
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 20
  },
  backButton: {
    padding: 8,
    zIndex: 10,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginRight: 40, // Offset for back button to keep title centered
  },
  loader: {
    position: "absolute",
    top: "45%",
    left: 0,
    right: 0,
    alignItems: "center",
  },
});
