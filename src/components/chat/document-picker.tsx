"use client";

import * as React from "react";
import { CheckCircle2, FileText, Loader2, Sparkles, Type } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SourceSwitcher, type SourceMode } from "@/components/upload/source-switcher";
import { PdfDropzone } from "@/components/upload/pdf-dropzone";
import { TextSourceInput } from "@/components/upload/text-source-input";
import { EMBEDDINGS_META, type EmbeddingsProviderId } from "@/lib/rag/embeddings";
import { PROVIDER_META, type ProviderId } from "@/types/provider";
import { getApiKey, setApiKey } from "@/lib/session";
import type { ProcessedDocument } from "@/services";
import { cn } from "@/lib/utils";

interface DocumentPickerProps {
  status: "idle" | "uploading" | "processing" | "ready" | "error";
  document: ProcessedDocument | null;
  errorMessage: string | null;
  /** The chat provider/model (used to know the active chat provider). */
  chatProvider: ProviderId;
  onProcess: (input: {
    source: { kind: "pdf" | "text"; file?: File | null; text?: string };
    embeddings: { provider: EmbeddingsProviderId; model: string; apiKey: string };
  }) => void;
  onReset: () => void;
  /** Whether the chat side has a key for the chosen chat provider. */
  hasChatKey: boolean;
}

/**
 * Top of the chat page: lets the user pick a source, choose an embeddings
 * provider/key, and run the ingest pipeline. Shows the loaded document
 * summary once `status === "ready"`.
 */
