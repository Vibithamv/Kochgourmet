import { router } from 'expo-router';

/** Navigate to login so register/forgot (and modals) are not left on the back stack. */
export function replaceLoginClearingAuthStack(): void {
  // dismissAll() dispatches POP_TO_TOP; iOS warns/errors when the stack has only one screen.
  if (router.canDismiss()) {
    router.dismissAll();
  }
  router.replace('/auth/login');
}
