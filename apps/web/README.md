# web (founder app)

Next.js 14 (App Router) + Tailwind. The Phase 1 (Foundation) founder experience:
**intake wizard → Company Object dashboard → Health Score → next best actions.**
Talks to the FastAPI backend (`apps/api`) over REST.

## Run (local)

```bash
# 1. start the API (from repo root)
uv run uvicorn apps.api.main:app --reload      # http://localhost:8000

# 2. start the web app (from apps/web)
npm install
npm run dev                                     # http://localhost:3000
```

Set `NEXT_PUBLIC_API_URL` if the API isn't on `http://localhost:8000`.

## Pages
- `/` — landing
- `/intake` — 4-step intake wizard (company → formation → founders → fundraising)
- `/company/[id]` — the live Company Object: 10 domains, cap table, Health Score gauge, next actions

> The demo backend uses an in-memory event store, so Company Objects reset when the API restarts.
> Swapping in the Postgres event store (ADR-0003) is a wiring change — the service depends on the
> `EventStore` Protocol.
