import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { RemoteMessage } from '@react-native-firebase/messaging';
import { getMessaging, onMessage, onTokenRefresh } from '@react-native-firebase/messaging';
import { registerCurrentFcmTokenWithBackend } from '@/utils/logFcmToken';
import {
  displayRemoteMessageAsLocalNotification,
  ensureDefaultAndroidNotificationChannel,
} from '@/utils/displayFcmAsLocalNotification';

function onTokenRefreshed() {
  registerCurrentFcmTokenWithBackend().catch(() => {});
}

export function FcmNotificationBridge() {
  const { t } = useTranslation();
  const tRef = useRef(t);
  tRef.current = t;

  useEffect(() => {
    let unsubscribeForeground: (() => void) | undefined;
    let unsubscribeTokenRefresh: (() => void) | undefined;

    const showAsDeviceNotification = (remoteMessage: RemoteMessage) => {
      displayRemoteMessageAsLocalNotification(remoteMessage, tRef.current).catch((err) => {
        console.warn('[FCM] Local notification failed', err);
      });
    };

    const attachListeners = (messaging: ReturnType<typeof getMessaging>) => {
      unsubscribeForeground = onMessage(messaging, showAsDeviceNotification);
      unsubscribeTokenRefresh = onTokenRefresh(messaging, onTokenRefreshed);
    };

    const run = async () => {
      let messaging;
      try {
        messaging = getMessaging();
      } catch {
        return;
      }

      await ensureDefaultAndroidNotificationChannel();
      attachListeners(messaging);
    };

    void run();

    return () => {
      unsubscribeForeground?.();
      unsubscribeTokenRefresh?.();
    };
  }, []);

  return null;
}
