"""Transactional outbox: cross-workflow triggers are written to an `outbox` table in the SAME
transaction as the company-object event that caused them, then relayed to the trigger bus.
Guarantees a trigger like `entity.formed` is never lost on crash/deploy. See ADR-0003.
TODO(@eng-spine).
"""
