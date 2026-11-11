"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

// Small persisted UI state (panel sizes, collapsed sections, mute). Values
// live in localStorage; `memory` mirrors them so the UI still updates when
// storage is unavailable (private windows, blocked site data).
const memory = new Map<string, string>();
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function read(key: string): string | null {
  const cached = memory.get(key);
  if (cached !== undefined) return cached;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Like useState, but remembered in the browser. `fallback` must be a stable
 * value (a primitive or a module-level constant). The server and the first
 * client render always see `fallback`, so there is no hydration mismatch.
 */
export function useStoredState<T>(
  key: string,
  fallback: T,
): [T, (value: T) => void] {
  const raw = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null,
  );

  const value = useMemo(() => {
    if (raw === null) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }, [raw, fallback]);

  const set = useCallback(
    (next: T) => {
      const json = JSON.stringify(next);
      memory.set(key, json);
      try {
        window.localStorage.setItem(key, json);
      } catch {
        // Storage unavailable - the in-memory copy still drives the UI.
      }
      listeners.forEach((listener) => listener());
    },
    [key],
  );

  return [value, set];
}
