"""AnthropicModelAdapter — Document Intelligence backed by Claude (Opus 4.8).

Used when ANTHROPIC_API_KEY is configured (see apps/api). It fills a *grounded* template — the model
never free-forms a legal doc; it completes a vetted template using only the supplied company
facts, and marks anything it can't fill as [TO BE COMPLETED]. Output still passes the deterministic
validators and the attorney-review gate before it becomes source-of-truth (see ADR-0005).
"""

from __future__ import annotations

from anthropic import AsyncAnthropic
from anthropic.types import TextBlock

from startupkit.ports.shared import ProviderDescriptor

_SYSTEM = (
    "You are a legal-document drafting assistant for an early-stage US startup. "
    "Complete the provided template using ONLY the company facts given. Do not invent facts; "
    "render anything unknown as '[TO BE COMPLETED]'. Output only the completed document. "
    "This is a draft pending review by a licensed attorney."
)


class AnthropicModelAdapter:
    descriptor = ProviderDescriptor(id="anthropic", capability="model")

    def __init__(self, api_key: str, model: str = "claude-opus-4-8") -> None:
        self._client = AsyncAnthropic(api_key=api_key)
        self._model = model

    async def fill_template(
        self, template: str, fields: dict[str, object], clauses: list[str]
    ) -> str:
        facts = "\n".join(f"- {k}: {v}" for k, v in fields.items())
        required = "\n".join(f"- {c}" for c in clauses)
        prompt = (
            f"TEMPLATE:\n{template}\n\nCOMPANY FACTS:\n{facts}\n\n"
            f"REQUIRED CLAUSES:\n{required}\n\nReturn the completed document."
        )
        msg = await self._client.messages.create(
            model=self._model,
            max_tokens=2000,
            system=_SYSTEM,
            messages=[{"role": "user", "content": prompt}],
        )
        block = msg.content[0]
        return block.text if isinstance(block, TextBlock) else ""
