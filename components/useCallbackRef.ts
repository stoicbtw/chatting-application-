"use client";

import { useCallback, useRef } from "react";

// returns a stable function identity that always calls the latest callback,
// so realtime/effect closures never go stale.
export function useCallbackRef<T extends (...args: any[]) => any>(fn: T): T {
  const ref = useRef(fn);
  ref.current = fn;
  return useCallback(((...args: any[]) => ref.current(...args)) as T, []);
}
