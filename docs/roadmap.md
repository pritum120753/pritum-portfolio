# Product roadmap

This roadmap reflects the repository as reviewed on 2026-11-13. Checked items are implemented in the source tree; unchecked items remain planned or incomplete.

## P0 — Production data durability

- [ ] Move the portfolio database to a durable plan/provider with backups before the current Render Free PostgreSQL expiration.
- [ ] Export and verify a restorable database backup.
- [ ] Write and test a documented recovery procedure.

## P1 — Security and reliability

- [x] Add login input validation and an in-process login rate limiter.
- [x] Add database-backed Admin and Super Admin role checks.
- [x] Restrict Admin Management to Super Admin.
- [ ] Enforce a single Super Admin at the database level.
- [ ] Add consistent schema validation to every CRUD endpoint.
- [ ] Validate URL schemes, date ranges, booleans, integers, and string length limits.
- [ ] Replace the process-local rate limiter with a shared store before horizontal scaling.
- [ ] Review JWT localStorage storage and plan secure session handling.
- [ ] Add structured logs, monitoring, health checks, and alerting.
- [ ] Add persistent admin audit history.

## P1 — Testing and engineering quality

- [x] Add backend tests for core authentication, authorization, login validation, Admin input validation, and rate limiting.
- [x] Add GitHub Actions checks for frontend build, backend syntax, backend tests, and Prisma schema validation.
- [ ] Add frontend unit/component tests for login, forms, and admin flows.
- [ ] Add end-to-end smoke tests for the public site and Admin Dashboard.
- [ ] Add controller integration tests for every CRUD resource.
- [ ] Add automated accessibility checks and responsive regression checks.
- [ ] Add formatting/lint rules and enforce them in CI.
- [ ] Add Dependabot updates and automated dependency vulnerability monitoring.

## P1 — Repository and deployment hygiene

- [x] Remove the stray empty root-level `git` file. [ ] Review root-level legacy `src/`, `public/`, and Vite files before cleanup.
- [ ] Review root-level `resume.pdf` and `sample-report.pdf` for intentional public disclosure and client confidentiality.
- [ ] Fix the default resume/sample-report asset paths so they resolve from the active `frontend/` build.
- [ ] Replace Base64 profile-image storage with validated object storage and signed/public URLs as appropriate.
- [ ] Add staging/preview deployment verification and rollback notes.
- [ ] Add database backup and restore monitoring.

## P2 — Public portfolio capabilities

- [ ] Extract the large public `App.jsx` component into reusable sections and feature modules.
- [ ] Add project categories, tags, filtering, and detail pages.
- [ ] Add robust image/media upload and storage with file validation.
- [ ] Add SEO metadata, sitemap, robots rules, and social sharing previews.
- [ ] Improve accessibility semantics, labels, keyboard navigation, and contrast.
- [ ] Add performance budgets and Lighthouse checks.

## P2 — Private Admin tools

- [x] Add multiple regular Admin accounts.
- [x] Add a single Super Admin promotion workflow and protect Super Admin account management.
- [ ] Add search, filtering, and pagination for larger collections.
- [ ] Add draft/published status and preview workflow.
- [ ] Add content ordering controls.
- [ ] Add confirmation and recovery patterns for destructive actions.
- [ ] Build a private, Admin-only AI job-tailored CV/resume maker (see [feature specification](ai-resume-builder.md)); it must not appear in public navigation.

## P3 — Integrations and insights

- [ ] Improve contact-form spam protection and message delivery/notifications.
- [ ] Add privacy-conscious optional analytics.
- [ ] Add export/backup tools for portfolio content.
- [ ] Add integration settings with server-side secret storage.

## Prioritization rules

For each proposed feature, record:

- User problem and expected benefit
- Scope and non-goals
- UI changes and API contract
- Database changes and migration/rollback plan
- Security and privacy implications
- Acceptance criteria and tests
- Deployment and environment changes

Do not start a feature that requires a production schema or authentication change without a reviewed migration and rollback plan.
