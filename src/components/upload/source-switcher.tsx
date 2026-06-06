"use client";

import * as React from "react";
import { FileText, Type } from "lucide-react";
import { cn } from "@/lib/utils";

export type SourceMode = "pdf" | "text";

interface SourceSwitcherProps {
  value: SourceMode;
  onChange: (value: SourceMode) => void;
  disabled?: boolean;
}

const OPTIONS: Array<{ value: SourceMode; label: string; icon: typeof FileText }> = [
  { value: "pdf", label: "PDF", icon: FileText },
  { value: "text", label: "Text", icon: Type },
];

/**
 * Underline tabs inspired by Linear/Notion. Active = solid bottom border + ink,
 * inactive = transparent border + muted text.
 */
export function SourceSwitcher({ value, onChange, disabled }: SourceSwitcherProps) {
  return (
    <div
      role="tablist"
      aria-label="Document source"
      className="inline-flex items-center gap-0.5 border-b border-zinc-200 dark:border-zinc-800"
    >
      {OPTIONS.map((opt) => {
        const active = opt.value === value;
        const Icon = opt.icon;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative inline-flex items-center gap-1.5 px-3 pb-2 pt-1 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-zinc-50 dark:focus-visible:ring-offset-zinc-950",
              "disabled:cursor-not-allowed disabled:opacity-50",
              active
                ? "text-zinc-950 dark:text-zinc-50"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {opt.label}
            <span
              aria-hidden
              className={cn(
                "absolute inset-x-2 -bottom-px h-px transition-colors",
                active ? "bg-zinc-950 dark:bg-zinc-50" : "bg-transparent",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
