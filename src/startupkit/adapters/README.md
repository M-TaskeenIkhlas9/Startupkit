# adapters (variant) — one thin implementation per third-party tool
`banking_mercury/` is the fully-worked reference (adapter + anti-corruption mapper + conformance test).
Stubs: `esign_docusign/`, `incorporation_stripe_atlas/`, `model_anthropic/`.
To add a provider: read docs/guides/writing-an-adapter.md, copy `banking_mercury`, implement the Protocol,
make the conformance test pass. CI won't merge an adapter that fails its port contract.
