# Repository Production-Readiness Audit

**Repository:** `pritum120753/pritum-portfolio`  
**Audit date:** 2026-11-13  
**Branch reviewed:** `main`  
**Scope:** Tracked Git tree, frontend and backend source, API routes/controllers, Prisma schema and migrations, package manifests/lockfiles, GitHub Actions, documentation, and current Render service/database metadata.

This is a source/configuration audit plus a limited hosting metadata review. It is not a penetration test, full UI test, or independent review of every record in the production database.

## Executive summary

The repository has a working full-stack foundation: React/Vite frontend, Express API, PostgreSQL through Prisma, JWT-based Admin authentication, Super Admin role gating, deployment configuration, and GitHub Actions checks.

The core product is implemented, but the repository is **not yet production-hardened**. The most important issue is the current Render Free PostgreSQL database's expiry. Other high-priority work includes public-document review, complete request validation, durable backups, and automated frontend/integration tests.

## P0 — Data durability and deployment risk

### Render Free PostgreSQL database expires

The connected Render workspace reports the portfolio database as a Free PostgreSQL instance with an expiry date of **2026-12-04**. The database is currently available, but Render's Free PostgreSQL tier expires 30 days after creation, becomes inaccessible at expiry, then has a 14-day grace period before deletion. Free PostgreSQL does not include backups. Move the database to a durable paid plan/provider or export and verify a restorable backup before expiry.

