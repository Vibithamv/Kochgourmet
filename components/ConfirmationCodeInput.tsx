import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors } from '@/constants/theme';

export const CONFIRMATION_CODE_LENGTH = 6;

type ConfirmationCodeInputProps = Readonly<{
  value: string;
  onChangeText: (text: string) => void;
  hasError?: boolean;
  inputRef?: React.RefObject<TextInput | null>;
  onFocus?: () => void;
  onBlur?: () => void;
  accessibilityLabel?: string;
}>;

export default function ConfirmationCodeInput({
  value,
  onChangeText,
  hasError = false,
  inputRef,
  onFocus,
  onBlur,
  accessibilityLabel = 'Confirmation code',
}: ConfirmationCodeInputProps) {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const [focused, setFocused] = useState(false);

  const handleChange = (text: string) => {
    onChangeText(text.replace(/\D/g, '').slice(0, CONFIRMATION_CODE_LENGTH));
  };

  const handleFocus = () => {
    setFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setFocused(false);
    onBlur?.();
  };

  return (
    <Pressable onPress={() => inputRef?.current?.focus()} style={styles.pressable}>
      <View style={styles.row}>
        {Array.from({ length: CONFIRMATION_CODE_LENGTH }, (_, index) => {
          const digit = value[index] ?? '';
          const isActive = focused && index === Math.min(value.length, CONFIRMATION_CODE_LENGTH - 1);
          let borderColor: string = colors.border.primary;
          if (hasError) borderColor = colors.error;
          else if (isActive) borderColor = colors.primary;
          else if (digit.length > 0 && focused) borderColor = colors.border.focus;

          return (
            <View
              key={`confirmation-digit-${index}`}
              style={[
                styles.box,
                {
                  backgroundColor: colors.background.primary,
                  borderColor,
                },
              ]}
            >
              <Text style={[styles.digit, { color: colors.text.primary }]}>{digit}</Text>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={CONFIRMATION_CODE_LENGTH}
        caretHidden
        style={styles.hiddenInput}
        onFocus={handleFocus}
        onBlur={handleBlur}
        accessibilityLabel={accessibilityLabel}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    position: 'relative',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  box: {
    flex: 1,
    maxWidth: 48,
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digit: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
});
