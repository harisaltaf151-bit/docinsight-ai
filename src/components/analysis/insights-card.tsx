"use client";

import * as React from "react";
import { Lightbulb, Loader2 } from "lucide-react";
import { SectionCard } from "./section-card";
import type { InsightItem } from "@/types/analysis";
import { cn } from "@/lib/utils";

interface InsightsCardProps {
  status: "pending" | "streaming" | "complete" | "error";
  /** Raw streamed text. Shown as a dim placeholder while parsing. */
  buffer: string;
  /** Parsed insights. */
  items: InsightItem[];
}

const IMPORTANCE_STYLES: Record<InsightItem["importance"], string> = {
  high: "border-emerald-300/70 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300",
  medium: "border-zinc-300 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300",
  low: "border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400",
};

/**
 * Renders the parsed insight list. While the model is still streaming JSON,
 * we show a dimmed ghost of the partial text so the section doesn't feel
 * empty.
 */
export function InsightsCard({ status, buffer, items }: InsightsCardProps) {
  return (
    <SectionCard
      index={2}
      title="Key insights"
      description="Non-obvious observations ranked by importance."
      status={status}
    >
      {items.length > 0 ? (
        <ul className="space-y-3">
          {items.map((item, i) => (
            <li
              key={`${item.title}-${i}`}
              className="flex gap-3 rounded-lg border border-zinc-100 bg-zinc-50/40 p-3 dark:border-zinc-900 dark:bg-zinc-900/40"
            >
              <span
                aria-hidden
                className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <Lightbulb className="h-3 w-3" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {item.title}
                  </h4>
                  <span
                    className={cn(
                      "rounded-full border px-1.5 py-0 text-[10px] font-medium uppercase tracking-wide",
                      IMPORTANCE_STYLES[item.importance],
                    )}
                  >
                    {item.importance}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                  {item.detail}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : status === "streaming" ? (
        <StreamingPlaceholder buffer={buffer} />
      ) : (
        <p className="text-sm text-zinc-400 dark:text-zinc-500">No insights extracted.</p>
      )}
    </SectionCard>
  );
}

function StreamingPlaceholder({ buffer }: { buffer: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-zinc-500">
      <Loader2 className="h-3.5 w-3.5 animate-spin" />
      <span className="font-mono text-xs">
        {buffer.length > 0
          ? `${buffer.length} chars received…`
          : "Waiting for model…"}
      </span>
    </div>
  );
}
