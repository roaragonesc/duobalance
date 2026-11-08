---
name: Workspace architecture
description: Dependency direction and package ownership across the monorepo.
applyTo: apps/**/*,packages/**/*,scripts/**/*
---

- Keep `apps/web` and `apps/api` independently buildable. Neither application
  may import source files from the other.
- Shared packages may contain only stable public contracts and schemas that
  are genuinely consumed by both applications; never put server-only logic,
  secrets, or database models there.
- Respect feature ownership in the web app and module/layer ownership in the
  API. Prefer a public package entry point over importing another module's
  implementation details.
- Web feature/UI code must not depend on page or app composition. The existing
  `app/router/screens.ts` is public navigation metadata usable by layouts.
- API services/repositories/models must not import HTTP routes, controllers or
  middlewares. Shared contracts must not depend on apps, tooling or server runtime.
- Preserve pnpm workspace configuration and lockfile; update
  the lockfile after dependency changes.
- Keep external QA and test data isolated from production code. Do not add
  empty directories or speculative architecture.
- Update `docs/ARCHITECTURE.md` and an ADR when an architectural decision or
  dependency direction changes.
- Consult and update `docs/COMPONENT_INVENTORY.md` with structural changes.
- Apply SRP/SOLID, DRY/KISS/YAGNI with judgment: prefer one clear owner, high
  cohesion and low coupling over generic repositories or speculative layers.
- Avoid dependency cycles. Package consumers use declared exports rather than
  private package paths. Internal feature imports remain legitimate where no
  public entry point has been agreed; do not introduce barrels mechanically.
- Run `npm run inventory:update` when sources/imports/exports change; review the
  generated diff and update manual responsibilities/contracts in the same change.
- `npm run lint:arch` checks inventory, supported AST imports, explicit boundaries,
  package entry points and local cycles (including types). Read its exact scope
  and exclusions in architecture; it does not certify runtime or DTO semantics.
- For validator changes, run authorized `npm run test:architecture` and
  `npm run typecheck:tooling`; never weaken rules to hide violations.
