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

type Wallet = {
  id: string;
  address: string;
};

type Props = {
  wallets: Wallet[];
  onChange?: (address: string, id: string) => void;
  /** Called when the user opens the picker but there are no wallets (instead of opening an empty list). */
  onEmptyWalletList?: () => void;
};

export default function WalletAddressDropdown({
  wallets,
  onChange,
  onEmptyWalletList,
}: Readonly<Props>) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const [selected, setSelected] = useState<Wallet | null>(null);
  const { theme } = useTheme();
  const colors = getColors(theme);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const selectedRef = useRef<Wallet | null>(null);
  selectedRef.current = selected;

  useEffect(() => {
    if (!wallets?.length) {
      setSelected(null);
      onChangeRef.current?.("", "");
      return;
    }
    const current = selectedRef.current;
    const next =
      current && wallets.some((w) => w.id === current.id)
        ? current
        : wallets[0];
    if (current?.id !== next.id) {
      onChangeRef.current?.(next.address, next.id);
    }
    setSelected(next);
    if ((wallets?.length ?? 0) <= 1) setOpen(false);
  }, [wallets]);

  const selectAddress = (item: any) => {
    setSelected(item);
    setOpen(false);
    onChange?.(item.address, item.id);
  };

  const walletCount = wallets?.length ?? 0;
  const showModalPicker = walletCount > 1;
  const dropdownSurfaceStyle = [
    styles.dropdown,
    {
      backgroundColor: colors.background.card,
      borderColor: colors.border.primary,
      borderWidth: 2,
    },
  ];
  const displayAddress =
    selected?.address ?? (walletCount === 1 ? wallets[0]?.address : undefined);

  let trigger: React.ReactNode;
  if (walletCount === 0) {
    trigger = (
      <TouchableOpacity
        style={dropdownSurfaceStyle}
        onPress={() => onEmptyWalletList?.()}
        activeOpacity={0.8}
      >
        <Text style={[styles.dropdownText, { color: colors.text.primary }]}>
          {t('investment.selectWallet')}
        </Text>
        <ChevronDown size={20} color={colors.text.tertiary} />
      </TouchableOpacity>
    );
  } else if (showModalPicker) {
    trigger = (
      <TouchableOpacity
        style={dropdownSurfaceStyle}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={[styles.dropdownText, { color: colors.text.primary }]}>
          {selected ? selected.address : t('investment.selectWallet')}
        </Text>
        <ChevronDown size={20} color={colors.text.tertiary} />
      </TouchableOpacity>
    );
  } else {
    trigger = (
      <View style={dropdownSurfaceStyle}>
        <Text style={[styles.dropdownText, { color: colors.text.primary }]}>
          {displayAddress ?? t('investment.selectWallet')}
        </Text>
      </View>
    );
  }

  return (
    <>
      {trigger}

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
                data={wallets}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.item, { borderBottomColor: colors.border.primary }]}
                    onPress={() => selectAddress(item)}
                  >
                    <Text style={[styles.itemText, { color: colors.text.primary }]}>
                      {item.address}
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
    borderColor: "#000",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownText: {
    fontSize: 15,
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
    marginHorizontal: 20
  },
  item: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    flexDirection: 'row',
    padding: 15,
  },
  itemText: {
    fontSize: 16,
  },
});
