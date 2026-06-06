"use client";

import * as React from "react";
import { validateFile } from "@/lib/file";
import { MAX_UPLOAD_BYTES } from "@/lib/constants";

interface UseFileUploadOptions {
  value: File | null;
  onChange: (file: File | null, error: string | null) => void;
  accept?: readonly string[];
  maxSize?: number;
}

interface UseFileUploadReturn {
  isDragging: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  dropzoneProps: {
    onDragEnter: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
  };
  inputProps: {
    type: "file";
    accept: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  };
  open: () => void;
  clear: () => void;
}

/**
 * Controlled drag-and-drop + file-picker state for a single File.
 *
 * The hook does NOT own the file state — it forwards every pick/drop through
 * `onChange(file, error)`. The parent stores the value and the error message,
 * which keeps the upload flow easy to reset (e.g. when the source mode flips).
 */
export function useFileUpload({
  value,
  onChange,
  accept = ["application/pdf"],
  maxSize = MAX_UPLOAD_BYTES,
}: UseFileUploadOptions): UseFileUploadReturn {
  const [isDragging, setIsDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const dragCounter = React.useRef(0);

  const handleFile = React.useCallback(
    (file: File | null) => {
      if (!file) {
        onChange(null, null);
        return;
      }
      const error = validateFile(file, accept, maxSize);
      onChange(error ? null : file, error);
    },
    [accept, maxSize, onChange],
  );

  // Keep the native input in sync with the controlled value so the same file
  // can be re-selected after being cleared.
  React.useEffect(() => {
    if (value === null && inputRef.current) {
      inputRef.current.value = "";
    }
  }, [value]);

  const open = React.useCallback(() => {
    inputRef.current?.click();
  }, []);

  const clear = React.useCallback(() => {
    handleFile(null);
  }, [handleFile]);

  const onDragEnter = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (dragCounter.current === 1) setIsDragging(true);
  }, []);

  const onDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = Math.max(0, dragCounter.current - 1);
    if (dragCounter.current === 0) setIsDragging(false);
  }, []);

  const onDragOver = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
  }, []);

  const onDrop = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0] ?? null;
      handleFile(file);
    },
    [handleFile],
  );

  const onInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null;
      handleFile(file);
    },
    [handleFile],
  );

  return {
    isDragging,
    inputRef,
    dropzoneProps: { onDragEnter, onDragLeave, onDragOver, onDrop },
    inputProps: {
      type: "file",
      accept: accept.join(","),
      onChange: onInputChange,
    },
    open,
    clear,
  };
}
