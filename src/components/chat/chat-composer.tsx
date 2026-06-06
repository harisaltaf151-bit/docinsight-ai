"use client";

import * as React from "react";
import { ArrowUp, Square } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatComposerProps {
  onSend: (text: string) => void;
  onStop?: () => void;
  streaming?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * Multiline composer with submit on Enter (Shift+Enter for newline) and an
 * integrated stop button while a stream is in flight.
 */
export function ChatComposer({
  onSend,
  onStop,
  streaming = false,
  disabled = false,
  placeholder = "Ask a question…",
  className,
}: ChatComposerProps) {
  const [value, setValue] = React.useState("");
  const taRef = React.useRef<HTMLTextAreaElement>(null);

  // Auto-resize the textarea up to a sensible cap.
  React.useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }, [value]);

  function handleSend() {
    const text = value.trim();
    if (!text || streaming || disabled) return;
    onSend(text);
    setValue("");
    requestAnimationFrame(() => {
      const ta = taRef.current;
      if (ta) ta.style.height = "auto";
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div
      className={cn(
        "flex items-end gap-2 rounded-xl border border-zinc-200 bg-white p-2 shadow-sm transition-colors focus-within:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950",
        disabled && "opacity-60",
        className,
      )}
    >
      <Textarea
        ref={taRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        disabled={disabled}
        className="min-h-9 flex-1 resize-none border-0 bg-transparent px-2 py-1.5 text-sm shadow-none focus-visible:ring-0"
      />
      {streaming ? (
        <Button
          type="button"
          onClick={onStop}
          size="icon"
          variant="outline"
          aria-label="Stop generating"
        >
          <Square className="h-3.5 w-3.5 fill-current" />
        </Button>
      ) : (
        <Button
          type="button"
          onClick={handleSend}
          size="icon"
          disabled={disabled || value.trim().length === 0}
          aria-label="Send"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
