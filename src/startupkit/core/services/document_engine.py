"""DocumentEngine — generates a workflow phase's documents from the Company Object.

Wires the Document Intelligence Pipeline (ground -> generate -> validate) to a ModelPort. The model
adapter (Anthropic/Claude, or the offline template adapter) is injected by apps/api, so core never
depends on a concrete provider. Legally-operative drafts come back flagged 'pending-review'.
"""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

from pydantic import BaseModel

from startupkit.core.company_object.projections.snapshot import CompanySnapshot
from startupkit.core.document_intelligence.grounding.templates import load_grounding
from startupkit.core.document_intelligence.pipeline import GenerateRequest, Pipeline
from startupkit.core.document_intelligence.validators.rules import (
    MentionsCompany,
    MinimumLength,
    NoUnfilledPlaceholders,
)
from startupkit.ports.model import ModelPort

_REVIEW_KEYWORDS = (
    "agreement",
    "certificate",
    "bylaws",
    "consent",
    "election",
    "nda",
    "piia",
    "incorporation",
    "safe",
    "offer",
    "assignment",
)


class GeneratedDocument(BaseModel):
    doc_id: str
    doc_type: str
    workflow_code: str
    phase_n: int
    version: int
    status: str  # "pending-review" (legal) | "draft"
    body: str
    issues: list[str]


class DocumentEngine:
    def __init__(self, model: ModelPort) -> None:
        self._pipeline = Pipeline(
            model,
            load_grounding,
            [NoUnfilledPlaceholders(), MentionsCompany(), MinimumLength()],
        )

    async def generate(
        self, snap: CompanySnapshot, workflow_code: str, phase_n: int, doc_types: list[str]
    ) -> list[GeneratedDocument]:
        out: list[GeneratedDocument] = []
        for doc_type in doc_types:
            req = GenerateRequest(
                tenant_id=snap.company_id,
                doc_type=doc_type,
                jurisdiction=_jurisdiction(snap),
                company_fields=_fields(snap, doc_type),
            )
            doc, issues = await self._pipeline.generate(req)
            out.append(
                GeneratedDocument(
                    doc_id="DOC-" + uuid4().hex[:8].upper(),
                    doc_type=doc_type,
                    workflow_code=workflow_code,
                    phase_n=phase_n,
                    version=1,
                    status="pending-review" if _needs_review(doc_type) else "draft",
                    body=doc.body,
                    issues=issues,
                )
            )
        return out


def _needs_review(doc_type: str) -> bool:
    name = doc_type.lower()
    return any(k in name for k in _REVIEW_KEYWORDS)


def _jurisdiction(snap: CompanySnapshot) -> str:
    return "Delaware" if snap.jurisdiction == "US" else (snap.jurisdiction or "US")


def _fields(snap: CompanySnapshot, doc_type: str) -> dict[str, object]:
    founders = ", ".join(f"{f.name} ({f.role})" for f in snap.founders) or "[FOUNDERS]"
    founders_clause = f", together with its founders {founders}" if snap.founders else ""
    entity = {"c-corp": "Delaware C-Corporation", "llc": "Limited Liability Company"}.get(
        snap.entity_type, snap.entity_type or "corporation"
    )
    lead = snap.founders[0] if snap.founders else None
    return {
        "doc_title": doc_type,
        "company_name": snap.name or "[COMPANY NAME]",
        "entity_type": entity,
        "jurisdiction": _jurisdiction(snap),
        "governing_state": _jurisdiction(snap),
        "ein": snap.ein or "[EIN — TO BE COMPLETED]",
        "one_liner": snap.one_liner or snap.solution or "the company's business",
        "founders": founders,
        "founders_clause": founders_clause,
        "founder_name": lead.name if lead else "[FOUNDER NAME — TO BE COMPLETED]",
        "founder_title": lead.role if lead else "Founder",
        "authorized_shares": "10,000,000",
        "par_value": "$0.00001",
        "tax_year": datetime.now(UTC).strftime("%Y"),
        "purpose": f"This {doc_type} sets out the terms for {doc_type.lower()} "
        f"in connection with {snap.name or 'the company'}.",
        "today": datetime.now(UTC).strftime("%B %d, %Y"),
    }
