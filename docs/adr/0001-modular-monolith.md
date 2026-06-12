# ADR-0001: Modular monolith
**Status:** accepted
**Decision:** Ship as one deployable monorepo with hard internal module boundaries (hexagonal),
not microservices.
**Why:** Fastest path to MVP for a 5-person team; shared types; atomic refactors. Boundaries
(ports, platform services) are enforced in CI so doc-generation, compliance, or per-workflow workers
can be extracted into services later when scale or regulatory isolation demands it — without a rewrite.
**Consequences:** One CI/deploy; discipline required to keep boundaries clean (lint-enforced).
