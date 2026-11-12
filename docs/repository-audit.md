# Repository Audit

**Repository:** `pritum120753/pritum-portfolio`  
**Audit date:** 2026-11-13  
**Scope:** Read-only review of the tracked GitHub tree, package manifests, deployment configuration, current application entry points, API helper, authentication middleware, server routes, and latest GitHub Actions run.

This document records findings from the repository snapshot. It is not a claim that every runtime or production behavior has been tested. No application files were deleted or reorganized during this audit.

## Executive summary

The repository has a working foundation: a React/Vite frontend, Express API, Prisma/PostgreSQL data layer, admin authentication, environment templates, deployment configuration, and a CI workflow. The latest CI run for the audited `main` commit completed successfully.

The main maintainability concern is that the repository contains two generations of frontend source: the deployed `frontend/` application and an older root-level `src/`, `public/`, and `index.html` structure. Netlify currently builds from `frontend/`, so the root-level copy appears outside the configured deployment path. It should be verified before removal.

The next priority should be to improve test coverage and security controls, then modularize the large frontend files in small, reversible steps. Avoid a full rewrite.

## Confirmed repository structure

- `frontend/`: active Vite/React application configured as Netlify's build base.
- `backend/`: Express API, Prisma schema/migrations, controllers, routes, middleware, and admin creation script.
- `docs/`: architecture, configuration, development, roadmap, and private AI Resume Maker specification.
- `.github/workflows/ci.yml`: frontend build and backend syntax/Prisma validation.
- Root-level `src/`, `public/`, and `index.html`: legacy/duplicate frontend structure.
- Root, frontend, and backend each have package manifests/lockfiles.

## Findings and recommendations

### P1 — Resolve duplicate frontend source safely

**Evidence:** The root contains `src/App.jsx`, `src/main.jsx`, `src/ContactForm.jsx`, `src/StarBackground.jsx`, `src/data.js`, `vite.config.js`, `index.html`, and `public/`. The active deployment configuration in `netlify.toml` uses `base = "frontend"`, `command = "npm run build"`, and `publish = "dist"`. The active frontend has its own corresponding files under `frontend/src/` and `frontend/index.html`.

**Risk:** Developers may edit the wrong copy, and the old files can drift from the deployed app. The root-level `public/resume.pdf` and `public/sample-report.pdf` are tracked separately from the deployed `frontend/public/` folder.

**Recommendation:** Confirm no external workflow or developer process depends on the root-level legacy app. Then archive or remove the obsolete copy in a dedicated cleanup change after comparing assets and behavior. Do not delete it as part of unrelated work.

### P1 — Add automated tests before major refactoring

**Evidence:** The package scripts and CI workflow currently provide a frontend production build, backend JavaScript syntax checks, and Prisma schema validation. No test scripts or test files were present in the audited tree.

**Risk:** A successful build does not verify API behavior, admin authorization, form validation, data mapping, or regressions.

**Recommendation:** Add backend tests for authentication/authorization and CRUD validation first, then frontend tests for critical public/admin flows. Add tests to CI and keep deployment blocked on failures.

### P1 — Strengthen admin authentication protections

**Evidence:** The frontend API helper reads `admin_token` from `localStorage` and sends it as a Bearer token. The backend verifies JWTs and checks the `ADMIN` role. The login route is present; no login rate-limiting middleware was observed in the audited route/server setup.

**Risk:** A successful cross-site scripting issue could expose a localStorage token. Unrestricted login attempts increase brute-force risk.

**Recommendation:** Add login rate limiting and security tests. Evaluate a secure HttpOnly cookie session with an appropriate CSRF strategy as a separately planned change; do not switch token transport without coordinating frontend, backend, and deployment behavior.

### P2 — Break large frontend entry components into feature modules

**Evidence:** `frontend/src/App.jsx` is approximately 45 KB and `frontend/src/AdminApp.jsx` approximately 25 KB. Admin resource configuration, resource CRUD, About, Site Settings, login, navigation, and route rendering currently live together in `AdminApp.jsx`.

