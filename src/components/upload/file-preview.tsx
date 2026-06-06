"use client";

import * as React from "react";
import { FileText, X } from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface FilePreviewProps {
  file: File;
  onRemove: () => void;
  /**
   * Override the file-type label that appears next to the size.
   * Defaults to "PDF".
   */
  kindLabel?: string;
  disabled?: boolean;
}

export function FilePreview({ file, onRemove, kindLabel = "PDF", disabled }: FilePreviewProps) {
  return (
    <div
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border border-zinc-200 bg-white p-3 text-left transition-colors",
        "dark:border-zinc-800 dark:bg-zinc-950",
        disabled && "opacity-60",
      )}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50">
        <FileText className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">{file.name}</p>
        <p className="mt-0.5 text-xs text-zinc-500">
          <span className="num-tabular">{formatBytes(file.size)}</span>
          <span className="mx-1.5 text-zinc-300 dark:text-zinc-700">·</span>
          {kindLabel}
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        disabled={disabled}
        aria-label="Remove file"
        className="shrink-0"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
