"use client";

import * as React from "react";
import { AlertCircle, UploadCloud } from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";
import { useFileUpload } from "@/hooks/use-file-upload";
import { ACCEPTED_PDF_MIME, MAX_UPLOAD_BYTES } from "@/lib/constants";
import { FilePreview } from "@/components/upload/file-preview";

interface PdfDropzoneProps {
  value: File | null;
  error: string | null;
  onChange: (file: File | null, error: string | null) => void;
  disabled?: boolean;
}

/**
 * Drag-and-drop + click-to-browse area for a single PDF.
 *
 * Hairline dashed border at rest, solid + tinted on drag-over, and a 1px
 * ring when the file input is focused via keyboard.
 */
export function PdfDropzone({ value, error, onChange, disabled }: PdfDropzoneProps) {
  const { isDragging, inputRef, dropzoneProps, inputProps, open, clear } = useFileUpload({
    value,
    onChange,
    accept: ACCEPTED_PDF_MIME,
    maxSize: MAX_UPLOAD_BYTES,
  });

  function onKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      open();
    }
  }

  return (
    <div className="space-y-2">
      <div
        {...dropzoneProps}
        onClick={() => !disabled && open()}
        onKeyDown={onKeyDown}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Drop a PDF here, or click to browse"
        aria-disabled={disabled}
        className={cn(
          "group relative flex min-h-[180px] flex-col items-center justify-center rounded-xl border-2 border-dashed bg-zinc-50/40 px-6 py-8 text-center transition-all duration-200",
          "hover:border-zinc-300 hover:bg-zinc-50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-zinc-50 dark:focus-visible:ring-offset-zinc-950",
          isDragging && "border-zinc-950 bg-zinc-100/80 dark:border-zinc-50 dark:bg-zinc-900/60",
          error && !value && "border-amber-400 bg-amber-50/40 dark:border-amber-500/50 dark:bg-amber-950/20",
          value && "border-solid border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950",
          disabled && "pointer-events-none cursor-not-allowed opacity-60",
        )}
      >
        <input
          ref={inputRef}
          {...inputProps}
          className="sr-only"
          aria-hidden
          tabIndex={-1}
        />

        {value ? (
          <div className="w-full">
            <FilePreview file={value} onRemove={clear} disabled={disabled} />
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-900 transition-transform duration-200",
                "dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50",
                isDragging && "scale-110",
              )}
            >
              <UploadCloud className="h-5 w-5" />
            </div>
            <p className="mt-4 text-sm font-medium text-zinc-950 dark:text-zinc-50">
              {isDragging ? "Drop to upload" : "Drop a PDF here"}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              or click to browse
              <span className="mx-1.5 text-zinc-300 dark:text-zinc-700">·</span>
              <span className="num-tabular">PDF up to {formatBytes(MAX_UPLOAD_BYTES)}</span>
            </p>
          </div>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
