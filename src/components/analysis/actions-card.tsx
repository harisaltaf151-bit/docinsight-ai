"use client";

import * as React from "react";
import { CheckSquare, Loader2 } from "lucide-react";
import { SectionCard } from "./section-card";
import type { ActionItem } from "@/types/analysis";
import { cn } from "@/lib/utils";

interface ActionsCardProps {
  status: "pending" | "streaming" | "complete" | "error";
  /** Raw streamed text. Shown as a dim placeholder while parsing. */
  buffer: string;
  items: ActionItem[];
}

const PRIORITY_STYLES: Record<ActionItem["priority"], string> = {
  high: "border-red-300/70 text-red-700 dark:border-red-900 dark:text-red-300",
  medium: "border-amber-300/70 text-amber-700 dark:border-amber-900 dark:text-amber-300",
  low: "border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400",
};

/**
 * Renders the parsed action list. While the model is still streaming JSON,
 * we show a dimmed ghost of the partial text so the section doesn't feel
 * empty.
 */
export function ActionsCard({ status, buffer, items }: ActionsCardProps) {
  return (
    <SectionCard
      index={3}
      title="Action items"
      description="Concrete next steps pulled from the document."
      status={status}
    >
      {items.length > 0 ? (
        <ul className="space-y-2.5">
          {items.map((item, i) => (
            <li
              key={`${item.task}-${i}`}
              className="flex gap-3 rounded-lg border border-zinc-100 p-3 dark:border-zinc-900"
            >
              <span
                aria-hidden
                className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border border-zinc-300 text-zinc-400 dark:border-zinc-700 dark:text-zinc-500"
              >
                <CheckSquare className="h-3 w-3" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {item.task}
                  </p>
                  <span
                    className={cn(
                      "rounded-full border px-1.5 py-0 text-[10px] font-medium uppercase tracking-wide",
                      PRIORITY_STYLES[item.priority],
                    )}
                  >
                    {item.priority}
                  </span>
                </div>
                {(item.owner || item.due) && (
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {item.owner && <>Owner: {item.owner}</>}
                    {item.owner && item.due && <> · </>}
                    {item.due && <>Due: {item.due}</>}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : status === "streaming" ? (
        <StreamingPlaceholder buffer={buffer} />
      ) : (
        <p className="text-sm text-zinc-400 dark:text-zinc-500">No actions extracted.</p>
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
