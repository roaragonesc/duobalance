---
name: Node API
description: Express, MongoDB, validation, and security rules for DuoBalance API code.
applyTo: apps/api/src/**/*.ts
---

- Keep HTTP composition in routes/controllers, business rules in services, and
  persistence in repositories/models; add a layer only when it has a concrete
  responsibility.
- Validate all request data at the server boundary. TypeScript types do not
  replace runtime validation.
- Derive the acting user from the authenticated session; never trust client
  ownership or membership fields.
- Enforce DuoBalance privacy, ownership, two-member, integer-cent, historical
  split, and settlement invariants in the API and database layer.
- Use transactions for related financial writes and preserve existing
  concurrency protections.
- Return consistent HTTP errors without leaking stack traces, credentials,
  tokens, or personal data. Do not silently hide unexpected failures.
- Keep configuration and credentials in `apps/api/.env`; never commit them or
  expose them through `VITE_*`.
- Run the API build and lint plus the relevant external QA scenarios.
- Locate the owning layer and affected contracts/consumers in the inventory.
  Keep HTTP translation separate from domain/application and persistence.
- Validate configuration before connecting integrations. Use safe queries and
  explicit migrations when changing stored data, preserving rollback safety.
- Keep logs useful without credentials, tokens, request bodies or personal data.
- Update inventory and API documentation with changes. Use authorized developer
  tests for pure rules; request external QA separately, never execute by default.
