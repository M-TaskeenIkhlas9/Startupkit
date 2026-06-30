"""TavilySearchAdapter — SearchPort backed by Tavily, an LLM-optimized search API.

Used when TAVILY_API_KEY is set (better, cleaner results than scraping). Same seam as DuckDuckGo;
uses httpx (already a dependency). Any failure returns [] so the co-founder degrades gracefully.
Free tier: https://tavily.com (1k searches/mo).
"""

from __future__ import annotations

import httpx

from startupkit.ports.search import SearchResult

_URL = "https://api.tavily.com/search"


class TavilySearchAdapter:
    id = "tavily"

    def __init__(self, api_key: str, timeout: float = 10.0) -> None:
        self._key = api_key
        self._timeout = timeout

    async def search(self, query: str, max_results: int = 5) -> list[SearchResult]:
        if not query.strip():
            return []
        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                resp = await client.post(
                    _URL,
                    json={
                        "api_key": self._key,
                        "query": query,
                        "max_results": max_results,
                        "search_depth": "basic",
                    },
                )
                resp.raise_for_status()
                data = resp.json()
        except (httpx.HTTPError, ValueError):
            return []

        out: list[SearchResult] = []
        for item in data.get("results", [])[:max_results]:
            url = str(item.get("url") or "")
            title = str(item.get("title") or "").strip()
            if title and url.startswith("http"):
                out.append(
                    SearchResult(title=title, url=url, snippet=str(item.get("content") or "")[:300])
                )
        return out
