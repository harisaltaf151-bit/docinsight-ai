import type { RetrievedChunk } from "./retriever";

export const RAG_SYSTEM = `You are DocInsight's RAG assistant. You answer questions about a single document that the user has uploaded.

Rules:
- Answer ONLY from the provided context. If the context does not contain the answer, say "I don't have that information in the document." Do not invent facts.
- Quote numbers, names, and dates verbatim when they appear in the context.
- When the user asks for a list, use bullet points.
- When the user asks for a structured answer, use headings or numbered lists as appropriate.
- Reference passages by their bracketed number, e.g. [1], [2]. Place the citation at the end of the sentence it supports.
- Do not mention the prompt, the retrieval system, or the document id. Just answer.
- Keep prose concise. Avoid filler phrases like "Based on the provided context…".`;

export interface RagUserPromptInput {
  question: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  retrieved: RetrievedChunk[];
}

const MAX_CONTEXT_CHARS = 12_000;

export function buildRagUserPrompt({
  question,
  history,
  retrieved,
}: RagUserPromptInput): string {
  const context = buildContextBlock(retrieved);
  const historyBlock =
    history.length > 0
      ? history
          .map(
            (m) =>
              `${m.role === "user" ? "User" : "Assistant"}: ${m.content.trim()}`,
          )
          .join("\n")
      : "";

  return `${context}

${historyBlock ? `Conversation so far:\n${historyBlock}\n` : ""}User question: ${question.trim()}

Answer using the numbered context passages above. Cite passages as [n].`.trim();
}

function buildContextBlock(retrieved: RetrievedChunk[]): string {
  if (retrieved.length === 0) {
    return "Context: (no relevant passages were retrieved for this question)";
  }
  const blocks: string[] = [];
  let used = 0;
  for (let i = 0; i < retrieved.length; i++) {
    const r = retrieved[i]!;
    const header = `[${i + 1}] (similarity ${r.score.toFixed(3)})`;
    const body = r.chunk.content.trim();
    const cost = header.length + body.length + 4;
    if (used + cost > MAX_CONTEXT_CHARS) {
      // Truncate the last passage to fit the budget rather than dropping it
      // entirely; the user still benefits from partial context.
      const remaining = Math.max(0, MAX_CONTEXT_CHARS - used - header.length - 4);
      if (remaining > 200) {
        blocks.push(`${header}\n${body.slice(0, remaining).trimEnd()}…`);
      }
      break;
    }
    blocks.push(`${header}\n${body}`);
    used += cost;
  }
  return `Context passages:\n\n${blocks.join("\n\n")}`;
}
