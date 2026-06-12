# ADR-0002: Durable execution via Temporal (Python SDK)
**Status:** accepted (revisit if a lighter option is preferred for the first weeks)
**Context:** Workflows wait days/weeks (IRS, Delaware, KYC, founder signatures) and are human-in-the-loop.
In-process state lost on deploy/crash is unacceptable.
**Decision:** Use Temporal via the `temporalio` Python SDK. A single generic workflow interprets
declarative manifests; idempotent activities perform side effects; durable timers handle waits and
reminders; replay gives free regression testing.
**Consequences:** Operational dependency (run Temporal); activities must be idempotent; workflow code
follows determinism rules. The "scheduler" is mostly built-in (durable timers), not a separate component.
