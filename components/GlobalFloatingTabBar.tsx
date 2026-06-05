import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChefHat, Heart, Menu, Star, TrendingUp } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getShadows } from '@/constants/theme';
import { useTabBarSuppressed } from '@/utils/tabBarStore';

const TABS = [
  { route: '/',          label: 'Rezepte',   Icon: Star,        filledWhenActive: true,  match: (p: string) => p === '/' || p.startsWith('/recipe') },
  { route: '/projects',  label: 'Magazin',   Icon: ChefHat,     filledWhenActive: false, match: (p: string) => p.startsWith('/projects') || p.startsWith('/magazin') },
  { route: '/portfolio', label: 'Favoriten', Icon: Heart,       filledWhenActive: false, match: (p: string) => p.startsWith('/portfolio') || p.startsWith('/favoriten') },
  { route: '/offerings', label: 'Bonus',     Icon: TrendingUp,  filledWhenActive: false, match: (p: string) => p.startsWith('/offerings') || p.startsWith('/project') || p.startsWith('/investment') },
  { route: '/account',   label: 'Menü',      Icon: Menu,        filledWhenActive: false, match: (p: string) => p.startsWith('/account') || p === '/auth/kycRequest' || p === '/screens/portfolio' || p === '/screens/projects' },
];

const TAB_LABEL_ACTIVE_COLOR = '#EE7051';
const TAB_LABEL_INACTIVE_COLOR = '#000000';

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
  const shadows = getShadows(theme);
  const isDark = theme === 'dark' || theme === 'darkGreen';

  const suppressed = useTabBarSuppressed();

  if (HIDDEN_PATHS.has(pathname)) return null;
  if (suppressed) return null;

  const activeTab = TABS.find(t => t.match(pathname)) ?? TABS[0];
  const bottom = Math.max(insets.bottom, 12) + 4;

  const blurTint = isDark ? 'dark' : 'light';
  const glassOverlay = isDark
    ? 'rgba(34, 30, 28, 0.42)'
    : 'rgba(255, 249, 240, 0.52)';
  const glassBorder = isDark
    ? 'rgba(255, 255, 255, 0.1)'
    : 'rgba(255, 255, 255, 0.72)';

  return (
    <View style={[styles.wrapper, { bottom }]} pointerEvents="box-none">
      <View style={[styles.bar, shadows.card, { borderColor: glassBorder }]}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 68 : 85}
          tint={blurTint}
          style={StyleSheet.absoluteFill}
        />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: glassOverlay }]} />
        <View style={styles.barInner}>
          {TABS.map(tab => {
            const isFocused = activeTab.route === tab.route;
            const color = isFocused ? TAB_LABEL_ACTIVE_COLOR : TAB_LABEL_INACTIVE_COLOR;

            return (
              <TouchableOpacity
                key={tab.route}
                onPress={() => {
                  if (!isFocused) router.navigate(tab.route as any);
                }}
                style={styles.item}
                activeOpacity={0.7}
              >
                <tab.Icon
                  size={18}
                  color={color}
                  strokeWidth={1.5}
                  fill={tab.filledWhenActive ? color : 'transparent'}
                />
                <Text style={[styles.label, { color }]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
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
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  barInner: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 4,
  },
  label: {
    fontFamily: 'Roboto-Regular',
    fontSize: 12,
    lineHeight: 12,
    letterSpacing: 0,
  },
});
