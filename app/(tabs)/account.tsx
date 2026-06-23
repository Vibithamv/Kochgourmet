import React, { useCallback, useMemo, useState } from 'react';
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
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors } from '@/constants/theme';
import { useGlobalAlert } from '@/contexts/AlertContext';
import { useAuth } from '@/contexts/AuthContext';
import { replaceLoginClearingAuthStack } from '@/utils/authNavigation';
import LanguageSelector from '@/components/LanguageSelector';

interface MenuItem {
  id: string;
  labelKey: string;
  route?: string;
  onPress?: () => void;
  labelColor?: string;
}

const TAB_BAR_HEIGHT = 90;

export default function MenuScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const insets = useSafeAreaInsets();
  const { showAlert } = useGlobalAlert();
  const { signOut } = useAuth();
  const [bonusExpanded, setBonusExpanded] = useState(false);

  const handleSignOut = useCallback(() => {
    showAlert(t('account.signOut'), t('account.signOutConfirm'), {
      buttonText: t('account.signOut'),
      buttonCallback: () => {
        signOut();
        replaceLoginClearingAuthStack();
      },
      secondaryButtonText: t('common.cancel'),
    });
  }, [showAlert, signOut, t]);

  const mainMenuItems = useMemo<MenuItem[]>(
    () => [
      { id: 'rezepte', labelKey: 'common.tabs.rezepte', route: '/' },
      { id: 'magazin', labelKey: 'common.tabs.magazin', route: '/projects' },
      { id: 'favoriten', labelKey: 'common.tabs.favoriten', route: '/portfolio' },
      { id: 'profile', labelKey: 'account.changeProfile', route: '/account/profile' },
      { id: 'settings', labelKey: 'account.appSettings', route: '/account/settings' },
    ],
    [],
  );

  const bonusSubmenuItems = useMemo<MenuItem[]>(
    () => [
      { id: 'portfolio', labelKey: 'portfolio.title', route: '/screens/portfolio' },
      { id: 'investment', labelKey: 'account.investment', route: '/offerings' },
      { id: 'securitiesAccount', labelKey: 'account.securitiesAccount', route: '/account/securities-account' },
      { id: 'bankDetails', labelKey: 'account.bankDetails', route: '/account/bank-details' },
      { id: 'kyc', labelKey: 'account.kycVerification', route: '/auth/kycRequest?from=menu' },
      { id: 'help', labelKey: 'account.helpSupport', route: '/account/help-support' },
    ],
    [],
  );

  const bottomMenuItems = useMemo<MenuItem[]>(
    () => [
      { id: 'privacy', labelKey: 'account.privacyPolicy', route: '/account/datenschutz' },
      { id: 'legal', labelKey: 'account.legalNotice', route: '/account/impressum' },
      { id: 'signOut', labelKey: 'account.signOut', labelColor: colors.primary, onPress: handleSignOut },
    ],
    [colors.primary, handleSignOut],
  );

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
        {t(item.labelKey)}
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

        <Text style={[styles.title, { color: colors.text.primary }]}>
          {t('common.tabs.menu')}
        </Text>

        <View style={styles.list}>
          {mainMenuItems.map(item => (
            <View key={item.id}>
              {renderMenuRow(item)}
              {renderDivider()}
            </View>
          ))}

          <View>
            <TouchableOpacity
              style={styles.row}
              onPress={() => setBonusExpanded(prev => !prev)}
              activeOpacity={0.5}
            >
              <Text style={[styles.rowLabel, { color: colors.text.primary }]}>
                {t('common.tabs.token')}
              </Text>
              {bonusExpanded ? (
                <ChevronUp size={20} color={colors.text.tertiary} strokeWidth={1.5} />
              ) : (
                <ChevronDown size={20} color={colors.text.tertiary} strokeWidth={1.5} />
              )}
            </TouchableOpacity>
            {bonusExpanded && bonusSubmenuItems.map(subItem => (
              <View key={subItem.id}>
                {renderDivider()}
                {renderMenuRow(subItem, { submenu: true })}
              </View>
            ))}
            {renderDivider()}
          </View>

          {bottomMenuItems.map(item => (
            <View key={item.id}>
              {renderMenuRow(item)}
              {item.id !== 'signOut' && renderDivider()}
            </View>
          ))}

          <View style={styles.languageContainer}>
            <LanguageSelector />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingHorizontal: 26 },
  title: {
    fontFamily: 'PlayfairDisplay_700Bold',
    fontSize: 35,
    lineHeight: 48,
    letterSpacing: 0,
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
    fontFamily: 'Roboto-Light',
    fontSize: 17,
    lineHeight: 23,
    letterSpacing: 0,
  },
  submenuLabel: {
    fontFamily: 'Roboto-Light',
    fontSize: 17,
    lineHeight: 23,
    letterSpacing: 0,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    opacity: 0.6,
  },
  languageContainer: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
});
