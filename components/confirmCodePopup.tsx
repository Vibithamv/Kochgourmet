import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  Dialog,
  HelperText,
  Portal,
  TextInput,
} from "react-native-paper";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/contexts/ThemeContext";
import { getColors } from "@/constants/theme";

interface ConfirmCodePopupProps {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: (code: string) => void | Promise<void>;
  resendOTP: () => void | Promise<void>;
}

const CONFIRMATION_CODE_MAX_LENGTH = 10;

const ConfirmCodePopup: React.FC<ConfirmCodePopupProps> = ({
  visible,
  onDismiss,
  onConfirm,
  resendOTP,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = getColors(theme);

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingResend, setLoadingResend] = useState(false);
  /** Paper `TextInput` forwards `TextInputHandles`; use a narrow ref for `.focus()` after open. */
  const codeInputRef = useRef<{ focus: () => void } | null>(null);

  useEffect(() => {
    if (visible) {
      setCode("");
      setError("");
      setLoading(false);
      setLoadingResend(false);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => {
      codeInputRef.current?.focus();
    }, 150);
    return () => clearTimeout(t);
  }, [visible]);

  const handleConfirm = async () => {
    if (!code.trim()) {
      setError("auth.confirmationCode.enterCode");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onConfirm(code.trim());
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoadingResend(true);
    try {
      await resendOTP();
    } finally {
      setLoadingResend(false);
    }
  };

  const buttonStyle = {
    borderRadius: 8,
    flex: 1,
    alignItems: "center" as const,
    backgroundColor: colors.primary,
  };

  const disabledStyle = {
    backgroundColor: colors.border.primary,
    opacity: 0.6,
  };

  return (
    <Portal>
      <Dialog
        style={{ backgroundColor: colors.background.primary }}
        visible={visible}
        onDismiss={onDismiss}
      >
        <Dialog.Title
          style={{
            alignSelf: "center",
            textAlign: "center",
            fontSize: 18,
            color: colors.text.primary,
          }}
        >
          {t("auth.confirmationCode.title")}
        </Dialog.Title>
        <Dialog.Content>
          <TextInput
            ref={codeInputRef as React.ComponentProps<typeof TextInput>['ref']}
            mode="outlined"
            keyboardType="numeric"
            maxLength={CONFIRMATION_CODE_MAX_LENGTH}
            value={code}
            style={{ height: 50, backgroundColor: colors.background.primary }}
            textColor={colors.text.primary}
            theme={{
              colors: {
                primary: colors.primary,
                onSurfaceVariant: colors.text.secondary,
                outline: colors.border.primary,
              },
            }}
            onChangeText={(val) => {
              setCode(val);
              if (error) setError("");
            }}
          />
          {error ? <HelperText type="error">{t(error)}</HelperText> : null}
        </Dialog.Content>
        <Dialog.Actions
          style={{ flexDirection: "row", justifyContent: "space-between" }}
        >
          <Button
            style={buttonStyle}
            labelStyle={{ color: colors.text.inverse, textAlign: "center" }}
            onPress={onDismiss}
          >
            {t("auth.confirmationCode.cancel")}
          </Button>
          <Button
            style={[buttonStyle, (loading) && disabledStyle]}
            labelStyle={{ color: colors.text.inverse, textAlign: "center" }}
            onPress={handleConfirm}
            loading={loading}
            disabled={loading || loadingResend}
          >
            {t("auth.confirmationCode.confirm")}
          </Button>
          <Button
            style={[buttonStyle, (loadingResend) && disabledStyle]}
            labelStyle={{ color: colors.text.inverse, textAlign: "center" }}
            onPress={handleResend}
            loading={loadingResend}
            disabled={loading || loadingResend}
          >
            {t("auth.confirmationCode.resend")}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

export default ConfirmCodePopup;
