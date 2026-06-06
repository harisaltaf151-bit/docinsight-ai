export type DocumentSourceType = "pdf" | "text";

export interface BaseDocument {
  id: string;
  title: string;
  sourceType: DocumentSourceType;
  createdAt: string;
  charCount: number;
}

export interface TextDocument extends BaseDocument {
  sourceType: "text";
  content: string;
}

export interface PdfDocument extends BaseDocument {
  sourceType: "pdf";
  filename: string;
  mimeType: "application/pdf";
  pageCount?: number;
  /** Server-side pointer or content hash. Never the raw bytes on the client. */
  storageRef?: string;
}

export type DocumentRecord = TextDocument | PdfDocument;

export interface DocumentChunk {
  id: string;
  documentId: string;
  index: number;
  content: string;
  tokenCount: number;
}
