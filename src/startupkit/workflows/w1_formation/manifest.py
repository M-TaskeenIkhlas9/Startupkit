"""W1 — Business Formation. The reference workflow. Steps are DATA; the runner executes them.

Mirrors the Eraser flow: name checks -> docs -> filing -> EIN -> 83(b) fuse -> triggers.
"""

from __future__ import annotations

from startupkit.core.orchestration.runner import (
    ActionStep,
    DecisionStep,
    EmitTriggerStep,
    GenerateDocStep,
    HumanTaskStep,
    WaitEventStep,
    WorkflowManifest,
)

w1_formation = WorkflowManifest(
    id="w1-formation",
    entry="name-checks",
    steps={
        "name-checks": ActionStep(
            capability="incorporation", action="check_name_availability", next="name-decision"
        ),
        "name-decision": DecisionStep(
            on="name_conflict", yes="name-checks", no="emit-name-confirmed"
        ),
        # unblocks W4 + W5
        "emit-name-confirmed": EmitTriggerStep(trigger="name.confirmed", next="gen-articles"),
        "gen-articles": GenerateDocStep(doc_type="articles-of-incorporation", next="sign-docs"),
        "sign-docs": HumanTaskStep(
            task="all-founders-sign", remind_after_hours=48, next="file-state"
        ),
        "file-state": ActionStep(
            capability="incorporation", action="file_with_state", next="await-cert"
        ),
        "await-cert": WaitEventStep(event="certificate.issued", next="apply-ein"),
        "apply-ein": ActionStep(capability="incorporation", action="apply_ein", next="await-ein"),
        "await-ein": WaitEventStep(event="ein.issued", next="emit-ein"),
        "emit-ein": EmitTriggerStep(trigger="ein.received", next="file-83b"),  # unblocks W3
        # CRITICAL FUSE: 83(b) must be filed within 30 days of stock issuance — handled by the
        # compliance engine's guaranteed-delivery path, not a best-effort timer.
        "file-83b": HumanTaskStep(
            task="file-83b-election", remind_after_hours=24, next="emit-formed"
        ),
        "emit-formed": EmitTriggerStep(trigger="entity.formed"),  # unblocks W2 + W6
    },
)
