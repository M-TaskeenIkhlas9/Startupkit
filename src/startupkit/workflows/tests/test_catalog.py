"""Workflow catalog tests: 8 workflows, dependency gating, status derivation from the snapshot."""

from __future__ import annotations

from startupkit.core.company_object.events import DocumentSubmitted
from startupkit.core.company_object.memory_store import InMemoryEventStore
from startupkit.core.services.company_object_service import CompanyObjectService
from startupkit.core.services.intake import FounderIntake, IntakeRequest
from startupkit.workflows.catalog import CATALOG, WorkflowView, doc_key, status_for


def _intake(
    formation_status: str, ein: str | None = None, entity_type: str = "c-corp"
) -> IntakeRequest:
    return IntakeRequest(
        company_name="Acme AI",
        owner_email="m@acme.ai",
        one_liner="x",
        industry="logistics",
        stage="mvp-build",
        jurisdiction="US",
        entity_type=entity_type,  # type: ignore[arg-type]
        formation_status=formation_status,  # type: ignore[arg-type]
        ein=ein,
        founders=[FounderIntake(name="M", email="m@acme.ai", role="CEO", equity_pct=100.0)],
    )


def test_catalog_has_eight_workflows() -> None:
    assert [wf.code for wf in CATALOG] == ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"]
    for wf in CATALOG:
        assert wf.phases, f"{wf.code} has no phases"


def test_llc_gets_a_different_w1_document_set() -> None:
    from startupkit.workflows.catalog import get_workflow

    llc = get_workflow("W1", "llc")
    cc = get_workflow("W1", "c-corp")
    assert llc is not None and cc is not None
    llc_docs = {d.name for ph in llc.phases for d in ph.documents}
    cc_docs = {d.name for ph in cc.phases for d in ph.documents}
    # LLC-specific documents present, C-Corp-specific ones absent
    assert {"Certificate of Formation", "Operating Agreement", "Membership Ledger"} <= llc_docs
    assert "Certificate of Incorporation" not in llc_docs
    assert "Bylaws" not in llc_docs
    assert "Founder Stock Purchase Agreement (FSPA)" not in llc_docs
    assert "Certificate of Incorporation" in cc_docs
    # the LLC formation docs are fillable templates
    for d in (d for ph in llc.phases for d in ph.documents):
        if d.name in ("Certificate of Formation", "Operating Agreement", "Membership Ledger"):
            assert d.template and d.fields, d.name


def test_llc_gets_the_units_721_taa_in_w2() -> None:
    from startupkit.workflows.catalog import DocumentDef, WorkflowDef, get_workflow

    def wf_for(entity: str) -> WorkflowDef:
        wf = get_workflow("W2", entity)
        assert wf is not None
        return wf

    def taa(wf: WorkflowDef) -> DocumentDef:
        return next(d for ph in wf.phases for d in ph.documents if "TAA" in d.name)

    cc_wf, llc_wf = wf_for("c-corp"), wf_for("llc")
    cc, llc = taa(cc_wf), taa(llc_wf)
    # C-Corp: shares + IRC §351; LLC: membership units + IRC §721 + Operating Agreement section
    assert "Section 351" in cc.template and "{{share_number}}" in cc.template
    assert "Section 721" in llc.template and "{{unit_number}}" in llc.template
    assert "Relationship to Operating Agreement" in llc.template
    assert {f.key for f in llc.fields} >= {"membership_percentage", "membership_agreement_type"}
    # the Founders' Agreement is also entity-conditional: stock/repurchase vs units/redemption
    def fa(wf: WorkflowDef) -> DocumentDef:
        return next(d for ph in wf.phases for d in ph.documents if d.name == "Founders' Agreement")

    fa_cc, fa_llc = fa(cc_wf), fa(llc_wf)
    assert "Repurchase Right" in fa_cc.template and "Delaware corporation" in fa_cc.template
    assert "Redemption Right" in fa_llc.template and "Percentage Interest" in fa_llc.template
    assert {f.key for f in fa_llc.fields} >= {"management_structure", "fmv_determiner"}
    # the Advisor Agreement forks too: FAST NSO grid (C-Corp) vs profits interest (LLC)
    def adv(wf: WorkflowDef) -> DocumentDef:
        return next(d for ph in wf.phases for d in ph.documents if d.name == "Advisor Agreement")

    assert "Non-Qualified Stock Options" in adv(cc_wf).template
    assert "profits interest" in adv(llc_wf).template.lower()
    assert {f.key for f in adv(llc_wf).fields} >= {"pi_grant", "liquidation_threshold"}
    # everything else in W2 stays identical between the two variants
    cc_docs = {d.name for ph in cc_wf.phases for d in ph.documents}
    llc_docs = {d.name for ph in llc_wf.phases for d in ph.documents}
    assert cc_docs == llc_docs


async def test_status_for_serves_the_llc_w1_for_llcs() -> None:
    svc = CompanyObjectService(InMemoryEventStore())
    snap = await svc.snapshot(await svc.create_from_intake(_intake("idea", entity_type="llc")))
    w1 = next(v for v in status_for(snap) if v.definition.code == "W1")
    names = {d.name for p in w1.definition.phases for d in p.documents}
    assert "Operating Agreement" in names and "Bylaws" not in names


def test_w1_has_the_83b_fuse() -> None:
    w1 = next(wf for wf in CATALOG if wf.code == "W1")
    fuses = [d for ph in w1.phases for d in ph.documents if d.critical]
    assert any("83(b)" in d.name for d in fuses)


