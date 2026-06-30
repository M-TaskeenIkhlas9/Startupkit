"""GroqModelAdapter — ModelPort backed by Groq (OpenAI-compatible, free Llama models).

Used when GROQ_API_KEY is set (see apps/api). Same seam as the Anthropic and template adapters:
`complete` powers the AI Co-Founder reasoning, `fill_template` powers document generation. Uses
httpx (already a dependency) — no new SDK.
"""

from __future__ import annotations

import httpx

from startupkit.ports.shared import ProviderDescriptor

_URL = "https://api.groq.com/openai/v1/chat/completions"

_DOC_SYSTEM = (
    "You complete a legal/business document template using ONLY the facts provided. "
    "Output just the completed document in Markdown. Mark anything unknown as '[TO BE COMPLETED]'. "
    "This is a draft pending review by a licensed professional."
)


class GroqModelAdapter:
    descriptor = ProviderDescriptor(id="groq", capability="model")

    def __init__(self, api_key: str, model: str = "llama-3.3-70b-versatile") -> None:
        self._key = api_key
        self._model = model

    async def complete(self, system: str, prompt: str) -> str:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                _URL,
                headers={"Authorization": f"Bearer {self._key}"},
                json={
                    "model": self._model,
                    "temperature": 0.4,
                    "max_tokens": 900,
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": prompt},
                    ],
                },
            )
            resp.raise_for_status()
            data = resp.json()
            return str(data["choices"][0]["message"]["content"]).strip()

    async def fill_template(
        self, template: str, fields: dict[str, object], clauses: list[str]
    ) -> str:
        facts = "\n".join(f"- {k}: {v}" for k, v in fields.items())
        required = "\n".join(f"- {c}" for c in clauses)
        prompt = (
            f"TEMPLATE:\n{template}\n\nCOMPANY FACTS:\n{facts}\n\n"
            f"REQUIRED CLAUSES:\n{required}\n\nReturn the completed document."
        )
        return await self.complete(_DOC_SYSTEM, prompt)
