"""W7 · Go-To-Market engine tests.

The rules worth protecting:
  1. The motion thresholds are the product's opinion — they must not drift.
  2. W7 never invents. No ICP / no search / no model -> say so, return nothing.
  3. A founder's correction always beats our read.
  4. Health scores what's DONE, never what's typed in.
"""

from __future__ import annotations

import pytest

from startupkit.core.company_object.brand_types import BrandCore, BrandState
from startupkit.core.company_object.gtm_types import (
    Connection,
    Experiment,
    GtmInputs,
    GtmState,
    GtmStrategy,
    LostDeal,
    Pricing,
    PricingTier,
    Sequence,
    TargetAccount,
)
from startupkit.core.company_object.memory_store import InMemoryEventStore
from startupkit.core.company_object.projections.snapshot import CompanySnapshot
from startupkit.core.services.company_object_service import CompanyObjectService
from startupkit.core.services.gtm import (
    GTM_DOCS,
    _motion_from,
    attribution,
    channel_matrix,
    check_deliverability,
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
from startupkit.core.services.intake import FounderIntake, IntakeRequest


def _snap(**kw: object) -> CompanySnapshot:
    snap = CompanySnapshot(
        company_id="CO-20260101-TEST",
        name="Nexora Labs",
        one_liner="The AI operating system for startups.",
        industry="AI Infrastructure",
        stage="pre-seed",
        customer="Seed-stage B2B SaaS startups",
        solution="One AI-native OS",
    )
    for k, v in kw.items():
        setattr(snap, k, v)
    return snap


def _brand(icp: str = "Seed-stage B2B SaaS startups") -> BrandState:
    return BrandState(core=BrandCore(icp=icp, category="Startup Operating System"))


# --- 1. the motion fork: the product's opinion, pinned -------------------------------------------


@pytest.mark.parametrize(
    ("acv", "self_serve", "committee", "expected"),
    [
        ("high", True, "one", "outbound"),  # big ACV always needs a human
        ("low", True, "many", "outbound"),  # a committee always needs a human
        ("low", True, "one", "plg"),  # cheap + self-serve + one buyer
        ("low", False, "one", "hybrid"),  # cheap but needs a demo
        ("mid", True, "few", "hybrid"),  # the messy middle
    ],
)
def test_motion_thresholds(acv: str, self_serve: bool, committee: str, expected: str) -> None:
    motion, why = _motion_from(acv, self_serve, committee)
    assert motion == expected
    assert why, "every motion must explain itself to the founder"


# --- 2. read_motion: infer from the Company Object, admit guesses --------------------------------


@pytest.mark.asyncio
async def test_read_motion_computes_acv_from_pricing_not_a_question() -> None:
    """$3,000/mo -> $36k/yr -> outbound. The founder is never asked for their ACV."""
    snap = _snap(
        gtm=GtmState(pricing=Pricing(tiers=[PricingTier(name="Team", price="3000", unit="mo")]))
    )
    read = await read_motion(snap, model=None)
    assert read.acv.value == "high"
    assert read.acv.known is True
    assert "36,000" in read.acv.evidence
    assert read.motion == "outbound"


@pytest.mark.asyncio
async def test_read_motion_admits_when_it_is_guessing() -> None:
    read = await read_motion(_snap(), model=None)
    assert read.acv.known is False
    assert "guessing" in read.acv.evidence.lower()


@pytest.mark.asyncio
async def test_founder_correction_beats_our_read() -> None:
    """A human decision must never be silently overwritten by a re-read."""
    snap = _snap(
        gtm=GtmState(
            pricing=Pricing(tiers=[PricingTier(name="Team", price="3000", unit="mo")]),
            inputs=GtmInputs(acv="low", self_serve="yes", committee="one"),
        )
    )
    read = await read_motion(snap, model=None)
    assert read.acv.value == "low"  # not "high", even though pricing says $36k
    assert read.acv.known is True
    assert read.motion == "plg"  # the correction changes the fork


# --- 3. discovery never invents ------------------------------------------------------------------


@pytest.mark.asyncio
async def test_discover_without_icp_says_so_and_invents_nothing() -> None:
    snap = _snap(customer="", brand=BrandState())
    d = await discover_accounts(snap, model=None, search=None)
    assert d.accounts == []
    assert "W5" in d.note


@pytest.mark.asyncio
async def test_discover_without_search_invents_nothing() -> None:
    d = await discover_accounts(_snap(brand=_brand()), model=None, search=None)
    assert d.accounts == []
    assert d.note


@pytest.mark.asyncio
async def test_discover_uses_the_founders_own_trigger() -> None:
    """One trigger list: the query uses what the founder ticked, not a hard-coded default."""
    snap = _snap(
        brand=_brand(),
        gtm=GtmState(inputs=GtmInputs(triggers=["Hit a compliance or audit deadline"])),
    )
    d = await discover_accounts(snap, model=None, search=None)
    assert "compliance" in d.query.lower()


# --- 4. health scores what's done ----------------------------------------------------------------


def test_health_of_an_empty_engine_is_weak() -> None:
    h = gtm_health(GtmState())
    assert h.score == 0
    assert h.label == "Weak"


def test_health_ignores_typing_and_rewards_customers() -> None:
    """Filling in fields must not score as high as actually closing someone."""
    typed = GtmState(
        strategy=GtmStrategy(motion="outbound", objective="first_customers", channels=["a", "b"]),
        pricing=Pricing(
            model="tiered", tiers=[PricingTier(name="T", price="100")], pilot="14d"
        ),
    )
    sold = typed.model_copy(deep=True)
    sold.accounts = [TargetAccount(name=f"Co {i}", stage="won") for i in range(12)]
    sold.sequences = [Sequence(name="v1", approved=True)]
    sold.connections = [
        Connection(kind="crm", status="connected"),
        Connection(kind="analytics", status="verified"),
    ]
    assert gtm_health(sold).score > gtm_health(typed).score
    proof = next(d for d in gtm_health(sold).dimensions if d.name == "Proof of Revenue")
    assert proof.score == 100


def test_health_flags_a_target_list_that_is_too_broad() -> None:
    broad = GtmState(accounts=[TargetAccount(name=f"Co {i}") for i in range(400)])
    workable = GtmState(accounts=[TargetAccount(name=f"Co {i}") for i in range(40)])
    broad_dim = next(d for d in gtm_health(broad).dimensions if d.name == "Target List")
    ok_dim = next(d for d in gtm_health(workable).dimensions if d.name == "Target List")
    assert ok_dim.score > broad_dim.score


# --- 5. generation is key-free -------------------------------------------------------------------


@pytest.mark.asyncio
async def test_generate_works_with_no_model_and_never_returns_empty() -> None:
    draft = await generate_gtm(_snap(brand=_brand()), model=None)
    assert draft.source == "engine"
    assert draft.strategy.motion
    assert draft.strategy.motion_rationale
    assert draft.sequences and draft.sequences[0].steps
    assert draft.campaigns and draft.tasks


@pytest.mark.asyncio
async def test_generated_plan_follows_the_motion() -> None:
    cheap = _snap(gtm=GtmState(pricing=Pricing(tiers=[PricingTier(name="S", price="40")])))
    draft = await generate_gtm(cheap, model=None)
    assert draft.strategy.motion == "plg"
    assert any("signup" in t.text.lower() for t in draft.tasks)


# --- 6. exports land in the shape the executor tool expects --------------------------------------


def test_targets_export_is_clay_shaped() -> None:
    accounts = [TargetAccount(name="Northline", domain="northline.com", size="11-50")]
    snap = _snap(gtm=GtmState(accounts=accounts))
    csv = export_targets_csv(snap)
    assert csv.splitlines()[0] == "company,domain,employee_range,trigger,stage,owner"
    assert "Northline" in csv


def test_crm_export_maps_our_stages_to_real_hubspot_lifecycle_values() -> None:
    accounts = [TargetAccount(name="A", stage="won"), TargetAccount(name="B", stage="prospect")]
    snap = _snap(gtm=GtmState(accounts=accounts))
    csv = export_crm_csv(snap)
    assert "customer" in csv  # won -> customer
    assert "subscriber" in csv  # prospect -> subscriber


def test_sequence_export_splits_subject_from_body() -> None:
    seq = [Sequence(name="v1", steps=["Day 1 — Subject: hello there\n\nBody text here"])]
    snap = _snap(gtm=GtmState(sequences=seq))
    csv = export_sequence_csv(snap)
    assert "hello there" in csv
    assert "Body text here" in csv


def test_csv_export_escapes_commas_and_quotes() -> None:
    snap = _snap(gtm=GtmState(accounts=[TargetAccount(name='Ac,me "Co"', domain="a.com")]))
    csv = export_targets_csv(snap)
    assert '"Ac,me ""Co"""' in csv


# --- 7. the five promised documents --------------------------------------------------------------


@pytest.mark.parametrize("key", list(GTM_DOCS))
def test_every_catalog_document_renders(key: str) -> None:
    snap = _snap(brand=_brand(), gtm=GtmState(strategy=GtmStrategy(motion="outbound")))
    body = render_gtm_doc(snap, key)
    assert body.startswith("# ")
    assert "Nexora Labs" in body


def test_unknown_document_raises() -> None:
    with pytest.raises(KeyError):
        render_gtm_doc(_snap(), "not-a-doc")


# --- 8. persistence: last-write-wins, same contract as the brand state ---------------------------


@pytest.mark.asyncio
async def test_gtm_state_persists_and_replaces_wholesale() -> None:
    service = CompanyObjectService(InMemoryEventStore())
    cid = await service.create_from_intake(
        IntakeRequest(
            company_name="Nexora Labs",
            owner_email="f@n.ai",
            one_liner="x",
            industry="AI",
            stage="pre-seed",
            jurisdiction="US",
            entity_type="c-corp",
            formation_status="formed",
            founders=[FounderIntake(name="A", email="a@n.ai", role="CEO", equity_pct=100.0)],
        )
    )
    await service.set_gtm(cid, GtmState(strategy=GtmStrategy(motion="plg"), steps_done=["mod:icp"]))
    await service.set_gtm(
        cid,
        GtmState(
            strategy=GtmStrategy(motion="outbound"),
            inputs=GtmInputs(acv="high", triggers=["Raised a round in the last 6 months"]),
            steps_done=["mod:icp", "mod:pricing"],
        ),
    )
    snap = await service.snapshot(cid)
    assert snap.gtm.strategy.motion == "outbound"  # last write wins
    assert snap.gtm.inputs.acv == "high"  # corrections survive a reload
    assert snap.gtm.inputs.triggers == ["Raised a round in the last 6 months"]
    assert snap.gtm.steps_done == ["mod:icp", "mod:pricing"]
    assert snap.domains  # the gtm domain of the twin fills itself in


# --- 9. pricing research: an unevidenced price is never sold as research --------------------------


@pytest.mark.asyncio
async def test_pricing_without_category_says_so() -> None:
    snap = _snap(industry="", brand=BrandState())
    read = await research_pricing(snap, model=None, search=None)
    assert read.tiers == []
    assert "W5" in read.note


@pytest.mark.asyncio
async def test_pricing_without_search_proposes_nothing() -> None:
    read = await research_pricing(_snap(brand=_brand()), model=None, search=None)
    assert read.tiers == []
    assert read.comps == []


# --- 10. deliverability: record-exists is not mail-works ------------------------------------------


def _fake_dns(records: dict[tuple[str, str], list[str]]):
    async def fake(domain: str, rtype: str = "TXT") -> list[str]:
        return records.get((domain, rtype), [])

    return fake


@pytest.mark.asyncio
async def test_deliverability_passes_a_healthy_domain(monkeypatch: pytest.MonkeyPatch) -> None:
    import startupkit.core.services.gtm as gtm_mod

    monkeypatch.setattr(
        gtm_mod,
        "_doh_txt",
        _fake_dns({
            ("good.com", "MX"): ["10 mail.good.com."],
            ("good.com", "TXT"): ["v=spf1 include:_spf.google.com ~all"],
            ("_dmarc.good.com", "TXT"): ["v=DMARC1; p=quarantine"],
        }),
    )
    d = await check_deliverability("good.com")
    assert d.ready is True
    assert d.warmup  # the ramp always ships with the verdict


@pytest.mark.asyncio
async def test_null_mx_and_null_spf_fail_even_though_records_exist(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """RFC 7505 '0 .' declares no mail; a bare 'v=spf1 -all' declares it sends none."""
    import startupkit.core.services.gtm as gtm_mod

    monkeypatch.setattr(
        gtm_mod,
        "_doh_txt",
        _fake_dns({
            ("example.com", "MX"): ["0 ."],
            ("example.com", "TXT"): ["v=spf1 -all"],
        }),
    )
    d = await check_deliverability("example.com")
    assert d.ready is False
    by_name = {c.name: c for c in d.checks}
    assert by_name["MX (can receive mail)"].status == "fail"
    assert by_name["SPF (who may send as you)"].status == "fail"


@pytest.mark.asyncio
async def test_deliverability_with_no_domain_asks_for_one() -> None:
    d = await check_deliverability("")
    assert d.ready is False
    assert d.checks == []


# --- 11. content engine is key-free and grounded --------------------------------------------------


@pytest.mark.asyncio
async def test_content_generates_six_scheduled_ideas_without_a_model() -> None:
    plan = await generate_content(_snap(brand=_brand()), model=None)
    assert len(plan.ideas) == 6
    assert plan.source == "engine"
    assert {i.week for i in plan.ideas} == {1, 2, 3}  # a 3-week calendar, 2 per week
    assert all(i.platform in ("blog", "linkedin", "x") for i in plan.ideas)


# --- 12. channel matrix: 2 bets, everything else a decision ---------------------------------------


@pytest.mark.parametrize("motion", ["outbound", "plg", "hybrid"])
def test_channel_matrix_always_names_exactly_two_bets(motion: str) -> None:
    snap = _snap(gtm=GtmState(strategy=GtmStrategy(motion=motion)))
    m = channel_matrix(snap)
    assert m.motion == motion
    bets = [v for v in m.verdicts if v.verdict == "bet"]
    assert len(bets) == 2, "pre-seed discipline: exactly two channels to commit to"
    assert all(v.why for v in m.verdicts), "every ignore is a decision, so every row explains"


def test_paid_ads_are_ignored_in_every_motion() -> None:
    for motion in ("outbound", "plg", "hybrid"):
        m = channel_matrix(_snap(gtm=GtmState(strategy=GtmStrategy(motion=motion))))
        paid = next(v for v in m.verdicts if v.channel == "Paid ads")
        assert paid.verdict == "ignore"


# --- 13. guardrails: the pipeline talks back ------------------------------------------------------


def test_no_guardrails_on_an_empty_engine() -> None:
    assert stage_guardrails(GtmState()) == []


def test_twenty_contacted_zero_replies_is_a_stop() -> None:
    state = GtmState(
        accounts=[TargetAccount(name=f"Co {i}", stage="contacted") for i in range(20)],
        sequences=[Sequence(name="v1", approved=True)],
        pricing=Pricing(locked=True),
    )
    rails = stage_guardrails(state)
    assert any(r.severity == "stop" and r.link == "outreach" for r in rails)


def test_pilots_without_closes_is_a_stop() -> None:
    state = GtmState(
        accounts=[TargetAccount(name=f"Co {i}", stage="pilot") for i in range(3)],
        pricing=Pricing(locked=True),
    )
    rails = stage_guardrails(state)
    assert any(r.severity == "stop" and r.link == "crm" for r in rails)


def test_three_price_losses_point_back_to_w5() -> None:
    state = GtmState(lost_deals=[LostDeal(account=f"A{i}", reason="price") for i in range(3)])
    rails = stage_guardrails(state)
    assert any(r.severity == "stop" and r.link == "discovery" for r in rails)


def test_selling_without_a_locked_price_warns() -> None:
    state = GtmState(
        accounts=[TargetAccount(name="Co", stage="contacted")],
        sequences=[Sequence(name="v1", approved=True)],
    )
    rails = stage_guardrails(state)
    assert any(r.link == "pricing" and r.severity == "warn" for r in rails)


# --- 14. attribution: computed from real stages, honest floor -------------------------------------


def test_attribution_with_no_accounts_says_so() -> None:
    a = attribution(GtmState())
    assert a.rows == []
    assert a.best == ""


def test_attribution_refuses_to_call_a_winner_below_three_contacted() -> None:
    state = GtmState(accounts=[TargetAccount(name="A", trigger="funding", stage="replied")])
    a = attribution(state)
    assert a.best == ""
    assert "early" in a.note.lower()


def test_attribution_names_the_working_trigger() -> None:
    accounts = [
        TargetAccount(name=f"F{i}", trigger="Raised a round", stage="replied") for i in range(3)
    ] + [TargetAccount(name=f"H{i}", trigger="Hiring", stage="contacted") for i in range(3)]
    a = attribution(GtmState(accounts=accounts))
    assert a.best == "Raised a round"
    assert "Raised a round" in a.note


# --- 15. gtm chat: grounded fallback, never empty -------------------------------------------------


@pytest.mark.asyncio
async def test_gtm_chat_without_a_model_still_answers() -> None:
    reply = await gtm_chat(_snap(), "how do I price this?", model=None)
    assert reply.source == "engine"
    assert "Generate" in reply.reply  # no motion yet -> points at the generate button


@pytest.mark.asyncio
async def test_gtm_chat_fallback_uses_their_own_state() -> None:
    snap = _snap(gtm=GtmState(strategy=GtmStrategy(motion="outbound")))
    reply = await gtm_chat(snap, "what next?", model=None)
    assert "outbound" in reply.reply


# --- 16. order form + experiments persistence -----------------------------------------------------


def test_order_form_carries_the_payment_link_when_set() -> None:
    snap = _snap(
        gtm=GtmState(
            pricing=Pricing(tiers=[PricingTier(name="Team", price="1200", unit="mo")]),
            inputs=GtmInputs(payment_link="https://buy.stripe.com/abc123"),
        )
    )
    body = render_gtm_doc(snap, "order-form")
    assert "https://buy.stripe.com/abc123" in body
    assert "Team" in body


def test_order_form_without_a_link_tells_the_founder_where_to_paste_it() -> None:
    body = render_gtm_doc(_snap(), "order-form")
    assert "Stripe Payment Link" in body


@pytest.mark.asyncio
async def test_experiments_and_payment_link_survive_a_save() -> None:
    service = CompanyObjectService(InMemoryEventStore())
    cid = await service.create_from_intake(
        IntakeRequest(
            company_name="Nexora Labs",
            owner_email="f@n.ai",
            one_liner="x",
            industry="AI",
            stage="pre-seed",
            jurisdiction="US",
            entity_type="c-corp",
            formation_status="formed",
            founders=[FounderIntake(name="A", email="a@n.ai", role="CEO", equity_pct=100.0)],
        )
    )
    await service.set_gtm(
        cid,
        GtmState(
            inputs=GtmInputs(payment_link="https://buy.stripe.com/abc123"),
            experiments=[
                Experiment(
                    id="e1",
                    hypothesis="Funding trigger doubles replies",
                    metric="reply rate",
                    status="running",
                )
            ],
        ),
    )
    snap = await service.snapshot(cid)
    assert snap.gtm.inputs.payment_link == "https://buy.stripe.com/abc123"
    assert snap.gtm.experiments[0].hypothesis == "Funding trigger doubles replies"
