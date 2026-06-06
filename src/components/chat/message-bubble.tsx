"use client";

import * as React from "react";
import { Bot, Loader2, User } from "lucide-react";
import type { ChatMessage } from "@/types/chat";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
  className?: string;
}

/**
 * Render a single chat message. Assistant messages are rendered in a
 * bubble with a streaming caret while tokens are arriving. User messages
 * are right-aligned with an inverted colour scheme for visual scanning.
 */
export function MessageBubble({ message, isStreaming, className }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex w-full gap-3",
        isUser ? "flex-row-reverse" : "flex-row",
        className,
      )}
    >
      <div
        aria-hidden
        className={cn(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border",
          isUser
            ? "border-zinc-200 bg-white text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400"
            : "border-zinc-200 bg-zinc-900 text-zinc-50 dark:border-zinc-800 dark:bg-zinc-100 dark:text-zinc-900",
        )}
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
      </div>
      <div
        className={cn(
          "min-w-0 max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "rounded-tr-sm bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900"
            : "rounded-tl-sm border border-zinc-200 bg-white text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200",
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <AssistantContent content={message.content} streaming={Boolean(isStreaming)} />
        )}
      </div>
    </div>
  );
}

function AssistantContent({ content, streaming }: { content: string; streaming: boolean }) {
  if (!content) {
    return (
      <span className="inline-flex items-center gap-1.5 text-zinc-400">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span className="text-xs">Thinking…</span>
      </span>
    );
  }
  return (
    <p className="whitespace-pre-wrap break-words">
      {content}
      {streaming && (
        <span
          aria-hidden
          className="ml-0.5 inline-block h-3.5 w-[2px] -mb-0.5 animate-pulse bg-zinc-900 align-baseline dark:bg-zinc-100"
        />
      )}
    </p>
  );
}
