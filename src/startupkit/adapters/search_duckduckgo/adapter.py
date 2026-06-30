"""DuckDuckGoSearchAdapter — SearchPort backed by DuckDuckGo's HTML endpoint. Free, no API key.

The default web-research provider (used when no TAVILY_API_KEY is set). Scrapes the lightweight
`html.duckduckgo.com` results page with httpx (already a dependency) — no new SDK. Result links are
DDG redirects (`/l/?uddg=<encoded real url>`); we decode them back to the real destination. Any
failure (network, layout change, timeout) returns [] so the co-founder degrades gracefully.
"""

from __future__ import annotations

import html
import re
from urllib.parse import parse_qs, unquote, urlparse

import httpx

from startupkit.ports.search import SearchResult

_URL = "https://html.duckduckgo.com/html/"
_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0 Safari/537.36"
    )
}
# Each result anchor: <a ... class="result__a" href="...">title</a>
_ANCHOR = re.compile(r'<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)</a>', re.DOTALL)
# Snippet: <a class="result__snippet" ...>text</a> (or a span in some layouts)
_SNIPPET = re.compile(r'class="result__snippet"[^>]*>(.*?)</a>', re.DOTALL)
_TAGS = re.compile(r"<[^>]+>")


def _clean(raw: str) -> str:
    return html.unescape(_TAGS.sub("", raw)).strip()


def _real_url(href: str) -> str:
    """DDG wraps results as //duckduckgo.com/l/?uddg=<encoded>. Decode back to the destination."""
    if href.startswith("//"):
        href = "https:" + href
    target = parse_qs(urlparse(href).query).get("uddg")
    return unquote(target[0]) if target else href


class DuckDuckGoSearchAdapter:
    id = "duckduckgo"

    def __init__(self, timeout: float = 8.0) -> None:
        self._timeout = timeout

    async def search(self, query: str, max_results: int = 5) -> list[SearchResult]:
        if not query.strip():
            return []
        try:
            async with httpx.AsyncClient(timeout=self._timeout, follow_redirects=True) as client:
                resp = await client.post(_URL, headers=_HEADERS, data={"q": query})
                resp.raise_for_status()
                body = resp.text
        except (httpx.HTTPError, httpx.InvalidURL):
            return []

        snippets = [_clean(s) for s in _SNIPPET.findall(body)]
        results: list[SearchResult] = []
        for i, (href, title) in enumerate(_ANCHOR.findall(body)):
            url = _real_url(href)
            name = _clean(title)
            if not name or not url.startswith("http"):
                continue
            results.append(
                SearchResult(title=name, url=url, snippet=snippets[i] if i < len(snippets) else "")
            )
            if len(results) >= max_results:
                break
        return results
