# Analysis of `chat.md`

**Content type:** Full electoral program text ("البرنامج الانتخابي") of a Moroccan political party (حزب الاتحاد الدستوري). Pure narrative + policy-commitment prose — no tables, no images, no links, no code.

**Structure:** Hierarchical but expressed only through bold text, not real Markdown headings:
- Title + slogan
- Political intro (تقديم سياسي)
- 4 "National Commitments" (الالتزام الوطني الأول–الرابع): economy, social equity/protection, regional development, governance/trust — each with intro → several "أولا/ثانيا/ثالثا…" subsections → numbered/bulleted concrete measures → a closing "خاتمة الالتزام" paragraph
- Supporting sectoral policies (digital, water/environment, women/family, youth, culture, media, sport)
- Crisis-resilience section
- Governance & execution section
- Closing political statement

**Size:** 1,137 lines / 89,491 bytes / ~45,000 Arabic characters ≈ roughly 14,000–20,000 tokens (Arabic tokenizes less efficiently than Latin script). Small.

**Language:** 100% Modern Standard Arabic. No French/English in the source content.

**Suitable for direct LLM context?** Yes — comfortably fits whole inside a single request context (even a 32K window), so it can be stuffed in full rather than retrieved piecemeal.

**Chunking needed?** No, not for size. The lack of real Markdown headings (sections are bold paragraphs, not `#`/`##`) would also make automatic heading-based chunking unreliable without custom preprocessing.

**Embeddings / vector DB / RAG needed?** No, not for this size and single-document scope. Retrieval would add complexity and a real failure mode here: many subsections repeat near-identical phrasing ("يلتزم الاتحاد الدستوري بـ…"), so embedding similarity could easily pull the *wrong* section for a query. Full-context stuffing is simpler and more reliable at this scale. PostgreSQL (added below) is used for storage/versioning, not as a vector store.

**Arabic-specific problems found:**
- The whole 1,137-line document is wrapped in one `<div dir="rtl" lang="ar">…</div>`. Many Markdown-to-HTML parsers (remark/marked/markdown-it by default) treat content inside a top-level HTML block as raw/opaque and **do not re-parse Markdown inside it** — meaning `**bold**`, numbered lists, and `•` bullets could render as literal text instead of formatted HTML unless the parser is explicitly configured to allow Markdown-in-HTML, or the wrapper is removed and `dir="rtl"` is applied by the app instead.
- List formatting is inconsistent: most sections use a trailing backslash `\` (Markdown hard line-break) to keep bullets tight; others (e.g. retirement, disability, reintegration subsections) use plain blank-line-separated bullets, which will render as separate paragraphs instead of a list. Cosmetic, but worth normalizing.
- No real headings, no frontmatter/metadata (no version/date), no section IDs — fine for an LLM reading it as prose, but a blocker for any future programmatic chunking or citation-by-ID.

---

# 1. Recommended Architecture

```
User
 ↓ types a question (AR/FR/EN, possibly mixed)
Chatbot UI (Next.js React component, RTL-aware, Client Component)
 ↓ POST /api/chat
Backend API (Next.js Route Handlers — same app, serverless functions)
 ↓ calls
Knowledge Retrieval (loader that reads chat.md content from PostgreSQL, cached in memory with TTL)
 ↓ supplies current text of
knowledge_documents table in PostgreSQL (source of truth, seeded from chat.md)
 ↓ injected into system prompt, sent to
AI Model (Claude via Messages API)
 ↓ returns grounded answer
Response formatting (sanitize Markdown, mark language direction)
 ↓
