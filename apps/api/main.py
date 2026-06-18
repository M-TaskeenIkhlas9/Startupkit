"""FastAPI entrypoint + webhook ingress. TODO(@eng-product).

Webhooks: verify provider signature -> dedupe -> map to internal event -> hand to orchestration.
Run: `uv run uvicorn apps.api.main:app --reload`
"""

from fastapi import FastAPI

app = FastAPI(title="StartupKit API")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
