import { WebView } from "react-native-webview";
import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState, useRef, useCallback } from "react";
import { ActivityIndicator, BackHandler, Text, StyleSheet, TouchableOpacity, View, Platform } from "react-native";
import { createPaymentOrder } from "@/hooks/createPayment";
import { useGlobalAlert } from "@/contexts/AlertContext";
import { ArrowLeft } from "lucide-react-native";
import { getColors } from "@/constants/themes";
import { useTheme } from "@/contexts/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PaymentWebView() {
  const { url, orderId } = useLocalSearchParams();
  const kycUrl = Array.isArray(url) ? url[0] : url;
  const createPayment = createPaymentOrder();
  const { showAlert } = useGlobalAlert();
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();
  const colors = getColors(theme);
  const insets = useSafeAreaInsets();
  const isProcessingRef = useRef(false);

  const showErrorAlert = useCallback((title: string, message: string) => {
    const show = () => showAlert(title, message);
    if (Platform.OS === "ios") {
      // Defer until after transitions so the alert does not conflict with an active presentation.
      setTimeout(show, 400);
    } else {
      show();
    }
  }, [showAlert]);

  const checkStatus = useCallback(async (id: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setLoading(true);
    try {
      const res = await createPayment.checkPaymentStatus(id);

      if (res.success) {
        const status = res.data.data.status;

        if (["READYTOMINT", "paid", "completed"].includes(status)) {
          showAlert("Payment Successful", "Your payment was successful.",
            {
              buttonText: "OK",
              buttonCallback: () => {
                router.replace('/(tabs)/portfolio');
              },
            }
          );
        } else {
          showAlert(
            "Payment Incomplete",
            "Your payment is not completed.Continue to leave this page?",
            {
              buttonText: "YES",
              buttonCallback: () => {
                router.back();
              },
              secondaryButtonText: "Cancel",
            }
          );
        }
      } else if (res.status === 401) {
        showErrorAlert("Session Expired", "Please login again....");
        router.replace("/auth/login");
      } else {
        const err = res.error;
        const message = typeof err === "string" ? err : err?.message ?? err?.error?.message ?? "Something went wrong.";
        console.log("Payment check failed", res.error);
        showErrorAlert("Payment check failed", message);
      }
    } catch (e) {
      console.log("Payment check failed", e);
      showErrorAlert("Payment check failed", e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
      isProcessingRef.current = false;
    }
  }, [createPayment, showAlert, showErrorAlert]);

  const handleBackAction = useCallback(() => {
    const id = Array.isArray(orderId) ? orderId[0] : orderId;
    checkStatus(id);
    return true; // Used by BackHandler
  }, [orderId, checkStatus]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackAction
    );

    return () => subscription.remove();
  }, [handleBackAction]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <View style={[styles.headerContainer, { paddingTop: insets.top + 5 }]}>
        <TouchableOpacity onPress={handleBackAction} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Payment</Text>
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
        source={{ uri: kycUrl }}
        androidHardwareAccelerationDisabled={true}
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