def test_doc_key_is_stable_and_slugged() -> None:
    assert doc_key("W1", "Certificate of Incorporation") == "W1-certificate-of-incorporation"
    assert doc_key("W1", "83(b) Election") == "W1-83-b-election"


def test_w1_documents_carry_fillable_templates() -> None:
    w1 = next(wf for wf in CATALOG if wf.code == "W1")
    templated = [d for ph in w1.phases for d in ph.documents if d.template]
    assert len(templated) >= 3
    for d in templated:
        assert d.fields, f"{d.name} has a template but no fields"


def test_every_workflow_has_at_least_one_fillable_template() -> None:
    for wf in CATALOG:
        templated = [d for ph in wf.phases for d in ph.documents if d.template]
        assert templated, f"{wf.code} has no fillable templates"
        for d in templated:
            assert d.fields, f"{wf.code} {d.name} has a template but no fields"
            assert "📤 What to do next" in d.template, f"{wf.code} {d.name} missing the output step"


async def test_submitting_required_docs_completes_the_phase() -> None:
    svc = CompanyObjectService(InMemoryEventStore())
    cid = await svc.create_from_intake(_intake("idea"))
    w1 = next(wf for wf in CATALOG if wf.code == "W1")
    phase = next(p for p in w1.phases if p.n == 2)
    required = [d for d in phase.documents if d.required]

    # submit all but the last required doc -> phase not yet done
    for d in required[:-1]:
        await svc.submit_document(
            cid,
            DocumentSubmitted(
                doc_key=doc_key("W1", d.name),
                workflow_code="W1",
                phase_n=2,
                doc_name=d.name,
                method="filled",
            ),
        )
    snap = await svc.snapshot(cid)
    assert all(doc_key("W1", d.name) in snap.submitted_documents for d in required[:-1])

    # the projection records method + filename for an upload
    await svc.submit_document(
        cid,
        DocumentSubmitted(
            doc_key=doc_key("W1", required[-1].name),
            workflow_code="W1",
            phase_n=2,
            doc_name=required[-1].name,
            method="uploaded",
            filename="signed.pdf",
        ),
    )
    snap = await svc.snapshot(cid)
    last = snap.submitted_documents[doc_key("W1", required[-1].name)]
    assert last.method == "uploaded" and last.filename == "signed.pdf"


async def test_idea_stage_locks_everything_after_w1() -> None:
    svc = CompanyObjectService(InMemoryEventStore())
    snap = await svc.snapshot(await svc.create_from_intake(_intake("idea")))
    views: dict[str, WorkflowView] = {v.definition.code: v for v in status_for(snap)}

    assert views["W1"].status == "available"
    assert all(views[c].status == "locked" for c in ["W2", "W3", "W4", "W5", "W6", "W7", "W8"])


async def test_formed_with_ein_unlocks_wave_one() -> None:
    svc = CompanyObjectService(InMemoryEventStore())
    snap = await svc.snapshot(await svc.create_from_intake(_intake("formed", ein="88-1234567")))
    views: dict[str, WorkflowView] = {v.definition.code: v for v in status_for(snap)}

    assert views["W1"].status == "complete"
    # Wave 1 (formation-gated) becomes available
    for code in ["W2", "W3", "W4", "W5", "W8"]:
        assert views[code].status == "available", code
    # second-order deps stay locked until their parent is done
    assert views["W6"].status == "locked"  # needs W2
    assert views["W7"].status == "locked"  # needs W5


async def test_formed_without_ein_keeps_banking_locked() -> None:
    svc = CompanyObjectService(InMemoryEventStore())
    snap = await svc.snapshot(await svc.create_from_intake(_intake("formed")))
    views: dict[str, WorkflowView] = {v.definition.code: v for v in status_for(snap)}

    assert views["W1"].status == "in-progress"  # formed but no EIN
    # W1 isn't complete without the EIN, so W3 (banking) stays locked behind W1.
    assert views["W3"].status == "locked"
    assert "W1" in views["W3"].blocked_reason


def test_every_phase_has_an_actor_and_cta() -> None:
    actors = {"startupkit", "provider", "founder"}
    for wf in CATALOG:
        for p in wf.phases:
            assert p.actor in actors
            assert p.cta
            # the founder should both get things done for them AND do some themselves
        assert {p.actor for p in wf.phases}, wf.code


async def test_completing_phases_advances_progress_and_unlocks() -> None:
    svc = CompanyObjectService(InMemoryEventStore())
    cid = await svc.create_from_intake(_intake("formed", ein="88-1234567"))

    # W2 starts available with no phases done
    before = {v.definition.code: v for v in status_for(await svc.snapshot(cid))}
    assert before["W2"].status == "available"
    assert before["W6"].status == "locked"  # needs W2

    # complete all phases of W2 (5 stages: IP ownership → confirm → NDAs → engagement → conditional)
    w2 = next(wf for wf in CATALOG if wf.code == "W2")
    for phase in w2.phases:
        await svc.complete_phase(cid, "W2", phase.n)

    after = {v.definition.code: v for v in status_for(await svc.snapshot(cid))}
    assert after["W2"].status == "complete"
    assert after["W2"].progress_pct == 100
    assert after["W6"].status == "available"  # W2 done -> W6 unlocks


async def test_completing_phases_raises_health_score() -> None:
    svc = CompanyObjectService(InMemoryEventStore())
    cid = await svc.create_from_intake(_intake("formed", ein="88-1234567"))
    before = (await svc.health(cid)).overall
    # W4 (Technical) maps to the technical dimension, which isn't already maxed out.
    for n in range(1, 5):
        await svc.complete_phase(cid, "W4", n)
    after = (await svc.health(cid)).overall
    assert after > before
