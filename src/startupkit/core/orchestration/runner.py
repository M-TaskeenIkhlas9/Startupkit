"""Generic manifest interpreter. ONE Temporal workflow runs ANY workflow's declarative steps.

This is what turns W2..W8 into data (the 30%) instead of bespoke code.
Real Temporal wiring (proxy activities, signals for human waits) lives in apps/worker.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class ActionStep(BaseModel):
    kind: Literal["action"] = "action"
    capability: str
    action: str
    next: str | None = None


class GenerateDocStep(BaseModel):
    kind: Literal["generate-doc"] = "generate-doc"
    doc_type: str
    next: str | None = None


class HumanTaskStep(BaseModel):
    kind: Literal["human-task"] = "human-task"
    task: str
    remind_after_hours: int | None = None
    next: str | None = None


class WaitEventStep(BaseModel):
    kind: Literal["wait-event"] = "wait-event"
    event: str
    next: str | None = None


class DecisionStep(BaseModel):
    kind: Literal["decision"] = "decision"
    on: str
    yes: str
    no: str


class EmitTriggerStep(BaseModel):
    kind: Literal["emit-trigger"] = "emit-trigger"
    trigger: str
    next: str | None = None


Step = ActionStep | GenerateDocStep | HumanTaskStep | WaitEventStep | DecisionStep | EmitTriggerStep


class WorkflowManifest(BaseModel):
    id: str
    entry: str
    steps: dict[str, Step] = Field(default_factory=dict)
