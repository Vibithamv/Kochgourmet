import {
  AuthorizationStatus,
  getMessaging,
  getToken,
  registerDeviceForRemoteMessages,
  requestPermission,
} from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import * as Notifications from 'expo-notifications';
import { PermissionsAndroid, Platform } from 'react-native';
import { RegisterToken } from '@/hooks/register_token';
import type { NotificationPromptHandlers } from '@/utils/logFcmToken';

const NOTIFICATION_USER_OPTED_IN_KEY = 'notification-user-opted-in';
const NOTIFICATION_SYSTEM_DENIED_KEY = 'notification-system-denied';

function getAndroidApiLevel(): number {
  return typeof Platform.Version === 'number'
    ? Platform.Version
    : Number.parseInt(String(Platform.Version), 10) || 0;
}

type PromptDecision = 'register_silent' | 'show_soft_ask' | 'skip';

async function isAndroidPostNotificationsGranted(): Promise<boolean> {
  if (Platform.OS !== 'android' || getAndroidApiLevel() < 33) return true;
  return PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
}

async function getIosPermissionState(): Promise<'granted' | 'denied' | 'undetermined'> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') return 'granted';
    if (status === 'denied') return 'denied';
    return 'undetermined';
  } catch {
    return 'undetermined';
  }
}

async function getPromptDecision(): Promise<PromptDecision> {
  if (Platform.OS === 'android') {
    if (getAndroidApiLevel() >= 33) {
      if (await isAndroidPostNotificationsGranted()) return 'register_silent';
      if ((await AsyncStorage.getItem(NOTIFICATION_SYSTEM_DENIED_KEY)) === 'true') {
        return 'skip';
      }
      return 'show_soft_ask';
    }

    // Android 12 and below: no runtime permission — expo often reports "granted" without
    // showing any UI. Always show the custom soft ask until the user opts in.
    if ((await AsyncStorage.getItem(NOTIFICATION_USER_OPTED_IN_KEY)) === 'true') {
      return 'register_silent';
    }
    return 'show_soft_ask';
  }

  const iosState = await getIosPermissionState();
  if (iosState === 'granted') return 'register_silent';
  if (iosState === 'denied') return 'skip';
  return 'show_soft_ask';
}

async function canRegisterPushToken(): Promise<boolean> {
  if (Platform.OS === 'android') {
    if (getAndroidApiLevel() >= 33) {
      return isAndroidPostNotificationsGranted();
    }
    return (await AsyncStorage.getItem(NOTIFICATION_USER_OPTED_IN_KEY)) === 'true';
  }
  return (await getIosPermissionState()) === 'granted';
}

async function ensureAndroidPostNotificationsPermission(): Promise<boolean> {
  if (Platform.OS !== 'android' || getAndroidApiLevel() < 33) return true;
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
  );
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

async function ensureIosPushPermission(messaging: ReturnType<typeof getMessaging>): Promise<boolean> {
  const authStatus = await requestPermission(messaging);
  const enabled =
    authStatus === AuthorizationStatus.AUTHORIZED ||
    authStatus === AuthorizationStatus.PROVISIONAL;
  if (!enabled) return false;
  await registerDeviceForRemoteMessages(messaging);
  return true;
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

async function registerFcmTokenWithBackend(): Promise<void> {
  const messaging = getMessaging();
  const token = await getToken(messaging);
  if (!token) return;

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
}

async function requestSystemNotificationPermissionAndRegister(): Promise<void> {
  const messaging = getMessaging();

  if (Platform.OS === 'ios') {
    const granted = await ensureIosPushPermission(messaging);
    if (!granted) {
      console.log('[FCM] Push permission not granted');
      return;
    }
  } else {
    const granted = await ensureAndroidPostNotificationsPermission();
    if (!granted) {
      console.log('[FCM] Push permission not granted');
      if (getAndroidApiLevel() >= 33) {
        await AsyncStorage.setItem(NOTIFICATION_SYSTEM_DENIED_KEY, 'true');
      }
      return;
    }
  }

  await registerFcmTokenWithBackend();
}

/**
 * Re-register the current device token with your API (e.g. after FCM rotation).
 * Does not prompt for permissions; skips if messaging is unavailable.
 */
export async function registerCurrentFcmTokenWithBackend(): Promise<void> {
  try {
    if (!(await canRegisterPushToken())) return;
    await registerFcmTokenWithBackend();
  } catch (error) {
    console.warn('[FCM] register-token (refresh) skipped', error);
  }
}

/** @deprecated Use promptPushNotificationsAfterLogin for login flow. */
export async function logFcmTokenOnSuccessfulLogin(): Promise<void> {
  await requestSystemNotificationPermissionAndRegister();
}

export function promptPushNotificationsAfterLogin({
  showAlert,
  t,
}: NotificationPromptHandlers): Promise<void> {
  return new Promise((resolve) => {
    void (async () => {
      try {
        const decision = await getPromptDecision();
        if (decision === 'register_silent') {
          await registerFcmTokenWithBackend();
          resolve();
          return;
        }
        if (decision === 'skip') {
          resolve();
          return;
        }

        showAlert(
          t('notifications.permissionTitle'),
          t('notifications.permissionMessage'),
          {
            buttonText: t('notifications.permissionAllow'),
            buttonCallback: () => {
              void (async () => {
                try {
                  if (Platform.OS === 'android' && getAndroidApiLevel() < 33) {
                    await AsyncStorage.setItem(NOTIFICATION_USER_OPTED_IN_KEY, 'true');
                  }
                  await requestSystemNotificationPermissionAndRegister();
                } finally {
                  resolve();
                }
              })();
            },
            secondaryButtonText: t('notifications.permissionDeny'),
            secondaryButtonCallback: () => resolve(),
          }
        );
      } catch (error) {
        console.warn('[FCM] Notification soft-ask skipped', error);
        resolve();
      }
    })();
  });
}