Chatbot UI (renders bubble, dir="auto")
```

Why each piece exists:
- **UI**: a Next.js component embedded in the site's layout, RTL-correct by default.
- **Backend API (Next.js Route Handlers)**: the only place the LLM API key and DB credentials may live; also where you enforce validation, rate limits, and the grounding system prompt — never call the model or DB directly from the browser. Using Next.js means frontend and backend live in one codebase/deployment instead of two separate services.
- **Knowledge Retrieval**: a small seam between "the app" and "the stored knowledge." Even though MVP just loads the whole document, isolating this means you can later swap in chunking/RAG without touching the route handler or model-integration code.
- **PostgreSQL**: holds the knowledge base content (so it can be edited/updated without a redeploy) plus optional conversation logs, rate-limit counters, and an audit trail of knowledge updates. This is *necessary* once you deploy Next.js as serverless functions (e.g. on Vercel), because serverless functions have an ephemeral/read-only filesystem — you can't just edit a local `chat.md` file on the server and expect it to persist or be writable at runtime. A database is the correct place for content that must be updatable at runtime.
- **AI Model**: does the actual language understanding/generation, constrained by the system prompt to stay inside the stored knowledge base text.
- **Response formatting**: sanitizes Markdown to safe HTML and lets the browser's bidi algorithm handle direction per message.

---

# 2. Technology Stack

- **Frontend**: **Next.js** (App Router, React), chat widget built as a Client Component rendered inside the site's layout. If the chatbot ever needs to run on pages outside this Next.js app, a small separate embeddable bundle can be built later — not needed if the whole website is this Next.js app.
- **Backend**: **Next.js Route Handlers** (`app/api/chat/route.ts`, etc.) — no separate Express/Fastify service needed; they run as serverless functions (or a Node server, depending on hosting) within the same Next.js deployment.
- **Database**: **PostgreSQL** — stores:
  - the knowledge base content (`knowledge_documents` table: id, slug, content, version, content_hash, updated_at) so it can be updated without rebuilding/redeploying the app
  - optionally, conversation logs and rate-limit counters
  - an audit trail of knowledge updates (who/when/old hash → new hash)
- **ORM/DB client**: **Prisma** — simplest reliable pairing with Next.js + PostgreSQL, gives type-safe queries and easy migrations.
- **AI model/API**: Claude (Anthropic) via the Messages API — strong Arabic support, large context window, simple integration. Use a mid-tier model for quality/cost balance; a cheaper/faster model is an option if traffic is high and answers stay simple.
- **Vector database**: still not needed (see analysis above) — PostgreSQL here is plain relational storage, not a vector store.
- **Embedding model**: still not needed for MVP.
- **Markdown parser**: needed twice — (a) backend-side, a minimal cleanup step applied once (at import time) to strip the outer `<div dir="rtl">` wrapper before the text is stored in PostgreSQL; (b) frontend-side, a small renderer (`marked` or `markdown-it`) + a sanitizer (`DOMPurify`) to safely turn the model's Markdown reply into HTML.
- **Authentication**: not needed for the public chat endpoint — this is a public informational widget, not a logged-in feature. The admin "update knowledge" endpoint is protected by a simple secret token instead of full user auth.
- **Hosting/deployment**: **Vercel** is the natural fit for Next.js. Use a managed PostgreSQL provider that pairs well with serverless (e.g. Neon, Supabase, or Railway) rather than self-hosting, since Vercel functions need a connection-pooled/serverless-friendly Postgres.

---

# 3. Project Structure

```
app/
  api/
    chat/route.ts                 (POST /api/chat)
    health/route.ts               (GET /health)
    admin/
      reload-knowledge/route.ts   (POST, token-protected)
  (site pages/layout — chat widget mounted in layout.tsx)

components/
  chat/
    Launcher.tsx
    Panel.tsx
    MessageList.tsx
    Bubble.tsx
    InputBar.tsx
  chat/styles.css                 (RTL-aware, logical properties)

lib/
  knowledge/loader.ts             (reads current knowledge row from Postgres via Prisma, caches in memory)
  knowledge/cache.ts              (TTL / invalidate-on-update cache)
  ai/client.ts                    (Anthropic SDK wrapper)
  ai/promptBuilder.ts             (system prompt: instructions + knowledge base content)
  middleware/rateLimit.ts
  middleware/validate.ts

prisma/
  schema.prisma                   (KnowledgeDocument, optionally Conversation, Message, RateLimitEvent)
  migrations/

