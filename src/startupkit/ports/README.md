# ports (core) — capability Protocols
A workflow depends on a port (`typing.Protocol`), never on a vendor. One module per capability.
`banking.py` is the reference. `model.py` powers Document Intelligence.
`esign/incorporation/payments/payroll` are stubs awaiting definition (@eng-integrations).
A port change is an RFC; every port has a matching conformance base in core/ports_runtime/conformance.
