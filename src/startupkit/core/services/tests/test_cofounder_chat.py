"""AI Co-Founder chat tests — research grounding, fact capture, offline fallback, DDG parsing."""

from __future__ import annotations

from startupkit.adapters.model_template import TemplateModelAdapter
from startupkit.adapters.search_duckduckgo.adapter import _clean, _real_url
from startupkit.adapters.search_none import NoSearchAdapter
from startupkit.core.services.cofounder_chat import ChatTurn, IdeaChatRequest, idea_chat
from startupkit.ports.search import SearchResult
from startupkit.ports.shared import ProviderDescriptor


class _FakeModel:
    """A non-template model that echoes a canned co-founder JSON reply."""

    descriptor = ProviderDescriptor(id="groq", capability="model")

    def __init__(self, raw: str) -> None:
        self._raw = raw

    async def complete(self, system: str, prompt: str) -> str:
        self.last_prompt = prompt
        return self._raw

    async def fill_template(
        self, template: str, fields: dict[str, object], clauses: list[str]
    ) -> str:
        return ""


class _FakeSearch:
    id = "stub"

    def __init__(self, results: list[SearchResult]) -> None:
        self._results = results
        self.queried: str | None = None

    async def search(self, query: str, max_results: int = 5) -> list[SearchResult]:
        self.queried = query
        return self._results


_CANNED = (
    '{"reply": "Foundersuite already owns this.", '
    '"question": "What is your wedge?", '
    '"next_steps": ["Call 10 founders this week"], '
    '"examples": [{"company": "Foundersuite", "takeaway": "narrow first"}], '
    '"facts": {"willingness_to_pay": "$200"}, '
    '"refined_problem": "sharper", "refined_solution": "", '
    '"ready": false, "verdict": "needs-work"}'
)


async def test_chat_grounds_in_live_research_and_returns_sources() -> None:
    search = _FakeSearch(
        [SearchResult(title="Foundersuite", url="https://foundersuite.com/", snippet="raise")]
    )
    model = _FakeModel(_CANNED)
    req = IdeaChatRequest(
        problem="founders struggle to raise",
        customer="early-stage founders",
        solution="a fundraising CRM",
        user_message="here's my idea",
    )
    r = await idea_chat(req, model, search)

    # the research was actually queried and fed into the model prompt
    assert search.queried and "fundraising CRM" in search.queried
    assert "foundersuite.com" in model.last_prompt
    # sources surfaced back to the UI, plus the parsed structured fields
    assert [s.url for s in r.sources] == ["https://foundersuite.com/"]
    assert r.question == "What is your wedge?"
    assert r.next_steps == ["Call 10 founders this week"]
    assert r.examples[0].company == "Foundersuite"
    assert r.facts["willingness_to_pay"] == "$200"
    assert r.verdict == "needs-work"


async def test_chat_merges_existing_facts() -> None:
    model = _FakeModel(_CANNED)
    req = IdeaChatRequest(
        solution="x", user_message="hi", facts={"founders_interviewed": "5"}
    )
    r = await idea_chat(req, model, NoSearchAdapter())
    # NoSearch returns nothing; old + new facts both kept
    assert r.sources == []
    assert r.facts["founders_interviewed"] == "5"
    assert r.facts["willingness_to_pay"] == "$200"


async def test_offline_fallback_is_advisory_not_a_quiz() -> None:
    req = IdeaChatRequest(solution="x", user_message="i dont know just help me")
    r = await idea_chat(req, TemplateModelAdapter(), NoSearchAdapter())
    # stuck founder -> the co-founder makes the call, with steps + a question + applied examples
    assert r.next_steps and r.examples and r.question
    assert "don't build" in r.reply.lower() or "narrow" in r.reply.lower()


async def test_conversation_converges_and_stops_asking() -> None:
    # Even though the model tries to ask a question, CONCLUDE phase strips it and endorses building.
    model = _FakeModel(_CANNED.replace('"verdict": "needs-work"', '"verdict": "promising"'))
    history = [ChatTurn(role="user", content=f"msg {i}") for i in range(5)]
    req = IdeaChatRequest(solution="a fundraising CRM", user_message="ok", messages=history)
    r = await idea_chat(req, model, NoSearchAdapter())
    assert r.concluded is True
    assert r.question == ""  # stopped asking
    assert r.ready is True  # promising verdict on conclude -> endorse building


async def test_founder_can_force_wrap_up_anytime() -> None:
    model = _FakeModel(_CANNED)
    req = IdeaChatRequest(solution="x", user_message="stop asking, just build it")
    r = await idea_chat(req, model, NoSearchAdapter())
    assert r.concluded is True
    assert r.question == ""


async def test_early_turns_still_explore() -> None:
    model = _FakeModel(_CANNED)
    req = IdeaChatRequest(solution="x", user_message="here's my idea")
    r = await idea_chat(req, model, NoSearchAdapter())
    assert r.concluded is False
    assert r.question == "What is your wedge?"  # still asking early on


def test_duckduckgo_decodes_redirect_and_strips_tags() -> None:
    href = "//duckduckgo.com/l/?uddg=https%3A%2F%2Ffoundersuite.com%2F&rut=abc"
    assert _real_url(href) == "https://foundersuite.com/"
    assert _clean("<b>Founder</b>suite &amp; co") == "Foundersuite & co"
