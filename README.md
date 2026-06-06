# DocInsight AI

AI-powered document analysis SaaS. Upload a PDF, drop a `.txt` / `.md`, or paste
text; get a **summary**, **key insights**, and **action items** from your choice
of AI provider. Chat with any analyzed document using RAG.

> **Bring-your-own-key.** API keys are stored in `sessionStorage` only and sent
> per-request to the BFF. They are never persisted to the server, logs, or a
> database. The tab is the boundary of trust.

## Features

- **PDF upload** (drag-drop or click) — parsed server-side with `pdf-parse`
- **TXT / MD file upload** or **paste text** — up to 200k characters
- **Three-section analysis** — summary, ranked insights, action items
- **Streaming responses** — Server-Sent Events, one chunk at a time
- **Multi-provider** — Claude, OpenAI, Gemini, Groq (drop-in swap)
- **RAG chat** — cosine retrieval over the document you analyzed, with cited
  numbered passages
- **Ephemeral results** — analyses persist in `sessionStorage`; the canonical
  history view is at `/results`
- **Three-step onboarding** — provider, model, key, with success animation
- **Dark / light / system** — via `next-themes`
- **Session-only secrets** — no server-side keys, no telemetry, no cookies

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | [Next.js 15](https://nextjs.org/) (App Router) + React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com/) (new-york) |
| Validation | [zod](https://zod.dev/) |
| Theme | [next-themes](https://github.com/pacocoursey/next-themes) |
| Icons | [lucide-react](https://lucide.dev/) |
| Toasts | [sonner](https://sonner.emilkowal.ski/) |
| AI SDKs | `@anthropic-ai/sdk`, `openai`, `@google/generative-ai` (Groq reuses the OpenAI client) |
| PDF | `pdf-parse` |

## Getting Started

```bash
# install
npm install

# (optional) copy env template — there are no server secrets by design
cp .env.example .env.local

# start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The first run lands on
`/onboarding`, which guides you through picking a provider, a model, and
entering your API key.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (standalone output for Docker) |
| `npm start` | Run the production build locally |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run the TypeScript compiler in `--noEmit` mode |
| `npm run format` | Format with Prettier |
| `npm run format:check` | Verify formatting only |

## Project Structure

```
src/
├── app/                          # App Router
│   ├── (dashboard)/              # Authenticated route group (sidebar layout)
│   │   ├── dashboard/            # Overview + recent activity
│   │   ├── analyze/              # Upload + stream
│   │   ├── results/              # List & detail (sessionStorage)
│   │   ├── chat/                 # RAG chat
│   │   └── settings/             # API key management
│   ├── onboarding/               # 3-step provider connection
│   ├── api/                      # BFF route handlers (edge runtime)
│   │   ├── health/               # Health check
│   │   ├── providers/            # List available providers
│   │   ├── analyze/              # SSE streaming analysis
│   │   ├── documents/process/    # Ingest PDF/TXT for RAG
│   │   └── chat/                 # SSE streaming RAG chat
│   ├── layout.tsx
│   ├── page.tsx                  # Landing
│   └── globals.css
├── components/
│   ├── ui/                       # shadcn primitives
│   ├── layout/                   # Sidebar, Navbar, ThemeToggle
│   ├── shared/                   # EmptyState, PageHeader, LoadingSpinner
│   ├── onboarding/               # Connect flow, progress dots, brand mark
│   ├── upload/                   # PDF dropzone, text source input
│   ├── analysis/                 # Section cards (summary/insights/actions)
│   ├── results/                  # List & detail components
│   ├── chat/                     # Message bubble, composer, sources panel
│   └── dashboard/                # Recent activity card
├── hooks/                        # Custom React hooks (useApiKey, useResults, useAnalysisStream, …)
├── lib/
│   ├── ai/                       # Provider abstraction, orchestrator, json parser
│   ├── rag/                      # Embeddings, chunker, store, retriever
│   ├── prompts/                  # Per-section system prompts
│   ├── validators.ts             # zod schemas
│   ├── results-store.ts          # sessionStorage CRUD
│   ├── session.ts                # sessionStorage helpers
│   ├── file.ts                   # File → base64 / text utilities
│   └── utils.ts
├── services/                     # Client-side service layer (BFF callers)
└── types/                        # Shared TS types
```

## Architecture Notes

### Streaming

`POST /api/analyze` and `POST /api/chat` return `text/event-stream`. Each SSE
event is a single line of JSON. The orchestrator in `lib/ai/orchestrator.ts`
runs summary → insights → actions sequentially so the client receives a clean
reading-order flow.

### RAG

`POST /api/documents/process` accepts a PDF or text, chunks it (800-char
windows with 100-char overlap), embeds it (OpenAI or Gemini), and stores it in
an in-memory map keyed by `documentId` with a 1-hour TTL. `POST /api/chat`
looks up the document, embeds the question, retrieves the top-k most similar
chunks, and asks the chat model to answer with citations.

> The in-memory store is a placeholder. For production, swap it for SQLite,
> Redis, or a vector DB — see `lib/rag/store.ts` for the interface.

### Security Posture

- API keys are written to `sessionStorage` only — they vanish on tab close.
- Headers set in `next.config.ts`: `X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`. The `X-Powered-By` header is disabled.
- No server-side logging of request bodies or keys.
- No telemetry (set `NEXT_TELEMETRY_DISABLED=1`).

## Deployment

### Vercel (recommended)

The app is Next.js 15 with edge-runtime API routes and works on Vercel out of
the box. No environment variables are required because keys are client-side.

```bash
npx vercel
```

### Docker

Multi-stage Dockerfile produces a small image based on `node:20-alpine` and
uses the Next.js `output: "standalone"` build:

```bash
docker build -t docinsight-ai .
docker run -p 3000:3000 docinsight-ai
```

Or with the bundled compose file:

```bash
docker compose up --build
```

The container exposes a `/api/health` endpoint that Docker's `HEALTHCHECK`
polls every 30 seconds.

## Adding shadcn Components

```bash
npx shadcn@latest add <component>
```

The `components.json` file is preconfigured for this project.

## License

MIT
