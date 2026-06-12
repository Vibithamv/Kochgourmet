/**
 * Web / non-native: Firebase Messaging is not available.
 * Native builds use `logFcmToken.native.ts`.
 */

export type NotificationPromptHandlers = {
  showAlert: (
    title: string,
    message: string,
    options?: {
      buttonText?: string;
      buttonCallback?: () => void;
      secondaryButtonText?: string;
      secondaryButtonCallback?: () => void;
    }
  ) => void;
  t: (key: string) => string;
};

export function promptPushNotificationsAfterLogin(_handlers: NotificationPromptHandlers): Promise<void> {
  return Promise.resolve();
}

export async function logFcmTokenOnSuccessfulLogin(): Promise<void> {}

export async function registerCurrentFcmTokenWithBackend(): Promise<void> {}
