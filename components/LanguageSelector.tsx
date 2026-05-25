import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Globe, Check, X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors, Typography } from '@/constants/theme';

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  // { code: 'es', name: 'Spanish', nativeName: 'Español' },
];

export default function LanguageSelector() {
  const { i18n } = useTranslation();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const [modalVisible, setModalVisible] = useState(false);

  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setModalVisible(false);
  };

  const currentLang =
    languages.find((l) => l.code === i18n.language) ||
    languages.find((l) => i18n.language.startsWith(`${l.code}-`)) ||
    languages.find((l) => l.code === 'de')!;
  const currentCode = currentLang.code.toUpperCase();

  return (
    <>
      <TouchableOpacity
        style={[styles.trigger, { borderColor: colors.border.primary }]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Globe size={15} color={colors.text.tertiary} />
        <Text style={[styles.triggerText, { color: colors.text.tertiary }]}>{currentCode}</Text>
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={[styles.sheet, {
            backgroundColor: colors.background.primary,
            borderColor: colors.border.primary,
          }]}>
            {/* Header */}
            <View style={[styles.sheetHeader, { borderBottomColor: colors.border.primary }]}>
              <Text style={[styles.sheetTitle, { color: colors.text.primary }]}>Language</Text>
              <TouchableOpacity
                style={[styles.closeBtn, { backgroundColor: colors.background.secondary }]}
                onPress={() => setModalVisible(false)}
              >
                <X size={16} color={colors.text.tertiary} />
              </TouchableOpacity>
            </View>

            {/* Options */}
            {languages.map((lang, index) => {
              const isActive =
                i18n.language === lang.code || i18n.language.startsWith(`${lang.code}-`);
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.option,
                    isActive && { backgroundColor: `${colors.primary}10` },
                    index < languages.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border.primary },
                  ]}
                  onPress={() => changeLanguage(lang.code)}
                  activeOpacity={0.7}
                >
                  <View>
                    <Text style={[
                      styles.optionName,
                      { color: isActive ? colors.primary : colors.text.primary },
                    ]}>
                      {lang.name}
                    </Text>
                    <Text style={[styles.optionNative, { color: colors.text.tertiary }]}>
                      {lang.nativeName}
                    </Text>
                  </View>
                  {isActive && <Check size={18} color={colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  triggerText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: 'Inter-Medium',
    letterSpacing: 0.5,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingBottom: 32,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  sheetTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.1,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  optionName: {
    fontSize: Typography.fontSize.base,
    fontFamily: 'Inter-Medium',
    marginBottom: 2,
  },
  optionNative: {
    fontSize: Typography.fontSize.sm,
    fontFamily: 'Inter-Regular',
  },
});
