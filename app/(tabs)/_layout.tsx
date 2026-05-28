import { Tabs, usePathname } from 'expo-router';
import React, { useCallback } from 'react';
import {
  BackHandler,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChefHat, Heart, Menu, Star, TrendingUp } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ASYNC_STORAGE_EXIT_RESET_TO_HOME } from '@/constants/navigation';
import { useGlobalAlert } from '@/contexts/AlertContext';
import { useFocusEffect } from '@react-navigation/native';

// Figma: rgba(255,246,234,0.8) + backdropFilter blur(10px)
const TAB_BAR_BG = 'rgba(255, 246, 234, 0.95)';

async function exitApp() {
  try {
    await AsyncStorage.setItem(ASYNC_STORAGE_EXIT_RESET_TO_HOME, '1');
  } catch { /* still exit */ }
  BackHandler.exitApp();
}

const TAB_ICONS: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  index: Star,
  offerings: TrendingUp,
  projects: ChefHat,
  portfolio: Heart,
  account: Menu,
};

const TAB_LABELS: Record<string, string> = {
  index: 'Rezepte',
  projects: 'Magazin',
  portfolio: 'Favoriten',
  offerings: 'Bonus',
  account: 'Menü',
};

interface FloatingTabBarProps {
  readonly state: any;
  readonly navigation: any;
  readonly primaryColor: string;
  readonly tertiaryColor: string;
  readonly tabBarBottom: number;
}

function FloatingTabBar({ state, navigation, primaryColor, tertiaryColor, tabBarBottom }: FloatingTabBarProps) {
  const visibleRoutes = state.routes.filter((r: any) => r.name !== 'engagement');

  return (
    <View style={[styles.tabBarWrapper, { bottom: tabBarBottom }]}>
      <View style={styles.tabBar}>
        {visibleRoutes.map((route: any) => {
          const routeIndex = state.routes.findIndex((r: any) => r.key === route.key);
          const isFocused = state.index === routeIndex;
          const Icon = TAB_ICONS[route.name] ?? Star;
          const label = TAB_LABELS[route.name] ?? route.name;
          const color = isFocused ? primaryColor : tertiaryColor;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabItem}
              activeOpacity={0.7}
            >
              <Icon size={22} color={color} />
              <Text style={[styles.tabLabel, { color }]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  const { theme } = useTheme();
  const colors = getColors(theme);
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { showAlert } = useGlobalAlert();

  const tabBarBottom = Math.max(insets.bottom, 12) + 4;

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        const isOnTabRoot =
          pathname === '/' ||
          pathname === '/projects' ||
          pathname === '/portfolio' ||
          pathname === '/offerings' ||
          pathname === '/account';

        if (isOnTabRoot) {
          showAlert('App beenden', 'Möchtest du die App beenden?', {
            buttonText: 'Ja',
            buttonCallback: () => { void exitApp(); },
            secondaryButtonText: 'Abbrechen',
          });
          return true;
        }
        return false;
      };

      if (Platform.OS === 'android') {
        const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => sub.remove();
      }
    }, [pathname])
  );

  const renderTabBar = useCallback(
    (props: any) => (
      <FloatingTabBar
        {...props}
        primaryColor={colors.primary}
        tertiaryColor={colors.text.tertiary}
        tabBarBottom={tabBarBottom}
      />
    ),
    [colors.primary, colors.text.tertiary, tabBarBottom]
  );

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}
        tabBar={renderTabBar}
      >
        <Tabs.Screen name="index" options={{ title: 'Rezepte' }} />
        <Tabs.Screen name="projects" options={{ title: 'Magazin' }} />
        <Tabs.Screen name="portfolio" options={{ title: 'Favoriten' }} />
        <Tabs.Screen name="offerings" options={{ title: 'Bonus' }} />
        <Tabs.Screen name="account" options={{ title: 'Menü' }} />
        <Tabs.Screen name="engagement" options={{ href: null }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBarWrapper: {
    position: 'absolute',
    left: 20,
    right: 20,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 32,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: TAB_BAR_BG,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabLabel: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
  },
});
