import { useEffect, useState } from 'react';

const listeners = new Set<(v: boolean) => void>();
let suppressCount = 0;

function notify() {
  const suppressed = suppressCount > 0;
  listeners.forEach((fn) => fn(suppressed));
}

/** Hide root ThemedStatusBar while a detail screen manages status bar icons. */
export function suppressRootStatusBar() {
  suppressCount++;
  notify();
}

export function restoreRootStatusBar() {
  suppressCount = Math.max(0, suppressCount - 1);
  notify();
}

export function useRootStatusBarSuppressed(): boolean {
  const [suppressed, setSuppressed] = useState(suppressCount > 0);

  useEffect(() => {
    listeners.add(setSuppressed);
    return () => {
      listeners.delete(setSuppressed);
    };
  }, []);

  return suppressed;
}
