import type { EmbeddingsProviderId } from "./embeddings";
import { randomUUID } from "node:crypto";

/**
 * Server-side, in-memory document store for RAG.
 *
 * Each entry holds the raw chunks plus the embeddings array produced at
 * ingest time. Entries auto-expire after `DEFAULT_TTL_MS` (1 hour by
 * default) — long enough for a productive chat session, short enough to
 * bound memory pressure on the server.
 *
 * The store is a module-level singleton. Next.js route handlers share the
 * same Node process in dev/prod, so a single instance is sufficient.
 *
 * SECURITY: document content is held in process memory only and never
 * written to disk. Pair this with the BFF's per-request API-key handling
 * to keep the RAG pipeline ephemeral by design.
 */

export interface StoredChunk {
  id: string;
  index: number;
  content: string;
  charCount: number;
  wordCount: number;
}

export interface StoredDocument {
  id: string;
  title: string;
  sourceKind: "pdf" | "text";
  sourceLabel: string;
  charCount: number;
  chunks: StoredChunk[];
  /** Aligned 1:1 with `chunks`. Each vector has the same length. */
  embeddings: number[][];
  embeddingProvider: EmbeddingsProviderId;
  embeddingModel: string;
  embeddingDimensions: number;
  createdAt: number;
  expiresAt: number;
}

const DEFAULT_TTL_MS = 60 * 60 * 1000;

class DocumentStore {
  private docs = new Map<string, StoredDocument>();
  private ttlMs: number;
  private lastSweep = 0;
  private readonly SWEEP_INTERVAL_MS = 5 * 60 * 1000;

  constructor(ttlMs: number = DEFAULT_TTL_MS) {
    this.ttlMs = ttlMs;
  }

  put(input: Omit<StoredDocument, "id" | "createdAt" | "expiresAt">): StoredDocument {
    const now = Date.now();
    const doc: StoredDocument = {
      ...input,
      id: randomUUID(),
      createdAt: now,
      expiresAt: now + this.ttlMs,
    };
    this.docs.set(doc.id, doc);
    this.maybeSweep(now);
    return doc;
  }

  get(id: string): StoredDocument | null {
    const doc = this.docs.get(id);
    if (!doc) return null;
    if (Date.now() > doc.expiresAt) {
      this.docs.delete(id);
      return null;
    }
    return doc;
  }

  delete(id: string): boolean {
    return this.docs.delete(id);
  }

  size(): number {
    return this.docs.size;
  }

  setTtl(ms: number): void {
    this.ttlMs = ms;
  }

  private maybeSweep(now: number) {
    if (now - this.lastSweep < this.SWEEP_INTERVAL_MS) return;
    this.lastSweep = now;
    for (const [id, doc] of this.docs) {
      if (now > doc.expiresAt) this.docs.delete(id);
    }
  }
}

// Use a global singleton to survive hot reloads in dev. The Map is the only
// state, so this is safe across HMR boundaries.
const globalForStore = globalThis as unknown as { __ragDocStore?: DocumentStore };
export const documentStore: DocumentStore =
  globalForStore.__ragDocStore ?? (globalForStore.__ragDocStore = new DocumentStore());
