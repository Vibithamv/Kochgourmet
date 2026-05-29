import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChefHat, Heart, Menu, Star, TrendingUp } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors } from '@/constants/theme';
import { useTabBarSuppressed } from '@/utils/tabBarStore';

const TABS = [
  { route: '/',          label: 'Rezepte',   Icon: Star,        match: (p: string) => p === '/' || p.startsWith('/recipe') },
  { route: '/projects',  label: 'Magazin',   Icon: ChefHat,     match: (p: string) => p.startsWith('/projects') || p.startsWith('/magazin') },
  { route: '/portfolio', label: 'Favoriten', Icon: Heart,       match: (p: string) => p.startsWith('/portfolio') || p.startsWith('/favoriten') },
  { route: '/offerings', label: 'Bonus',     Icon: TrendingUp,  match: (p: string) => p.startsWith('/offerings') || p.startsWith('/project') || p.startsWith('/investment') },
  { route: '/account',   label: 'Menü',      Icon: Menu,        match: (p: string) => p.startsWith('/account') || p === '/auth/kycRequest' || p === '/screens/portfolio' || p === '/screens/projects' },
];

const HIDDEN_PATHS = new Set([
  '/auth/login', '/auth/register', '/auth/forgotPassword',
  '/auth/callback', '/auth/whitelistRequest',
  '/screens/KYCWebView', '/screens/docSignWebview', '/screens/docWebview',
  '/screens/kycWaiting', '/screens/paymentWebView', '/screens/platformError',
  '/screens/whitelistRequest', '/screens/whitelistResponseWaiting',
  '/+not-found',
]);

export default function GlobalFloatingTabBar() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const isDark = theme === 'dark' || theme === 'darkGreen';

  const suppressed = useTabBarSuppressed();

  if (HIDDEN_PATHS.has(pathname)) return null;
  if (suppressed) return null;

  const activeTab = TABS.find(t => t.match(pathname)) ?? TABS[0];
  const bottom = Math.max(insets.bottom, 12) + 4;

  const barBg = isDark
    ? 'rgba(34, 30, 28, 0.97)'
    : 'rgba(255, 246, 234, 0.97)';

  return (
    <View style={[styles.wrapper, { bottom }]} pointerEvents="box-none">
      <View style={[styles.bar, { backgroundColor: barBg, borderColor: colors.border.primary }]}>
        {TABS.map(tab => {
          const isFocused = activeTab.route === tab.route;
          const color = isFocused ? colors.primary : colors.text.tertiary;

          return (
            <TouchableOpacity
              key={tab.route}
              onPress={() => {
                if (!isFocused) router.navigate(tab.route as any);
              }}
              style={styles.item}
              activeOpacity={0.7}
            >
              {isFocused && (
                <View style={[styles.activePill, { backgroundColor: isDark ? 'rgba(240,138,114,0.15)' : 'rgba(238,123,95,0.12)' }]} />
              )}
              <tab.Icon size={22} color={color} />
              <Text style={[styles.label, { color }]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 999,
  },
  bar: {
    flexDirection: 'row',
    borderRadius: 32,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
    }),
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 4,
  },
  activePill: {
    position: 'absolute',
    top: 0,
    left: 4,
    right: 4,
    bottom: 0,
    borderRadius: 20,
  },
  label: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
  },
});
