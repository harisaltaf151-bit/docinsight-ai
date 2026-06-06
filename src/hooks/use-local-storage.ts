"use client";

import * as React from "react";

type Setter<T> = (value: T | ((prev: T) => T)) => void;

/**
 * useState backed by localStorage. SSR-safe (returns initial value on server).
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, Setter<T>] {
  const [value, setValue] = React.useState<T>(initialValue);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw != null) setValue(JSON.parse(raw) as T);
    } catch {
      // ignore
    } finally {
      setHydrated(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const set: Setter<T> = React.useCallback(
    (next) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          // ignore quota / private mode
        }
        return resolved;
      });
    },
    [key],
  );

  return [hydrated ? value : initialValue, set];
}
