import { getMessaging, getToken } from '@react-native-firebase/messaging';
import * as Application from 'expo-application';
import { Platform } from 'react-native';
import { RemoveToken } from '@/hooks/remove_token';

async function getDeviceIdForApi(): Promise<string> {
  try {
    if (Platform.OS === 'android') {
      const id = Application.getAndroidId();
      return id || 'unknown';
    }
    if (Platform.OS === 'ios') {
      const id = await Application.getIosIdForVendorAsync();
      return id || 'unknown';
    }
  } catch {
    // fall through
  }
  return 'unknown';
}

/**
 * Calls POST /remove-token while auth tokens are still in AsyncStorage.
 * Invoked from `signOut` before clearing storage.
 */
export async function unregisterPushTokenOnSignOut(): Promise<void> {
  try {
    const messaging = getMessaging();
    const token = await getToken(messaging);
    const device_id = await getDeviceIdForApi();
    const { request } = RemoveToken();
    const result = await request(token, device_id);
    if (!result.success) {
      console.warn('[FCM] remove-token failed', result);
    }
  } catch (error) {
    console.warn('[FCM] remove-token skipped', error);
  }
}
