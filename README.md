# AI Research Notebook

A local-first research workspace for browser-based document analysis — write and organize research, run AI analysis both locally and in the cloud, and keep everything on your own machine.

This is not an AI chatbot wrapper. It's a demonstration of how to architect a real browser application around local-first storage, background processing, and a genuinely hybrid (local + cloud) AI pipeline — with every failure mode handled explicitly instead of assumed away.

**Live Demo:** [https://ai-research-notebook.netlify.app](https://ai-research-notebook.netlify.app)

## Overview

Import or write documents, take research notes alongside them, and run AI analysis — sentiment, summarization, and key-concept extraction — using either a model running entirely in your browser or a cloud LLM, with the app deciding (or you overriding) which one makes sense for a given document. Every AI request is logged with its real cost: provider, model, duration, and token usage where available — never fabricated.

```
Documents
    ↓
Research Workspace (editor + notes)
    ↓
Local Processing (stats, keywords, sentiment)
    ↓
AI Analysis (local + cloud, routed automatically)
    ↓
Persistent Results (IndexedDB)
    ↓
Research History
```

## Architecture

```
React UI
   │
   ▼
Components (documents / notes / ai / dashboard / history / commandPalette / settings)
   │
   ▼
Custom Hooks (useDocuments, useNotes, useAI, useDashboardStats, …)
   │
   ▼
Services (ai / storage / documents / notes / session)
   │
   ├── IndexedDB (via the `idb` library)
   ├── AI Providers (local worker / cloud proxy)
   ├── Web Workers (text processing, local AI)
   └── Browser APIs (File, Clipboard, online/offline)
```

Components never talk to IndexedDB, a worker, or an AI provider directly — they go through a hook, which goes through a service. This is what makes it possible to, say, swap the sentiment model or add a second cloud provider without touching a single component.

State ownership follows the data's actual lifetime:

- **React state** — current UI concerns: which document is selected, whether a modal is open, in-progress form values.
- **`SettingsContext`** — small, cross-cutting preferences (theme, AI provider preference) that need to be read from many unrelated components.
- **`ResearchContext`** — the document list and current selection, needed by the sidebar, editor, and AI panel alike.
- **IndexedDB** — everything that must survive a reload: documents, notes, AI history, settings.

## Hybrid AI Architecture

```
                    User Text
                       │
                       ▼
              ┌─────────────────┐
              │ Analysis Router │   (services/ai/aiRouter.js)
              └────────┬────────┘
                       │
              ┌────────┴────────┐
              │                 │
          Simple Task       Complex Task
              │                 │
              ▼                 ▼
        Local Browser AI      Cloud AI
```

Not every operation is actually routable — some only make sense one way:

| Operation | Local | Cloud | Routing |
|---|---|---|---|
| Text Statistics | ✓ (plain counting, no model) | — | Always local |
| Sentiment | ✓ (Transformers.js model) | — | Always local — no cloud implementation exists, by design |
| Summarization | — | ✓ (Claude, streamed) | Always cloud — a local summarizer would just be truncation |
| Key Concepts | ✓ (frequency counting) | ✓ (Claude) | **Router decides**, or you can force either |

Key Concepts is the one operation both providers can do, so it's where `aiRouter.js` makes a real decision: short documents (≤300 words) route to Local (fast, private, free); longer documents route to Cloud (better synthesis); offline always falls back to Local regardless of preference. Every result shows *why* it was routed where it was — the reasoning is never hidden.

## Local AI

Sentiment analysis runs entirely in your browser via [Transformers.js](https://github.com/xenova/transformers.js), using `Xenova/distilbert-base-uncased-finetuned-sst-2-english` (~65MB, quantized). Nothing is sent over the network for this — you can verify it in the Network tab.

The model loads **lazily**: clicking "Analyze Locally" for the first time triggers the download, with real progress reported (`Downloading model… 42% (onnx/model_quantized.onnx)`), not a generic spinner. It's cached by the browser afterward, so subsequent sessions load instantly. The pipeline is a module-level singleton in `localAIProvider.js` — once loaded, it stays loaded for the session regardless of which document or panel is open, since reloading a 65MB model per remount would be wasteful.

## Web Workers

Two workers, for two different reasons:

- **`textWorker.js`** — text statistics and keyword extraction. Both are regex/counting-based and scale with document size; a multi-megabyte imported document can take long enough to noticeably stall the main thread if run inline. Verified with a 2.36MB synthetic document: the worker computed correct stats (420,000 words) while a UI interaction (theme toggle) on the main thread completed in ~1ms — proof the thread wasn't blocked.
- **`aiWorker.js`** — the Transformers.js model. Downloading tens of megabytes and running WASM inference are both far too slow for the main thread.

Deliberately *not* moved to a worker: the live word count in the document editor. It's a cheap per-keystroke calculation on typically-small text, and message-passing to a worker would add latency for no benefit. Workers are for genuinely heavy, infrequent operations — not reflexively used everywhere.

## IndexedDB

A single database (`services/storage/database.js`) with four object stores — `documents`, `notes`, `aiHistory`, `settings` — each with its own repository module (`documentRepository.js`, `notesRepository.js`, `historyRepository.js`, `settingsRepository.js`) exposing plain async functions. No component imports `idb` directly.

React state never holds the source of truth for persisted data — hooks like `useDocuments` load from IndexedDB on mount and keep a local copy in sync with mutations, but a reload always re-reads from the database. Autosave is debounced (600–800ms) to avoid writing on every keystroke, with a global Ctrl+S shortcut that force-flushes a pending save immediately.

## AI Provider Abstraction

```
AI Provider
     │
     ├── Local AI Provider   (services/ai/localAIProvider.js)
     │
     └── Cloud AI Provider   (services/ai/cloudAIProvider.js)
```

Components call `aiService.js` — never a provider directly. `aiService` is also where every operation gets automatically recorded to AI history (win, lose, or cancelled), so no caller has to remember to log anything. Swapping the cloud provider, or adding a third one, means changing `cloudAIProvider.js` and `aiService.js` — no component code changes.

### Why there's a server-side proxy

Anthropic's API key cannot be safely used from browser JavaScript — anyone can read it out of the network tab or the bundled source. There is no way to "hide" a secret in client-side code. The fix here is a Netlify serverless function (`netlify/functions/claude-proxy.js`) that holds `ANTHROPIC_API_KEY` server-side; the browser calls the function, the function calls Anthropic, and the response streams straight back. The frontend never sees the key.

The function also whitelists which system prompts it will use (`summarize`, `key-concepts`) — the client sends an operation name, never a raw prompt, so a compromised frontend can't smuggle arbitrary instructions to the model.

### Streaming

Cloud responses use Claude's SSE (Server-Sent Events) streaming. `cloudAIProvider.js` parses the stream client-side, extracting `content_block_delta` text as it arrives and the real `usage` (token counts) from `message_start`/`message_delta`. The UI shows text appearing progressively with a blinking cursor, a Cancel button (AbortController-backed), and a stall-timeout guard so a dropped connection surfaces an error instead of an infinite spinner.

## Features

- **Documents** — create, import (`.txt`/`.md`/`.json`, extensible registry), edit, rename, duplicate, delete, search, export
- **Research Notes** — multiple notes per document, autosaved, searchable, copyable, exportable (`.md`/`.txt`)
- **Text Statistics** — characters, words, sentences, paragraphs, reading time — computed locally, no AI
- **Sentiment Analysis** — local, via Transformers.js, with real download progress
- **Summarization** — cloud, streamed, with cancel/retry
- **Key Concepts** — hybrid: routed automatically or forced Local/Cloud
- **AI Response Inspector** — status, provider, model, duration, characters, and *real* token counts (never estimated) for every result
- **AI History** — every request logged with full metadata; searchable, deletable, reopenable, "Open Document" jumps back to the source
- **Research Dashboard** — document/note/AI-analysis counts, total words, recent activity, most-used topics — all computed from what's actually stored
- **Command Palette** (Ctrl+K) — real commands plus unified search across documents, notes, and AI history
- **Session Import/Export** — back up or restore everything as one JSON file, with per-record validation (a malformed file doesn't take down the whole import)
- **Theme** — light/dark/system, `prefers-reduced-motion` respected throughout
- **Offline-aware** — local features (documents, notes, local AI, history) work with no network; cloud features fail with a clear message rather than a silent hang

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl/Cmd + K` | Open command palette |
| `Ctrl/Cmd + S` | Force-save the current document/note immediately |
| `Ctrl/Cmd + O` | Import a document |
| `Ctrl/Cmd + Enter` | Analyze the current document (sentiment) |
| `Esc` | Close a modal or the command palette |

Also documented in-app under **Settings**.

## Installation

```bash
git clone <this-repo>
cd ai-research-notebook
npm install
```

## Environment Variables

Cloud AI is optional. Without it, everything except Summarize and Cloud Key Concepts works fully offline.

Copy `.env.example` to `.env`:

```bash
ANTHROPIC_API_KEY=       # from console.anthropic.com — never commit this
ANTHROPIC_MODEL=claude-sonnet-5
```

`.env` is gitignored. The key is read only by the Netlify function (`netlify/functions/claude-proxy.js`), which runs server-side — it is never bundled into frontend code.

## Development

```bash
npm run dev          # Vite only — local AI, documents, notes, dashboard, everything except cloud AI
npm run dev:cloud     # Netlify dev — adds the /api/claude-proxy function for cloud AI locally
```

Use `dev:cloud` (with `.env` populated) whenever you want to test Summarize or cloud-routed Key Concepts locally.

## Build

```bash
npm run build         # outputs to dist/
npm run preview       # serve the production build locally
```

## Deployment

Deploys to [Netlify](https://netlify.com) as configured (`netlify.toml`):

```bash
npx netlify deploy --prod
```

Set `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL` under **Site settings → Environment variables** in the Netlify dashboard — the same two variables as the local `.env`. Without them, the app deploys and works fully; cloud AI requests will return a clear "not configured" error instead of crashing.

## Engineering Decisions

- **Repositories over a generic ORM-like layer** — four small, explicit modules (`documentRepository.js`, etc.) instead of one generic `db.get(store, id)` helper. Slightly more code, much easier to see what's actually being read/written where.
- **`aiService` as the single point of history recording** — rather than every AI-panel component remembering to log its own result, `aiService` wraps each provider call and records success/error/cancellation uniformly. One place to get it right.
- **Router scope kept honest** — the hybrid router only exists for Key Concepts, the one operation both providers can genuinely do. Sentiment and Summarization are hardcoded to their single capable provider rather than pretending there's a decision to make.
- **Remount-via-`key` over manual state-reset** — document/note editors reset their local state by remounting (`key={doc.id}`) when the underlying record changes, instead of hand-rolling "was this an external change or my own typing" detection.
- **Pub/sub for cross-tree shortcuts** — Ctrl+S and Ctrl+Enter need to reach whichever editor/analysis panel is currently mounted without a prop-drilling chain from the app root. Two tiny event buses (`saveBus.js`, `analyzeBus.js`) do this more simply than lifting all editor state to the top.
- **Session export regenerates every ID** — importing a session never reuses the original record IDs (new ones are generated, with references remapped), so importing the same file twice — or into a browser that already has data — never collides or overwrites.

## Limitations

- **Model size** — the sentiment model is ~65MB; first load requires a real download. Subsequent loads are instant (browser cache), but this is a genuine one-time cost, not hidden.
- **Local key-concept extraction is naive** — frequency counting, not semantic understanding. It's honestly labeled as such, not dressed up as smarter than it is.
- **`npm audit` flags vulnerabilities in `@xenova/transformers`'s optional Node-side dependencies** (`sharp`, `onnxruntime-node` via `onnx-proto`/`protobufjs`) — these are used only for server-side/Node inference paths that this browser-only app never imports; not reachable from the shipped bundle.
- **Brave browser Shields can silently block Web Worker requests**, even on `localhost` during development — if Text Statistics or local AI hang indefinitely in Brave, disable Shields for the dev server's origin. This is a browser-extension interaction, not an app bug (confirmed: other workers on the same page continued working normally).
- **No automated test suite** — verification throughout development was done by exercising the running app directly (real IndexedDB operations, real worker messages, real API calls where a key was available) rather than unit/integration tests.
- **Single cloud provider** — only Anthropic Claude is implemented. The abstraction (`aiService` → provider) supports adding another, but no second implementation exists yet.

## Future Improvements

- A second cloud provider (OpenAI, etc.) behind the same `cloudAIProvider` interface, to demonstrate true provider swapping
- Structured extraction (e.g., "pull all dates/names/claims from this document" as JSON) as a third hybrid operation
- A local embeddings model for semantic (not just keyword) search across documents and notes
- Service Worker for full offline app-shell caching (currently offline-capable at the data layer, but the app shell itself still needs an initial online load)
- Automated tests (the manual verification approach doesn't scale as well as the app grows)
