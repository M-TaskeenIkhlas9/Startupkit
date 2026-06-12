"""Event-sourced Company Object. State is never overwritten — only events are appended.

Projections (see ./projections) derive cap table, documents, compliance calendar, and triggers.
"""
from __future__ import annotations

from typing import Literal, Union

from pydantic import BaseModel, Field


class CompanyNamed(BaseModel):
    type: Literal["company.named"] = "company.named"
    name: str


class FounderAdded(BaseModel):
    type: Literal["founder.added"] = "founder.added"
    founder_id: str
    equity_pct: float
    vesting: str


class EntityFormed(BaseModel):
    type: Literal["entity.formed"] = "entity.formed"
    jurisdiction: str
    entity_type: Literal["c-corp", "llc"]
    certificate_ref: str


class EinIssued(BaseModel):
    type: Literal["ein.issued"] = "ein.issued"
    ein: str


class StockIssued(BaseModel):
    type: Literal["stock.issued"] = "stock.issued"
    founder_id: str
    shares: int
    issued_at: str


CompanyEvent = Union[CompanyNamed, FounderAdded, EntityFormed, EinIssued, StockIssued]


class EventEnvelope(BaseModel):
    id: str
    tenant_id: str
    sequence: int           # monotonic per tenant — ordering + optimistic concurrency
    occurred_at: str
    event: CompanyEvent = Field(discriminator="type")
