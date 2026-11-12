# Development guide

This guide describes how to extend the portfolio without making future features difficult to maintain.

## Core principles

1. **Add features incrementally.** Avoid replacing the working application with a large rewrite.
2. **Keep public and admin behavior separate.** Public pages should only read public data; writes must remain protected by authentication and admin authorization.
3. **Keep the API contract stable.** If a response or request shape changes, update the frontend, backend, and documentation together.
4. **Use database migrations.** Never edit a deployed database schema manually. Update `backend/prisma/schema.prisma`, generate a migration, review its SQL, and deploy it deliberately.
5. **Keep secrets on the server.** Never put database credentials, JWT secrets, or admin passwords in frontend code or committed files.
6. **Document new configuration.** Every new environment variable must be added to `backend/.env.example` and `docs/configuration.md`.
7. **Test before deployment.** Add or update tests for new business logic, API routes, permissions, and user-facing behavior.

## Where new code belongs

### Frontend

- `frontend/src/App.jsx`: current public portfolio page. It is a legacy, large component; avoid adding unrelated features directly to it.
- `frontend/src/AdminApp.jsx`: current admin dashboard and resource management UI. Avoid growing this file with unrelated feature logic.
- `frontend/src/services/`: shared API client and future API-specific modules.
- `frontend/src/components/`: reusable UI components (create this directory when extracting shared components).
- `frontend/src/features/<feature>/`: recommended home for new feature-specific components, hooks, and API functions.
- `frontend/src/pages/`: recommended home for route-level pages as the app grows.

For a new feature, prefer a feature folder such as:

```text
frontend/src/features/analytics/
  components/
  hooks/
  api.js
  index.js
```

Extract existing monolithic components gradually, one feature at a time. Keep routes and visible behavior unchanged during each refactor.

### Backend

- `backend/src/routes/`: URL and middleware wiring only.
- `backend/src/controllers/`: HTTP request/response handling.
- `backend/src/middleware/`: authentication, authorization, validation, and shared request middleware.
- `backend/src/services/`: recommended location for reusable business logic and integrations.
- `backend/src/validators/`: recommended location for request schemas.
- `backend/src/lib/`: shared infrastructure such as Prisma.
- `backend/prisma/`: schema and migration history.

For a new backend feature, use a consistent module:

```text
backend/src/
  routes/feature.routes.js
  controllers/feature.controller.js
  services/feature.service.js
  validators/feature.validator.js
```

Do not put database queries, business rules, and response formatting all into route files.

## Adding a database-backed feature

1. Define the data model and relationships in `backend/prisma/schema.prisma`.
2. Create and review a migration in a development database.
3. Add a service for business rules and database operations.
4. Add controller and routes.
5. Apply authentication and admin authorization to every write endpoint.
6. Validate all user input on the server.
7. Add tests for success, invalid input, missing records, and unauthorized access.
8. Add frontend feature UI and API calls.
9. Document API routes and any new environment variables.
10. Verify the build and deployment before merging.

## API conventions

- Use plural resource names, e.g. `/api/projects`.
- Use GET for reads, POST for creation, PUT/PATCH for updates, and DELETE for deletion.
- Return consistent JSON responses with a `success` property and a useful message for errors.
- Return appropriate HTTP status codes (400 validation, 401 unauthenticated, 403 forbidden, 404 missing resource, 500 unexpected server error).
- Never trust frontend validation as a security boundary.
- Avoid returning password hashes, tokens, or internal stack traces.

## Quality gates

Before merging a feature:

- [ ] Frontend production build passes.
- [ ] Backend syntax and Prisma validation pass.
- [ ] Tests cover core behavior and authorization.
- [ ] Public routes remain public; write routes require admin authorization.
- [ ] No secrets or private client data are committed.
- [ ] README/API/configuration docs are updated.
- [ ] Netlify and Render environment configuration is checked.
- [ ] Existing public portfolio and admin workflows are manually smoke-tested.

## Refactoring policy

The current public and admin React entry components are large. Refactor them in small, reversible steps:

1. Extract a component or feature without changing its behavior.
2. Run the build and smoke-test the affected route.
3. Commit the refactor separately from feature changes.
4. Repeat.

Do not combine a large UI redesign, database migration, and authentication rewrite in one change.
