"""The W1-W8 workflow catalog — the founder-facing 'what to do' content, as DATA.

This is the presentation/sequencing layer (distinct from the Temporal execution manifests in each
w*/manifest.py). It encodes, per workflow: the goal, the ordered phases, each phase's documents and
*who does the work*, and the dependency edges that gate it. Content is transcribed from the Guidance
workflow diagrams (Business Formation, Legal & Compliance, Financial Infra, Brand, HR, GTM, Ops).

Each phase has an `actor` + `mode`: StartupKit (or a provider) can do it *for* the founder, or the
founder does it themselves and confirms. `status_for(snapshot)` derives each workflow's live status
and progress from the `workflow.phase.completed` events in the Company Object.

Importing `core` from `workflows` is allowed by import-linter; `core` never imports us.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

from startupkit.core.company_object.projections.snapshot import CompanySnapshot

WorkflowCode = Literal["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"]
WorkflowStatus = Literal["locked", "available", "in-progress", "complete"]

# Who performs the phase, and how:
#   startupkit = StartupKit generates / orchestrates it
#   provider   = executed through an integrated third-party tool (Stripe Atlas, Mercury, ...)
#   founder    = the founder does it themselves, then confirms
Actor = Literal["startupkit", "provider", "founder"]
# automated = one click, we handle it · assisted = we draft, you approve · manual = you do it
Mode = Literal["automated", "assisted", "manual"]


class DocField(BaseModel):
    """One blank in a document template the founder fills in."""

    key: str
    label: str
    placeholder: str = ""
    kind: Literal["text", "textarea", "date", "number", "money"] = "text"
    prefill: str = ""  # token resolved from the company, e.g. "company.name" — optional


class DocumentDef(BaseModel):
    name: str
    required: bool = True
    critical: bool = False  # irreversible / fuse documents (e.g. 83(b))
    note: str = ""
    # When present, the document is a fillable template the founder can complete in-app. `template`
    # is themed markdown with {{field_key}} / {{company.*}} tokens; `fields` are the blanks.
    fields: list[DocField] = []
    template: str = ""
    # When present, this is a guided TASK (e.g. "set up your GitHub org") — themed markdown how-to
    # steps shown in the modal, completed by "Mark as done" (optionally uploading proof).
    guidance: str = ""


def doc_key(workflow_code: str, name: str) -> str:
    """Stable id for a (workflow, document) pair — e.g. 'W1-certificate-of-incorporation'."""
    slug = "".join(c if c.isalnum() else "-" for c in name.lower())
    while "--" in slug:
        slug = slug.replace("--", "-")
    return f"{workflow_code}-{slug.strip('-')}"


class Phase(BaseModel):
    n: int
    name: str
    summary: str
    actor: Actor = "startupkit"
    mode: Mode = "assisted"
    cta: str = "Mark complete"
    documents: list[DocumentDef] = []


class WorkflowDef(BaseModel):
    code: WorkflowCode
    slug: str
    name: str
    goal: str
    color: str
    depends_on: list[WorkflowCode] = []
    unlocks: list[WorkflowCode] = []
    phases: list[Phase] = []


class WorkflowView(BaseModel):
    """A workflow + its live status for one company."""

    definition: WorkflowDef
    status: WorkflowStatus
    progress_pct: int
    completed_phases: list[int] = []
    blocked_reason: str = ""


STAGE_SEQUENCE: list[str] = [
    "pre-founder",
    "discovery",
    "problem-solution-fit",
    "mvp-build",
    "first-revenue",
    "pmf",
    "pre-seed",
    "series-a",
]


# --- W1 Business Formation ----------------------------------------------------------------------

W1 = WorkflowDef(
    code="W1",
    slug="formation",
    name="Business Formation",
    goal="Create the legal entity: incorporate, issue founder stock, file 83(b), get your EIN.",
    color="#185FA5",
    depends_on=[],
    unlocks=["W2", "W3", "W4", "W5", "W6", "W8"],
    phases=[
        # Company identity (entity type, jurisdiction, name) is captured during onboarding, so W1
        # starts at the document work. Spec phases: Documents & Filing -> Ownership & 83(b) ->
        # Federal & Finalize (which fires entity.formed / ein.received to unlock W2/W3/W6).
        Phase(
            n=1,
            name="Documents & Filing",
            summary="Generate the formation documents, get all founders to sign, and file.",
            actor="startupkit",
            mode="assisted",
            cta="Generate, sign & file",
            documents=[
                DocumentDef(name="Certificate of Incorporation"),
                DocumentDef(name="Incorporator Statement & Organizer Documents"),
                DocumentDef(name="Bylaws"),
                DocumentDef(name="Initial Board Consent"),
            ],
        ),
        Phase(
            n=2,
            name="Ownership & 83(b)",
            summary="Issue founder shares, record the cap table, and file the 83(b) in 30 days.",
            actor="founder",
            mode="manual",
            cta="Issue shares & file 83(b)",
            documents=[
                DocumentDef(name="Founder Stock Purchase Agreement (FSPA)"),
                DocumentDef(name="Stock Ledger"),
                DocumentDef(name="Cap Table"),
                DocumentDef(
                    name="83(b) Election",
                    critical=True,
                    note="IRS Form 15620 — file within 30 days of the stock grant. No extensions.",
                ),
            ],
        ),
        Phase(
            n=3,
            name="Federal & Finalize",
            summary="Get the federal tax ID (EIN) and stand up ongoing compliance.",
            actor="provider",
            mode="automated",
            cta="Apply for EIN",
            documents=[
                DocumentDef(name="EIN Confirmation Letter"),
                DocumentDef(name="Registered Agent Agreement"),
                DocumentDef(name="Delaware Franchise Tax registration"),
                DocumentDef(name="Compliance Calendar"),
            ],
        ),
    ],
)

# --- W2 IP & Legal ------------------------------------------------------------------------------

W2 = WorkflowDef(
    code="W2",
    slug="ip-legal",
    name="IP & Legal Contracts",
    goal="Own your IP, then put the confidentiality and commercial contract framework in place.",
    color="#534AB7",
    depends_on=["W1"],
    unlocks=["W6"],
    phases=[
        # Journey (w2-legal-journey.md): you cannot protect what you have not claimed, and you
        # cannot engage others before your own house is in order. Internal IP ownership first,
        # then confidentiality, then third-party engagement, then conditional/compliance docs.
        Phase(
            n=1,
            name="Establish IP ownership",
            summary="Authorize the IP framework, then transfer each founder's past & future work.",
            actor="startupkit",
            mode="assisted",
            cta="Generate & sign IP documents",
            documents=[
                DocumentDef(
                    name="Founders' Agreement",
                    note="Roles, equity, vesting, decision-making, and founder departures.",
                ),
                DocumentDef(
                    name="Technology Assignment Agreement (TAA)",
                    note="Assigns pre-incorporation intellectual property to the company.",
                ),
                DocumentDef(
                    name="Proprietary Information & Inventions Agreement (PIIA)",
                    note="Covers future work; gates the first hire. Reused by every hire.",
                ),
            ],
        ),
        Phase(
            n=2,
            name="Confirm IP ownership",
            summary="A clean, data-room-ready record of exactly what the company now owns.",
            actor="startupkit",
            mode="automated",
            cta="Generate confirmation letter",
            documents=[
                DocumentDef(name="Invention Assignment Confirmation Letter"),
            ],
        ),
        Phase(
            n=3,
            name="Confidentiality framework",
            summary="Reusable NDAs for confidential information shared with third parties.",
            actor="startupkit",
            mode="automated",
            cta="Generate NDA templates",
            documents=[
                DocumentDef(name="NDA — One-Way"),
                DocumentDef(name="NDA — Mutual"),
            ],
        ),
        Phase(
            n=4,
            name="Third-party engagement",
            summary="The contracts you deploy to engage contractors, creatives, clients, vendors.",
            actor="founder",
            mode="assisted",
            cta="Generate engagement templates",
            documents=[
                DocumentDef(name="Independent Contractor Agreement (ICA)"),
                DocumentDef(name="MSA — Client-Facing"),
                DocumentDef(name="MSA — Vendor-Facing"),
                DocumentDef(name="Statement of Work (SOW)"),
                DocumentDef(
                    name="Service Level Agreement (SLA)",
                    required=False,
                    note="Attach when you commit to uptime or support targets.",
                ),
                DocumentDef(name="Advisor Agreement", required=False),
            ],
        ),
        Phase(
            n=5,
            name="Conditional & compliance",
            summary="Add these when they apply: AI use and processing personal data.",
            actor="startupkit",
            mode="assisted",
            cta="Generate applicable documents",
            documents=[
                DocumentDef(
                    name="AI Addendum",
                    required=False,
                    note="If the company builds with or ships AI.",
                ),
                DocumentDef(
                    name="Data Processing Addendum (DPA)",
                    required=False,
                    note="If you process another party's personal data.",
                ),
            ],
        ),
    ],
)

# --- W3 Financial Infrastructure ----------------------------------------------------------------

W3 = WorkflowDef(
    code="W3",
    slug="financial",
    name="Financial Infrastructure",
    goal="Set up your money stack — banking, cards, tax, accounting, payments — then raise.",
    color="#0F6E56",
    depends_on=["W1"],
    unlocks=[],
    phases=[
        # StartupKit guides + records (self-reported); it never submits applications, verifies, or
        # stores account credentials. Connect = the money tools (guided setup, per
        # W3/w3-system-steps.md). Configure = tax + books. Generate = the real documents.
        Phase(
            n=1,
            name="Connect",
            summary="Set up your money tools — StartupKit guides you and records what's done.",
            actor="founder",
            mode="manual",
            cta="Confirm my money stack",
            documents=[
                DocumentDef(
                    name="Business Banking",
                    note="Keeps company money separate — what protects your liability shield.",
                ),
                DocumentDef(
                    name="Corporate Card",
                    note="Company spend without a personal guarantee.",
                    required=False,
                ),
                DocumentDef(
                    name="Accounting Setup",
                    note="The books your accountant + investors expect.",
                ),
                DocumentDef(
                    name="Payment Processing",
                    note="How revenue arrives. Unblocks W7's first payment.",
                    required=False,
                ),
            ],
        ),
        Phase(
            n=2,
            name="Configure",
            summary="Your tax profile and opening books — generated from what StartupKit knows.",
            actor="startupkit",
            mode="assisted",
            cta="Confirm tax & books",
            documents=[
                DocumentDef(
                    name="Tax Setup",
                    note="Federal + state + Delaware deadlines, added to one compliance calendar.",
                ),
                DocumentDef(
                    name="Chart of Accounts",
                    note="The standard startup account structure for your books.",
                ),
                DocumentDef(
                    name="Opening Balance Sheet",
                    note="Day-one books, auto-built from your cap table.",
                    required=False,
                ),
            ],
        ),
        Phase(
            n=3,
            name="Generate",
            summary="The real documents — a financial policy now, SAFEs when you raise.",
            actor="startupkit",
            mode="assisted",
            cta="Generate documents",
            documents=[
                DocumentDef(
                    name="Financial & Expense Policy",
                    note="Spending limits, approvals, reimbursement — adopted by the board.",
                ),
                DocumentDef(
                    name="SAFE — Post-Money Valuation Cap",
                    note="YC standard first-money. Delaware C-Corp only.",
                    required=False,
                ),
                DocumentDef(
                    name="SAFE — Post-Money Discount",
                    note="YC SAFE priced by discount instead of a cap.",
                    required=False,
                ),
                DocumentDef(
                    name="SAFE — Post-Money MFN",
                    note="YC SAFE with no cap/discount — matches later, better terms.",
                    required=False,
                ),
                DocumentDef(
                    name="Board Consent — SAFE Issuance",
                    note="The §141(f) board approval that authorizes the SAFE.",
                    required=False,
                ),
                DocumentDef(
                    name="Pro Rata Side Letter",
                    note="Investor's right to keep their % next round (pairs with a Cap SAFE).",
                    required=False,
                ),
            ],
        ),
    ],
)

# --- W4 Technical Infrastructure ----------------------------------------------------------------

W4 = WorkflowDef(
    code="W4",
    slug="technical",
    name="Technical Infrastructure",
    goal="Stand up domain, email, code, hosting, and auth — with IP-clean commits.",
    color="#BA7517",
    depends_on=["W1"],
    unlocks=[],
    phases=[
        Phase(
            n=1,
            name="Domain & email",
            summary="Register the domain and set up professional business email.",
            actor="provider",
            mode="automated",
            cta="Register domain & email",
            documents=[
                DocumentDef(name="Domain registration"),
                DocumentDef(name="Business email setup (Google Workspace)"),
            ],
        ),
        Phase(
            n=2,
            name="Code repository",
            summary="Create the GitHub org — commits gated on a signed PIIA.",
            actor="provider",
            mode="automated",
            cta="Create GitHub org",
            documents=[DocumentDef(name="GitHub organization (PIIA-gated)")],
        ),
        Phase(
            n=3,
            name="Hosting & infra",
            summary="Deploy on managed hosting (Vercel / Supabase).",
            actor="provider",
            mode="automated",
            cta="Provision hosting",
            documents=[DocumentDef(name="Hosting + database provisioning")],
        ),
        Phase(
            n=4,
            name="Auth & security",
            summary="Set up authentication and baseline security controls.",
            actor="founder",
            mode="manual",
            cta="Configure & confirm",
            documents=[
                DocumentDef(name="Auth provider setup"),
                DocumentDef(name="Security baseline"),
            ],
        ),
    ],
)

# --- W5 Brand & Product Foundation --------------------------------------------------------------

W5 = WorkflowDef(
    code="W5",
    slug="brand",
    name="Brand & Product Foundation",
    goal="Turn what StartupKit knows about you into a living brand — strategy, identity, and "
    "launch assets, all synced.",
    color="#D85A30",
    depends_on=["W1"],
    unlocks=["W7"],
    phases=[
        # Not a document folder: StartupKit generates a living Brand Core from the Company Object,
        # grounded in a proven Brand Play (real named brands). Define → Design → Deploy; interactive
        # first, export on demand. The custom W5 view renders this; the catalog drives progress.
        Phase(
            n=1,
            name="Define",
            summary="StartupKit picks a proven Brand Play for you and drafts a living Brand Core — "
            "positioning, voice, and message — from what it already knows. You refine it.",
            actor="startupkit",
            mode="assisted",
            cta="Generate my Brand Core",
            documents=[
                DocumentDef(
                    name="Brand Core",
                    note="Strategy, positioning, and messaging — the single source of truth.",
                ),
                DocumentDef(
                    name="Positioning Statement",
                    note="The one sentence your site, deck, and sales scripts ladder up to.",
                ),
            ],
        ),
        Phase(
            n=2,
            name="Design",
            summary="A live visual system — palette, type, and logo direction — plus name, domain, "
            "and handle availability. Handed to Figma with everything specified.",
            actor="startupkit",
            mode="assisted",
            cta="Generate identity",
            documents=[
                DocumentDef(name="Visual Identity System"),
                DocumentDef(name="Name & Availability", required=False),
            ],
        ),
        Phase(
            n=3,
            name="Deploy",
            summary="A live landing page and a one-pager generated from your Brand Core — change "
            "the core once and they update. Export when you're ready to hand off.",
            actor="startupkit",
            mode="assisted",
            cta="Build launch assets",
            documents=[
                DocumentDef(name="Landing Page Preview"),
                DocumentDef(
                    name="Product One-Pager",
                    required=False,
                    note="Exportable brief for investors and partners.",
                ),
            ],
        ),
    ],
)

# --- W6 People & HR -----------------------------------------------------------------------------

W6 = WorkflowDef(
    code="W6",
    slug="people-hr",
    name="People & HR",
    goal="Hire, onboard, pay, and retain a world-class team — staying fully compliant.",
    color="#3B6D11",
    depends_on=["W2"],
    unlocks=[],
    phases=[
        Phase(
            n=1,
            name="Workforce planning",
            summary="Plan the team structure, roles, and headcount against company stage.",
            actor="startupkit",
            mode="assisted",
            cta="Generate hiring plan",
            documents=[
                DocumentDef(name="Hiring Plan & Org Chart"),
                DocumentDef(name="Job Descriptions"),
            ],
        ),
        Phase(
            n=2,
            name="Hiring",
            summary="Make compliant offers and sign employment + IP agreements.",
            actor="startupkit",
            mode="assisted",
            cta="Generate offer pack",
            documents=[
                DocumentDef(name="Offer Letter"),
                DocumentDef(name="Employment Agreement"),
                DocumentDef(name="PIIA (employee)"),
            ],
        ),
        Phase(
            n=3,
            name="Onboarding & payroll",
            summary="Onboard new hires and run payroll + benefits.",
            actor="provider",
            mode="automated",
            cta="Set up payroll",
            documents=[
                DocumentDef(name="Onboarding pack"),
                DocumentDef(name="Payroll setup"),
                DocumentDef(name="Benefits enrollment", required=False),
            ],
        ),
        Phase(
            n=4,
            name="Equity & compensation",
            summary="Grant options and record them in the cap table.",
            actor="startupkit",
            mode="assisted",
            cta="Generate option grant",
            documents=[
                DocumentDef(name="Option Grant Agreement"),
                DocumentDef(name="ESOP Plan", required=False),
            ],
        ),
    ],
)

# --- W7 Go-To-Market ----------------------------------------------------------------------------

W7 = WorkflowDef(
    code="W7",
    slug="gtm",
    name="Go-To-Market",
    goal="Turn the product into customers, revenue, and repeatable growth.",
    color="#A32D2D",
    depends_on=["W5"],
    unlocks=[],
    phases=[
        Phase(
            n=1,
            name="Customer & positioning",
            summary="Research the customer and lock positioning, pricing, and packaging.",
            actor="startupkit",
            mode="assisted",
            cta="Generate ICP & pricing",
            documents=[
                DocumentDef(name="ICP & Buyer Personas"),
                DocumentDef(name="Pricing & Packaging"),
            ],
        ),
        Phase(
            n=2,
            name="Funnel & pipeline",
            summary="Set up the website, CRM, and lead-generation engine.",
            actor="provider",
            mode="automated",
            cta="Set up CRM & pipeline",
            documents=[
                DocumentDef(name="GTM Strategy"),
                DocumentDef(name="Landing pages"),
                DocumentDef(name="CRM & pipeline setup"),
            ],
        ),
        Phase(
            n=3,
            name="Sales & content",
            summary="Outreach sequences, sales scripts, and content marketing.",
            actor="startupkit",
            mode="assisted",
            cta="Generate sequences",
            documents=[
                DocumentDef(name="Email outreach sequences"),
                DocumentDef(name="Sales scripts"),
                DocumentDef(name="Content plan", required=False),
            ],
        ),
    ],
)

# --- W8 Operations & Tooling --------------------------------------------------------------------

W8 = WorkflowDef(
    code="W8",
    slug="operations",
    name="Operations & Tooling",
    goal="Build a scalable operating system: run efficiently, reduce chaos, scale confidently.",
    color="#F26B1D",
    depends_on=["W1"],
    unlocks=[],
    phases=[
        Phase(
            n=1,
            name="Operating system",
            summary="Define how the company runs: cadences, ownership, decision rights.",
            actor="startupkit",
            mode="assisted",
            cta="Generate ops manual",
            documents=[
                DocumentDef(name="Operations Manual"),
                DocumentDef(name="Company OS doc"),
            ],
        ),
        Phase(
            n=2,
            name="SOPs & knowledge",
            summary="Document repeatable processes and stand up a knowledge base.",
            actor="startupkit",
            mode="assisted",
            cta="Generate SOP library",
            documents=[
                DocumentDef(name="SOP Library"),
                DocumentDef(name="Knowledge Base"),
            ],
        ),
        Phase(
            n=3,
            name="Tooling & automation",
            summary="Pick the tool stack, wire automation, and build reporting dashboards.",
            actor="founder",
            mode="manual",
            cta="Configure & confirm",
            documents=[
                DocumentDef(name="Tool stack plan"),
                DocumentDef(name="Automation playbook", required=False),
                DocumentDef(name="Reporting dashboards"),
            ],
        ),
    ],
)


# --- W1 · LLC formation variant (served instead of the C-Corp W1 when entity_type == "llc") ------
# An LLC files a Certificate of Formation (not Incorporation), adopts an Operating Agreement (not
# Bylaws), and issues membership units (not stock) — so the whole W1 document set differs. Docs
# shared with the C-Corp W1 (Cap Table, EIN, Registered Agent, Compliance Calendar) keep names.
W1_LLC = WorkflowDef(
    code="W1",
    slug="formation",
    name="Business Formation",
    goal="Form the LLC: Certificate of Formation, Operating Agreement, issue units, get an EIN.",
    color="#185FA5",
    depends_on=[],
    unlocks=["W2", "W3", "W4", "W5", "W6", "W8"],
    phases=[
        Phase(
            n=1,
            name="Documents & Filing",
            summary="File the Certificate of Formation and adopt the Operating Agreement.",
            actor="startupkit",
            mode="assisted",
            cta="Generate & file",
            documents=[
                DocumentDef(name="Certificate of Formation"),
                DocumentDef(name="Operating Agreement"),
            ],
        ),
        Phase(
            n=2,
            name="Ownership",
            summary="Issue membership units and record the membership ledger and cap table.",
            actor="founder",
            mode="manual",
            cta="Issue units",
            documents=[
                DocumentDef(name="Membership Unit Purchase Agreement"),
                DocumentDef(name="Membership Ledger"),
                DocumentDef(name="Cap Table"),
            ],
        ),
        Phase(
            n=3,
            name="Federal & Finalize",
            summary="Get the federal tax ID (EIN) and stand up ongoing compliance.",
            actor="provider",
            mode="automated",
            cta="Apply for EIN",
            documents=[
                DocumentDef(name="EIN Confirmation Letter"),
                DocumentDef(name="Registered Agent Agreement"),
                DocumentDef(name="Delaware LLC Annual Tax"),
                DocumentDef(name="Compliance Calendar"),
            ],
        ),
    ],
)


CATALOG: list[WorkflowDef] = [W1, W2, W3, W4, W5, W6, W7, W8]
_BY_CODE: dict[str, WorkflowDef] = {wf.code: wf for wf in CATALOG}


def _attach_templates() -> None:
    """Enrich documents with their fillable template + fields, or guided-task how-to steps."""
    from startupkit.workflows.doc_guidance import GUIDANCE
    from startupkit.workflows.doc_templates import TEMPLATES

    for wf in [*CATALOG, W1_LLC]:
        for phase in wf.phases:
            for d in phase.documents:
                key = doc_key(wf.code, d.name)
                tpl = TEMPLATES.get(key)
                if tpl is not None:
                    d.fields, d.template = tpl
                guide = GUIDANCE.get(key)
                if guide is not None:
                    d.guidance = guide


_attach_templates()


def _build_w2_llc() -> WorkflowDef:
    """W2 for LLCs: same stages/documents, but any doc with a '<doc_key>-llc' template registered
    (today: the Technology Assignment Agreement — units/IRC §721 instead of shares/IRC §351) gets
    the LLC variant swapped in."""
    from startupkit.workflows.doc_templates import TEMPLATES

    wf = W2.model_copy(deep=True)
    for phase in wf.phases:
        for d in phase.documents:
            llc = TEMPLATES.get(doc_key(wf.code, d.name) + "-llc")
            if llc is not None:
                d.fields, d.template = llc
    return wf


W2_LLC = _build_w2_llc()


def get_workflow(code: str, entity_type: str = "c-corp") -> WorkflowDef | None:
    """The workflow definition, entity-aware: W1 formation and the W2 founder-IP documents differ
    for LLCs (Certificate of Formation / units & §721 TAA instead of stock & §351)."""
    if entity_type == "llc":
        if code.upper() == "W1":
            return W1_LLC
        if code.upper() == "W2":
            return W2_LLC
    return _BY_CODE.get(code)


def status_for(snap: CompanySnapshot) -> list[WorkflowView]:
    """Derive each workflow's live status + progress from `workflow.phase.completed` events.

    A workflow is complete when all its phases are done, in-progress when some are, available when
    unlocked but unstarted, and locked while its dependency workflows aren't complete yet.
    """
    completed: dict[str, set[int]] = {
        code: set(phases) for code, phases in snap.completed_phases.items()
    }

    def n_done(wf: WorkflowDef) -> int:
        valid = range(1, len(wf.phases) + 1)
        return len([n for n in completed.get(wf.code, set()) if n in valid])

    done: dict[str, bool] = {wf.code: n_done(wf) >= len(wf.phases) > 0 for wf in CATALOG}

    views: list[WorkflowView] = []
    for wf in CATALOG:
        if snap.entity_type == "llc":
            if wf.code == "W1":
                wf = W1_LLC  # the LLC formation document set
            elif wf.code == "W2":
                wf = W2_LLC  # the LLC founder-IP variant (units/§721 TAA)
        total = len(wf.phases)
        c = n_done(wf)
        phases_done = sorted(n for n in completed.get(wf.code, set()) if 1 <= n <= total)

        unmet = [dep for dep in wf.depends_on if not done.get(dep, False)]
        status: WorkflowStatus
        if unmet:
            status, progress, reason = "locked", 0, "Complete " + ", ".join(unmet) + " first."
        elif c >= total and total > 0:
            status, progress, reason = "complete", 100, ""
        elif c > 0:
            status, progress, reason = "in-progress", round(c / total * 100), ""
        else:
            status, progress, reason = "available", 0, ""

        views.append(
            WorkflowView(
                definition=wf,
                status=status,
                progress_pct=progress,
                completed_phases=phases_done,
                blocked_reason=reason,
            )
        )
    return views
