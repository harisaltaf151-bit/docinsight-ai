"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  index: number;
  title: string;
  description?: string;
  status: "pending" | "streaming" | "complete" | "error";
  children?: React.ReactNode;
}

/**
 * Frame for each of the three result sections. The frame fades in when the
 * server emits a `section (started)` event, shows a streaming indicator while
 * tokens arrive, and switches to "complete" once the section finishes.
 */
export function SectionCard({
  index,
  title,
  description,
  status,
  children,
}: SectionCardProps) {
  const isVisible = status !== "pending";
  return (
    <section
      data-state={status}
      className={cn(
        "rounded-xl border border-zinc-200 bg-white transition-opacity duration-300 dark:border-zinc-800 dark:bg-zinc-950",
        isVisible ? "opacity-100" : "opacity-0",
      )}
    >
      <header className="flex items-start justify-between gap-4 border-b border-zinc-100 px-5 py-4 dark:border-zinc-900">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 font-mono text-[10px] font-semibold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
          >
            {String(index).padStart(2, "0")}
          </span>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {title}
            </h3>
            {description && (
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                {description}
              </p>
            )}
          </div>
        </div>
        <StatusPill status={status} />
      </header>
      <div className="px-5 py-4">{isVisible ? children : null}</div>
    </section>
  );
}

function StatusPill({
  status,
}: {
  status: "pending" | "streaming" | "complete" | "error";
}) {
  if (status === "pending") return null;
  if (status === "streaming") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
        <Loader2 className="h-3 w-3 animate-spin" />
        Streaming
      </span>
    );
  }
  if (status === "complete") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
        Ready
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
      Failed
    </span>
  );
}
