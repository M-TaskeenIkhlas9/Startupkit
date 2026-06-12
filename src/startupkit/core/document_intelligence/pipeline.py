"""Document Intelligence: ground -> generate -> validate -> (human approve -> versioned store).

Generation is NEVER trusted on its own. A legal/financial doc must pass deterministic validators
AND a human gate before it is stored. See ADR-0005.
"""
from __future__ import annotations

from collections.abc import Awaitable, Callable
from typing import Protocol

from pydantic import BaseModel

from startupkit.ports.model import ModelPort


class GenerateRequest(BaseModel):
    tenant_id: str
    doc_type: str           # e.g. "articles-of-incorporation"
    jurisdiction: str       # selects rule-pack + clause set
    company_fields: dict[str, object]


class GeneratedDoc(BaseModel):
    doc_type: str
    version: int
    body: str


class Grounding(BaseModel):
    template: str
    clauses: list[str]


class Validator(Protocol):
    name: str
    def run(self, draft: str, req: GenerateRequest) -> list[str]: ...  # returns issues


class Pipeline:
    def __init__(
        self,
        model: ModelPort,
        load_grounding: Callable[[GenerateRequest], Awaitable[Grounding]],
        validators: list[Validator],
    ) -> None:
        self._model = model
        self._load = load_grounding
        self._validators = validators

    async def generate(self, req: GenerateRequest) -> tuple[GeneratedDoc, list[str]]:
        grounding = await self._load(req)                                    # 1. ground (no free-form)
        body = await self._model.fill_template(                              # 2. generate via model port
            grounding.template, req.company_fields, grounding.clauses,
        )
        issues = [i for v in self._validators for i in v.run(body, req)]     # 3. deterministic validate
        # 4. human approval + 5. versioned store happen in the workflow/services layer, not here.
        return GeneratedDoc(doc_type=req.doc_type, version=0, body=body), issues