**Risk:** Changes to one feature can create unintended side effects in unrelated screens, and the files are harder to test and review.

**Recommendation:** Extract one area at a time into `features/<feature>/` modules, keeping current routes, API payloads, and visual behavior unchanged. Start with admin resource managers and shared form components.

### P2 — Improve backend separation and request validation

**Evidence:** Backend code is organized into routes, controllers, middleware, and Prisma library, which is a useful starting structure. Business logic and database access are primarily in controllers. No dedicated service or validation modules were present in the tree.

**Risk:** Validation and business rules can become inconsistent as new features are added.

**Recommendation:** Introduce feature modules with route/controller/service/validator boundaries when each feature is next changed. Add shared validation schemas and consistent API error responses incrementally.

### P2 — Improve API client resilience and request handling

**Evidence:** `frontend/src/services/api.js` centralizes API requests and attaches the admin token. It parses JSON and throws a message for non-2xx responses.

**Recommendation:** Add request timeouts/AbortSignal support, handle non-JSON responses explicitly, and only set JSON content type when the request body is JSON. Preserve existing response shapes and authentication behavior during the change.

### P2 — Expand CI beyond build and syntax checks

**Evidence:** CI runs on pushes to `main` and pull requests. It uses Node.js 20, runs `npm ci` in frontend/backend, builds the frontend, checks backend JavaScript syntax, and validates Prisma.

**Recommendation:** Add tests, dependency/security review, and (when available) lint/type checks. Consider separating preview/deployment from validation and require checks before merging.

### P3 — Clarify package and source-of-truth conventions

**Evidence:** The root package coordinates frontend/backend scripts, while frontend and backend each have their own package manifests and lockfiles. The frontend and backend manifests also reference the root package through `file:..`.

**Recommendation:** Document which package manager and install commands are canonical. Keep lockfiles synchronized with manifest changes and test a clean install in CI. Avoid introducing a workspace migration until there is a clear benefit and a tested migration plan.

### P3 — Protect private or owner-only assets

**Evidence:** The root-level `public/resume.pdf` and `public/sample-report.pdf` are tracked. The root `.gitignore` excludes paths under `frontend/public/`, but does not exclude the root-level copies. Netlify's configured base is `frontend`, so these root assets are not in the configured publish directory today.

**Risk:** If the deployment base changes or a different build process is used, personal or sample documents could become publicly served.

**Recommendation:** Confirm whether these files are intended to be public and whether they contain personal/client-sensitive information. If private, remove them from public asset paths and Git history as appropriate; use private storage for future admin-only files.

## Positive foundations

- Frontend and backend have separate package manifests and lockfiles.
- Netlify explicitly builds from `frontend/`.
- Backend has a Prisma schema and tracked migrations.
- JWT verification and an explicit admin-role check exist.
- Environment files are ignored and a backend `.env.example` is present.
- The latest CI run for the audited commit completed with a successful conclusion.

## Recommended execution order

1. Add backend tests and admin security protections.
2. Verify the legacy root frontend is unused; then clean it up in a dedicated commit.
3. Extract Admin Panel modules without changing behavior.
4. Introduce backend validation/service boundaries incrementally.
5. Improve the API client and expand CI.
6. Build private admin-only tools, including the AI Resume Maker, on top of the improved structure.

## Verification snapshot

- GitHub tree: 94 entries; tree response was not truncated.
- Netlify build base: `frontend`.
- CI: latest run for audited `main` commit completed successfully.
- This was a source/configuration audit, not a live production penetration test or a full end-to-end test.


## Security work completed after this audit

The backend now validates login input types, email format, and maximum password length; applies an in-process limit of 10 login attempts per client IP per 15-minute window; returns HTTP 429 with a Retry-After header when the limit is reached; reduces the JSON request body limit to 1 MB; supports an explicit allowlist of comma-separated CORS origins; and has Node's built-in test runner coverage for token authentication, admin-role enforcement, login validation, and rate limiting.

**Deployment note:** Set `TRUST_PROXY=1` in Render's backend environment when the service is behind Render's reverse proxy. The rate limiter is process-local; use a shared store before running multiple backend instances.
