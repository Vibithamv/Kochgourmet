import { Stack } from 'expo-router';
import { RegisterPendingProvider } from '@/contexts/RegisterPendingContext';

export default function AuthLayout() {
  return (
    <RegisterPendingProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="registerConfirm" options={{ gestureEnabled: false }} />
        <Stack.Screen name="registerSuccess" options={{ gestureEnabled: false }} />
        <Stack.Screen
          name="embeddedWalletRequired"
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen name="whitelistRequest" />
        <Stack.Screen name="callback" />
      </Stack>
    </RegisterPendingProvider>
  );
}