"use client";

import * as React from "react";
import type { AnalyzeRequest } from "@/lib/validators";
import type {
  AnalysisResult,
  AnalysisStreamEvent,
  ActionItem,
  InsightItem,
} from "@/types/analysis";
import { analysisService } from "@/services";

export type StreamStatus =
  | "idle"
  | "running"
  | "complete"
  | "error"
  | "aborted";

export interface SectionState<T> {
  status: "pending" | "streaming" | "complete" | "error";
  /** Incremental text as it streams in. */
  buffer: string;
  /** Parsed result, populated when the section finishes successfully. */
  items: T[];
}

export interface StreamState {
  status: StreamStatus;
  errorMessage: string | null;
  summary: SectionState<never>;
  insights: SectionState<InsightItem>;
  actions: SectionState<ActionItem>;
  result: AnalysisResult | null;
  startedAt: number | null;
  completedAt: number | null;
}

const EMPTY_SECTION_PENDING: SectionState<never> = {
  status: "pending",
  buffer: "",
  items: [],
};

const EMPTY_INSIGHTS_PENDING: SectionState<InsightItem> = {
  status: "pending",
  buffer: "",
  items: [],
};

const EMPTY_ACTIONS_PENDING: SectionState<ActionItem> = {
  status: "pending",
  buffer: "",
  items: [],
};

const INITIAL_STATE: StreamState = {
  status: "idle",
  errorMessage: null,
  summary: EMPTY_SECTION_PENDING,
  insights: EMPTY_INSIGHTS_PENDING,
  actions: EMPTY_ACTIONS_PENDING,
  result: null,
  startedAt: null,
  completedAt: null,
};

interface UseAnalysisStreamResult {
  state: StreamState;
  start: (payload: AnalyzeRequest) => void;
  cancel: () => void;
  reset: () => void;
}

/**
 * Run an analysis job via streaming SSE and expose a normalised state object
 * for the UI to render. The hook owns the AbortController so a single
 * component can mount, run, and clean up without leaking fetch handles.
 */
export function useAnalysisStream(): UseAnalysisStreamResult {
  const [state, setState] = React.useState<StreamState>(INITIAL_STATE);
  const controllerRef = React.useRef<AbortController | null>(null);

  const cancel = React.useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setState((prev) =>
      prev.status === "running"
        ? { ...prev, status: "aborted" }
        : prev,
    );
  }, []);

  const reset = React.useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setState(INITIAL_STATE);
  }, []);

  const start = React.useCallback((payload: AnalyzeRequest) => {
    // Cancel any prior run.
    controllerRef.current?.abort();

    setState({ ...INITIAL_STATE, status: "running", startedAt: Date.now() });

    const controller = analysisService.stream(payload, (event) => {
      applyEvent(setState, event);
    });
    controllerRef.current = controller;
  }, []);

  // Cleanup on unmount.
  React.useEffect(() => {
    return () => {
      controllerRef.current?.abort();
      controllerRef.current = null;
    };
  }, []);

  return { state, start, cancel, reset };
}

function applyEvent(
  setState: React.Dispatch<React.SetStateAction<StreamState>>,
  event: AnalysisStreamEvent,
): void {
  switch (event.type) {
    case "token": {
      if (!event.section || typeof event.data !== "string") return;
      appendToken(setState, event.section, event.data);
      return;
    }
    case "section": {
      if (!event.section) return;
      applySectionBoundary(setState, event.section, event.status, event.data);
      return;
    }
    case "done": {
      setState((prev) => ({
        ...prev,
        // Don't overwrite an error status with complete
        status: prev.status === "error" ? "error" : "complete",
        completedAt: Date.now(),
        result: (event.data as AnalysisResult | undefined) ?? prev.result,
      }));
      return;
    }
    case "error": {
      setState((prev) => ({
        ...prev,
        status: "error",
        errorMessage: event.message ?? "Analysis failed",
      }));
      return;
    }
  }
}

function appendToken(
  setState: React.Dispatch<React.SetStateAction<StreamState>>,
  section: "summary" | "insights" | "actions",
  delta: string,
): void {
  setState((prev) => {
    if (section === "summary") {
      return {
        ...prev,
        summary: { ...prev.summary, status: "streaming", buffer: prev.summary.buffer + delta },
      };
    }
    if (section === "insights") {
      return {
        ...prev,
        insights: { ...prev.insights, status: "streaming", buffer: prev.insights.buffer + delta },
      };
    }
    return {
      ...prev,
      actions: { ...prev.actions, status: "streaming", buffer: prev.actions.buffer + delta },
    };
  });
}

function applySectionBoundary(
  setState: React.Dispatch<React.SetStateAction<StreamState>>,
  section: "summary" | "insights" | "actions",
  status: "started" | "complete" | undefined,
  data: unknown,
): void {
  setState((prev) => {
    if (status === "started") {
      if (section === "summary") {
        return { ...prev, summary: { status: "streaming", buffer: "", items: [] } };
      }
      if (section === "insights") {
        return { ...prev, insights: { status: "streaming", buffer: "", items: [] } };
      }
      return { ...prev, actions: { status: "streaming", buffer: "", items: [] } };
    }
    if (status === "complete") {
      if (section === "summary") {
        return { ...prev, summary: { ...prev.summary, status: "complete" } };
      }
      const items = Array.isArray(data) ? (data as never[]) : [];
      if (section === "insights") {
        return { ...prev, insights: { ...prev.insights, status: "complete", items: items as InsightItem[] } };
      }
      return { ...prev, actions: { ...prev.actions, status: "complete", items: items as ActionItem[] } };
    }
    return prev;
  });
}
