import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sun, Moon, Leaf, Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import {
  getColors,
  Typography,
  Spacing,
  BorderRadius,
  type ThemeMode,
} from '@/constants/theme';
import { suppressTabBar, restoreTabBar } from '@/utils/tabBarStore';

interface ThemeToggleProps {
  style?: any;
}

interface ThemeOption {
  mode: ThemeMode;
  nameKey: string;
  descriptionKey: string;
  icon: React.ReactNode;
}

export default function ThemeToggle({ style }: Readonly<ThemeToggleProps>) {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const colors = getColors(theme);

  const themeOptions: ThemeOption[] = useMemo(
    () => [
      {
        mode: 'light',
        nameKey: 'account.themeLight',
        descriptionKey: 'account.themeLightDesc',
        icon: <Sun size={20} color="#EE7B5F" />,
      },
      {
        mode: 'dark',
        nameKey: 'account.themeDark',
        descriptionKey: 'account.themeDarkDesc',
        icon: <Moon size={20} color="#C9BEB5" />,
      },
      {
        mode: 'darkGreen',
        nameKey: 'account.themeForest',
        descriptionKey: 'account.themeForestDesc',
        icon: <Leaf size={20} color="#6BA888" />,
      },
    ],
    [],
  );

  const getCurrentTheme = () => {
    return themeOptions.find(option => option.mode === theme) || themeOptions[0];
  };

  const openModal = () => { suppressTabBar(); setModalVisible(true); };
  const closeModal = () => { restoreTabBar(); setModalVisible(false); };

  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    closeModal();
  };

  return (
    <>
      <View style={[styles.container, style]}>
        <TouchableOpacity 
          style={styles.content}
          onPress={openModal}
          activeOpacity={0.7}
        >
          <Text style={[styles.title, { color: colors.text.primary }]}>
            {t(getCurrentTheme().nameKey)}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.background.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.background.primary, paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>{t('account.chooseTheme')}</Text>
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: colors.background.secondary }]}
                onPress={closeModal}
              >
                <Text style={[styles.closeButtonText, { color: colors.text.secondary }]}>×</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={themeOptions}
              keyExtractor={(item) => item.mode}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.themeOption, { borderBottomColor: colors.border.secondary }]}
                  onPress={() => handleThemeChange(item.mode)}
                >
                  <View style={styles.themeOptionContent}>
                    <View style={[styles.themeIcon, { backgroundColor: colors.background.secondary }]}>
                      {item.icon}
                    </View>
                    <View style={styles.themeInfo}>
                      <Text style={[styles.themeName, { color: colors.text.primary }]}>{t(item.nameKey)}</Text>
                      <Text style={[styles.themeDescription, { color: colors.text.secondary }]}>{t(item.descriptionKey)}</Text>
                    </View>
                  </View>
                  {theme === item.mode && (
                    <Check size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    // Remove background and padding to match parent styling
  },
  content: {
    // Simple container for the text
  },
  title: {
    fontSize: Typography.fontSize.base,
    fontFamily: 'Roboto-Light',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.xl,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: 'PlayfairDisplay_700Bold',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: Typography.fontSize.xl,
    fontFamily: 'Roboto-Regular',
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
  },
  themeOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  themeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  themeInfo: {
    flex: 1,
  },
  themeName: {
    fontSize: Typography.fontSize.lg,
    fontFamily: 'Roboto-Regular',
    marginBottom: 2,
  },
  themeDescription: {
    fontSize: Typography.fontSize.base,
    fontFamily: 'Roboto-Light',
  },
});