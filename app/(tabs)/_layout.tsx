import { Tabs, useFocusEffect, usePathname } from 'expo-router';
import React, { useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  type TouchableOpacityProps,
  StyleSheet,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { House, Search, TrendingUp, User } from 'lucide-react-native';
import { useTenant } from '@/contexts/TenantContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getColors } from '@/constants/theme';
import { BackHandler } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ASYNC_STORAGE_EXIT_RESET_TO_HOME } from '@/constants/navigation';
import { useGlobalAlert } from '@/contexts/AlertContext';
import { useTranslation } from 'react-i18next';

type TabBarIconProps = { size: number; color: string };
type LucideIcon = React.ComponentType<{ size: number; color: string }>;

function createTabBarIcon(Icon: LucideIcon) {
  return function TabBarIcon({ size, color }: TabBarIconProps) {
    return <Icon size={size} color={color} />;
  };
}

const TabIconHome = createTabBarIcon(House);
const TabIconSearch = createTabBarIcon(Search);
const TabIconTrendingUp = createTabBarIcon(TrendingUp);
const TabIconUser = createTabBarIcon(User);

// Lazy load tab screens for better performance
const HomeScreen = React.lazy(() => import('./index'));
const ProjectsScreen = React.lazy(() => import('./projects'));
const InvestmentsScreen = React.lazy(() => import('./portfolio'));
const AccountScreen = React.lazy(() => import('./account'));

export default function TabLayout() {
  useTenant();
  const { theme } = useTheme();
  const colors = getColors(theme);
  const insets = useSafeAreaInsets();
  const scrollViewRefs = React.useRef<{ [key: string]: ScrollView | null }>({});
  const { showAlert } = useGlobalAlert();
  const { t } = useTranslation();

  const tabBarHeight = 60 + Math.max(insets.bottom, 0);
  const pathname = usePathname();

  const scrollToTop = (routeName: string) => {
    const scrollView = scrollViewRefs.current[routeName];
    if (scrollView) {
      scrollView.scrollTo({ y: 0, animated: true });
    }
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // List all root tab routes
        const isOnTabRoot =
          pathname === "/projects" ||
          pathname === "/portfolio" ||
          pathname === "/" ||
          pathname === "/account";

        if (isOnTabRoot) {
          showAlert('Exit', 'Do you want to exit the app?',
            {
              buttonText: "Yes",
              buttonCallback: () => {
                void (async () => {
                  try {
                    await AsyncStorage.setItem(ASYNC_STORAGE_EXIT_RESET_TO_HOME, '1');
                  } catch {
                    /* still exit */
                  }
                  BackHandler.exitApp();
                })();
              },
              secondaryButtonText: "Cancel",
              // secondaryButtonCallback: handleCancel,
            }
          )

          return true;
        }

        return false; // default behavior (go back)
      };

      if (Platform.OS === "android") {
        const sub = BackHandler.addEventListener(
          "hardwareBackPress",
          onBackPress
        );
        return () => sub.remove();
      }
    }, [pathname])
  );

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.text.tertiary,
          tabBarStyle: {
            backgroundColor: colors.background.primary,
            borderTopColor: colors.border.primary,
            borderTopWidth: 1,
            paddingBottom: 4,
            paddingTop: 8,
            height: tabBarHeight,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontFamily: 'Inter-Medium',
            marginTop: 2,
          },
          lazy: true,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('common.tabs.start'),
            tabBarIcon: TabIconHome,
            tabBarButton: (props) => (
              <TouchableOpacity
                {...({
                  ...props,
                  delayLongPress: props.delayLongPress ?? undefined,
                  disabled: props.disabled ?? undefined,
                  onPress: (e) => {
                    scrollToTop('index');
                    props.onPress?.(e);
                  },
                } as TouchableOpacityProps)}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="projects"
          options={{
            title: t('common.tabs.token'),
            tabBarIcon: TabIconSearch,
            tabBarButton: (props) => (
              <TouchableOpacity
                {...({
                  ...props,
                  delayLongPress: props.delayLongPress ?? undefined,
                  disabled: props.disabled ?? undefined,
                  onPress: (e) => {
                    scrollToTop('projects');
                    props.onPress?.(e);
                  },
                } as TouchableOpacityProps)}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="portfolio"
          options={{
            title: t('common.tabs.portfolio'),
            tabBarIcon: TabIconTrendingUp,
            tabBarButton: (props) => (
              <TouchableOpacity
                {...({
                  ...props,
                  delayLongPress: props.delayLongPress ?? undefined,
                  disabled: props.disabled ?? undefined,
                  onPress: (e) => {
                    scrollToTop('portfolio');
                    props.onPress?.(e);
                  },
                } as TouchableOpacityProps)}
              />
            ),
          }}
        />
        {/* <Tabs.Screen
          name="project/[id]"
          options={{
            href: null,
          }}
        /> */}
        {/* <Tabs.Screen
          name="transfer"
          options={{
            href: null,
          }}
        /> */}
        {/* <Tabs.Screen
          name="wallets"
          options={{
            href: null,
          }}
        /> */}
        <Tabs.Screen
          name="account"
          options={{
            title: t('common.tabs.account'),
            tabBarIcon: TabIconUser,
            tabBarButton: (props) => (
              <TouchableOpacity
                {...({
                  ...props,
                  delayLongPress: props.delayLongPress ?? undefined,
                  disabled: props.disabled ?? undefined,
                  onPress: (e) => {
                    scrollToTop('account');
                    props.onPress?.(e);
                  },
                } as TouchableOpacityProps)}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="engagement"
          options={{
            href: null,
          }}
        />
      </Tabs>

      {/* <FloatingTenantButton /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  floatingButtonContainer: {
    position: 'absolute',
    left: '50%',
    marginLeft: -28,
  },
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  tenantLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});