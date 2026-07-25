# StartupKit API — FastAPI, run with uv.
#
# Build from the REPO ROOT, not this directory, since the app imports the shared
# src/startupkit package and apps/api as namespace packages:
#   docker build -f apps/api/Dockerfile -t startupkit-api .

FROM python:3.12-slim AS base

# uv gives us reproducible installs from uv.lock, matching CI exactly.
COPY --from=ghcr.io/astral-sh/uv:0.5 /uv /uvx /bin/

WORKDIR /app

# Install dependencies first so this layer caches independently of source changes.
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project --no-dev

# Now bring in the actual source and install the project itself.
COPY src/ ./src/
COPY apps/api/ ./apps/api/
RUN uv sync --frozen --no-dev

ENV PATH="/app/.venv/bin:$PATH"
EXPOSE 8000

CMD ["uvicorn", "apps.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
