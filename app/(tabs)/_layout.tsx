import { Tabs, usePathname } from 'expo-router';
import React, { useCallback } from 'react';
import { BackHandler, Platform, View, StyleSheet } from 'react-native';
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

  return (
    <View style={styles.container}>
      <Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' }, animation: 'shift' }}>
        <Tabs.Screen name="index"      options={{ title: 'Rezepte' }} />
        <Tabs.Screen name="projects"   options={{ title: 'Magazin' }} />
        <Tabs.Screen name="portfolio"  options={{ title: 'Favoriten' }} />
        <Tabs.Screen name="offerings"  options={{ title: 'Bonus' }} />
        <Tabs.Screen name="account"    options={{ title: 'Menü' }} />
        <Tabs.Screen name="engagement" options={{ href: null }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
