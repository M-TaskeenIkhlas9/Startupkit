# Security & compliance

## Data classification
- **Critical PII:** EIN, SSN, bank account/routing, provider OAuth tokens → field-level encrypted, never logged.
- **Sensitive:** cap table, equity, documents → tenant-scoped, access-controlled.
- **Operational:** workflow/step state, metrics.

## Controls
- **Tenant isolation:** Postgres row-level security; option to graduate a tenant to schema/DB-per-tenant.
- **Encryption:** TLS in transit; field-level encryption at rest for Critical PII via `platform/security`.
- **Secrets:** per-tenant vault for provider tokens; scoped + short-lived + rotatable; platform secrets separate.
- **Audit:** hash-chained, append-only log of every state-changing action (tamper-evident; doubles as SOC 2 evidence).
- **Access:** RBAC per resource (founder vs co-founder vs employee vs advisor see different data).
- **Residency:** EU tenants (W2 generates a DPA) → region-aware storage.

## SOC 2 by design
Audit trails, access control, encryption, and change management are built in from M1 so attestation is a
documentation exercise, not a re-architecture.

## The 83(b) guarantee (hard requirement)
A 30-day, no-extension, irreversible deadline. The compliance engine treats it as the canonical
guaranteed-delivery case: multiple channels, explicit acknowledgement, escalating urgency, and a human
backstop if unacknowledged. A best-effort cron is not acceptable. Covered by a dedicated reliability test.
