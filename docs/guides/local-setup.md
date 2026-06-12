# Local setup
```bash
uv sync --extra dev          # creates .venv and installs deps
docker compose up -d          # postgres + temporal + temporal UI (localhost:8080)
cp .env.example .env           # fill DATABASE_URL, TEMPORAL_*, ANTHROPIC_API_KEY, provider keys
uv run pytest                  # runs unit + adapter conformance tests
uv run uvicorn apps.api.main:app --reload   # API on :8000
uv run python apps/worker/main.py            # Temporal worker (once implemented)
```
Quality gates locally: `uv run ruff check .` · `uv run mypy` · `uv run lint-imports`.
Temporal UI shows running workflows and their wait states at http://localhost:8080.
