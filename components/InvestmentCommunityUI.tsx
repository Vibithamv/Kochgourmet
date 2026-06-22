import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  type TextStyle,
} from 'react-native';
import { Minus, Plus } from 'lucide-react-native';
import { getColors } from '@/constants/theme';

export const INVESTMENT_CONTENT_PADDING = 26;

type AppColors = ReturnType<typeof getColors>;

export function investmentRowLabelStyle(): TextStyle {
  return {
    fontFamily: 'Roboto-Light',
    fontSize: 15,
    lineHeight: 23,
    letterSpacing: 0,
  };
}

export function investmentRowValueStyle(medium = false): TextStyle {
  return {
    fontFamily: medium ? 'Roboto-Medium' : 'Roboto-Light',
    fontSize: 15,
    lineHeight: 23,
    letterSpacing: 0,
  };
}

type SummaryRowProps = Readonly<{
  label: string;
  value?: string;
  right?: React.ReactNode;
  divider?: boolean;
  valueMedium?: boolean;
  colors: AppColors;
}>;

export function InvestmentSummaryRow({
  label,
  value,
  right,
  divider = true,
  valueMedium = false,
  colors,
}: SummaryRowProps) {
  return (
    <View
      style={[
        styles.row,
        divider && { borderBottomColor: colors.border.primary, borderBottomWidth: 1 },
      ]}
    >
      <Text style={[investmentRowLabelStyle(), { color: colors.text.primary, flex: 1 }]}>
        {label}
      </Text>
      {right ?? (
        <Text
          style={[
            investmentRowValueStyle(valueMedium),
            { color: colors.text.primary, textAlign: 'right' },
          ]}
        >
          {value}
        </Text>
      )}
    </View>
  );
}

type TokenStepperProps = Readonly<{
  value: number;
  minimum: number;
  onDecrement: () => void;
  onIncrement: () => void;
  colors: AppColors;
}>;

export function InvestmentTokenStepper({
  value,
  minimum,
  onDecrement,
  onIncrement,
  colors,
}: TokenStepperProps) {
  const buyIconColor = '#FFFFFF';

  return (
    <View style={styles.stepper}>
      <TouchableOpacity
        style={[styles.stepperBtn, { backgroundColor: colors.primary }]}
        onPress={onDecrement}
        disabled={value <= minimum}
        activeOpacity={0.85}
      >
        <Minus size={16} color={buyIconColor} />
      </TouchableOpacity>
      <Text style={[investmentRowValueStyle(), { color: colors.text.primary, minWidth: 24, textAlign: 'center' }]}>
        {value}
      </Text>
      <TouchableOpacity
        style={[styles.stepperBtn, { backgroundColor: colors.primary }]}
        onPress={onIncrement}
        activeOpacity={0.85}
      >
        <Plus size={16} color={buyIconColor} />
      </TouchableOpacity>
    </View>
  );
}

type ScreenTitleProps = Readonly<{
  line1: string;
  line2: string;
  colors: AppColors;
}>;

export function InvestmentScreenTitle({ line1, line2, colors }: ScreenTitleProps) {
  return (
    <View style={styles.titleBlock}>
      <Text style={[styles.titleLine, { color: colors.text.primary }]}>{line1}</Text>
      <Text style={[styles.titleLine, { color: colors.text.primary }]}>{line2}</Text>
    </View>
  );
}

type FloatingBarProps = Readonly<{
  primaryLabel: string;
  cancelLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  onCancel: () => void;
  bottom: number;
  colors: AppColors;
  isDark: boolean;
}>;

export function InvestmentFloatingBar({
  primaryLabel,
  cancelLabel,
  onPrimary,
  primaryDisabled = false,
  onCancel,
  bottom,
  colors,
  isDark,
}: FloatingBarProps) {
  const primaryTextColor = primaryDisabled
    ? colors.text.secondary
    : isDark
      ? '#0D1117'
      : '#FFFFFF';

  return (
    <View style={[styles.floatingActions, { bottom }]} pointerEvents="box-none">
      <TouchableOpacity
        style={[
          styles.primaryBtn,
          {
            backgroundColor: primaryDisabled
              ? colors.interactive.disabled
              : colors.primary,
          },
        ]}
        onPress={onPrimary}
        disabled={primaryDisabled}
        activeOpacity={0.85}
      >
        <Text style={[styles.primaryBtnText, { color: primaryTextColor }]}>
          {primaryLabel}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.cancelBtn,
          {
            backgroundColor: colors.background.primary,
            borderColor: colors.border.primary,
          },
        ]}
        onPress={onCancel}
        activeOpacity={0.7}
      >
        <Text style={[styles.cancelBtnText, { color: colors.text.primary }]}>
          {cancelLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    gap: 12,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    marginBottom: 28,
    gap: 2,
    alignItems: 'flex-start',
  },
  titleLine: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 35,
    lineHeight: 48,
    letterSpacing: 0,
    textAlign: 'left',
  },
  floatingActions: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: INVESTMENT_CONTENT_PADDING,
  },
  primaryBtn: {
    flex: 1,
    height: 45,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBtnText: {
    fontFamily: 'Roboto-Regular',
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: 0,
  },
  cancelBtn: {
    flex: 1,
    height: 45,
    borderRadius: 9999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  cancelBtnText: {
    fontFamily: 'Roboto-Light',
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: 0,
  },
});
