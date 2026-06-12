"""COPY ME to start a new workflow. Replace id/steps. Keep steps declarative where possible."""
from __future__ import annotations

from startupkit.core.orchestration.runner import HumanTaskStep, WorkflowManifest

new_workflow = WorkflowManifest(
    id="wX-rename-me",
    entry="first-step",
    steps={"first-step": HumanTaskStep(task="describe-me")},
)
