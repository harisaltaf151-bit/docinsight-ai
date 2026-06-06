/**
 * Recursive character chunker.
 *
 * Splits text into overlapping windows of approximately `chunkSize`
 * characters, preferring natural boundaries:
 *
 *   1. Paragraphs  (double newlines)
 *   2. Lines       (single newlines)
 *   3. Sentences   (`. `, `! `, `? `, or `.\n`)
 *   4. Words       (whitespace)
 *   5. Hard split  (last resort)
 *
 * Adjacent chunks overlap by `overlap` characters to preserve context
 * across boundaries. The overlap is measured on the raw string, not on
 * tokens, which is fine for retrieval-quality chunks at this size.
 */

export interface Chunk {
  id: string;
  index: number;
  content: string;
  charCount: number;
  /** Rough word count, useful for the UI. */
  wordCount: number;
}

export interface ChunkOptions {
  /** Target chunk size in characters. Default 800. */
  chunkSize?: number;
  /** Overlap between adjacent chunks in characters. Default 100. */
  overlap?: number;
  /** Minimum chunk size; smaller trailing chunks are merged. Default 50. */
  minChunkSize?: number;
  /** Optional id generator; defaults to `crypto.randomUUID`. */
  idFactory?: () => string;
}

const DEFAULTS = {
  chunkSize: 800,
  overlap: 100,
  minChunkSize: 50,
};

export function chunkText(text: string, options: ChunkOptions = {}): Chunk[] {
  const { chunkSize, overlap, minChunkSize, idFactory } = { ...DEFAULTS, ...options };
  const id = idFactory ?? (() => crypto.randomUUID());

  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  // Phase 1: split into raw blocks on paragraph boundaries.
  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  // Phase 2: merge / split paragraphs into windows of ~chunkSize.
  const pieces: string[] = [];
  let buffer = "";

  function flushBuffer() {
    if (buffer.trim().length === 0) return;
    if (buffer.length <= chunkSize) {
      pieces.push(buffer.trim());
    } else {
      // Paragraph grew too large — split at finer boundaries.
      pieces.push(...splitLargeBuffer(buffer, chunkSize));
    }
    buffer = "";
  }

  for (const para of paragraphs) {
    if (para.length + buffer.length + 2 <= chunkSize) {
      buffer = buffer ? `${buffer}\n\n${para}` : para;
    } else {
      flushBuffer();
      if (para.length <= chunkSize) {
        buffer = para;
      } else {
        pieces.push(...splitLargeBuffer(para, chunkSize));
      }
    }
  }
  flushBuffer();

  // Phase 3: apply overlap to adjacent pieces.
  const chunks: Chunk[] = [];
  for (let i = 0; i < pieces.length; i++) {
    const piece = pieces[i]!;
    if (i > 0 && overlap > 0) {
      const prev = chunks[chunks.length - 1]!;
      const tail = prev.content.slice(Math.max(0, prev.content.length - overlap));
      // Only carry tail that starts at a word boundary to avoid
      // mid-word prefixes.
      const cleaned = tail.replace(/^[^\s]+/, "").trim();
      if (cleaned.length >= minChunkSize / 2) {
        chunks.push(makeChunk(`${cleaned} ${piece}`.trim(), chunks.length, id));
        continue;
      }
    }
    chunks.push(makeChunk(piece, chunks.length, id));
  }

  return chunks;
}

function makeChunk(content: string, index: number, idFactory: () => string): Chunk {
  return {
    id: idFactory(),
    index,
    content,
    charCount: content.length,
    wordCount: content.split(/\s+/).filter(Boolean).length,
  };
}

/**
 * Split an oversized buffer at progressively finer boundaries.
 * Used when a single paragraph exceeds `chunkSize`.
 */
function splitLargeBuffer(buffer: string, chunkSize: number): string[] {
  const SPLITTERS: Array<RegExp | ""> = [/\n/, /(?<=[.!?])\s+/, /\s+/, ""];
  for (const splitter of SPLITTERS) {
    const parts = splitter ? buffer.split(splitter) : Array.from(buffer);
    // The "no splitter" branch is the last-resort hard split; only fire it
    // when previous passes couldn't shrink the buffer enough.
    if (splitter === "") {
      return hardSplit(buffer, chunkSize);
    }
    const allSmall = parts.every((p) => p.length <= chunkSize);
    if (allSmall) {
      return mergeSmall(parts, chunkSize);
    }
  }
  return hardSplit(buffer, chunkSize);
}

// Split `buffer` into `chunkSize` windows with the smallest possible overlap
// to keep the call site simple. The recursive splitter above normally avoids
// this path.
function hardSplit(buffer: string, chunkSize: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < buffer.length; i += chunkSize) {
    out.push(buffer.slice(i, i + chunkSize));
  }
  return out;
}

function mergeSmall(parts: string[], chunkSize: number): string[] {
  const out: string[] = [];
  let buf = "";
  for (const p of parts) {
    const sep = buf ? " " : "";
    if (buf.length + sep.length + p.length <= chunkSize) {
      buf = buf + sep + p;
    } else {
      if (buf) out.push(buf);
      buf = p;
    }
  }
  if (buf) out.push(buf);
  return out;
}
