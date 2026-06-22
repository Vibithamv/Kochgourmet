import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { Modal, View, Text, Pressable, TouchableOpacity, StyleSheet, Platform } from "react-native";
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

  const primaryBtnTextColor =
    theme === 'dark' || theme === 'darkGreen' ? '#0D1117' : '#FFFFFF';
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
                    { borderColor: colors.border.primary },
                  ]}
                  onPress={handleSecondaryPress}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[styles.secondaryButtonText, { color: colors.text.primary }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {secondaryButtonText}
                  </Text>
                </TouchableOpacity>
                <Pressable
                  style={({ pressed }) => [
                    styles.button,
                    { backgroundColor: colors.primary },
                    pressed && Platform.OS === 'ios' ? { opacity: 0.75 } : null,
                  ]}
                  android_ripple={{ color: 'rgba(255, 255, 255, 0.2)' }}
                  onPress={handlePrimaryPress}
                >
                  <Text
                    style={[styles.buttonText, { color: primaryBtnTextColor }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {buttonText}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={({ pressed }) => [
                  styles.singleButton,
                  { backgroundColor: colors.primary },
                  pressed && Platform.OS === 'ios' ? { opacity: 0.75 } : null,
                ]}
                android_ripple={{ color: 'rgba(255, 255, 255, 0.2)' }}
                onPress={handlePrimaryPress}
              >
                <Text style={[styles.buttonText, { color: primaryBtnTextColor }]}>
                  {buttonText}
                </Text>
              </Pressable>
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
    fontFamily: 'Roboto-Medium',
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontSize: Typography.fontSize.base,
    fontFamily: 'Roboto-Light',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 22,
    width: '100%',
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  button: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  secondaryButton: {
    borderWidth: 1,
  },
  singleButton: {
    width: "100%",
    paddingVertical: 8,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Roboto-Regular',
    lineHeight: 20,
    letterSpacing: 0,
    textAlign: 'center',
    width: '100%',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: 'Roboto-Light',
    lineHeight: 20,
    letterSpacing: 0,
    textAlign: 'center',
    width: '100%',
  },
});
