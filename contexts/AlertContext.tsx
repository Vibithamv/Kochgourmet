import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { getColors, Typography } from "@/constants/theme";

type AlertContextType = {
  showAlert: (
    title: string,
    message: string,
    options?: {
      buttonText?: string;
      buttonCallback?: () => void;
      secondaryButtonText?: string;
      secondaryButtonCallback?: () => void;
    }
  ) => void;
  hideAlert: () => void;
};

const AlertContext = createContext<AlertContextType | null>(null);

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [buttonText, setButtonText] = useState("OK");
  const [buttonCallback, setButtonCallback] = useState<(() => void) | undefined>(undefined);
  const [secondaryButtonText, setSecondaryButtonText] = useState<string | undefined>();
  const [secondaryButtonCallback, setSecondaryButtonCallback] = useState<(() => void) | undefined>();

  const showAlert = useCallback(
    (
      title: string,
      message: string,
      options?: {
        buttonText?: string;
        buttonCallback?: () => void;
        secondaryButtonText?: string;
        secondaryButtonCallback?: () => void;
      }
    ) => {
      setTitle(title);
      setMessage(message);
      setButtonText(options?.buttonText || "OK");
      setButtonCallback(() => options?.buttonCallback);
      setSecondaryButtonText(options?.secondaryButtonText);
      setSecondaryButtonCallback(() => options?.secondaryButtonCallback);
      setVisible(true);
    },
    []
  );

  const hideAlert = useCallback(() => setVisible(false), []);

  const contextValue = useMemo(
    () => ({ showAlert, hideAlert }),
    [showAlert, hideAlert]
  );

  const handlePrimaryPress = () => {
    hideAlert();
    buttonCallback?.();
  };

  const handleSecondaryPress = () => {
    hideAlert();
    secondaryButtonCallback?.();
  };

  const primaryBtnTextColor = colors.text.onPrimary;
  const hasSecondary = secondaryButtonText != null && secondaryButtonText.length > 0;

  return (
    <AlertContext.Provider value={contextValue}>
      {children}
      <Modal visible={visible} transparent={true} animationType="fade">
        <View style={styles.overlay}>
          <View
            style={[
              styles.container,
              {
                backgroundColor: colors.background.primary,
                borderColor: colors.border.primary,
              },
            ]}
          >
            {/* Title */}
            <Text style={[styles.title, { color: colors.text.primary }]}>
              {title}
            </Text>

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: colors.border.primary }]} />

            {/* Message */}
            <Text style={[styles.message, { color: colors.text.secondary }]}>
              {message}
            </Text>

            {/* Buttons */}
            {hasSecondary ? (
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.secondaryButton,
                    {
                      borderColor: colors.primary,
                      backgroundColor: "transparent",
                    },
                  ]}
                  onPress={handleSecondaryPress}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.buttonText, { color: colors.primary }]}>
                    {secondaryButtonText}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: colors.primary }]}
                  onPress={handlePrimaryPress}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.buttonText, { color: primaryBtnTextColor }]}>
                    {buttonText}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.singleButton, { backgroundColor: colors.primary }]}
                onPress={handlePrimaryPress}
                activeOpacity={0.75}
              >
                <Text style={[styles.buttonText, { color: primaryBtnTextColor }]}>
                  {buttonText}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
};

export const useGlobalAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useGlobalAlert must be used within an AlertProvider");
  }
  return context;
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "82%",
    borderRadius: 16,
    borderWidth: 1,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 20,
    alignItems: "center",
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontFamily: "Inter-Bold",
    textAlign: "center",
    marginBottom: 14,
  },
  divider: {
    width: "100%",
    height: 1,
    marginBottom: 14,
  },
  message: {
    fontSize: Typography.fontSize.base,
    fontFamily: "Inter-Regular",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 22,
    width: "100%",
  },
  buttonRow: {
    flexDirection: "row",
    width: "100%",
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButton: {
    borderWidth: 1.5,
  },
  singleButton: {
    width: "100%",
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: Typography.fontSize.base,
    fontFamily: "Inter-SemiBold",
  },
});
