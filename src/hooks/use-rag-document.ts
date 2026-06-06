"use client";

import * as React from "react";
import { documentProcessService, type ProcessedDocument } from "@/services";
import type { EmbeddingsProviderId, ProviderId } from "@/types/provider";
import { EMBEDDINGS_META, resolveEmbeddingsModel } from "@/lib/rag/embeddings";
import { readFileAsBase64 } from "@/lib/file";
import { getErrorMessage } from "@/lib/utils";

export type ProcessStatus = "idle" | "uploading" | "processing" | "ready" | "error";

export interface ProcessSource {
  kind: "pdf" | "text";
  /** For PDF: the File. For text: ignored. */
  file?: File | null;
  /** For text: the content. For PDF: ignored. */
  text?: string;
}

export interface EmbeddingsConfig {
  provider: EmbeddingsProviderId;
  model: string;
  apiKey: string;
}

export interface UseRagDocumentResult {
  status: ProcessStatus;
  document: ProcessedDocument | null;
  errorMessage: string | null;
  process: (input: {
    source: ProcessSource;
    embeddings: EmbeddingsConfig;
  }) => Promise<ProcessedDocument | null>;
  reset: () => void;
}

/**
 * Owns the lifecycle of a single RAG document:
 *  - `idle`        nothing loaded
 *  - `uploading`   client-side prep (PDF → base64)
 *  - `processing`  BFF is chunking + embedding
 *  - `ready`       BFF returned a `documentId` we can chat with
 *  - `error`       request failed; `errorMessage` populated
 */
export function useRagDocument(): UseRagDocumentResult {
  const [status, setStatus] = React.useState<ProcessStatus>("idle");
  const [document, setDocument] = React.useState<ProcessedDocument | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const process = React.useCallback(
    async ({
      source,
      embeddings,
    }: {
      source: ProcessSource;
      embeddings: EmbeddingsConfig;
    }): Promise<ProcessedDocument | null> => {
      setErrorMessage(null);
      setDocument(null);

      if (!embeddings.apiKey) {
        setStatus("error");
        setErrorMessage("Missing embeddings API key");
        return null;
      }
      // Resolve model: use the user choice if it exists in the catalog,
      // otherwise fall back to the provider default.
      const meta = EMBEDDINGS_META[embeddings.provider];
      const model = meta.models.find((m) => m.id === embeddings.model)
        ? embeddings.model
        : meta.defaultModel;
      resolveEmbeddingsModel(embeddings.provider, model);

      try {
        setStatus("uploading");
        let body: { type: "pdf"; content: string; filename: string; mimeType: "application/pdf" } | { type: "text"; content: string };
        if (source.kind === "pdf") {
          if (!source.file) throw new Error("No PDF selected");
          const base64 = await readFileAsBase64(source.file);
          body = {
            type: "pdf",
            content: base64,
            filename: source.file.name,
            mimeType: "application/pdf",
          };
        } else {
          if (!source.text || !source.text.trim()) throw new Error("No text to process");
          body = { type: "text", content: source.text };
        }

        setStatus("processing");
        const result = await documentProcessService.process({
          embeddings: {
            provider: embeddings.provider,
            model,
            apiKey: embeddings.apiKey,
          },
          source: body,
        });
        setDocument(result);
        setStatus("ready");
        return result;
      } catch (err) {
        setStatus("error");
        setErrorMessage(getErrorMessage(err, "Failed to process document"));
        return null;
      }
    },
    [],
  );

  const reset = React.useCallback(() => {
    setStatus("idle");
    setDocument(null);
    setErrorMessage(null);
  }, []);

  return { status, document, errorMessage, process, reset };
}

// Re-export so consumers don't need a second import line.
export type { ProviderId };
