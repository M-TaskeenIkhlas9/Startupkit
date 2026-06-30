"""NoSearchAdapter — SearchPort that returns nothing. The offline default.

When no web research is available the co-founder simply falls back to its own knowledge.
"""

from __future__ import annotations

from startupkit.ports.search import SearchResult


class NoSearchAdapter:
    id = "none"

    async def search(self, query: str, max_results: int = 5) -> list[SearchResult]:
        return []