.env (not committed: DATABASE_URL, ANTHROPIC_API_KEY, ADMIN_RELOAD_TOKEN)
```

---

# 4. Data Flow

1. User types a message in the widget (any language, any mix).
2. Widget POSTs `{ message, history }` to `/api/chat` (Next.js Route Handler).
3. Handler validates input, checks rate limit.
4. Knowledge loader returns the current knowledge base text — from an in-memory cache if fresh, otherwise queried from the `knowledge_documents` table in PostgreSQL via Prisma.
5. Prompt builder assembles: system instructions (grounding + refusal + anti-injection rules) + full knowledge base text + user message + short history.
6. Handler calls the AI model.
7. Model returns an answer grounded in the document (or the defined "I don't have that information" fallback).
8. Handler sanitizes/forwards the response (optionally logs the exchange to Postgres).
9. Widget renders it in a bubble with `dir="auto"`, formatted Markdown.

---

# 5. Implementation Roadmap

**Phase 1 — Project setup**: `npx create-next-app` (App Router, TypeScript), set up PostgreSQL (managed instance) + Prisma, env var management (`DATABASE_URL`, `ANTHROPIC_API_KEY`, `ADMIN_RELOAD_TOKEN`). *Verify*: `GET /health` returns 200; `npx prisma migrate dev` runs cleanly against the DB.

**Phase 2 — Prepare chat.md → PostgreSQL**: clean the source file (remove the outer `<div>` wrapper, normalize bullet formatting), then write a one-off import script that inserts the cleaned content into the `knowledge_documents` table as the initial version. *Verify*: a query against the table returns the full cleaned text; spot-check formatting parses correctly.

**Phase 3 — Knowledge retrieval**: build `lib/knowledge/loader.ts`/`cache.ts` — query the latest `knowledge_documents` row via Prisma, cache in memory with a short TTL, expose `getKnowledgeBase()`. *Verify*: unit test that updates the DB row and confirms the loader returns updated content after cache expiry/forced reload.

**Phase 4 — Backend (Route Handlers)**: `app/api/chat/route.ts`, `app/api/health/route.ts`, `app/api/admin/reload-knowledge/route.ts` (token-protected, updates the cache pointer after a DB edit), validation, rate limiting. *Verify*: curl tests for success, oversized input rejection, rate-limit 429, admin route rejects requests without the correct token.

**Phase 5 — AI integration**: finalize system prompt (grounding, refusal style, injection resistance), pick model params (low temperature). *Verify*: a ~20-question test set (in-scope, out-of-scope, injection attempts) run against the endpoint.

**Phase 6 — Chat interface**: build the widget as Next.js Client Components, wire to `/api/chat`, client-side history + "new conversation." *Verify*: manual golden-path + edge cases (empty input, long input, offline).

**Phase 7 — Arabic/RTL**: `dir="rtl"` on the container, `dir="auto"` per bubble, logical CSS properties. *Verify*: visual QA with Arabic-only, French-only, English-only, and mixed messages.

**Phase 8 — Security**: lock down the admin route token, finalize rate limits, confirm `DATABASE_URL`/`ANTHROPIC_API_KEY` never reach the client bundle, restrict CORS if the API is ever called from outside the Next.js app itself. *Verify*: attempt admin route without token (blocked), attempt to exceed rate limit (blocked), inspect client bundle for leaked secrets.

**Phase 9 — Testing**: full functional/RTL/mobile/error-state pass, plus a "content update" test (update the DB row via the admin route, confirm the bot reflects the change within the expected cache window, no rebuild). *Verify*: checklist all green.

**Phase 10 — Deployment**: deploy the Next.js app to Vercel (or similar), provision managed PostgreSQL, run Prisma migrations against production, set production env vars, add basic uptime/error monitoring. *Verify*: same golden-path test run against production.

---

# 6. Arabic/RTL Strategy

- Widget container defaults to `dir="rtl"`.
- Each message bubble uses `dir="auto"` so the browser's native Unicode Bidi Algorithm handles mixed Arabic/French/English text correctly per-message, without manual detection logic.
- CSS uses logical properties (`margin-inline-start`, `text-align: start`, etc.) instead of hard-coded left/right, so layout mirrors automatically.
- The model is instructed to reply in the same language the user wrote in (including mixed messages → dominant language), since the knowledge base itself is Arabic-only but users may ask in French/English.
- Model output is Markdown; render it through a sanitizer, not raw HTML injection.

---

# 7. Security Strategy

- `ANTHROPIC_API_KEY` and `DATABASE_URL` live only in server-side environment variables (Vercel project env vars) — never in a Client Component, never logged.
- HTTPS only; input validation (max length, reject empty/binary/control characters) on every Route Handler.
- Per-IP/session rate limiting on `/api/chat` to control abuse and cost.
- No authentication needed for the public chat endpoint; the `/api/admin/reload-knowledge` route is protected by a separate secret token (`ADMIN_RELOAD_TOKEN`), checked server-side.
- PostgreSQL access only from server-side code (Route Handlers/Prisma) — never exposed to the client; use a connection-pooled/serverless-friendly connection string as recommended by the hosting provider.
- Prompt-injection defense: system prompt explicitly states user text is data, not instructions, and the model must refuse to reveal its instructions or the raw knowledge base verbatim on request.
- No PII in the knowledge base; avoid collecting personal data through the chat UI. If conversation logs are stored in PostgreSQL, define a retention/redaction policy and avoid storing identifying info without consent.

---

# 8. Testing Strategy

- A fixed ~20-item Q&A set covering: correct in-scope answers (verifiable against the stored knowledge base), deliberately out-of-scope questions (must trigger the "I don't have this information" fallback), and known prompt-injection phrasings (must be refused/ignored).
- Manual RTL/mixed-language visual QA pass.
- Mobile responsiveness pass.
- A "live update" test: update the knowledge base row via the admin route, confirm the bot's answers change within the expected cache window without redeploying the app.
- Prisma migration test: run migrations against a fresh database to confirm the schema applies cleanly.

---

# 9. Deployment Strategy

- Deploy the Next.js app to Vercel (native fit for Next.js Route Handlers + serverless functions).
- Provision a managed PostgreSQL instance (Neon/Supabase/Railway) and run Prisma migrations against it as part of the deploy pipeline.
- Set production env vars (`DATABASE_URL`, `ANTHROPIC_API_KEY`, `ADMIN_RELOAD_TOKEN`) in the hosting provider's secret manager.
- Basic uptime/error monitoring and log retention policy from day one.

---

# 10. Potential Problems

- The `<div dir="rtl">` wrapper around the entire source file will break Markdown rendering in many parsers if used as-is — must be stripped/handled during the one-time import into PostgreSQL, before this content is ever fed to a Markdown-to-HTML step.
- Inconsistent bullet formatting in the source (backslash-joined vs. blank-line-separated) may render slightly differently in places if the raw text is ever rendered directly instead of being re-summarized by the model.
- Serverless functions (Vercel) have an ephemeral/read-only filesystem — this is exactly why the knowledge base must live in PostgreSQL rather than as a local `chat.md` file read at runtime; keep that in mind if any part of the implementation is tempted to fall back to `fs.readFile` in production.
- Full-context stuffing means every request re-sends ~15–20K tokens of Arabic text — fine for a single-document MVP, but if the knowledge base grows substantially (multiple documents, much larger content), you'll eventually need real chunking + retrieval; the "knowledge loader" seam in the architecture is designed to make that transition painless later.
- No real headings mean any future move to RAG/citation-by-section will require a manual preprocessing step to mark section boundaries.
- Adding PostgreSQL introduces a new operational dependency (connection limits, cold-start latency on serverless, migration management) that wasn't needed for the file-based MVP — worth it here mainly because it solves the "update without rebuild" requirement cleanly on serverless hosting.

---

# 11. Recommended Next Step

Do the Phase 2 work first: clean `chat.md` (remove the outer `<div>` wrapper, normalize bullet formatting) and write the one-off import script that loads it into the `knowledge_documents` PostgreSQL table. Everything else in the roadmap — the Next.js Route Handlers, the knowledge loader/cache, the AI integration — depends on having that clean, DB-backed source of truth in place.
