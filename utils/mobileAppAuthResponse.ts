import type { MobileAppAuthResponse, MobileAppUser } from '@/types/mobileAppApi';

export function resolveMobileAppAuthUser(
  data: MobileAppAuthResponse,
  fallbackEmail = '',
): MobileAppUser {
  if (data.user) {
    return data.user;
  }

  return {
    uid: data.uid ?? 0,
    email: data.email ?? fallbackEmail,
    firstName: data.firstName ?? '',
    lastName: data.lastName ?? '',
    newsletterDaily: false,
    newsletterWeekly: false,
  };
}
