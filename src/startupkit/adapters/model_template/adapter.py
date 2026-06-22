"""TemplateModelAdapter — fills a grounded template deterministically (no LLM, no key).

Implements ModelPort structurally. It lets Document Intelligence produce real, grounded drafts
locally today; swapping in the Anthropic (Claude) adapter is a wiring change in apps/api. Anything
the company facts don't cover is rendered as an explicit [TO BE COMPLETED] marker so the validators
and the attorney-review gate catch it.
"""

from __future__ import annotations

from startupkit.ports.shared import ProviderDescriptor


class _SafeDict(dict[str, str]):
    def __missing__(self, key: str) -> str:
        return f"[{key.replace('_', ' ').upper()} — TO BE COMPLETED]"


class TemplateModelAdapter:
    descriptor = ProviderDescriptor(id="template", capability="model")

    async def fill_template(
        self, template: str, fields: dict[str, object], clauses: list[str]
    ) -> str:
        flat = _SafeDict({k: str(v) for k, v in fields.items()})
        body = template.format_map(flat)
        if clauses:
            numbered = "\n".join(f"{i}. {c}" for i, c in enumerate(clauses, 1))
            body += f"\n\n## Standard clauses\n{numbered}"
        return body
