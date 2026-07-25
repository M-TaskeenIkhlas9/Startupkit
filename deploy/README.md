# Deploying StartupKit

Everything about running this somewhere real lives here. `docker-compose.yml` at the repo root is
**local dev only** (Postgres + Temporal for `uv run uvicorn ...` / `npm run dev` to talk to) — this
folder is the actual production/staging topology.

**Deploying to Vercel instead?** See [`vercel.md`](./vercel.md) — different setup (two separate
Vercel projects, Redis instead of Postgres for the event store), not the Docker path below.

## Before you deploy: the one real gap

The API's event store is in-memory
(`src/startupkit/core/company_object/memory_store.py`) — every company is lost on restart. The
`postgres` service below exists so the deployment shape is correct, but **the app doesn't persist
to it yet**. Don't put real founder data behind this until that's wired up; treat a first deploy as
a staging/demo environment, not production, until then.

## Building and running

```bash
cp deploy/env/.env.production.example deploy/env/.env.production
# fill in real values — never commit .env.production

docker compose -f deploy/docker-compose.prod.yml --env-file deploy/env/.env.production up -d --build
```

This builds and runs three containers: `api` (FastAPI, port 8000), `web` (Next.js, port 3000),
`postgres` (port 5432, unused by the app today — see above). Put a reverse proxy / TLS terminator
(Caddy, nginx, or your host's load balancer) in front of `web` and `api`; neither serves HTTPS
itself.

## CI

`.github/workflows/deploy.yml` builds both Docker images and pushes them to GitHub Container
Registry (`ghcr.io`) on every merge to `main` — it does **not** deploy anywhere on its own. Wire
the last step to your actual host (SSH + `docker compose pull && up -d`, or a platform-specific
action) once you've picked one.

## Not yet part of this

- `apps/worker` — the Temporal worker is a stub (`raise SystemExit("TODO")`); orchestration isn't
  wired in (see `docs/architecture/`'s "orchestration: designed vs. actual" section). Don't deploy it.
- Auth / RBAC / multi-tenancy — none of it exists yet; every deploy today is effectively single-tenant.