export function DocumentPicker({
  status,
  document,
  errorMessage,
  chatProvider,
  onProcess,
  onReset,
  hasChatKey,
}: DocumentPickerProps) {
  const [mode, setMode] = React.useState<SourceMode>("pdf");
  const [pdfFile, setPdfFile] = React.useState<File | null>(null);
  const [pdfError, setPdfError] = React.useState<string | null>(null);
  const [text, setText] = React.useState("");
  const [textError, setTextError] = React.useState<string | null>(null);

  const [embProvider, setEmbProvider] = React.useState<EmbeddingsProviderId>("openai");
  const [embModel, setEmbModel] = React.useState<string>(EMBEDDINGS_META.openai.defaultModel);
  const [embApiKey, setEmbApiKey] = React.useState<string>("");

  // On mount, seed the embeddings key from sessionStorage if present.
  React.useEffect(() => {
    const stored = getApiKey("openai");
    if (stored) setEmbApiKey(stored);
  }, []);

  const isProcessing = status === "uploading" || status === "processing";

  const embMeta = EMBEDDINGS_META[embProvider];
  const models = embMeta.models;

  // When the embeddings provider changes, reset model + try to load key.
  React.useEffect(() => {
    setEmbModel(embMeta.defaultModel);
    const stored = getApiKey(embProvider);
    if (stored) setEmbApiKey(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embProvider]);

  const isReady =
    hasChatKey &&
    embApiKey.length > 0 &&
    ((mode === "pdf" && pdfFile !== null && !pdfError) ||
      (mode === "text" && text.trim().length > 0 && !textError));

  function handleModeChange(next: SourceMode) {
    if (next === mode) return;
    setMode(next);
    setPdfFile(null);
    setPdfError(null);
    setText("");
    setTextError(null);
  }

  function handleProcess() {
    if (!isReady) return;
    // Persist the embeddings key in the same slot as the chat key so the
    // chat route can re-embed the user's query without re-prompting.
    setApiKey(embProvider, embApiKey);
    onProcess({
      source: mode === "pdf" ? { kind: "pdf", file: pdfFile } : { kind: "text", text },
      embeddings: { provider: embProvider, model: embModel, apiKey: embApiKey },
    });
  }

  const chatName = PROVIDER_META[chatProvider].name;

  if (status === "ready" && document) {
    return <LoadedDocumentCard document={document} onReset={onReset} />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Document</CardTitle>
            <CardDescription>
              Upload a PDF or paste text. We chunk, embed, and store it for retrieval.
            </CardDescription>
          </div>
          <SourceSwitcher value={mode} onChange={handleModeChange} disabled={isProcessing} />
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {!hasChatKey && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900/50 dark:bg-amber-950/30">
            <p className="font-medium text-amber-900 dark:text-amber-200">
              Connect {chatName} first
            </p>
            <p className="mt-0.5 text-amber-800 dark:text-amber-300/80">
              You need a chat provider API key before processing a document for chat.
            </p>
          </div>
        )}

        {mode === "pdf" ? (
          <PdfDropzone
            value={pdfFile}
            error={pdfError}
            onChange={(f, e) => {
              setPdfFile(f);
              setPdfError(e);
            }}
            disabled={isProcessing}
          />
        ) : (
          <TextSourceInput
            value={text}
            error={textError}
            onChange={(t, e) => {
              setText(t);
              setTextError(e);
            }}
            disabled={isProcessing}
          />
        )}

        {/* Embeddings config */}
        <div className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50/40 p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-zinc-500" aria-hidden />
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Embeddings
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <ProviderSelect
              value={embProvider}
              onChange={setEmbProvider}
              disabled={isProcessing}
            />
            <ModelSelect
              value={embModel}
              options={models}
              onChange={setEmbModel}
              disabled={isProcessing}
            />
            <Input
              type="password"
              placeholder={`${embMeta.name} API key`}
              value={embApiKey}
              onChange={(e) => setEmbApiKey(e.target.value)}
              disabled={isProcessing}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        </div>

        {status === "error" && errorMessage && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
            {errorMessage}
          </div>
        )}

        <div className="flex flex-col-reverse items-stretch gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-zinc-500">
            {isProcessing
              ? status === "uploading"
                ? "Preparing document…"
                : "Chunking and embedding on the server…"
              : "Ready to process."}
          </p>
          <Button onClick={handleProcess} disabled={!isReady || isProcessing} size="lg">
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {status === "uploading" ? "Uploading" : "Processing"}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Process document
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadedDocumentCard({
  document,
  onReset,
}: {
  document: ProcessedDocument;
  onReset: () => void;
}) {
  const SourceIcon = document.sourceKind === "pdf" ? FileText : Type;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="truncate text-base">{document.title}</CardTitle>
              <Badge variant="secondary" className="shrink-0">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Ready
              </Badge>
            </div>
            <CardDescription className="mt-1">
              {document.sourceLabel} ·{" "}
              {document.chunkCount} chunk{document.chunkCount === 1 ? "" : "s"} ·{" "}
              {document.charCount.toLocaleString()} chars
            </CardDescription>
          </div>
          <SourceIcon className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
        </div>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Cell label="Embeddings" value={document.embeddingProvider} mono />
          <Cell label="Model" value={document.embeddingModel} mono />
          <Cell label="Dimensions" value={String(document.embeddingDimensions)} />
          <Cell label="Expires" value={formatRelative(document.expiresAt)} />
        </dl>
        <div className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-3 dark:border-zinc-800">
          <p className="text-xs text-zinc-500">
            Ask questions below. Retrieval runs against this document.
          </p>
          <Button onClick={onReset} variant="ghost" size="sm">
            Use a different document
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Cell({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-0.5 truncate text-sm text-zinc-900 dark:text-zinc-100",
          mono && "font-mono text-[12px]",
        )}
        title={value}
      >
        {value}
      </dd>
    </div>
  );
}

function ProviderSelect({
  value,
  onChange,
  disabled,
}: {
  value: EmbeddingsProviderId;
  onChange: (v: EmbeddingsProviderId) => void;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as EmbeddingsProviderId)}
      disabled={disabled}
      className={cn(
        "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm transition-colors",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
      )}
    >
      {(["openai", "gemini"] as const).map((id) => (
        <option key={id} value={id}>
          {EMBEDDINGS_META[id].name}
        </option>
      ))}
    </select>
  );
}

function ModelSelect({
  value,
  options,
  onChange,
  disabled,
}: {
  value: string;
  options: { id: string; label: string }[];
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(
        "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm transition-colors",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
      )}
    >
      {options.map((m) => (
        <option key={m.id} value={m.id}>
          {m.label}
        </option>
      ))}
    </select>
  );
}

function formatRelative(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const diff = d.getTime() - Date.now();
  if (diff < 0) return "expired";
  const min = Math.round(diff / 60_000);
  if (min < 60) return `in ${min}m`;
  const hr = Math.round(min / 60);
  return `in ${hr}h`;
}
