"use client";

import * as React from "react";
import { Clock, Cpu, FileText, Sparkles, Type } from "lucide-react";
import { PROVIDER_META, type ProviderId } from "@/types/provider";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ResultMetaProps {
  title: string;
  sourceLabel: string;
  sourceKind: "pdf" | "text";
  createdAt: string;
  provider: ProviderId;
  model: string;
  latencyMs: number;
  className?: string;
}

/**
 * Header band for a single result. Renders the title, source pill, and a
 * row of meta facts (provider, model, latency, created). Kept compact so it
 * fits above the three section cards without pushing them below the fold.
 */
export function ResultMeta({
  title,
  sourceLabel,
  sourceKind,
  createdAt,
  provider,
  model,
  latencyMs,
  className,
}: ResultMetaProps) {
  const providerName = PROVIDER_META[provider].name;
  const modelLabel = modelLabelFor(provider, model);
  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950",
        className,
      )}
    >
      <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <SourceIcon kind={sourceKind} />
            <span className="truncate font-medium">{sourceLabel}</span>
            <span aria-hidden>·</span>
            <time dateTime={createdAt} className="shrink-0">
              {formatRelativeTime(createdAt)}
            </time>
          </div>
          <h1 className="mt-2 truncate text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {title}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
          <Badge variant="secondary">{providerName}</Badge>
          <Badge variant="outline" className="font-mono text-[11px]">
            {modelLabel}
          </Badge>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-zinc-100 px-5 py-4 text-sm dark:border-zinc-900 sm:grid-cols-4">
        <MetaCell icon={<Sparkles className="h-3.5 w-3.5" />} label="Provider" value={providerName} />
        <MetaCell icon={<Cpu className="h-3.5 w-3.5" />} label="Model" value={modelLabel} mono />
        <MetaCell icon={<Clock className="h-3.5 w-3.5" />} label="Latency" value={formatLatency(latencyMs)} />
        <MetaCell icon={<FileText className="h-3.5 w-3.5" />} label="Created" value={formatAbsoluteTime(createdAt)} />
      </dl>
    </div>
  );
}

function MetaCell({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {icon}
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 truncate text-sm text-zinc-900 dark:text-zinc-100",
          mono && "font-mono text-[12px]",
        )}
        title={value}
      >
        {value}
      </dd>
    </div>
  );
}

function SourceIcon({ kind }: { kind: "pdf" | "text" }) {
  if (kind === "pdf") {
    return <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden />;
  }
  return <Type className="h-3.5 w-3.5 shrink-0" aria-hidden />;
}

function modelLabelFor(provider: ProviderId, model: string): string {
  const entry = PROVIDER_META[provider].models.find((m) => m.id === model);
  return entry?.label ?? model;
}

function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

function formatAbsoluteTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
