"use client";

import * as React from "react";
import { ChevronDown, FileText } from "lucide-react";
import type { CitationPayload } from "@/lib/rag/orchestrator";
import { cn } from "@/lib/utils";

interface SourcesPanelProps {
  citations: CitationPayload | null;
  className?: string;
}

/**
 * Collapsible list of the chunks retrieved for the most recent assistant
 * turn. Score is shown as a percent for at-a-glance ranking.
 */
export function SourcesPanel({ citations, className }: SourcesPanelProps) {
  const [open, setOpen] = React.useState(true);
  const chunks = citations?.chunks ?? [];

  if (chunks.length === 0) return null;

  return (
    <section
      className={cn(
        "rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <FileText className="h-3.5 w-3.5 text-zinc-500" aria-hidden />
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Sources
          </span>
          <span className="rounded-full border border-zinc-200 bg-zinc-50 px-1.5 py-0 text-[10px] font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            {chunks.length}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-zinc-500 transition-transform",
            open ? "rotate-0" : "-rotate-90",
          )}
          aria-hidden
        />
      </button>
      {open && (
        <ol className="border-t border-zinc-100 dark:border-zinc-900">
          {chunks.map((c) => (
            <li
              key={c.id}
              className="border-b border-zinc-100 px-4 py-3 last:border-b-0 dark:border-zinc-900"
            >
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="inline-flex h-5 w-5 items-center justify-center rounded border border-zinc-200 bg-zinc-50 font-mono text-[10px] font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                >
                  {c.index}
                </span>
                <span className="text-[11px] uppercase tracking-wide text-zinc-500">
                  similarity
                </span>
                <span className="font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
                  {(c.score * 100).toFixed(1)}%
                </span>
                <span className="ml-auto font-mono text-[10px] text-zinc-400">
                  {c.id.slice(0, 8)}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                {c.excerpt}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
