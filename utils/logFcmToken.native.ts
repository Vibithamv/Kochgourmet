import {
  AuthorizationStatus,
  getMessaging,
  getToken,
  registerDeviceForRemoteMessages,
  requestPermission,
} from '@react-native-firebase/messaging';
import * as Application from 'expo-application';
import { PermissionsAndroid, Platform } from 'react-native';
import { RegisterToken } from '@/hooks/register_token';

async function ensureAndroidPostNotificationsPermission(): Promise<void> {
  if (Platform.OS !== 'android' || Platform.Version < 33) return;
  await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
  );
}

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
 * Re-register the current device token with your API (e.g. after FCM rotation).
 * Does not prompt for permissions; skips if messaging is unavailable.
 */
export async function registerCurrentFcmTokenWithBackend(): Promise<void> {
  try {
    const messaging = getMessaging();
    const token = await getToken(messaging);
    if (!token) return;

    const device_id = await getDeviceIdForApi();
    let platform = 'unknown';
    if (Platform.OS === 'android') platform = 'android';
    else if (Platform.OS === 'ios') platform = 'ios';

    const { request: registerPushToken } = RegisterToken();
    const registerResponse = await registerPushToken(token, device_id, platform);
    if (!registerResponse.success) {
      console.warn('[FCM] register-token (refresh) failed', registerResponse);
    }
  } catch (error) {
    console.warn('[FCM] register-token (refresh) skipped', error);
  }
}

export async function logFcmTokenOnSuccessfulLogin(): Promise<void> {
  try {
    await ensureAndroidPostNotificationsPermission();

    const messaging = getMessaging();

    if (Platform.OS === 'ios') {
      const authStatus = await requestPermission(messaging);
      const enabled =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;
      if (!enabled) {
        console.log('[FCM] Push permission not granted');
        return;
      }
      await registerDeviceForRemoteMessages(messaging);
    }

    const token = await getToken(messaging);
    console.log('[FCM] Device token (login):', token);

    const device_id = await getDeviceIdForApi();
    let platform = 'unknown';
    if (Platform.OS === 'android') platform = 'android';
    else if (Platform.OS === 'ios') platform = 'ios';

    const { request: registerPushToken } = RegisterToken();
    const registerResponse = await registerPushToken(token, device_id, platform);
    if (!registerResponse.success) {
      console.warn('[FCM] register-token failed', registerResponse);
    }
  } catch (error) {
    console.warn('[FCM] Failed to get/register FCM token after login', error);
  }
}
