---
name: React frontend
description: Accessibility, feature boundaries, and browser behavior for DuoBalance web code.
applyTo: apps/web/src/**/*.{ts,tsx,css}
---

- Keep routes and global providers in `src/app/`; keep reusable UI in
  `src/components/`, and feature-specific code in `src/features/`.
- Keep API transport/adapters in `src/services/api/`; feature services own the
  feature-facing contract.
- Use strict TypeScript and existing React Router, Tailwind, and form patterns.
- Keep the UI in Spanish (Spain), use semantic HTML, visible associated labels,
  accessible error/status announcements, and visible keyboard focus.
- Use links for navigation and buttons for actions. Preserve `aria-current`
  on active navigation and stable accessible names.
- Keep loading, error, empty, and success states observable. Prevent duplicate
  form submission and confirm destructive actions.
- Keep components accessible and behavior deterministic; do not add unnecessary
  `data-testid` attributes.
- Do not place business authorization or secrets in the browser.
- Consult the inventory and locate existing owners/consumers before editing;
  update its entries when files are added, removed, moved or renamed.
- Keep rendering pure. Derive values instead of using effects to mirror state;
  reserve effects for external synchronization with correct cleanup.
- Distinguish local, remote and global state; do not duplicate sources of truth.
- Use composition and reusable hooks where they solve actual repetition.
  Measure before introducing memoization or state-management dependencies.
- Test observable behavior with focused developer tests when available;
  without adding testing infrastructure by default.
