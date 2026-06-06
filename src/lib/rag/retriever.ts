import type { StoredChunk, StoredDocument } from "./store";

/**
 * Cosine-similarity top-k retrieval.
 *
 * Vectors are L2-normalised at index time so the score collapses to a
 * single dot product. Normalisation makes retrieval O(N·D) instead of
 * O(N·(D + D)) and is robust to documents that mix dense paragraphs with
 * sparse ones.
 */

export interface RetrievedChunk {
  chunk: StoredChunk;
  score: number;
}

export interface RetrieveOptions {
  /** Number of chunks to return. Default 5. */
  topK?: number;
  /** Minimum similarity score; chunks below are dropped. Default 0. */
  minScore?: number;
}

export function retrieve(
  document: StoredDocument,
  queryVector: number[],
  options: RetrieveOptions = {},
): RetrievedChunk[] {
  const { topK = 5, minScore = 0 } = options;
  if (document.chunks.length === 0) return [];

  // Defensive: if the query vector has a different length than the indexed
  // vectors we cannot compare them. The orchestrator catches this earlier
  // and returns a 422; this is a last-resort guard.
  const expectedDim = document.embeddingDimensions;
  if (expectedDim > 0 && queryVector.length !== expectedDim) {
    throw new Error(
      `Query vector dimension (${queryVector.length}) does not match document dimension (${expectedDim})`,
    );
  }

  const normalizedQuery = normalize(queryVector);
  const scored: RetrievedChunk[] = [];

  for (let i = 0; i < document.chunks.length; i++) {
    const chunk = document.chunks[i]!;
    const stored = document.embeddings[i]!;
    const score = dot(normalizedQuery, stored);
    if (score >= minScore) {
      scored.push({ chunk, score });
    }
  }

  // Partial sort: top-k by descending score. For typical chunk counts
  // (<1000) the simple sort below is faster than a heap.
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

function normalize(v: number[]): number[] {
  let sum = 0;
  for (const x of v) sum += x * x;
  const norm = Math.sqrt(sum);
  if (norm === 0) return v;
  const out = new Array<number>(v.length);
  for (let i = 0; i < v.length; i++) out[i] = v[i]! / norm;
  return out;
}

function dot(a: number[], b: number[]): number {
  // a is pre-normalised; b was pre-normalised at index time.
  const n = Math.min(a.length, b.length);
  let s = 0;
  for (let i = 0; i < n; i++) s += a[i]! * b[i]!;
  return s;
}

/**
 * L2-normalise a batch of vectors in-place style (returns new arrays).
 * Used by the orchestrator before retrieval so the pre-normalised storage
 * shape is maintained if we ever swap to a different retriever.
 */
export function normalizeBatch(vectors: number[][]): number[][] {
  return vectors.map(normalize);
}
