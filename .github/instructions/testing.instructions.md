---
name: Testing and QA
description: Validation expectations and external QA boundary for DuoBalance.
applyTo: apps/**/*,packages/**/*,scripts/**/*
---

- Developer tests, such as focused unit tests and tooling validator tests, may
  live here when required. The architecture validator uses Node's built-in
  `node:test` via `npm run test:architecture`. Focused HTTP client/service tests
  use `node:test` and `tsx` via `npm run test:unit`; `npm run typecheck:unit`
  checks their types. Client tests live in `apps/web/tests`, outside browser sources;
  connector tests live in `apps/api/tests` with mocked Mongoose. Both suites
  must not connect to databases or duplicate the external QA framework.
  Do not install additional runners without permission.
- Keep developer tests independent and deterministic. Reuse fixtures/factories
  where useful, avoid fixed sleeps, and never skip failures to hide defects.
- Keep the web app automatable with semantic HTML, accessible names, labels,
  deterministic states, and no fixed sleeps or production-only test hooks.
- For UI changes, validate observable behavior, accessible names and keyboard flow.
- For API changes, verify boundary validation, authorization, status codes,
  and relevant financial invariants with authorized developer checks.
- Run only existing, authorized checks covering the change:
  `pnpm run check:architecture`, `pnpm run lint`, and `pnpm run build`.
  Run `pnpm run build:demo` when shared web bootstrap or Vite behavior changes.
- Report PASS, FAIL, BLOCKED and NOT_RUN with exact commands and limitations.
- For architecture tooling changes also run authorized `npm run test:architecture`
  and `npm run typecheck:tooling`. These are developer checks, not external QA.
- Full suites and deployments are never a default verification step.
