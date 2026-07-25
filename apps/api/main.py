"""FastAPI entrypoint — Phase 1 (Foundation) surface.

Endpoints back the founder app's intake wizard and dashboard:
  POST /api/companies              -> mint a Company Object from intake
  GET  /api/companies/{id}         -> the live snapshot (10-domain digital twin)
  GET  /api/companies/{id}/health  -> 0-100 Health Score across 8 weighted dimensions
  GET  /api/companies/{id}/next    -> ranked next-best-actions (Phase 1 dependency heuristics)

Storage: InMemoryEventStore locally/Docker, or RedisEventStore (Vercel KV) when KV_REST_API_URL
is set — both implement the same EventStore Protocol, chosen in _build_store() below.
Run locally: `uv run uvicorn apps.api.main:app --reload`

On Vercel, this file is deployed via the ASGI @vercel/python builder (see apps/api/vercel.json —
deliberately NOT at the repo root, since a root-level vercel.json gets read by every Vercel
project connected to this repo, not just this one, and silently breaks the separate frontend
project's Next.js build). `includeFiles: ["../../src/**"]` bundles the src/startupkit package
alongside this file — the sys.path insert immediately below makes `from startupkit...` resolve in
that environment without the project needing to be pip-installed (it works locally too; the
insert is a no-op there since the editable install already puts src/ on the path).
"""

from __future__ import annotations

import sys
from pathlib import Path

_SRC = Path(__file__).resolve().parents[2] / "src"
if str(_SRC) not in sys.path:
    sys.path.insert(0, str(_SRC))

import base64
import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, Response
from pydantic import BaseModel

from startupkit.adapters.model_template import TemplateModelAdapter
from startupkit.core.company_object.brand_types import BrandState, PresenceItem
from startupkit.core.company_object.events import (
    DocumentGenerated,
    DocumentSubmitted,
    FounderProfileSet,
)
from startupkit.core.company_object.gtm_types import GtmState
from startupkit.core.company_object.memory_store import InMemoryEventStore
from startupkit.core.company_object.ops_types import OpsState
from startupkit.core.company_object.people_types import PeopleState
from startupkit.core.company_object.projections.health_score import HealthScore
from startupkit.core.company_object.projections.snapshot import CompanySnapshot, DocumentRecord
from startupkit.core.company_object.store import EventStore
from startupkit.core.services.advisor import SUGGESTED_QUESTIONS, Answer, ask
from startupkit.core.services.brand import (
    BrandHealth,
    ChatReply,
    CoachTip,
    PlayMatch,
    brand_chat,
    brand_coach,
    brand_health,
    check_presence,
    generate_brand_core,
    generate_visual_system,
    match_plays,
)
from startupkit.core.services.brand_assets import (
    render_site_html,
    svg_favicon,
    svg_wordmark,
)
from startupkit.core.services.case_studies import CaseStudy, relevant_case_studies
from startupkit.core.services.cofounder_chat import IdeaChatRequest, IdeaChatResponse, idea_chat
from startupkit.core.services.company_object_service import CompanyObjectService, NextAction
from startupkit.core.services.compliance import ComplianceItem, compliance_calendar
from startupkit.core.services.document_engine import DocumentEngine, GeneratedDocument
from startupkit.core.services.gtm import (
    GTM_DOCS,
    Attribution,
    ChannelMatrix,
    ContentPlanDraft,
    CustomerSuccessView,
    Deliverability,
    Discovery,
    GtmDraft,
    GtmHealth,
    Guardrail,
    MotionRead,
    PricingRead,
    attribution,
    channel_matrix,
    check_deliverability,
    customer_success,
    discover_accounts,
    export_crm_csv,
    export_sequence_csv,
    export_targets_csv,
    generate_content,
    generate_gtm,
    gtm_chat,
    gtm_health,
    read_motion,
    render_gtm_doc,
    research_pricing,
    stage_guardrails,
)
from startupkit.core.services.guardrails import GuardrailAction, GuardrailResult, check
from startupkit.core.services.idea_reasoning import IdeaReasoning, reason_about_idea
from startupkit.core.services.idea_validation import (
    IdeaAssessment,
    IdeaValidationAnswers,
    assess_idea,
)
from startupkit.core.services.intake import IntakeRequest
from startupkit.core.services.journey import Journey, journey_graph
from startupkit.core.services.recommendations import Recommendation, recommendations_for
from startupkit.core.services.risks import CompanyRisk, company_risks
from startupkit.ports.model import ModelPort
from startupkit.ports.search import SearchPort
from startupkit.workflows.catalog import (
    CATALOG,
    WorkflowDef,
    WorkflowView,
    doc_key,
    get_workflow,
    status_for,
)

