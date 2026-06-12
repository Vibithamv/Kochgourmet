import { Tabs, usePathname } from 'expo-router';
import React, { useCallback } from 'react';
import { BackHandler, Platform, View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ASYNC_STORAGE_EXIT_RESET_TO_HOME } from '@/constants/navigation';
import { useGlobalAlert } from '@/contexts/AlertContext';
import { useFocusEffect } from '@react-navigation/native';

async function exitApp() {
  try {
    await AsyncStorage.setItem(ASYNC_STORAGE_EXIT_RESET_TO_HOME, '1');
  } catch { /* still exit */ }
  BackHandler.exitApp();
}

export default function TabLayout() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { showAlert } = useGlobalAlert();

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
          showAlert(t('common.exit'), t('common.exitMsg'), {
            buttonText: t('common.confirm'),
            buttonCallback: () => { void exitApp(); },
            secondaryButtonText: t('common.cancel'),
          });
          return true;
        }
        return false;
      };

      if (Platform.OS === 'android') {
        const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => sub.remove();
      }
    }, [pathname, showAlert, t])
  );

  return (
    <View style={styles.container}>
      <Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' }, animation: 'shift' }}>
        <Tabs.Screen name="index"      options={{ title: t('common.tabs.rezepte') }} />
        <Tabs.Screen name="projects"   options={{ title: t('common.tabs.magazin') }} />
        <Tabs.Screen name="portfolio"  options={{ title: t('common.tabs.favoriten') }} />
        <Tabs.Screen name="offerings"  options={{ title: t('common.tabs.token') }} />
        <Tabs.Screen name="account"    options={{ title: t('common.tabs.menu') }} />
        <Tabs.Screen name="engagement" options={{ href: null }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
