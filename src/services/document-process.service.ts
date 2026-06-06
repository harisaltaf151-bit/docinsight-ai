import { apiRequest } from "./http";
import type { ProcessDocumentRequest } from "@/lib/validators";

/**
 * Response shape returned by `POST /api/documents/process`. The embeddings
 * are NOT included — the client only needs the `documentId` to start a chat.
 */
export interface ProcessedDocument {
  documentId: string;
  title: string;
  sourceLabel: string;
  sourceKind: "pdf" | "text";
  charCount: number;
  chunkCount: number;
  embeddingProvider: "openai" | "gemini";
  embeddingModel: string;
  embeddingDimensions: number;
  createdAt: string;
  expiresAt: string;
}

/**
 * Document ingest service. The BFF chunks + embeds the document and returns
 * a handle (`documentId`) that the chat service uses to retrieve context.
 */
export const documentProcessService = {
  process(payload: ProcessDocumentRequest): Promise<ProcessedDocument> {
    return apiRequest<ProcessedDocument>("/documents/process", {
      method: "POST",
      body: payload,
    });
  },
};
