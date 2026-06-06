"use client";

import * as React from "react";
import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PROVIDER_META, type ProviderId } from "@/types/provider";
import { ProviderMark } from "@/components/onboarding/provider-mark";

interface ProviderCardProps {
  id: ProviderId;
  selected: boolean;
  onSelect: (id: ProviderId) => void;
}

export function ProviderCard({ id, selected, onSelect }: ProviderCardProps) {
  const meta = PROVIDER_META[id];
  const modelCount = meta.models.length;
  const defaultModel = meta.models.find((m) => m.id === meta.defaultModel) ?? meta.models[0];

  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      aria-pressed={selected}
      className={cn(
        "group relative flex w-full items-start gap-4 rounded-xl border bg-white p-5 text-left transition-all duration-200 ease-out",
        "hover:-translate-y-px hover:border-zinc-300 hover:shadow-[0_1px_0_0_rgba(0,0,0,0.02)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-zinc-50 dark:focus-visible:ring-offset-zinc-950",
        selected
          ? "border-zinc-950 shadow-[0_0_0_1px_rgba(0,0,0,1)] dark:border-zinc-50 dark:shadow-[0_0_0_1px_rgba(255,255,255,1)]"
          : "border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950",
      )}
    >
      <ProviderMark id={id} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            {meta.name}
          </span>
          {selected && (
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-zinc-950 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-950">
              <Check className="h-2.5 w-2.5" strokeWidth={3} />
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{meta.tagline}</p>
        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
          <span className="num-tabular">{modelCount}</span> model{modelCount === 1 ? "" : "s"}
          {defaultModel && (
            <>
              <span className="mx-1.5 text-zinc-300 dark:text-zinc-700">·</span>
              <span className="font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
                {defaultModel.id}
              </span>
            </>
          )}
        </p>
      </div>

      <ChevronRight
        className={cn(
          "h-4 w-4 shrink-0 text-zinc-400 transition-all duration-200",
          "translate-x-0 opacity-0 group-hover:translate-x-0.5 group-hover:opacity-100",
          selected && "translate-x-0 opacity-100 text-zinc-950 dark:text-zinc-50",
        )}
      />
    </button>
  );
}