app = FastAPI(title="StartupKit API", version="0.1.0")


def _load_dotenv() -> None:
    """Minimal .env loader (no dependency): set keys from a gitignored .env if present."""
    for parent in (Path.cwd(), *Path(__file__).resolve().parents):
        env = parent / ".env"
        if env.is_file():
            for line in env.read_text().splitlines():
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))
            return


_load_dotenv()

# CORS_ORIGINS is a comma-separated list, e.g. "https://startupkit.vercel.app,https://app.startupkit.com".
# Defaults to local dev only so nothing is wide-open unless explicitly configured.
_cors_origins = [
    o.strip()
    for o in os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(",")
    if o.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

def _build_store() -> EventStore:
    """Redis (Vercel KV) if attached — required there, since InMemoryEventStore's dict doesn't
    survive Vercel's serverless instance fan-out/cold starts. Falls back to in-memory otherwise
    (local dev, Docker) where one long-lived process makes that a non-issue."""
    kv_url = os.environ.get("KV_REST_API_URL")
    kv_token = os.environ.get("KV_REST_API_TOKEN")
    if kv_url and kv_token:
        from startupkit.core.company_object.redis_store import RedisEventStore

        return RedisEventStore(kv_url, kv_token)
    return InMemoryEventStore()


_store = _build_store()
_service = CompanyObjectService(_store)


def _build_model() -> ModelPort:
    """Pick the LLM: Anthropic (Claude) > Groq (free Llama) > offline template engine."""
    anthropic_key = os.environ.get("ANTHROPIC_API_KEY")
    if anthropic_key:
        from startupkit.adapters.model_anthropic.adapter import AnthropicModelAdapter

        return AnthropicModelAdapter(anthropic_key)

    groq_key = os.environ.get("GROQ_API_KEY")
    if groq_key:
        from startupkit.adapters.model_groq.adapter import GroqModelAdapter

        return GroqModelAdapter(groq_key, os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile"))

    return TemplateModelAdapter()


def _build_search() -> SearchPort:
    """Pick web research: Tavily (best, needs key) > DuckDuckGo (free) > none (offline).

    Set SEARCH_PROVIDER=none to disable live research entirely.
    """
    if os.environ.get("SEARCH_PROVIDER", "").lower() == "none":
        from startupkit.adapters.search_none import NoSearchAdapter

        return NoSearchAdapter()

    tavily_key = os.environ.get("TAVILY_API_KEY")
    if tavily_key:
        from startupkit.adapters.search_tavily import TavilySearchAdapter

        return TavilySearchAdapter(tavily_key)

    from startupkit.adapters.search_duckduckgo import DuckDuckGoSearchAdapter

    return DuckDuckGoSearchAdapter()


_model = _build_model()
_search = _build_search()
_engine = DocumentEngine(_model)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


class ValidationResult(BaseModel):
    assessment: IdeaAssessment
    reasoning: IdeaReasoning


@app.post("/api/validate-idea")
async def validate_idea(answers: IdeaValidationAnswers) -> ValidationResult:
    """Step 1 — the AI Co-Founder's verdict: assess the idea + reason about whether to build it."""
    assessment = assess_idea(answers)
    reasoning = await reason_about_idea(answers, assessment, _model)
    return ValidationResult(assessment=assessment, reasoning=reasoning)


@app.post("/api/idea-chat")
async def idea_chat_endpoint(req: IdeaChatRequest) -> IdeaChatResponse:
    """Conversational idea refinement — chat with the AI Co-Founder; it captures facts as you go."""
    return await idea_chat(req, _model, _search)


@app.post("/api/companies")
async def create_company(req: IntakeRequest) -> dict[str, str]:
    company_id = await _service.create_from_intake(req)
    return {"company_id": company_id}


@app.get("/api/companies/{company_id}")
async def get_company(company_id: str) -> CompanySnapshot:
    snap = await _service.snapshot(company_id)
    if not snap.company_id:
        raise HTTPException(status_code=404, detail="company not found")
    return snap


@app.get("/api/companies/{company_id}/health")
async def get_health(company_id: str) -> HealthScore:
    snap = await _service.snapshot(company_id)
    if not snap.company_id:
        raise HTTPException(status_code=404, detail="company not found")
    return await _service.health(company_id)


@app.get("/api/companies/{company_id}/next")
async def get_next(company_id: str) -> list[NextAction]:
    snap = await _service.snapshot(company_id)
    if not snap.company_id:
        raise HTTPException(status_code=404, detail="company not found")
    return await _service.next_actions(company_id)


@app.get("/api/companies/{company_id}/compliance")
async def get_compliance(company_id: str) -> list[ComplianceItem]:
    """The per-company compliance calendar — what's due, when, and what's overdue."""
    snap = await _service.snapshot(company_id)
    if not snap.company_id:
        raise HTTPException(status_code=404, detail="company not found")
    return compliance_calendar(snap)


async def _snapshot_or_404(company_id: str) -> CompanySnapshot:
    snap = await _service.snapshot(company_id)
    if not snap.company_id:
        raise HTTPException(status_code=404, detail="company not found")
    return snap


async def _workflow_status(company_id: str) -> dict[str, str]:
    snap = await _service.snapshot(company_id)
    return {v.definition.code: v.status for v in status_for(snap)}


@app.get("/api/companies/{company_id}/risks")
async def get_risks(company_id: str) -> list[CompanyRisk]:
    """The consolidated risk register across the whole Company Object."""
    snap = await _snapshot_or_404(company_id)
    return company_risks(snap, await _workflow_status(company_id))


@app.get("/api/companies/{company_id}/journey")
async def get_journey(company_id: str) -> Journey:
    """The founder journey graph — where you are and the next step, matched to winning moves."""
    snap = await _snapshot_or_404(company_id)
    return journey_graph(snap, await _workflow_status(company_id))


@app.get("/api/companies/{company_id}/recommendations")
async def get_recommendations(company_id: str) -> list[Recommendation]:
    """Rich, prioritized recommendations: why, reasoning, steps, deadline, expected outcome."""
    snap = await _snapshot_or_404(company_id)
    return recommendations_for(snap, await _workflow_status(company_id))


@app.get("/api/companies/{company_id}/case-studies")
async def get_case_studies(company_id: str) -> list[CaseStudy]:
    """Relevant founder case studies — failures to avoid and successes to emulate."""
    snap = await _snapshot_or_404(company_id)
    return relevant_case_studies(snap, await _workflow_status(company_id))


class AskRequest(BaseModel):
    question: str


class AskResponse(BaseModel):
    answer: Answer
    suggested: list[str]


@app.post("/api/companies/{company_id}/ask")
async def ask_cofounder(company_id: str, req: AskRequest) -> AskResponse:
    """AI Co-Founder — a grounded answer to the founder's question."""
    snap = await _snapshot_or_404(company_id)
    answer = ask(req.question, snap, await _workflow_status(company_id))
    return AskResponse(answer=answer, suggested=SUGGESTED_QUESTIONS)


@app.post("/api/companies/{company_id}/guardrail/{action}")
async def check_guardrail(company_id: str, action: GuardrailAction) -> GuardrailResult:
    """Real-time guardrail: can the founder safely take this action yet?"""
    snap = await _snapshot_or_404(company_id)
    return check(action, snap, await _workflow_status(company_id))


# --- W5 · Brand & Product Foundation -----------------------------------------------------------


class CheckNameInput(BaseModel):
    name: str


@app.post("/api/brand/check-name")
async def brand_check_name(req: CheckNameInput) -> list[PresenceItem]:
    """Heuristic domain/handle/trademark read for a name — no company required.

    Shared by intake (an early nudge before formation) and W5 (the authoritative check,
    persisted onto the Brand Core) so there is one real engine behind both, not two.
    """
    return await check_presence(req.name, search=_search)


@app.get("/api/companies/{company_id}/brand/plays")
async def brand_plays(company_id: str) -> list[PlayMatch]:
    """Rank the proven Brand Plays for this company (backed by real named brands)."""
    snap = await _snapshot_or_404(company_id)
    return match_plays(snap)


class GenerateBrandInput(BaseModel):
    play_id: str = ""


@app.post("/api/companies/{company_id}/brand/generate")
async def brand_generate(company_id: str, req: GenerateBrandInput) -> BrandState:
    """Generate a Brand Core + visual system grounded in the chosen Brand Play. Does not persist."""
    snap = await _snapshot_or_404(company_id)
    core = await generate_brand_core(snap, req.play_id, model=_model, search=_search)
    visual = generate_visual_system(core)
    presence = await check_presence(snap.name, search=_search)
    return BrandState(core=core, visual=visual, presence=presence)


@app.post("/api/companies/{company_id}/brand")
async def save_brand(company_id: str, state: BrandState) -> CompanySnapshot:
    """Persist the founder's edited Brand Core — the source of truth the site/deck read from."""
    await _snapshot_or_404(company_id)
    await _service.set_brand(company_id, state)
    return await _service.snapshot(company_id)


@app.post("/api/companies/{company_id}/people")
async def save_people(company_id: str, state: PeopleState) -> CompanySnapshot:
    """W6 · Persist the hiring plan, employee roster, and step progress."""
    await _snapshot_or_404(company_id)
    await _service.set_people(company_id, state)
    return await _service.snapshot(company_id)


@app.post("/api/companies/{company_id}/gtm")
async def save_gtm(company_id: str, state: GtmState) -> CompanySnapshot:
    """W7 · Persist the revenue engine — motion, pricing, accounts, sequences, connections."""
    await _snapshot_or_404(company_id)
    await _service.set_gtm(company_id, state)
    return await _service.snapshot(company_id)


@app.post("/api/companies/{company_id}/ops")
async def save_ops(company_id: str, state: OpsState) -> CompanySnapshot:
    """W8 · Persist the operating system — cadences, SOPs, vendors, risks, policies."""
    await _snapshot_or_404(company_id)
    await _service.set_ops(company_id, state)
    return await _service.snapshot(company_id)


@app.post("/api/companies/{company_id}/gtm/generate")
async def gtm_generate(company_id: str) -> GtmDraft:
    """W7 · Draft the GTM engine from the Company Object + Brand Core. Does not persist."""
    snap = await _snapshot_or_404(company_id)
    return await generate_gtm(snap, model=_model)


@app.post("/api/companies/{company_id}/gtm/discover")
async def gtm_discover(company_id: str, trigger: str = "") -> Discovery:
    """W7 · Research the market from the ICP and propose real named accounts. Does not persist.

    W7 used to ask the founder to type 50 company names. Now it does the homework — they approve.
    """
    snap = await _snapshot_or_404(company_id)
    return await discover_accounts(snap, trigger=trigger, model=_model, search=_search)


@app.post("/api/companies/{company_id}/gtm/motion")
async def gtm_motion(company_id: str) -> MotionRead:
    """W7 · Infer the motion signals from the Company Object — don't ask what we already know."""
    snap = await _snapshot_or_404(company_id)
    return await read_motion(snap, model=_model)


@app.get("/api/companies/{company_id}/gtm/deliverability")
async def gtm_deliverability(company_id: str, domain: str = "") -> Deliverability:
    """W7 · Real SPF/DMARC/MX checks on the founder's sending domain (DNS-over-HTTPS)."""
    snap = await _snapshot_or_404(company_id)
    target = domain or (snap.website or "") or snap.owner_email.split("@")[-1]
    return await check_deliverability(target)


@app.post("/api/companies/{company_id}/gtm/content/generate")
async def gtm_content(company_id: str) -> ContentPlanDraft:
    """W7 · Content ideas from the Brand Core — so the PLG recommendation isn't a dead end."""
    snap = await _snapshot_or_404(company_id)
    return await generate_content(snap, model=_model)


@app.post("/api/companies/{company_id}/gtm/pricing")
async def gtm_pricing(company_id: str) -> PricingRead:
    """W7 · Research what comparable companies charge and propose tiers. Does not persist."""
    snap = await _snapshot_or_404(company_id)
    return await research_pricing(snap, model=_model, search=_search)


@app.get("/api/companies/{company_id}/gtm/health")
async def get_gtm_health(company_id: str) -> GtmHealth:
    """W7 · Score the revenue engine on what's actually done, never on what's typed in."""
    snap = await _snapshot_or_404(company_id)
    return gtm_health(snap.gtm)


@app.get("/api/companies/{company_id}/gtm/channels")
async def gtm_channels(company_id: str, motion: str = "") -> ChannelMatrix:
    """W7 · Every channel ranked for this motion: 2 bets, the rest ignored with a reason."""
    snap = await _snapshot_or_404(company_id)
    return channel_matrix(snap, motion=motion)


@app.get("/api/companies/{company_id}/gtm/guardrails")
async def gtm_guardrails(company_id: str) -> list[Guardrail]:
    """W7 · The pipeline talks back — warnings computed from real account stages."""
    snap = await _snapshot_or_404(company_id)
    return stage_guardrails(snap.gtm)


@app.get("/api/companies/{company_id}/gtm/attribution")
async def gtm_attribution(company_id: str) -> Attribution:
    """W7 · Which trigger is producing conversations, computed from real stages."""
    snap = await _snapshot_or_404(company_id)
    return attribution(snap.gtm)


@app.get("/api/companies/{company_id}/gtm/customer-success")
async def gtm_customer_success(company_id: str) -> CustomerSuccessView:
    """W7 · Retention and referrals for won accounts — closing isn't the finish line."""
    snap = await _snapshot_or_404(company_id)
    return customer_success(snap.gtm)


class GtmChatInput(BaseModel):
    message: str
    history: list[str] = []


@app.post("/api/companies/{company_id}/gtm/chat")
async def gtm_chat_endpoint(company_id: str, req: GtmChatInput) -> ChatReply:
    """W7 · GTM Q&A grounded in the founder's own pipeline numbers."""
    snap = await _snapshot_or_404(company_id)
    return await gtm_chat(snap, req.message, req.history, model=_model)


@app.get("/api/companies/{company_id}/gtm/export/{kind}.csv")
async def gtm_export(company_id: str, kind: str) -> Response:
    """W7 · Hand the decision off to the tool that executes it — we orchestrate, we don't rebuild.

    targets -> Clay / Apollo · sequence -> Instantly / Smartlead · crm -> HubSpot / Attio
    """
    snap = await _snapshot_or_404(company_id)
    builders = {
        "targets": export_targets_csv,
        "sequence": export_sequence_csv,
        "crm": export_crm_csv,
    }
    build = builders.get(kind)
    if build is None:
        raise HTTPException(status_code=404, detail="unknown export")
    slug = snap.name.lower().replace(" ", "-") or "company"
    return Response(
        content=build(snap),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{slug}-{kind}.csv"'},
    )


@app.get("/api/companies/{company_id}/gtm/docs")
async def gtm_docs_list(company_id: str) -> list[dict[str, str]]:
    """W7 · The five documents the catalog promises, generated from the Company Object."""
    await _snapshot_or_404(company_id)
    return [{"key": k, "name": v} for k, v in GTM_DOCS.items()]


@app.get("/api/companies/{company_id}/gtm/docs/{doc_key}.md")
async def gtm_doc(company_id: str, doc_key: str) -> Response:
    snap = await _snapshot_or_404(company_id)
    try:
        body = render_gtm_doc(snap, doc_key)
    except KeyError:
        raise HTTPException(status_code=404, detail="unknown document") from None
    return Response(
        content=body,
        media_type="text/markdown",
        headers={"Content-Disposition": f'attachment; filename="{doc_key}.md"'},
    )


@app.get("/api/companies/{company_id}/brand/health")
async def get_brand_health(company_id: str) -> BrandHealth:
    snap = await _snapshot_or_404(company_id)
    return brand_health(snap.brand)


class CoachInput(BaseModel):
    step: str = "define"  # define | design | deploy
    play_id: str = ""


@app.post("/api/companies/{company_id}/brand/coach")
async def brand_coach_endpoint(company_id: str, req: CoachInput) -> CoachTip:
    """The AI co-founder's guidance for a W5 step, grounded in real brand case studies."""
    snap = await _snapshot_or_404(company_id)
    play = req.play_id or (snap.brand.core.play_id if snap.brand else "")
    return await brand_coach(snap, play, req.step, model=_model)


# --- W5 production layer: generated logo, favicon, and the published site ------------------------


@app.get("/api/companies/{company_id}/brand/wordmark.svg")
async def brand_wordmark(company_id: str) -> Response:
    snap = await _snapshot_or_404(company_id)
    svg = svg_wordmark(snap.name, snap.brand.visual)
    return Response(content=svg, media_type="image/svg+xml")


@app.get("/api/companies/{company_id}/brand/favicon.svg")
async def brand_favicon(company_id: str) -> Response:
    snap = await _snapshot_or_404(company_id)
    svg = svg_favicon(snap.name, snap.brand.visual)
    return Response(content=svg, media_type="image/svg+xml")


@app.get("/site/{company_id}")
async def published_site(company_id: str, template: str | None = None) -> HTMLResponse:
    """The founder's published landing page — a real hosted page rendered from the Brand Core."""
    snap = await _snapshot_or_404(company_id)
    return HTMLResponse(content=render_site_html(snap, template))


class BrandChatInput(BaseModel):
    message: str
    history: list[str] = []


@app.post("/api/companies/{company_id}/brand/chat")
async def brand_chat_endpoint(company_id: str, req: BrandChatInput) -> ChatReply:
    """Conversational branding Q&A with the AI co-founder, grounded in the Brand Core."""
    snap = await _snapshot_or_404(company_id)
    return await brand_chat(snap, req.message, req.history, model=_model)


# --- Founder Input Layer -----------------------------------------------------------------------


@app.post("/api/companies/{company_id}/founder-profile")
async def set_founder_profile(company_id: str, profile: FounderProfileSet) -> CompanySnapshot:
    await _snapshot_or_404(company_id)
    await _service.set_founder_profile(company_id, profile)
    return await _service.snapshot(company_id)


class MilestoneInput(BaseModel):
    title: str
    category: str = "other"
    occurred_on: str
    note: str = ""


@app.post("/api/companies/{company_id}/milestones")
async def add_milestone(company_id: str, m: MilestoneInput) -> CompanySnapshot:
    await _snapshot_or_404(company_id)
    await _service.log_milestone(company_id, m.title, m.category, m.occurred_on, m.note)
    return await _service.snapshot(company_id)


class IntegrationInput(BaseModel):
    provider: str
    capability: str


@app.post("/api/companies/{company_id}/integrations")
async def connect_integration(company_id: str, i: IntegrationInput) -> CompanySnapshot:
    await _snapshot_or_404(company_id)
    await _service.connect_integration(company_id, i.provider, i.capability)
    return await _service.snapshot(company_id)


class NoteInput(BaseModel):
    kind: str = "note"
    text: str


@app.post("/api/companies/{company_id}/notes")
async def add_note(company_id: str, n: NoteInput) -> CompanySnapshot:
    await _snapshot_or_404(company_id)
    await _service.record_note(company_id, n.kind, n.text)
    return await _service.snapshot(company_id)


class EvidenceInput(BaseModel):
    name: str
    kind: str = "other"
    ref: str = ""
    note: str = ""


@app.post("/api/companies/{company_id}/evidence")
async def add_evidence(company_id: str, ev: EvidenceInput) -> CompanySnapshot:
    await _snapshot_or_404(company_id)
    await _service.add_evidence(company_id, ev.name, ev.kind, ev.ref, ev.note)
    return await _service.snapshot(company_id)


class AssessmentInput(BaseModel):
    phase: int
    answers: dict[str, str]


@app.post("/api/companies/{company_id}/assessment")
async def save_assessment(company_id: str, a: AssessmentInput) -> CompanySnapshot:
    """Save answers to an early-journey assessment phase (Pre-Founder ... First Revenue)."""
    await _snapshot_or_404(company_id)
    await _service.save_assessment(company_id, a.phase, a.answers)
    return await _service.snapshot(company_id)


@app.get("/api/workflows")
async def list_workflows() -> list[WorkflowDef]:
    """The static W1-W8 catalog (no company context)."""
    return CATALOG


@app.get("/api/workflows/{code}")
async def get_workflow_def(code: str) -> WorkflowDef:
    wf = get_workflow(code.upper())
    if wf is None:
        raise HTTPException(status_code=404, detail="workflow not found")
    return wf


@app.get("/api/companies/{company_id}/workflows")
async def company_workflows(company_id: str) -> list[WorkflowView]:
    """The W1-W8 catalog with live status (locked / available / in-progress / complete)."""
    snap = await _service.snapshot(company_id)
    if not snap.company_id:
        raise HTTPException(status_code=404, detail="company not found")
    return status_for(snap)


@app.post("/api/companies/{company_id}/workflows/{code}/phases/{phase_n}/complete")
async def complete_phase(company_id: str, code: str, phase_n: int) -> WorkflowView:
    """Mark a workflow phase done (StartupKit did it, or the founder confirms they did)."""
    snap = await _service.snapshot(company_id)
    if not snap.company_id:
        raise HTTPException(status_code=404, detail="company not found")

    wf = get_workflow(code.upper(), snap.entity_type)
    if wf is None:
        raise HTTPException(status_code=404, detail="workflow not found")
    if not any(p.n == phase_n for p in wf.phases):
        raise HTTPException(status_code=400, detail="no such phase in this workflow")

    # gate: can't act on a workflow whose dependencies aren't complete
    current = {v.definition.code: v for v in status_for(snap)}
    if current[wf.code].status == "locked":
        raise HTTPException(status_code=409, detail=current[wf.code].blocked_reason)

    await _service.complete_phase(company_id, wf.code, phase_n)
    updated = {v.definition.code: v for v in status_for(await _service.snapshot(company_id))}
    return updated[wf.code]


class GenerateResult(BaseModel):
    documents: list[GeneratedDocument]
    workflow: WorkflowView


@app.post("/api/companies/{company_id}/workflows/{code}/phases/{phase_n}/generate")
async def generate_phase(company_id: str, code: str, phase_n: int) -> GenerateResult:
    """The ⚡ 'do it for me' action: generate the phase docs, store them, complete the phase."""
    snap = await _service.snapshot(company_id)
    if not snap.company_id:
        raise HTTPException(status_code=404, detail="company not found")
    wf = get_workflow(code.upper(), snap.entity_type)
    if wf is None:
        raise HTTPException(status_code=404, detail="workflow not found")
    phase = next((p for p in wf.phases if p.n == phase_n), None)
    if phase is None:
        raise HTTPException(status_code=400, detail="no such phase in this workflow")

    current = {v.definition.code: v for v in status_for(snap)}
    if current[wf.code].status == "locked":
        raise HTTPException(status_code=409, detail=current[wf.code].blocked_reason)

    doc_types = [d.name for d in phase.documents if d.required]
    generated = await _engine.generate(snap, wf.code, phase_n, doc_types)
    await _service.store_documents(
        company_id, [DocumentGenerated(**g.model_dump()) for g in generated]
    )
    await _service.complete_phase(company_id, wf.code, phase_n)

    updated = {v.definition.code: v for v in status_for(await _service.snapshot(company_id))}
    return GenerateResult(documents=generated, workflow=updated[wf.code])


@app.get("/api/companies/{company_id}/documents")
async def list_documents(company_id: str) -> list[DocumentRecord]:
    snap = await _service.snapshot(company_id)
    if not snap.company_id:
        raise HTTPException(status_code=404, detail="company not found")
    return snap.documents


# --- Founder-completed documents: fill the template, or upload a copy ----------------------------

# Vercel's filesystem is read-only except /tmp (present via the VERCEL env var it auto-sets).
# /tmp there is ephemeral per-instance — same caveat as the event store without Redis attached —
# but at least the write succeeds instead of silently no-op'ing under the read-only-fs except below.
_UPLOAD_DIR = (
    Path("/tmp/uploads")
    if os.environ.get("VERCEL")
    else Path(__file__).resolve().parents[2] / "var" / "uploads"
)


class FillRequest(BaseModel):
    workflow_code: str
    phase_n: int
    doc_name: str
    fields: dict[str, str] = {}


class UploadRequest(BaseModel):
    workflow_code: str
    phase_n: int
    doc_name: str
    filename: str
    content_base64: str = ""  # optional raw bytes so we actually keep the uploaded file


class SubmitResult(BaseModel):
    workflow: WorkflowView
    submitted: list[str]  # doc_keys completed in this phase so far


async def _record_submission(
    company_id: str,
    code: str,
    phase_n: int,
    doc_name: str,
    method: str,
    fields: dict[str, str],
    filename: str,
) -> SubmitResult:
    """Record a filled/uploaded document, then complete the phase once all required docs are in."""
    snap = await _service.snapshot(company_id)
    if not snap.company_id:
        raise HTTPException(status_code=404, detail="company not found")
    wf = get_workflow(code.upper(), snap.entity_type)
    if wf is None:
        raise HTTPException(status_code=404, detail="workflow not found")
    phase = next((p for p in wf.phases if p.n == phase_n), None)
    if phase is None:
        raise HTTPException(status_code=400, detail="no such phase in this workflow")
    if doc_name not in {d.name for d in phase.documents}:
        raise HTTPException(status_code=400, detail="no such document in this phase")
    current = {v.definition.code: v for v in status_for(snap)}
    if current[wf.code].status == "locked":
        raise HTTPException(status_code=409, detail=current[wf.code].blocked_reason)

    await _service.submit_document(
        company_id,
        DocumentSubmitted(
            doc_key=doc_key(wf.code, doc_name),
            workflow_code=wf.code,
            phase_n=phase_n,
            doc_name=doc_name,
            method=method,
            fields=fields,
            filename=filename,
        ),
    )

    # Auto-complete the phase once every REQUIRED document in it has been filled or uploaded.
    snap = await _service.snapshot(company_id)
    required = [d for d in phase.documents if d.required]
    all_done = bool(required) and all(
        doc_key(wf.code, d.name) in snap.submitted_documents for d in required
    )
    if all_done and phase_n not in snap.completed_phases.get(wf.code, []):
        await _service.complete_phase(company_id, wf.code, phase_n)
        snap = await _service.snapshot(company_id)

    submitted = [
        s.doc_key
        for s in snap.submitted_documents.values()
        if s.workflow_code == wf.code and s.phase_n == phase_n
    ]
    updated = {v.definition.code: v for v in status_for(snap)}
    return SubmitResult(workflow=updated[wf.code], submitted=submitted)


@app.post("/api/companies/{company_id}/documents/fill")
async def fill_document(company_id: str, req: FillRequest) -> SubmitResult:
    """Founder filled a template's fields → mark the document complete."""
    return await _record_submission(
        company_id, req.workflow_code, req.phase_n, req.doc_name, "filled", req.fields, ""
    )


@app.post("/api/companies/{company_id}/documents/upload")
async def upload_document(company_id: str, req: UploadRequest) -> SubmitResult:
    """Founder uploaded their own copy → store it and mark the document complete."""
    safe = (req.filename or "upload").replace("/", "_").replace("..", "_")
    if req.content_base64:
        dest_dir = _UPLOAD_DIR / company_id
        dest_dir.mkdir(parents=True, exist_ok=True)
        try:
            payload = req.content_base64.split(",", 1)[-1]  # tolerate data: URL prefix
            (dest_dir / f"{doc_key(req.workflow_code.upper(), req.doc_name)}__{safe}").write_bytes(
                base64.b64decode(payload)
            )
        except (ValueError, OSError):
            pass  # storing the bytes is best-effort; the submission still counts
    return await _record_submission(
        company_id, req.workflow_code, req.phase_n, req.doc_name, "uploaded", {}, safe
    )
