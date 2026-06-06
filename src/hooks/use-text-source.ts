"use client";

import * as React from "react";
import { MAX_TEXT_CHARS } from "@/lib/constants";
import { readFileAsText } from "@/lib/file";

interface UseTextSourceOptions {
  value: string;
  onChange: (text: string, error: string | null) => void;
  maxLength?: number;
}

interface UseTextSourceReturn {
  setText: (text: string) => void;
  loadFile: (file: File) => Promise<void>;
  isReading: boolean;
  clear: () => void;
  charCount: number;
  maxLength: number;
  isOverLimit: boolean;
  error: string | null;
}

/**
 * Controlled text-source state. The parent owns the value; the hook only
 * provides setters and derives the over-limit error.
 */
export function useTextSource({
  value,
  onChange,
  maxLength = MAX_TEXT_CHARS,
}: UseTextSourceOptions): UseTextSourceReturn {
  const [isReading, setIsReading] = React.useState(false);
  const computeError = React.useCallback(
    (text: string): string | null => {
      if (text.length > maxLength) {
        return `Text is ${text.length.toLocaleString()} characters, max is ${maxLength.toLocaleString()}`;
      }
      return null;
    },
    [maxLength],
  );

  const setText = React.useCallback(
    (text: string) => {
      onChange(text, computeError(text));
    },
    [computeError, onChange],
  );

  const loadFile = React.useCallback(
    async (file: File) => {
      setIsReading(true);
      try {
        const text = await readFileAsText(file);
        onChange(text, computeError(text));
      } catch (err) {
        onChange("", `Failed to read file: ${(err as Error).message}`);
      } finally {
        setIsReading(false);
      }
    },
    [computeError, onChange],
  );

  const clear = React.useCallback(() => {
    onChange("", null);
  }, [onChange]);

  return {
    setText,
    loadFile,
    isReading,
    clear,
    charCount: value.length,
    maxLength,
    isOverLimit: value.length > maxLength,
    error: computeError(value),
  };
}
