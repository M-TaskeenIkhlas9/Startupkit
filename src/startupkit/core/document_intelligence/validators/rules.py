"""Deterministic validators (FR-D2). Every generated draft must pass these before the human gate.

They return a list of human-readable issues; an empty list means the draft passed that check.
"""

from __future__ import annotations

from startupkit.core.document_intelligence.pipeline import GenerateRequest


class NoUnfilledPlaceholders:
    name = "no-unfilled-placeholders"

    def run(self, draft: str, req: GenerateRequest) -> list[str]:
        n = draft.count("TO BE COMPLETED")
        return [f"{n} field(s) still need completion before signing."] if n else []


class MentionsCompany:
    name = "mentions-company"

    def run(self, draft: str, req: GenerateRequest) -> list[str]:
        name = str(req.company_fields.get("company_name", "")).strip()
        if name and name not in draft:
            return ["Draft does not reference the company's legal name."]
        return []


class MinimumLength:
    name = "minimum-length"

    def run(self, draft: str, req: GenerateRequest) -> list[str]:
        return ["Draft looks too short to be complete."] if len(draft) < 200 else []
