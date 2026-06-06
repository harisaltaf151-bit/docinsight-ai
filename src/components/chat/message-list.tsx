"use client";

import * as React from "react";
import type { ChatMessage } from "@/types/chat";
import { MessageBubble } from "./message-bubble";
import { EmptyState } from "@/components/shared/empty-state";
import { Sparkles } from "lucide-react";

interface MessageListProps {
  messages: ChatMessage[];
  streamingMessageId: string | null;
  className?: string;
}

/**
 * Scrollable list of chat messages with auto-scroll. Sticks to the bottom
 * while a stream is in progress and on new messages, but only if the user
 * is already near the bottom (so reading old messages is not disrupted).
 */
export function MessageList({ messages, streamingMessageId, className }: MessageListProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const stickToBottomRef = React.useRef(true);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = distanceFromBottom < 80;
  }

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el || !stickToBottomRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, streamingMessageId]);

  if (messages.length === 0) {
    return (
      <div className={className}>
        <EmptyState
          icon={<Sparkles className="h-5 w-5" />}
          title="Ask anything about the document"
          description="Retrieval finds the most relevant passages and the chat provider answers using them. Try a specific question to see which chunks were used."
        />
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className={`min-h-0 flex-1 overflow-y-auto px-1 py-4 ${className ?? ""}`}
    >
      <ol className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        {messages.map((m) => (
          <li key={m.id}>
            <MessageBubble
              message={m}
              isStreaming={m.id === streamingMessageId}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}
