import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';

try {
  const messaging = getMessaging();
  setBackgroundMessageHandler(messaging, async (remoteMessage) => {
    console.log('[FCM] Background message:', remoteMessage.messageId, remoteMessage.data);
  });
} catch (error) {
  console.warn('[FCM] Background handler not registered', error);
}
