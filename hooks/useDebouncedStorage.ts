"use client";

import { useEffect } from "react";

export function useDebouncedStorage(
  enabled: boolean,
  save: () => void,
  deps: unknown[],
  delay = 900
) {
  useEffect(() => {
    if (!enabled) return;

    const timer = window.setTimeout(save, delay);
    return () => window.clearTimeout(timer);
    // The caller owns dependency identity for the debounced save.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, delay, ...deps]);
}
