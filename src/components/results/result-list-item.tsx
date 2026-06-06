"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, CheckSquare, FileText, Lightbulb, Type } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PROVIDER_META, type ProviderId } from "@/types/provider";
import { cn } from "@/lib/utils";
import type { ResultPreview } from "@/types/result";

interface ResultListItemProps {
  preview: ResultPreview;
  className?: string;
}

/**
 * One row in the results list. Click anywhere on the row to open the
 * detail page. The row surfaces: title, source pill, meta (provider,
 * model, time), and counts of insights/actions.
 */
export function ResultListItem({ preview, className }: ResultListItemProps) {
  return (
    <Link
      href={`/results/${preview.id}`}
      className={cn(
        "group block rounded-xl border border-zinc-200 bg-white transition-colors hover:border-zinc-300 hover:bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/60",
        className,
      )}
    >
      <div className="flex items-start gap-4 px-5 py-4">
        <SourceIcon kind={preview.sourceKind} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-zinc-900 group-hover:text-zinc-950 dark:text-zinc-100 dark:group-hover:text-white">
              {preview.title}
            </h3>
            <Badge variant="secondary" className="shrink-0">
              {PROVIDER_META[preview.provider].name}
            </Badge>
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-300">
            {preview.summaryPreview || "No summary available."}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-mono">{preview.model}</span>
            <span aria-hidden>·</span>
            <span>{formatLatency(preview.latencyMs)}</span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1">
              <Lightbulb className="h-3 w-3" />
              {preview.insightCount} insight{preview.insightCount === 1 ? "" : "s"}
            </span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1">
              <CheckSquare className="h-3 w-3" />
              {preview.actionCount} action{preview.actionCount === 1 ? "" : "s"}
            </span>
            <span aria-hidden>·</span>
            <time dateTime={preview.createdAt}>{formatRelativeTime(preview.createdAt)}</time>
          </div>
        </div>
        <ArrowUpRight
          className="mt-1 h-4 w-4 shrink-0 text-zinc-300 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-zinc-500 dark:text-zinc-600 dark:group-hover:text-zinc-400"
          aria-hidden
        />
      </div>
    </Link>
  );
}

function SourceIcon({ kind }: { kind: "pdf" | "text" }) {
  const Icon = kind === "pdf" ? FileText : Type;
  return (
    <span
      aria-hidden
      className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
    >
      <Icon className="h-4 w-4" />
    </span>
  );
}

function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  const sec = Math.round(diff / 1000);
  if (sec < 5) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
