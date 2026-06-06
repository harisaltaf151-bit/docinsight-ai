"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ExternalLink, FileSearch, KeyRound, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/layout/navbar";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { ProviderRequiredDialog } from "@/components/shared/provider-required-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SourceSwitcher, type SourceMode } from "@/components/upload/source-switcher";
import { PdfDropzone } from "@/components/upload/pdf-dropzone";
import { TextSourceInput } from "@/components/upload/text-source-input";
import { SummaryCard } from "@/components/analysis/summary-card";
import { InsightsCard } from "@/components/analysis/insights-card";
import { ActionsCard } from "@/components/analysis/actions-card";
import { useApiKey } from "@/hooks/use-api-key";
import { useAnalysisStream } from "@/hooks/use-analysis-stream";
import { useResults } from "@/hooks/use-results";
import { readFileAsBase64 } from "@/lib/file";
import { getErrorMessage } from "@/lib/utils";
import { ROUTES } from "@/lib/navigation";
import { PROVIDER_META, type ProviderId } from "@/types/provider";
import { deriveTitle } from "@/lib/results-store";
import type { PersistedResult } from "@/types/result";

export default function AnalyzePage() {
  const {
    provider,
    model,
    apiKey,
    hasKey,
    setProvider,
    setModel,
    saveKey,
  } = useApiKey();
  const { state, start, reset } = useAnalysisStream();
  const { save: saveResult } = useResults();

  const [mode, setMode] = React.useState<SourceMode>("pdf");
  const [pdfFile, setPdfFile] = React.useState<File | null>(null);
  const [pdfError, setPdfError] = React.useState<string | null>(null);
  const [text, setText] = React.useState("");
  const [textError, setTextError] = React.useState<string | null>(null);
  const [savedResultId, setSavedResultId] = React.useState<string | null>(null);
  const [keyDialogOpen, setKeyDialogOpen] = React.useState(false);

  const isRunning = state.status === "running";
  const isComplete = state.status === "complete";

  const isReady =
    hasKey &&
    ((mode === "pdf" && pdfFile !== null && !pdfError) ||
      (mode === "text" && text.trim().length > 0 && !textError));

  // Persist on completion ─────────────────────────────────────────────────
  // We snapshot the source descriptor alongside the request so the
  // persister can derive a title without re-reading the file.
  const pendingSourceRef = React.useRef<
    { kind: "pdf" | "text"; filename?: string; text?: string } | null
  >(null);
  // Reference-counting guard: persist at most once per AnalysisResult object.
  const persistedForRef = React.useRef<unknown>(null);

  React.useEffect(() => {
    if (state.status !== "complete" || !state.result) return;
    if (persistedForRef.current === state.result) return;

    const src = pendingSourceRef.current;
    if (!src) return;

    const derived = deriveTitle(src);
    const persisted: PersistedResult = {
      ...state.result,
      id: crypto.randomUUID(),
      title: derived.title,
      sourceLabel: derived.sourceLabel,
      sourceKind: src.kind,
      createdAt: new Date().toISOString(),
    };
    saveResult(persisted);
    persistedForRef.current = state.result;
    setSavedResultId(persisted.id);
  }, [state.status, state.result, saveResult]);

  function handleModeChange(next: SourceMode) {
    if (next === mode) return;
    setMode(next);
    setPdfFile(null);
    setPdfError(null);
    setText("");
    setTextError(null);
    reset();
    pendingSourceRef.current = null;
    setSavedResultId(null);
    persistedForRef.current = null;
  }

  function handlePdfChange(file: File | null, err: string | null) {
    setPdfFile(file);
    setPdfError(err);
    if (state.status !== "idle") reset();
    if (file) {
      pendingSourceRef.current = { kind: "pdf", filename: file.name };
    } else {
      pendingSourceRef.current = null;
    }
  }

  function handleTextChange(next: string, err: string | null) {
    setText(next);
    setTextError(err);
    if (state.status !== "idle") reset();
    if (next) {
      pendingSourceRef.current = { kind: "text", text: next };
    } else {
      pendingSourceRef.current = null;
    }
  }

  async function handleSubmit() {
    // Gate on a real key. If none is saved, open the verify dialog so the
    // user can pick a provider + enter + verify a key in one motion.
    if (!hasKey || !apiKey) {
      if (
        (mode === "pdf" && pdfFile !== null && !pdfError) ||
        (mode === "text" && text.trim().length > 0 && !textError)
      ) {
        setKeyDialogOpen(true);
      }
      return;
    }

    try {
      if (mode === "pdf" && pdfFile) {
        const base64 = await readFileAsBase64(pdfFile);
        pendingSourceRef.current = { kind: "pdf", filename: pdfFile.name };
        persistedForRef.current = null;
        setSavedResultId(null);
        start({
          provider,
          model,
          apiKey,
          source: {
            type: "pdf",
            content: base64,
            filename: pdfFile.name,
            mimeType: "application/pdf",
          },
          options: { stream: true },
        });
      } else if (mode === "text") {
        pendingSourceRef.current = { kind: "text", text };
        persistedForRef.current = null;
        setSavedResultId(null);
        start({
          provider,
          model,
          apiKey,
          source: { type: "text", content: text },
          options: { stream: true },
        });
      }
    } catch (err) {
      const message = getErrorMessage(err, "Could not prepare document");
      toast.error("Submission failed", { description: message });
    }
  }

  /**
   * Fired by the verify dialog when a key is successfully saved. The
   * dialog returns the credentials it just verified, so we can submit
   * immediately without waiting for the hook's async state to settle.
   */
  function handleProviderConnected(info: {
    provider: ProviderId;
    model: string;
    apiKey: string;
  }) {
    setProvider(info.provider);
    setModel(info.model);
    saveKey(info.apiKey);
    // Use the just-verified credentials directly to kick off the request.
    void runAnalysis(info.provider, info.model, info.apiKey);
  }

  async function runAnalysis(p: ProviderId, m: string, k: string) {
    try {
      if (mode === "pdf" && pdfFile) {
        const base64 = await readFileAsBase64(pdfFile);
        pendingSourceRef.current = { kind: "pdf", filename: pdfFile.name };
        persistedForRef.current = null;
        setSavedResultId(null);
        start({
          provider: p,
          model: m,
          apiKey: k,
          source: {
            type: "pdf",
            content: base64,
            filename: pdfFile.name,
            mimeType: "application/pdf",
          },
          options: { stream: true },
        });
      } else if (mode === "text" && text.trim().length > 0) {
        pendingSourceRef.current = { kind: "text", text };
        persistedForRef.current = null;
        setSavedResultId(null);
        start({
          provider: p,
          model: m,
          apiKey: k,
          source: { type: "text", content: text },
          options: { stream: true },
        });
      }
    } catch (err) {
      const message = getErrorMessage(err, "Could not prepare document");
      toast.error("Submission failed", { description: message });
    }
  }

  function handleReset() {
    reset();
    setPdfFile(null);
    setPdfError(null);
    setText("");
    setTextError(null);
    pendingSourceRef.current = null;
    persistedForRef.current = null;
    setSavedResultId(null);
  }

  const providerName = PROVIDER_META[provider].name;

  return (
    <>
      <Navbar title="Analyze" description="Drop a PDF or paste text to extract insights." />
      <PageContainer>
        <PageHeader
          title="New analysis"
          description="Upload a PDF or paste text. Your provider analyzes the content and streams back a summary, insights, and action items."
          actions={
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Step 2 · Upload</Badge>
              <Button asChild variant="ghost" size="sm" className="gap-1.5">
                <Link href={ROUTES.results}>
                  View past results
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          }
        />

        <div className="grid gap-4 lg:grid-cols-5">
          {/* Source */}
          <Card className="lg:col-span-3">
            <CardHeader className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-base">Source</CardTitle>
                  <CardDescription>Pick a PDF or paste text.</CardDescription>
                </div>
                <SourceSwitcher
                  value={mode}
                  onChange={handleModeChange}
                  disabled={isRunning}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!hasKey && (
                <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900/50 dark:bg-amber-950/30">
                  <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-900 dark:text-amber-200">
                      Connect a provider to analyze
                    </p>
                    <p className="mt-0.5 text-amber-800 dark:text-amber-300/80">
                      You need an API key before sending documents.{" "}
                      <button
                        type="button"
                        onClick={() => setKeyDialogOpen(true)}
                        className="font-medium underline underline-offset-2 hover:text-amber-950 dark:hover:text-amber-100"
                      >
                        Connect now
                      </button>{" "}
                      or{" "}
                      <Link
                        href={ROUTES.onboarding}
                        className="font-medium underline underline-offset-2 hover:text-amber-950 dark:hover:text-amber-100"
                      >
                        use the full setup
                      </Link>
                      .
                    </p>
                  </div>
                </div>
              )}

              {mode === "pdf" ? (
                <PdfDropzone
                  key="pdf-source"
                  value={pdfFile}
                  error={pdfError}
                  onChange={handlePdfChange}
                  disabled={isRunning}
                />
              ) : (
                <TextSourceInput
                  key="text-source"
                  value={text}
                  error={textError}
                  onChange={handleTextChange}
                  disabled={isRunning}
                />
              )}

              <div className="flex flex-col-reverse items-stretch gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-zinc-500">
                  {isRunning
                    ? `Streaming from ${providerName}…`
                    : hasKey
                      ? `Ready to send to ${providerName}.`
                      : "Waiting for provider connection."}
                </p>
                <div className="flex gap-2 sm:flex-row-reverse">
                  {(isComplete || state.status === "error") && (
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={handleReset}
                      className="group sm:w-auto"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span>New analysis</span>
                    </Button>
                  )}
                  <Button
                    onClick={handleSubmit}
                    disabled={!isReady || isRunning}
                    size="lg"
                    className="group sm:w-auto"
                  >
                    {isRunning ? (
                      <>
                        <span className="inline-flex h-3 w-3">
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-r-transparent" />
                        </span>
                        <span>Analyzing</span>
                      </>
                    ) : (
                      <>
                        <span>Analyze</span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-3 lg:col-span-2">
            {state.status === "idle" ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Results</CardTitle>
                  <CardDescription>Summary, insights, and action items will appear here.</CardDescription>
                </CardHeader>
                <CardContent>
                  <EmptyState
                    icon={<FileSearch className="h-5 w-5" />}
                    title="No analysis yet"
                    description="Submit a PDF or some text to see the summary, key insights, and action items here."
                  />
                </CardContent>
              </Card>
            ) : state.status === "error" ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <ErrorState
                    title="Analysis failed"
                    message={state.errorMessage ?? "An unexpected error occurred."}
                    onRetry={handleReset}
                  />
                </CardContent>
              </Card>
            ) : (
              <>
                <ResultsHeader
                  providerName={providerName}
                  running={isRunning}
                  hasResult={isComplete}
                  latencyMs={
                    isComplete && state.startedAt && state.completedAt
                      ? state.completedAt - state.startedAt
                      : null
                  }
                />
                <div className="space-y-3">
                  <SummaryCard
                    status={state.summary.status}
                    text={state.summary.buffer}
                  />
                  <InsightsCard
                    status={state.insights.status}
                    buffer={state.insights.buffer}
                    items={state.insights.items}
                  />
                  <ActionsCard
                    status={state.actions.status}
                    buffer={state.actions.buffer}
                    items={state.actions.items}
                  />
                </div>
                {isComplete && savedResultId && (
                  <div className="rounded-lg border border-dashed border-emerald-200 bg-emerald-50/50 p-3 text-xs text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-200">
                    Saved to session.{" "}
                    <Link
                      href={ROUTES.results}
                      className="font-medium underline underline-offset-2 hover:text-emerald-950 dark:hover:text-emerald-50"
                    >
                      View all results →
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </PageContainer>

      <ProviderRequiredDialog
        open={keyDialogOpen}
        onOpenChange={setKeyDialogOpen}
        onConnected={handleProviderConnected}
        purpose="analyze"
      />
    </>
  );
}

function ResultsHeader({
  providerName,
  running,
  hasResult,
  latencyMs,
}: {
  providerName: string;
  running: boolean;
  hasResult: boolean;
  latencyMs: number | null;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
      <div>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Results
        </h2>
        <p className="text-xs text-zinc-500">
          {running
            ? `Streaming from ${providerName}…`
            : hasResult
              ? `Completed in ${latencyMs !== null ? `${(latencyMs / 1000).toFixed(1)}s` : "—"}`
              : "Preparing…"}
        </p>
      </div>
      <Badge variant="secondary">{providerName}</Badge>
    </div>
  );
}
