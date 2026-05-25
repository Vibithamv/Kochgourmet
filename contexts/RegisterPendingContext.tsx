import React, { createContext, useContext, useMemo, useState } from 'react';

export type RegisterPendingPayload = Readonly<{
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}>;

type RegisterPendingContextValue = Readonly<{
  pending: RegisterPendingPayload | null;
  setPending: (payload: RegisterPendingPayload | null) => void;
}>;

const RegisterPendingContext = createContext<RegisterPendingContextValue | null>(null);

export function RegisterPendingProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [pending, setPending] = useState<RegisterPendingPayload | null>(null);
  const value = useMemo(() => ({ pending, setPending }), [pending]);
  return <RegisterPendingContext.Provider value={value}>{children}</RegisterPendingContext.Provider>;
}

export function useRegisterPending(): RegisterPendingContextValue {
  const ctx = useContext(RegisterPendingContext);
  if (!ctx) {
    throw new Error('useRegisterPending must be used within RegisterPendingProvider');
  }
  return ctx;
}
