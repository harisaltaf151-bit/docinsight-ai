import { apiRequest } from "./http";
import type { DocumentRecord } from "@/types/document";

/**
 * Document service. The current scaffold only has the type surface — the
 * upload + extraction pipeline is implemented in the next milestone.
 */
export const documentService = {
  /** Upload a PDF (multipart) and return the persisted document record. */
  uploadPdf(file: File): Promise<DocumentRecord> {
    const form = new FormData();
    form.append("file", file);
    return apiRequest<DocumentRecord>("/documents", { method: "POST", body: form });
  },

  /** Persist pasted text as a document. */
  createText(title: string, content: string): Promise<DocumentRecord> {
    return apiRequest<DocumentRecord>("/documents", {
      method: "POST",
      body: { title, content, sourceType: "text" },
    });
  },

  get(id: string): Promise<DocumentRecord> {
    return apiRequest<DocumentRecord>(`/documents/${id}`);
  },
};
