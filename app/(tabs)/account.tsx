import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors, getTypography } from '@/constants/theme';
import { useGlobalAlert } from '@/contexts/AlertContext';
import { useAuth } from '@/contexts/AuthContext';
import { replaceLoginClearingAuthStack } from '@/utils/authNavigation';

interface MenuItem {
  label: string;
  route?: string;
  onPress?: () => void;
  labelColor?: string;
}

const TAB_BAR_HEIGHT = 90;

export default function MenuScreen() {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const typography = getTypography(theme);
  const insets = useSafeAreaInsets();
  const { showAlert } = useGlobalAlert();
  const { signOut } = useAuth();

  const handleSignOut = useCallback(() => {
    showAlert('Abmelden', 'Möchtest du dich wirklich abmelden?', {
      buttonText: 'Abmelden',
      buttonCallback: () => {
        signOut();
        replaceLoginClearingAuthStack();
      },
      secondaryButtonText: 'Abbrechen',
    });
  }, [showAlert, signOut]);

  // Flat list — items same as before, just no section groupings
  const MENU_ITEMS: MenuItem[] = [
    // Navigation
    { label: 'Rezepte', route: '/' },
    { label: 'Magazin', route: '/projects' },
    { label: 'Favoriten', route: '/portfolio' },
    { label: 'Bonus', route: '/offerings' },
    // Investment & account
    { label: 'Mein Portfolio', route: '/screens/portfolio' },
    { label: 'Profil ändern', route: '/account/profile' },
    { label: 'Wallets', route: '/account/wallets' },
    { label: 'Zahlungsmethoden', route: '/account/payment-methods' },
    { label: 'KYC Verifizierung', route: '/auth/kycRequest' },
    // Legal & support
    { label: 'Einstellungen', route: '/account/settings' },
    { label: 'Hilfe & Support', route: '/account/help-support' },
    { label: 'Impressum', route: '/account/impressum' },
    { label: 'Datenschutz', route: '/account/datenschutz' },
    // Auth
    { label: 'Abmelden', labelColor: colors.primary, onPress: handleSignOut },
  ];

  const navigate = (item: MenuItem) => {
    if (item.onPress) {
      item.onPress();
    } else if (item.route) {
      router.push(item.route as any);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: TAB_BAR_HEIGHT + Math.max(insets.bottom, 12) + 16 },
        ]}
      >
        <View style={{ height: Math.max(insets.top, 44) + 24 }} />

        {/* Title */}
        <Text style={[styles.title, {
          color: colors.text.primary,
          fontFamily: typography.fontFamily.display,
        }]}>
          Menü
        </Text>

        {/* Flat menu list with thin dividers between every row */}
        <View style={styles.list}>
          {MENU_ITEMS.map((item, i) => (
            <View key={item.label}>
              <TouchableOpacity
                style={styles.row}
                onPress={() => navigate(item)}
                activeOpacity={item.route || item.onPress ? 0.5 : 1}
              >
                <Text style={[
                  styles.rowLabel,
                  { color: item.labelColor ?? colors.text.primary },
                ]}>
                  {item.label}
                </Text>
                <ChevronRight size={20} color={colors.text.tertiary} strokeWidth={1.5} />
              </TouchableOpacity>
              {i < MENU_ITEMS.length - 1 && (
                <View style={[styles.divider, { backgroundColor: colors.border.primary }]} />
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingHorizontal: 26 },
  title: {
    fontSize: 56,
    lineHeight: 68,
    letterSpacing: -1,
    marginBottom: 24,
  },
  list: {
    // Continuous list, no section grouping
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 22,
  },
  rowLabel: {
    fontSize: 19,
    fontFamily: 'Inter-Regular',
    letterSpacing: 0.1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    opacity: 0.6,
  },
});
