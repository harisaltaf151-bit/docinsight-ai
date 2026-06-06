"use client";

import * as React from "react";
import { FileText, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTextSource } from "@/hooks/use-text-source";
import { useFileUpload } from "@/hooks/use-file-upload";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MAX_TEXT_CHARS, ACCEPTED_TEXT_MIME, MAX_UPLOAD_BYTES } from "@/lib/constants";

interface TextSourceInputProps {
  value: string;
  error: string | null;
  onChange: (text: string, error: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function TextSourceInput({
  value,
  error,
  onChange,
  disabled,
  placeholder = "Paste your text here, or start typing…",
}: TextSourceInputProps) {
  const { setText, loadFile, isReading, clear, charCount, maxLength, isOverLimit } = useTextSource({
    value,
    onChange,
    maxLength: MAX_TEXT_CHARS,
  });

  const { inputRef, inputProps, open } = useFileUpload({
    value: null,
    onChange: (file, fileError) => {
      if (fileError) {
        onChange(value, fileError);
        return;
      }
      if (file) void loadFile(file);
    },
    accept: ACCEPTED_TEXT_MIME,
    maxSize: MAX_UPLOAD_BYTES,
  });

  return (
    <div className="space-y-2">
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled || isReading}
          placeholder={placeholder}
          spellCheck={false}
          className={cn(
            "min-h-[180px] resize-y font-mono text-sm leading-relaxed",
            "pr-10",
            isOverLimit &&
              "border-amber-400 focus-visible:ring-amber-400 dark:border-amber-500/60",
          )}
        />
        {isReading && (
          <span
            className="pointer-events-none absolute right-3 top-3 inline-flex h-6 w-6 items-center justify-center rounded text-zinc-400"
            aria-label="Reading file"
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          </span>
        )}
        {!isReading && value && !disabled && (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear text"
            className="absolute right-3 top-3 rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <input ref={inputRef} {...inputProps} className="sr-only" aria-hidden tabIndex={-1} />

      <div className="flex items-center justify-between gap-3 text-xs">
        <span
          className={cn(
            "truncate",
            isOverLimit ? "text-amber-700 dark:text-amber-400" : "text-zinc-500",
          )}
        >
          {error ?? "Plain text or markdown. .txt, .md supported."}
        </span>
        <div className="flex shrink-0 items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={open}
            disabled={disabled || isReading}
            className="h-7 gap-1 px-2 text-xs"
          >
            <FileText className="h-3.5 w-3.5" />
            Load file
          </Button>
          <span
            className={cn(
              "num-tabular",
              isOverLimit ? "text-amber-700 dark:text-amber-400" : "text-zinc-500",
            )}
          >
            {charCount.toLocaleString()} / {maxLength.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
