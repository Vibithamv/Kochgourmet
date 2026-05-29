import { useEffect, useState } from 'react';

// Module-level counter so any modal can suppress the tab bar without a context.
const listeners = new Set<(v: boolean) => void>();
let suppressCount = 0;

function notify() {
  const suppressed = suppressCount > 0;
  listeners.forEach(fn => fn(suppressed));
}

export function suppressTabBar() {
  suppressCount++;
  notify();
}

export function restoreTabBar() {
  suppressCount = Math.max(0, suppressCount - 1);
  notify();
}

export function useTabBarSuppressed(): boolean {
  const [suppressed, setSuppressed] = useState(false);
  useEffect(() => {
    listeners.add(setSuppressed);
    return () => { listeners.delete(setSuppressed); };
  }, []);
  return suppressed;
}
