import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { router, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChefHat, Heart, Menu, Star } from 'lucide-react-native';
import BonusTabIcon from '@/components/BonusTabIcon';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors, getShadows } from '@/constants/theme';
import { useTabBarSuppressed } from '@/utils/tabBarStore';

const TABS = [
  { route: '/',          labelKey: 'common.tabs.rezepte',   Icon: Star,        filledWhenActive: true,  match: (p: string) => p === '/' || p.startsWith('/recipe') },
  { route: '/projects',  labelKey: 'common.tabs.magazin',   Icon: ChefHat,     filledWhenActive: false, match: (p: string) => p.startsWith('/projects') || p.startsWith('/magazin') },
  { route: '/portfolio', labelKey: 'common.tabs.favoriten', Icon: Heart,       filledWhenActive: false, match: (p: string) => p.startsWith('/portfolio') || p.startsWith('/favoriten') },
  { route: '/offerings', labelKey: 'common.tabs.token',     Icon: BonusTabIcon, iconKind: 'bonus', filledWhenActive: false, match: (p: string) => p.startsWith('/offerings') || p.startsWith('/project') || p.startsWith('/investment') },
  { route: '/account',   labelKey: 'common.tabs.menu',      Icon: Menu,        filledWhenActive: false, match: (p: string) => p === '/account' || p.startsWith('/account/') },
];

const TAB_LABEL_ACTIVE_COLOR = '#EE7051';
const TAB_LABEL_INACTIVE_COLOR = '#000000';
const GLASS_BG_OPACITY = 0.8;

const HIDDEN_PATHS = new Set([
  '/auth/login', '/auth/register', '/auth/registerConfirm', '/auth/forgotPassword',
  '/auth/callback', '/auth/kycRequest', '/auth/whitelistRequest',
  '/screens/KYCWebView', '/screens/docSignWebview', '/screens/docWebview',
  '/screens/kycWaiting', '/screens/paymentWebView', '/screens/platformError',
  '/screens/whitelistRequest', '/screens/whitelistResponseWaiting',
  '/screens/portfolio',
  '/recipe/filter',
  '/+not-found',
]);

function shouldHideTabBar(pathname: string): boolean {
  if (HIDDEN_PATHS.has(pathname)) return true;
  if (pathname.startsWith('/account/')) return true;
  if (pathname.startsWith('/portfolio/')) return true;
  if (pathname.startsWith('/favoriten/')) return true;
  if (pathname.startsWith('/project/')) return true;
  if (pathname.startsWith('/investment/')) return true;
  return false;
}

type GlobalFloatingTabBarProps = Readonly<{
  bootstrapComplete?: boolean;
}>;

export default function GlobalFloatingTabBar({
  bootstrapComplete = true,
}: GlobalFloatingTabBarProps) {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const shadows = getShadows(theme);
  const colors = getColors(theme);
  const isDark = theme === 'dark' || theme === 'darkGreen';

  const suppressed = useTabBarSuppressed();

  if (!bootstrapComplete) return null;
  if (shouldHideTabBar(pathname)) return null;
  if (suppressed) return null;

  const activeTab = TABS.find(t => t.match(pathname)) ?? TABS[0];
  const bottom = Math.max(insets.bottom, 12) + 4;

  const blurTint = isDark ? 'dark' : 'light';
  const glassOverlay = isDark
    ? theme === 'darkGreen'
      ? `rgba(21, 37, 28, ${GLASS_BG_OPACITY})`
      : `rgba(34, 30, 28, ${GLASS_BG_OPACITY})`
    : `rgba(255, 246, 234, ${GLASS_BG_OPACITY})`;
  const glassBorder = isDark
    ? 'rgba(255, 255, 255, 0.14)'
    : 'rgba(255, 255, 255, 0.65)';

  return (
    <View style={[styles.wrapper, { bottom }]} pointerEvents="box-none">
      <View style={[styles.bar, shadows.card, { borderColor: glassBorder }]}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 72 : 90}
          tint={blurTint}
          style={StyleSheet.absoluteFill}
        />
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: glassOverlay }]}
        />
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: 32,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.35)',
            },
          ]}
        />
        <View style={styles.barInner}>
          {TABS.map(tab => {
            const isFocused = activeTab.route === tab.route;
            const color = isFocused
              ? TAB_LABEL_ACTIVE_COLOR
              : isDark
                ? '#FFFFFF'
                : TAB_LABEL_INACTIVE_COLOR;

            return (
              <TouchableOpacity
                key={tab.route}
                onPress={() => {
                  if (!isFocused) router.navigate(tab.route as any);
                }}
                style={styles.item}
                activeOpacity={0.7}
              >
                {tab.iconKind === 'bonus' ? (
                  <BonusTabIcon
                    size={18}
                    color={isFocused ? TAB_LABEL_ACTIVE_COLOR : colors.text.secondary}
                  />
                ) : (
                  <tab.Icon
                    size={18}
                    color={color}
                    strokeWidth={1.5}
                    fill={tab.filledWhenActive ? color : 'transparent'}
                  />
                )}
                <Text style={[styles.label, { color }]}>{t(tab.labelKey)}</Text>
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
    borderWidth: 1,
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
    fontSize: 11,
    lineHeight: 11,
    letterSpacing: 0,
  },
});
