"use client";

import * as React from "react";
import { SectionCard } from "./section-card";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
  status: "pending" | "streaming" | "complete" | "error";
  /** Live-streamed text. Rendered verbatim with a caret while streaming. */
  text: string;
}

/**
 * The plain-prose summary. Streams token-by-token; no parsing needed.
 */
export function SummaryCard({ status, text }: SummaryCardProps) {
  return (
    <SectionCard
      index={1}
      title="Summary"
      description="A faithful 120–220 word overview of the document."
      status={status}
    >
      {text ? (
        <p
          className={cn(
            "text-sm leading-relaxed text-zinc-700 dark:text-zinc-200",
          )}
        >
          {text}
          {status === "streaming" && (
            <span
              aria-hidden
              className="ml-0.5 inline-block h-3.5 w-[2px] -mb-0.5 animate-pulse bg-zinc-900 align-baseline dark:bg-zinc-100"
            />
          )}
        </p>
      ) : (
        <p className="text-sm text-zinc-400 dark:text-zinc-500">Waiting for model…</p>
      )}
    </SectionCard>
  );
}
