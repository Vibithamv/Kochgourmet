import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronRight, ChevronDown, ChevronUp } from 'lucide-react-native';
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

const MAIN_MENU_ITEMS: MenuItem[] = [
  { label: 'Rezepte', route: '/' },
  { label: 'Magazin', route: '/projects' },
  { label: 'Favoriten', route: '/portfolio' },
];

const BONUS_SUBMENU_ITEMS: MenuItem[] = [
  { label: 'Mein Portfolio', route: '/screens/portfolio' },
  { label: 'Investment', route: '/offerings' },
  { label: 'Profil ändern', route: '/account/profile' },
  { label: 'KYC Verifizierung', route: '/auth/kycRequest' },
  { label: 'Hilfe & Support', route: '/account/help-support' },
  { label: 'Einstellungen', route: '/account/settings' },
];

export default function MenuScreen() {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const typography = getTypography(theme);
  const insets = useSafeAreaInsets();
  const { showAlert } = useGlobalAlert();
  const { signOut } = useAuth();
  const [bonusExpanded, setBonusExpanded] = useState(false);

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

  const bottomMenuItems: MenuItem[] = [
    { label: 'Datenschutz', route: '/account/datenschutz' },
    { label: 'Impressum', route: '/account/impressum' },
    { label: 'Abmelden', labelColor: colors.primary, onPress: handleSignOut },
  ];

  const navigate = (item: MenuItem) => {
    if (item.onPress) {
      item.onPress();
    } else if (item.route) {
      router.push(item.route as any);
    }
  };

  const renderDivider = () => (
    <View style={[styles.divider, { backgroundColor: colors.border.primary }]} />
  );

  const renderMenuRow = (item: MenuItem, options?: { submenu?: boolean }) => (
    <TouchableOpacity
      style={[styles.row, options?.submenu && styles.submenuRow]}
      onPress={() => navigate(item)}
      activeOpacity={item.route || item.onPress ? 0.5 : 1}
    >
      <Text style={[
        options?.submenu ? styles.submenuLabel : styles.rowLabel,
        { color: item.labelColor ?? colors.text.primary },
      ]}>
        {item.label}
      </Text>
      <ChevronRight size={20} color={colors.text.tertiary} strokeWidth={1.5} />
    </TouchableOpacity>
  );

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

        <Text style={[styles.title, {
          color: colors.text.primary,
          fontFamily: typography.fontFamily.display,
        }]}>
          Menü
        </Text>

        <View style={styles.list}>
          {MAIN_MENU_ITEMS.map(item => (
            <View key={item.label}>
              {renderMenuRow(item)}
              {renderDivider()}
            </View>
          ))}

          {/* Bonus — expandable submenu */}
          <View>
            <TouchableOpacity
              style={styles.row}
              onPress={() => setBonusExpanded(prev => !prev)}
              activeOpacity={0.5}
            >
              <Text style={[styles.rowLabel, { color: colors.text.primary }]}>
                Bonus
              </Text>
              {bonusExpanded ? (
                <ChevronUp size={20} color={colors.text.tertiary} strokeWidth={1.5} />
              ) : (
                <ChevronDown size={20} color={colors.text.tertiary} strokeWidth={1.5} />
              )}
            </TouchableOpacity>
            {bonusExpanded && BONUS_SUBMENU_ITEMS.map(subItem => (
              <View key={subItem.label}>
                {renderDivider()}
                {renderMenuRow(subItem, { submenu: true })}
              </View>
            ))}
            {renderDivider()}
          </View>

          {bottomMenuItems.map(item => (
            <View key={item.label}>
              {renderMenuRow(item)}
              {item.label !== 'Abmelden' && renderDivider()}
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
  list: {},
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 22,
  },
  submenuRow: {
    paddingLeft: 16,
    paddingVertical: 18,
  },
  rowLabel: {
    fontSize: 19,
    fontFamily: 'Inter-Regular',
    letterSpacing: 0.1,
  },
  submenuLabel: {
    fontSize: 17,
    fontFamily: 'Inter-Regular',
    letterSpacing: 0.1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    opacity: 0.6,
  },
});
