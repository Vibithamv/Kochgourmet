Create a new API hook at hooks/$ARGUMENTS.tsx

Use this pattern — all hooks return a consistent { success, data, error, status } shape:

```tsx
import { apiRequest } from '@/utils/api'; // or whatever the HTTP utility is
import { useTenant } from '@/contexts/TenantContext';

export function myHookName() {
  const { tenant } = useTenant();

  const myMethod = async (param: string) => {
    try {
      const response = await fetch(`${tenant.apiBase}/endpoint/${param}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // auth headers added by interceptor
        },
      });
      const data = await response.json();
      if (response.ok) {
        return { success: true, data, status: response.status };
      }
      return { success: false, error: data, status: response.status };
    } catch (error) {
      return { success: false, error, status: 0 };
    }
  };

  return { myMethod };
}
```

Callers handle 401 like this:
```tsx
const res = await hook.method();
if (res.success && res.data) {
  // use res.data.data.*
} else if (res.status === 401) {
  showAlert(t('profile.sessionExpired'), t('profile.loginAgain'));
  router.replace('/auth/login');
} else {
  showAlert(t('common.error'), t('common.errorMessage'));
}
```

Look at an existing hook like hooks/userManagement.tsx for the exact HTTP setup used in this project before writing the new one.