Reference: [Render Free instance limitations](https://render.com/docs/free).

### No verified backup/restore procedure

No repository backup job, restore script, or documented recovery test was found. A backup that has not been restored in a test is not a verified recovery plan.

**Required action:** create a protected database export, store it outside the repository, verify it can be restored into a separate database, and document the recovery steps.

## P1 — Privacy and public asset exposure

### PDFs are tracked in the public repository root

The Git tree contains:

- `public/resume.pdf` (approximately 475 KB)
- `public/sample-report.pdf` (approximately 6.5 MB)

The repository is public, so these files are downloadable from GitHub even though the active Netlify build uses `frontend/` and does not publish the root-level `public/` directory. Confirm the resume is intentionally public. Inspect the sample report for client names, property addresses, loan/application identifiers, signatures, contact details, or other confidential appraisal information. Remove sensitive material from the repository and assess Git-history cleanup if needed.

### Active frontend asset paths do not match tracked PDF paths

The active `frontend/src/App.jsx` links to `/sample-report.pdf`; its default resume URL is `/resume.pdf`. The matching PDFs are present under root `public/`, not `frontend/public/`. With Netlify's current `base = "frontend"`, root-level assets are not part of the published `dist` directory. The production Site Settings row also currently contains `heroResumeUrl = "/resume.pdf"`. Unless another deployed asset or redirect supplies the file, these links will not resolve.

**Required action:** decide which documents are meant to be public, place only approved public assets under `frontend/public/` or a proper asset host, and verify both links after deployment.

## P1 — Profile image storage

The profile image is currently converted to a Base64 data URL and stored in the `SiteSettings.heroImage` field. The Admin UI previously allowed 3 MB images against a 1 MB API JSON body limit. An interim fix now limits new images to 650 KiB and omits an unchanged image from unrelated settings updates, avoiding that request-size mismatch.

The storage model is still not ideal: Base64 data increases database size and is returned in the public Site Settings response. Replace it with a validated object-storage upload endpoint and appropriate public/private URLs.

## P1 — Backend validation is inconsistent

Validation helpers exist for login and Admin account input, and some field checks exist in the resource controllers. Validation is not yet comprehensive:

- Some updates call `.trim()` on values before consistently checking that they are strings.
- Experience and Education date parsing does not consistently reject invalid dates or impossible date ranges.
- Numeric ordering fields are not consistently constrained to finite integers.
- Project and Site Settings URLs do not have a common protocol/format allowlist.
- Booleans and optional values are not consistently type-checked on every resource.
- Unexpected type errors may become generic HTTP 500 responses rather than useful HTTP 400 validation errors.

**Required action:** introduce shared schema validation for all create/update endpoints, with tests for valid input, invalid types, missing fields, boundary values, and malformed dates/URLs.

## P1 — Admin and authentication hardening

Positive controls already present:

- bcrypt password hashing (12 rounds)
- login input validation
- in-process limit of 10 login attempts per client IP per 15-minute window
- JWT verification and database-backed role checks on protected requests
- separate `ADMIN` and `SUPER_ADMIN` authorization
- Super Admin-only Admin Management endpoints
- regular Admins cannot modify/delete the protected Super Admin through Admin Management
- deleting or demoting an account revokes its protected API access

Remaining risks:

- The rate limiter is process-local, resets on restart, and is not shared across instances.
- JWTs are stored in browser `localStorage`, so an XSS vulnerability could expose them.
- `User.role` is a free-form string in Prisma, and the database does not enforce a single Super Admin. The promotion script maintains one during its own transaction, but a DB constraint/serializable promotion strategy would be stronger.
- There is no persistent audit log for admin changes.
- There are no full controller integration tests for every write endpoint.

**Recommended action:** review an HttpOnly cookie session design, add a shared rate-limit store before scaling, enforce role invariants in the database, and record privileged changes.

## P2 — Frontend engineering and user experience

- `frontend/src/App.jsx` is approximately 45 KB and 1,269 lines; it combines many public sections and data-loading effects. Extract sections and feature modules gradually.
- The Admin application is already modularized into components, but shared form controls/validation remain duplicated.
- There are no frontend unit/component or end-to-end test suites.
- Some form labels are not associated with controls using `htmlFor`/IDs.
- The public page has basic title/description metadata, but no complete per-page SEO, sitemap, robots policy, or social sharing metadata.
- The public GitHub repositories section depends on the unauthenticated GitHub API and has no explicit user-facing rate-limit/error state.
- The shared frontend API helper now avoids forcing JSON content type on bodyless requests.

## P2 — Contact form anti-spam

The public contact form posts to Netlify Forms. The static HTML includes a honeypot declaration, but the React form does not render/submit the corresponding honeypot field. Add a verified Netlify Forms honeypot or another spam-control mechanism and test real submissions on the deployed site.

## P2 — Repository structure and hygiene

### Duplicate legacy frontend

The tree contains both the active `frontend/src/` app and legacy root-level `src/`, `public/`, `index.html`, and `vite.config.js`. Netlify explicitly builds from `frontend/`. The root package also provides convenience scripts and is referenced by child packages as a local `file:..` dependency, so remove/merge the legacy copy only after checking all imports and packaging behavior.

### Stray root-level file

The root contains a zero-byte file named `git`. It appears to be an accidental artifact and should be removed after confirming no external process depends on it.

### One-off script

`backend/add-skills.js` sits outside the main `src/scripts/` structure and is not exposed as a named package script. Decide whether it is still needed; if so, move it into a documented seed/import command with safe idempotency.

### Tooling gaps

- Weekly Dependabot updates are now configured for the root, frontend, backend, and GitHub Actions.
- CI now audits frontend and backend dependencies for high-severity vulnerabilities.
- CI uses pinned current GitHub Actions versions and Node.js 24.
- No formatter/linter is configured.
- No frontend tests exist.

## Positive foundations

- The active deployment root is explicit in `netlify.toml`.
- Separate frontend/backend package manifests and lockfiles exist.
- Prisma schema changes are represented by migrations.
- Secrets are not present in the tracked `.env.example`; real environment files are ignored.
- Express Helmet, CORS allowlist, 1 MB body limit, and protected routes are configured.
- Backend tests cover login validation, Admin input validation, authentication/authorization middleware, and login rate limiting.
- GitHub Actions verifies frontend build, dependency audit, backend syntax, backend tests, and Prisma schema validity.
- Admin screens are split into feature components.
- The current Super Admin role is active in the production database; role counts were verified during the audit.

## Additional deployment finding

The connected Render API service's build command currently runs `npm run create-admin` on every deploy after migrations. That script upserts the configured Admin email and replaces its password with `ADMIN_PASSWORD`. This means deployments can reset the provisioned account's password and may recreate it if absent. Move one-time Admin provisioning out of the normal build command after confirming the existing production account and provisioning process.

## Recommended execution order

1. **Resolve database expiry and verify a restorable backup.**
2. Review the public PDFs and confirm the intended resume/sample-report assets.
3. Fix the active public PDF paths and verify them after deployment.
4. Move profile image storage to object storage.
5. Add consistent server-side schemas and controller integration tests.
6. Review the Render build command so routine deploys do not reset Admin passwords.
7. Add frontend component/E2E tests, lint/format, and accessibility checks.
8. Improve JWT session handling and rate-limit storage; enforce the Super Admin invariant in the database.
9. Clean up legacy files and improve public-site SEO/performance.
10. Add admin audit history, draft/publish, search/filter, and further portfolio features.

## Verification snapshot

- GitHub tree: 113 entries at the start of the audit; recursive tree response was not truncated.
- Main branch: 1 branch (`main`).
- GitHub open issues: 0 at audit time.
- Pull requests and releases: none found in the reviewed API listing.
- CI: updated frontend build, high-severity dependency audits, backend syntax/tests, and Prisma validation all passed after the CI changes.
- Render API: current backend deployment reported Live during the initial infrastructure review.
- Render PostgreSQL: Free plan, available at audit time, expiry reported as 2026-12-04.
- Production Site Settings: `heroResumeUrl = "/resume.pdf"`; `heroImage` is a Base64 data URL of approximately 321,131 characters.
- Netlify latest production deploy: not independently verified in this audit.
