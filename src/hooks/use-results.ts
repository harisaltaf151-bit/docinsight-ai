"use client";

import * as React from "react";
import {
  listResults,
  getResult,
  saveResult,
  deleteResult,
  toPreview,
} from "@/lib/results-store";
import type { PersistedResult, ResultPreview } from "@/types/result";

interface UseResultsValue {
  /** All stored results, sorted newest-first. */
  results: PersistedResult[];
  /** Lightweight previews for list rendering. */
  previews: ResultPreview[];
  /** Whether the store has been hydrated from sessionStorage. */
  ready: boolean;
  /** Look up a single result by id (re-reads on hydration). */
  getById: (id: string) => PersistedResult | null;
  /** Persist a result and trigger a re-render. */
  save: (result: PersistedResult) => void;
  /** Delete a result by id and trigger a re-render. */
  remove: (id: string) => void;
  /** Force a re-read from the store (used after cross-tab writes). */
  refresh: () => void;
}

/**
 * Subscribes a component to the results store. Hydrates from sessionStorage
 * on mount and exposes a stable API for mutating the collection.
 */
export function useResults(): UseResultsValue {
  const [results, setResults] = React.useState<PersistedResult[]>([]);
  const [ready, setReady] = React.useState(false);

  const refresh = React.useCallback(() => {
    setResults(listResults());
  }, []);

  React.useEffect(() => {
    refresh();
    setReady(true);

    // Cross-tab sync (storage event) is intentionally not wired — sessionStorage
    // is per-tab, so a different tab opening the app starts fresh anyway.
  }, [refresh]);

  const getById = React.useCallback((id: string) => {
    return getResult(id);
  }, []);

  const save = React.useCallback(
    (result: PersistedResult) => {
      saveResult(result);
      refresh();
    },
    [refresh],
  );

  const remove = React.useCallback(
    (id: string) => {
      deleteResult(id);
      refresh();
    },
    [refresh],
  );

  const previews = React.useMemo(() => results.map(toPreview), [results]);

  return { results, previews, ready, getById, save, remove, refresh };
}
