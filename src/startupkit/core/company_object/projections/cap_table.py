"""Example projection: derive the cap table purely from events.

Pure function = trivially testable.
"""

from __future__ import annotations

from pydantic import BaseModel

from startupkit.core.company_object.events import EventEnvelope


class CapTableRow(BaseModel):
    founder_id: str
    shares: int = 0
    equity_pct: float


def project_cap_table(events: list[EventEnvelope]) -> list[CapTableRow]:
    rows: dict[str, CapTableRow] = {}
    for env in events:
        e = env.event
        if e.type == "founder.added":
            rows[e.founder_id] = CapTableRow(founder_id=e.founder_id, equity_pct=e.equity_pct)
        elif e.type == "stock.issued":
            row = rows.get(e.founder_id)
            if row is not None:
                row.shares += e.shares
    return list(rows.values())
