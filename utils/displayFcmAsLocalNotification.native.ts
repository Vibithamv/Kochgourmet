import * as Notifications from 'expo-notifications';
import type { RemoteMessage } from '@react-native-firebase/messaging';
import { LightTheme } from '@/constants/themes/light';
import { Platform } from 'react-native';

const CHANNEL_ID = 'default';

export async function ensureDefaultAndroidNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'General',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: LightTheme.primary,
    sound: 'default',
  });
}

function getDisplayStrings(
  remoteMessage: RemoteMessage,
  t: (key: string) => string
): { title: string; body: string } {
  const title =
    remoteMessage.notification?.title?.trim() ||
    (typeof remoteMessage.data?.title === 'string' ? remoteMessage.data.title : '') ||
    t('notifications.pushTitle');
  const fromDataBody =
    typeof remoteMessage.data?.body === 'string' ? remoteMessage.data.body : '';
  const fromNotificationBody = remoteMessage.notification?.body?.trim() ?? '';
  const body =
    fromNotificationBody ||
    fromDataBody ||
    (remoteMessage.data && Object.keys(remoteMessage.data).length > 0
      ? JSON.stringify(remoteMessage.data)
      : t('notifications.pushBodyFallback'));
  return { title, body };
}

export async function displayRemoteMessageAsLocalNotification(
  remoteMessage: RemoteMessage,
  t: (key: string) => string
): Promise<void> {
  const { title, body } = getDisplayStrings(remoteMessage, t);
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: remoteMessage.data as Record<string, unknown>,
      ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
    },
    trigger: null,
  });
}
