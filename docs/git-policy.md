# Git policy

Short-lived branches, small PRs, the **team lead is the only merger** to `main`. CI is the gatekeeper.

## Branching model (trunk-based)
- `main` is always releasable and protected. **No direct pushes.**
- Branch off `main` for every unit of work. Keep branches short-lived (< 2 days). Rebase on `main` daily.
- Branch naming: `type/team/short-description`
  - `feat/teamA/outbox-relayer`, `fix/teamB/docusign-status-map`, `chore/tl/branch-protection`
  - `type` ∈ `feat | fix | chore | docs | refactor | test | rfc`.

## Pull requests
- **One feature per PR**, ideally ≤ 400 lines of diff. If it grows, split it.
- Open as **Draft** while WIP; mark **Ready for review** when CI is green and acceptance criteria are met.
- PR description must include: the feature ID (e.g. `A3`), what changed, how it was tested, and any seam impact.
- **Reviewer = Team Lead.** TL reviews and **squash-merges**. Engineers do not merge their own PRs.
- Address review comments by pushing follow-up commits (don't force-push during review); TL squashes on merge.

## Commits
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.
- Subject ≤ 72 chars, imperative mood: `feat: add transactional outbox relayer`.
- Reference the feature ID in the body when useful.

## Changing a shared interface (the seam)
Interfaces in `ports/_shared`, `ports/*`, `packages/domain`, and platform service signatures are contracts.
- Open an **`rfc/...`** branch with a PR labelled `rfc`. Describe the change and who it affects.
- Requires **TL approval + sign-off from every affected owner** (per CODEOWNERS) before merge.
- Update the matching conformance suite / glossary in the **same PR**.

## Branch protection (TL configures on Day 1)
- Require PR before merging; **no direct pushes to `main`**.
- Require status checks to pass: `ruff`, `mypy`, `lint-imports`, `pytest`.
- Require **1 approval** (the TL); dismiss stale approvals on new commits.
- Require branches to be up to date with `main` before merge.
- Linear history (squash merges only).

## Merge hygiene
- Squash merge → one clean commit per feature on `main`.
- Delete the branch after merge.
- Never commit `.env`, secrets, `__pycache__/`, or `.venv/` (covered by `.gitignore`).
- Revert forward: if `main` breaks, revert the offending merge commit, then fix on a new branch.
