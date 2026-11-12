# Architecture and API notes

## System overview

```text
Netlify
  └─ React + Vite portfolio
      ├─ Public pages (projects, skills, experience, education, contact)
      └─ /admin (authenticated dashboard)
           │ HTTPS JSON requests
           ▼
Render-hosted Express API
  ├─ Public read endpoints
  ├─ JWT authentication / role checks for admin writes
  ├─ Controllers
  └─ Prisma ORM
       ▼
    PostgreSQL
```

The frontend API helper prefixes requests with `/api`. In local development, Vite proxies `/api` to port 5000. In deployment, set `VITE_API_URL` to the backend origin.

## Public API

- `GET /api` — API name and version
- `GET /api/health` — health endpoint
- `POST /api/auth/login` — admin login
- `GET /api/projects` and `GET /api/projects/:id` — project listings and details
- `GET /api/skills` — skills
- `GET /api/experiences` — experience
- `GET /api/education` — education
- `GET /api/about` — About content
- `GET /api/site-settings` — public site configuration

## Protected API

- `GET /api/auth/me` — current admin account
- `POST /api/projects`, `PUT /api/projects/:id`, `DELETE /api/projects/:id`
- `POST /api/skills`, `PUT /api/skills/:id`, `DELETE /api/skills/:id`
- `POST /api/experiences`, `PUT /api/experiences/:id`, `DELETE /api/experiences/:id`
- `POST /api/education`, `PUT /api/education/:id`, `DELETE /api/education/:id`
- `PUT /api/about`, `PUT /api/site-settings`

Protected routes use `authenticateToken` followed by `requireAdmin` and require `Authorization: Bearer <JWT>`.

## Database models

Prisma defines `User`, `Project`, `Skill`, `Experience`, `Education`, `AboutContent`, and `SiteSettings`. Schema changes are tracked in `backend/prisma/migrations`.

## Engineering considerations

- Passwords are stored as bcrypt hashes; JWTs are signed server-side.
- The Express application uses Helmet and a configured CORS origin.
- Validation exists for some fields, but comprehensive schema validation and login rate limiting remain recommended.
- The current API has a basic error handler; do not expose internal error details to clients.
- The frontend currently stores the admin token in localStorage. Consider an HttpOnly cookie-based session approach in a future security review, with CSRF defenses where applicable.
- Add integration tests for authentication, permissions, CRUD validation, and database behavior before treating the service as production-hardened.
