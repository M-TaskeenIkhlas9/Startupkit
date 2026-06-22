"""Document Engine tests: grounded generation, validation, and persistence into the snapshot."""

from __future__ import annotations

from startupkit.adapters.model_template import TemplateModelAdapter
from startupkit.core.company_object.events import DocumentGenerated
from startupkit.core.company_object.memory_store import InMemoryEventStore
from startupkit.core.services.company_object_service import CompanyObjectService
from startupkit.core.services.document_engine import DocumentEngine
from startupkit.core.services.intake import FounderIntake, IntakeRequest


def _intake() -> IntakeRequest:
    return IntakeRequest(
        company_name="Northwind Labs",
        owner_email="p@nw.dev",
        one_liner="AI pick-path optimizer",
        industry="logistics",
        stage="mvp-build",
        jurisdiction="US",
        entity_type="c-corp",
        formation_status="formed",
        ein="88-7654321",
        founders=[FounderIntake(name="Priya", email="p@nw.dev", role="CEO", equity_pct=100.0)],
    )


async def test_generates_grounded_drafts_with_company_facts() -> None:
    svc = CompanyObjectService(InMemoryEventStore())
    cid = await svc.create_from_intake(_intake())
    snap = await svc.snapshot(cid)
    engine = DocumentEngine(TemplateModelAdapter())

    docs = await engine.generate(snap, "W1", 3, ["Bylaws", "Initial Board Consent"])

    assert len(docs) == 2
    bylaws = next(d for d in docs if d.doc_type == "Bylaws")
    assert "Northwind Labs" in bylaws.body  # grounded in real company facts
    assert "Priya" in bylaws.body  # founder folded into the draft
    assert bylaws.status == "pending-review"  # legal doc gated for attorney review
    assert bylaws.version == 1


async def test_validators_flag_unfilled_fields() -> None:
    svc = CompanyObjectService(InMemoryEventStore())
    # no EIN -> the certificate template leaves an explicit [TO BE COMPLETED] marker
    req = _intake()
    req.ein = None
    cid = await svc.create_from_intake(req)
    engine = DocumentEngine(TemplateModelAdapter())

    docs = await engine.generate(await svc.snapshot(cid), "W1", 2, ["Certificate of Incorporation"])
    assert any("need completion" in issue for issue in docs[0].issues)


async def test_uses_real_vetted_standard_forms() -> None:
    svc = CompanyObjectService(InMemoryEventStore())
    cid = await svc.create_from_intake(_intake())
    snap = await svc.snapshot(cid)
    engine = DocumentEngine(TemplateModelAdapter())

    safe = (await engine.generate(snap, "W3", 5, ["SAFE Agreement"]))[0]
    assert "Simple Agreement for Future Equity" in safe.body
    assert "Post-Money Valuation Cap" in safe.body  # the YC post-money SAFE structure

    election = (await engine.generate(snap, "W1", 4, ["83(b) Election"]))[0]
    assert "Section 83(b)" in election.body
    assert "30 days" in election.body  # the irreversible deadline is in the form
    # personal/deal-specific fields are left for the founder + attorney
    assert election.issues

    piia_docs = await engine.generate(snap, "W2", 1, ["Proprietary Information (PIIA)"])
    assert "Assignment of Inventions" in piia_docs[0].body


async def test_generated_documents_persist_into_snapshot() -> None:
    svc = CompanyObjectService(InMemoryEventStore())
    cid = await svc.create_from_intake(_intake())
    engine = DocumentEngine(TemplateModelAdapter())

    docs = await engine.generate(await svc.snapshot(cid), "W2", 1, ["NDA"])
    await svc.store_documents(cid, [DocumentGenerated(**d.model_dump()) for d in docs])

    snap = await svc.snapshot(cid)
    assert len(snap.documents) == 1
    assert snap.documents[0].doc_type == "NDA"
    assert snap.documents[0].workflow_code == "W2"
