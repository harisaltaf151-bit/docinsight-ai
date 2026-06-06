export const APP_NAME = "DocInsight AI";
export const APP_DESCRIPTION =
  "AI-powered document analysis. Upload PDFs or paste text to get summaries, insights, and action items.";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_TEXT_CHARS = 200_000; // ~ 50k tokens, model-dependent

export const ACCEPTED_PDF_MIME = ["application/pdf"] as const;
export const ACCEPTED_TEXT_MIME = ["text/plain", "text/markdown"] as const;
export const ACCEPTED_TEXT_EXTENSIONS = [".txt", ".md", ".markdown"] as const;

export const STORAGE_KEYS = {
  apiKeyPrefix: "docinsight:apikey:",
  provider: "docinsight:provider",
  model: "docinsight:model",
  sessionId: "docinsight:session",
} as const;

export const QUERY_KEYS = {
  providers: ["providers"] as const,
  history: ["history"] as const,
  analysis: (id: string) => ["analysis", id] as const,
} as const;
