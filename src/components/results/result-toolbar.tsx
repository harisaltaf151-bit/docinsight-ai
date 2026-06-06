"use client";

import * as React from "react";
import { Copy, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PersistedResult } from "@/types/result";

interface ResultToolbarProps {
  result: PersistedResult;
  onDelete?: (id: string) => void;
  className?: string;
}

/**
 * Toolbar for a single result. Copies the summary or the full JSON, exports
 * the JSON to disk, and (optionally) deletes the result. Uses the
 * `Clipboard API` where available and falls back to a hidden textarea.
 */
export function ResultToolbar({ result, onDelete, className }: ResultToolbarProps) {
  const handleCopySummary = React.useCallback(async () => {
    const ok = await copyText(result.summary);
    if (ok) toast.success("Summary copied");
    else toast.error("Copy failed");
  }, [result.summary]);

  const handleCopyJson = React.useCallback(async () => {
    const json = JSON.stringify(result, null, 2);
    const ok = await copyText(json);
    if (ok) toast.success("JSON copied");
    else toast.error("Copy failed");
  }, [result]);

  const handleExport = React.useCallback(() => {
    const json = JSON.stringify(result, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = exportFilename(result);
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Downloaded");
  }, [result]);

  const handleDelete = React.useCallback(() => {
    if (!onDelete) return;
    onDelete(result.id);
  }, [onDelete, result.id]);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950",
        className,
      )}
    >
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Actions
      </span>
      <div className="ml-auto flex flex-wrap items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCopySummary}
          className="gap-1.5"
        >
          <Copy className="h-3.5 w-3.5" />
          Copy summary
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCopyJson}
          className="gap-1.5"
        >
          <Copy className="h-3.5 w-3.5" />
          Copy JSON
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="gap-1.5"
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </Button>
        {onDelete && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="gap-1.5 text-zinc-500 hover:text-red-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}

async function copyText(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to fallback
    }
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "absolute";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

function exportFilename(result: PersistedResult): string {
  const safe = result.title
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${safe || "result"}-${result.id.slice(0, 8)}.json`;
}
