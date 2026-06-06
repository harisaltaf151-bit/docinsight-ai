import { z } from "zod";

export const providerIdSchema = z.enum(["claude", "openai", "gemini", "groq"]);
export type ProviderId = z.infer<typeof providerIdSchema>;

export const embeddingsProviderIdSchema = z.enum(["openai", "gemini"]);
export type EmbeddingsProviderId = z.infer<typeof embeddingsProviderIdSchema>;

export const apiKeySchema = z
  .string()
  .min(10, "API key looks too short")
  .max(500, "API key looks too long");

export const sourceSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("text"),
    content: z.string().min(1, "Text is required").max(200_000),
  }),
  z.object({
    type: z.literal("pdf"),
    // base64-encoded PDF or a file reference; max ~10MB encoded
    content: z.string().min(1),
    filename: z.string().min(1),
    mimeType: z.literal("application/pdf"),
  }),
]);
export type SourceInput = z.infer<typeof sourceSchema>;

export const analyzeRequestSchema = z.object({
  provider: providerIdSchema,
  model: z.string().min(1),
  apiKey: apiKeySchema,
  source: sourceSchema,
  options: z
    .object({
      stream: z.boolean().default(false),
      sections: z
        .array(z.enum(["summary", "insights", "actions"]))
        .default(["summary", "insights", "actions"]),
    })
    .partial()
    .default({}),
});
export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;

export const chatRequestSchema = z.object({
  provider: providerIdSchema,
  model: z.string().min(1),
  apiKey: apiKeySchema,
  embeddings: z.object({
    provider: embeddingsProviderIdSchema,
    model: z.string().min(1),
    apiKey: apiKeySchema,
  }),
  documentId: z.string().min(1),
  message: z.string().min(1).max(8_000),
  topK: z.number().int().min(1).max(20).default(5),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(8_000),
      }),
    )
    .max(20)
    .default([]),
});
export type ChatRequest = z.infer<typeof chatRequestSchema>;

export const processDocumentRequestSchema = z.object({
  embeddings: z.object({
    provider: embeddingsProviderIdSchema,
    model: z.string().min(1),
    apiKey: apiKeySchema,
  }),
  source: sourceSchema,
  options: z
    .object({
      chunkSize: z.number().int().min(100).max(4_000).default(800),
      overlap: z.number().int().min(0).max(1_000).default(100),
    })
    .partial()
    .default({}),
});
export type ProcessDocumentRequest = z.infer<typeof processDocumentRequestSchema>;

export const insightItemSchema = z.object({
  title: z.string(),
  detail: z.string(),
  importance: z.enum(["low", "medium", "high"]).default("medium"),
});
export type InsightItem = z.infer<typeof insightItemSchema>;

export const actionItemSchema = z.object({
  task: z.string(),
  owner: z.string().optional(),
  due: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});
export type ActionItem = z.infer<typeof actionItemSchema>;

export const verifyProviderKeyRequestSchema = z.object({
  provider: providerIdSchema,
  apiKey: apiKeySchema,
});
export type VerifyProviderKeyRequest = z.infer<typeof verifyProviderKeyRequestSchema>;

export interface VerifyProviderKeyResponse {
  ok: boolean;
  error?: string;
  model?: string;
}

export const analysisResultSchema = z.object({
  summary: z.string(),
  insights: z.array(insightItemSchema),
  actions: z.array(actionItemSchema),
  meta: z.object({
    provider: providerIdSchema,
    model: z.string(),
    latencyMs: z.number().int().nonnegative(),
    tokenUsage: z
      .object({
        input: z.number().int().nonnegative(),
        output: z.number().int().nonnegative(),
      })
      .optional(),
  }),
});
export type AnalysisResult = z.infer<typeof analysisResultSchema>;
