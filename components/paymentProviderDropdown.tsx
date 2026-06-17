import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from "react-native";
import { ChevronDown } from "lucide-react-native"; // arrow icon
import { useTheme } from "@/contexts/ThemeContext";
import { getColors } from "@/constants/themes";
import { useTranslation } from "react-i18next";
import { formatPaymentTypeLabel } from "@/utils/investmentFormat";


type PaymentMethod = {
  id: string;
  type: string;
  providerType?: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  bic?: string;
};

type Props = {
  payment: PaymentMethod[];
  onChange?: (type: string, id: string) => void;
  variant?: 'default' | 'community';
};

export default function PaymentProviderDropdown({
  payment,
  onChange,
  variant = 'default',
}: Readonly<Props>) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [selected, setSelected] = useState<PaymentMethod | null>(null);
  const colors = getColors(theme);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const selectedRef = useRef<PaymentMethod | null>(null);
  selectedRef.current = selected;

  useEffect(() => {
    if (!payment?.length) {
      setSelected(null);
      onChangeRef.current?.("", "");
      return;
    }
    const current = selectedRef.current;
    const next =
      current && payment.some((p) => p.id === current.id)
        ? current
        : payment[0];
    if (current?.id !== next.id) {
      onChangeRef.current?.(next.type, next.id);
    }
    setSelected(next);
    if ((payment?.length ?? 0) <= 1) setOpen(false);
  }, [payment]);

  const selectAddress = (item: any) => {
    setSelected(item);
    setOpen(false);
    onChange?.(item.type, item.id);
  };

  const paymentCount = payment?.length ?? 0;
  const showModalPicker = paymentCount > 1;
  const isCommunity = variant === 'community';
  const dropdownSurfaceStyle = [
    styles.dropdown,
    isCommunity && styles.dropdownCommunity,
    {
      backgroundColor: colors.background.primary,
      borderColor: colors.border.primary,
      borderWidth: isCommunity ? 1 : 2,
    },
  ];
  const displayType =
    selected?.type ?? (paymentCount === 1 ? payment[0]?.type : undefined);
  const selectedLabel = selected
    ? formatPaymentTypeLabel(selected.type)
    : t('investment.paymentProvider');
  const singleLabel = displayType
    ? formatPaymentTypeLabel(displayType)
    : t('investment.paymentProvider');
  const showChevron = isCommunity || showModalPicker;

  const dropdownBody = (
    <>
      <Text style={[styles.dropdownText, { color: colors.text.primary, flex: 1 }]}>
        {showModalPicker ? selectedLabel : singleLabel}
      </Text>
      {showChevron ? (
        <ChevronDown size={20} color={colors.text.tertiary} />
      ) : null}
    </>
  );

  return (
    <>
      {showModalPicker ? (
        <TouchableOpacity
          style={dropdownSurfaceStyle}
          onPress={() => setOpen(true)}
          activeOpacity={0.8}
        >
          {dropdownBody}
        </TouchableOpacity>
      ) : (
        <View style={dropdownSurfaceStyle}>{dropdownBody}</View>
      )}

      {showModalPicker ? (
        <Modal
          visible={open}
          transparent
          animationType="fade"
          onRequestClose={() => setOpen(false)}
        >
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={() => setOpen(false)}
          >
            <View style={[styles.listBox, { backgroundColor: colors.background.primary }]}>
              <FlatList
                data={payment}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.item, { borderBottomColor: colors.border.primary }]}
                    onPress={() => selectAddress(item)}
                  >
                    <Text style={[styles.itemText, { color: colors.text.primary }]}>
                      {formatPaymentTypeLabel(item.type)}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  dropdown: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownCommunity: {
    borderRadius: 9999,
    paddingHorizontal: 18,
    paddingVertical: 14,
    minHeight: 45,
  },
  dropdownText: {
    fontSize: 15,
    fontFamily: 'Roboto-Light',
    letterSpacing: 0,
    color: "#333",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  listBox: {
    backgroundColor: "white",
    borderRadius: 10,
    maxHeight: "55%",
    overflow: "hidden",
  },
  item: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  itemText: {
    fontSize: 16,
    fontFamily: 'Roboto-Light',
    letterSpacing: 0,
  },
});
