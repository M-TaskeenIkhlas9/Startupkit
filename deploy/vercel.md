# Deploying to Vercel (both frontend and backend)

Two separate Vercel projects, same GitHub repo. Do them in this order — the backend needs to
exist first so you have its URL for the frontend's env var.

## 1. Backend project (`apps/api`)

1. Vercel → **Add New Project → Import** this repo.
2. **Root Directory: leave it at the repo root** (do NOT set it to `apps/api`) — `vercel.json` at
   the repo root points at `apps/api/main.py` and pulls in `src/**` alongside it via
   `includeFiles`. Setting Root Directory to `apps/api` would cut `src/startupkit` out of the
   deployment entirely.
3. Framework Preset: **Other** (it's not a Next.js app; Vercel will use `vercel.json`).
4. **Attach Vercel KV** (Storage tab → Create → KV, or connect an existing one) — this is what
   makes the backend survive across requests instead of losing companies on every cold start
   (see the root cause in the "Current Backend Architecture" artifact if you want the full
   explanation). Attaching it auto-injects `KV_REST_API_URL` / `KV_REST_API_TOKEN`, which
   `apps/api/main.py`'s `_build_store()` picks up automatically — no code change needed.
5. Environment Variables:
   - `ANTHROPIC_API_KEY` (or `GROQ_API_KEY` if you're using the free tier instead) — at least one
     of these, or AI features fall back to the offline template engine.
   - `CORS_ORIGINS` — set this *after* step 2 of the frontend below, once you know its URL, e.g.
     `https://startupkit-web.vercel.app`. Leave unset for now; it defaults to `localhost:3000`.
6. Deploy. Note the resulting URL (e.g. `https://startupkit-api.vercel.app`) — the frontend needs it.

## 2. Frontend project (`apps/web`)

1. Vercel → **Add New Project → Import** the same repo again (a second project).
2. **Root Directory: `apps/web`** — the opposite of step 1, this one really does need it, since
   the Next.js app is self-contained there.
3. Framework Preset: Next.js (auto-detected).
4. Environment Variables → `NEXT_PUBLIC_API_URL` = the backend URL from step 1.6.
5. Deploy.

## 3. Close the loop

Go back to the **backend** project → Environment Variables → set `CORS_ORIGINS` to the frontend's
real URL from step 2.5 → redeploy the backend (env var changes need a redeploy to take effect).

## What's still a known limitation here, even with Redis attached

- **Document uploads** (`/documents/upload`) write to `/tmp` on Vercel, which is ephemeral per
  instance — the upload is acknowledged and the "uploaded" state is recorded correctly (that part
  is in Redis via the event), but the actual file bytes may not survive a cold start. Fine for a
  demo where nobody re-downloads the raw upload; not fine as a real document store.
- **Function timeouts**: Hobby plan caps a request at 10s. The AI endpoints
  (`/ask`, `/brand/generate`, `/gtm/generate`, `/gtm/discover`, `/gtm/chat`, `/brand/chat`,
  `/gtm/content/generate`) can exceed that, especially `/ask` which does a live search *then* an
  LLM call. If these matter for the demo, a Pro plan (60s+ default, configurable higher) removes
  most of the risk.
- **Redis has no schema/migrations** — it's a direct, honest translation of the in-memory store
  (whole event list per company, JSON-serialized), not the target Postgres design in
  `docs/architecture/`. Good enough to survive a demo; not the real persistence layer.
