import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sun, Moon, Leaf, Check } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import {
  getColors,
  Typography,
  Spacing,
  BorderRadius,
  type ThemeMode,
} from '@/constants/theme';
import { suppressTabBar, restoreTabBar } from '@/utils/tabBarStore';

interface ThemeOption {
  mode: ThemeMode;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const themeOptions: ThemeOption[] = [
  {
    mode: 'light',
    name: 'Light Mode',
    description: 'Clean and bright interface',
    icon: <Sun size={20} color="#EE7B5F" />,
  },
  {
    mode: 'dark',
    name: 'Dark Mode',
    description: 'Easy on the eyes',
    icon: <Moon size={20} color="#C9BEB5" />,
  },
  {
    mode: 'darkGreen',
    name: 'Forest Mode',
    description: 'Nature-inspired dark theme',
    icon: <Leaf size={20} color="#6BA888" />,
  },
];

interface ThemeToggleProps {
  style?: any;
}

export default function ThemeToggle({ style }: Readonly<ThemeToggleProps>) {
  const { theme, setTheme } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const colors = getColors(theme);

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
            {getCurrentTheme().name}
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
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>Choose Theme</Text>
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
                      <Text style={[styles.themeName, { color: colors.text.primary }]}>{item.name}</Text>
                      <Text style={[styles.themeDescription, { color: colors.text.secondary }]}>{item.description}</Text>
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
    fontFamily: Typography.fontFamily.regular,
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
    fontFamily: Typography.fontFamily.bold,
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
    fontWeight: 'bold',
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
    fontFamily: Typography.fontFamily.semiBold,
    marginBottom: 2,
  },
  themeDescription: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
  },
});