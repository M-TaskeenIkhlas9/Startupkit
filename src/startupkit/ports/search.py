"""SearchPort — live web research behind the AI Co-Founder. Same swappable seam as ModelPort.

`search` returns ranked web results the co-founder grounds its advice in (real competitors, market
signals, comparable startups). Adapters: Tavily (best, needs key) > DuckDuckGo (free, no key) >
none (offline → empty list, co-founder falls back to its own knowledge). Always degrade gracefully:
a network failure returns [] rather than raising, so the chat never breaks.
"""

from __future__ import annotations

from typing import Protocol, runtime_checkable

from pydantic import BaseModel


class SearchResult(BaseModel):
    title: str
    url: str
    snippet: str = ""


@runtime_checkable
class SearchPort(Protocol):
    id: str

    async def search(self, query: str, max_results: int = 5) -> list[SearchResult]:
        """Return up to `max_results` web results. Empty list means 'no research available'."""
        ...
