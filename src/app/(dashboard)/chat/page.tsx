"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ProviderRequiredDialog } from "@/components/shared/provider-required-dialog";
import { DocumentPicker } from "@/components/chat/document-picker";
import { MessageList } from "@/components/chat/message-list";
import { ChatComposer } from "@/components/chat/chat-composer";
import { SourcesPanel } from "@/components/chat/sources-panel";
import { useApiKey } from "@/hooks/use-api-key";
import { useRagDocument } from "@/hooks/use-rag-document";
import { useRagChat } from "@/hooks/use-rag-chat";
import { getApiKey } from "@/lib/session";
import type { ProviderId } from "@/types/provider";

export default function ChatPage() {
  const { provider, model, apiKey, hasKey, setProvider, setModel, saveKey } = useApiKey();
  const ragDoc = useRagDocument();
  const chat = useRagChat({ documentId: ragDoc.document?.documentId ?? null });
  const [keyDialogOpen, setKeyDialogOpen] = React.useState(false);
  // Preserves the user's typed message across the key-verification flow.
  // The composer clears locally the moment `onSend` fires, so the parent
  // has to remember the text to re-send it after the dialog succeeds.
  const pendingMessageRef = React.useRef<string | null>(null);

  const documentId = ragDoc.document?.documentId ?? null;
  const ready = ragDoc.status === "ready" && documentId !== null;
  const streamingMessageId = chat.isStreaming
    ? chat.messages[chat.messages.length - 1]?.id ?? null
    : null;

  const sendWith = React.useCallback(
    (p: ProviderId, m: string, k: string, text: string) => {
      const embProvider = ragDoc.document?.embeddingProvider ?? "openai";
      const embApiKey = getApiKey(embProvider) ?? k;
      chat.send({
        provider: p,
        model: m,
        apiKey: k,
        embeddings: {
          provider: embProvider,
          model: ragDoc.document?.embeddingModel ?? "text-embedding-3-small",
          apiKey: embApiKey,
        },
        message: text,
        topK: 5,
      });
    },
    [chat, ragDoc.document?.embeddingProvider, ragDoc.document?.embeddingModel],
  );

  const handleSend = (text: string) => {
    if (!apiKey) {
      pendingMessageRef.current = text;
      setKeyDialogOpen(true);
      return;
    }
    sendWith(provider, model, apiKey, text);
  };

  const handleProviderConnected = (info: {
    provider: ProviderId;
    model: string;
    apiKey: string;
  }) => {
    setProvider(info.provider);
    setModel(info.model);
    saveKey(info.apiKey);
    const pending = pendingMessageRef.current;
    pendingMessageRef.current = null;
    if (pending) {
      sendWith(info.provider, info.model, info.apiKey, pending);
    }
  };

  return (
    <>
      <Navbar
        title="Chat"
        description="RAG-powered Q&A over your document."
        actions={<Badge variant="secondary">Step 4 · RAG</Badge>}
      />
      <PageContainer>
        <PageHeader
          title="Chat with document"
          description="Chunk, embed, retrieve, and stream answers grounded in the document you upload."
        />

        <div className="grid gap-4 xl:grid-cols-3">
          {/* Left column: document + sources */}
          <div className="space-y-3 xl:col-span-1">
            <DocumentPicker
              status={ragDoc.status}
              document={ragDoc.document}
              errorMessage={ragDoc.errorMessage}
              chatProvider={provider}
              hasChatKey={hasKey}
              onProcess={async ({ source, embeddings }) => {
                await ragDoc.process({ source, embeddings });
              }}
              onReset={ragDoc.reset}
            />
            {ready && <SourcesPanel citations={chat.lastCitations} />}
          </div>

          {/* Right column: chat thread + composer */}
          <Card className="flex min-h-[calc(100vh-220px)] flex-col xl:col-span-2">
            <header className="flex items-center justify-between border-b border-zinc-200 px-5 py-3 dark:border-zinc-800">
              <div>
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Conversation
                </h2>
                <p className="text-xs text-zinc-500">
                  {ready
                    ? "Streaming answers grounded in retrieved chunks."
                    : "Process a document to start chatting."}
                </p>
              </div>
              {ready && (
                <Badge variant="outline" className="gap-1.5">
                  <Sparkles className="h-3 w-3" />
                  RAG
                </Badge>
              )}
            </header>

            <MessageList
              messages={chat.messages}
              streamingMessageId={chat.isStreaming ? streamingMessageId : null}
            />

            <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
              <ChatComposer
                onSend={handleSend}
                onStop={chat.stop}
                streaming={chat.isStreaming}
                disabled={!ready || !hasKey}
                placeholder={
                  !hasKey
                    ? "Connect a provider to chat…"
                    : !ready
                      ? "Process a document first…"
                      : "Ask anything about the document…"
                }
              />
              {chat.status === "error" && chat.errorMessage && (
                <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                  {chat.errorMessage}
                </p>
              )}
              {chat.status === "aborted" && (
                <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                  Generation stopped.
                </p>
              )}
            </div>
          </Card>
        </div>
      </PageContainer>

      <ProviderRequiredDialog
        open={keyDialogOpen}
        onOpenChange={setKeyDialogOpen}
        onConnected={handleProviderConnected}
        purpose="chat"
      />
    </>
  );
}
