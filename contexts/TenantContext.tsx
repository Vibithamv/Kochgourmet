import React, { createContext, useContext, useMemo, useState } from 'react';
import type { Tenant } from '../types';

interface TenantContextType {
  tenant: Tenant | null;
  setTenant: (tenant: Tenant) => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

type TenantProviderProps = Readonly<{
  children: React.ReactNode;
}>;

export function TenantProvider({ children }: TenantProviderProps) {
  const [tenant, setTenant] = useState<Tenant | null>({
    id: 'default',
    name: 'RealEstate Invest',
    logo_url: 'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
    primary_color: '#1E293B',
    secondary_color: '#10B981',
    domain: 'default.realestateinvest.com'
  });

  const contextValue = useMemo(
    () => ({ tenant, setTenant }),
    [tenant, setTenant]
  );

  return (
    <TenantContext.Provider value={contextValue}>
      {children}
    </TenantContext.Provider>
  );
}

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};