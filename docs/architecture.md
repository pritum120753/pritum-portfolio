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
  ├─ JWT authentication and database-backed role checks
  ├─ Controllers and validation helpers
  └─ Prisma ORM
       ▼
    PostgreSQL
```

The frontend API helper prefixes requests with `/api`. In local development, Vite proxies `/api` to port 5000. In deployment, set `VITE_API_URL` to the backend origin.

## Roles and authorization

| Capability | Admin | Super Admin |
| --- | --- | --- |
| Read public portfolio data | Yes | Yes |
| Create/update/delete portfolio content | Yes | Yes |
| Read admin accounts | No | Yes |
| Create regular Admin accounts | No | Yes |
| Edit/delete regular Admin accounts | No | Yes |
| Manage the Super Admin account through Admin Management | No | No |

The `User.role` field currently stores the strings `ADMIN` and `SUPER_ADMIN`. Authorization middleware checks the token role against the current database role on protected requests. The promotion script keeps one Super Admin when run, but the database schema does not yet enforce uniqueness of the Super Admin role.

## Public API

- `GET /api` — API name and version
- `GET /api/health` — health endpoint
- `POST /api/auth/login` — admin login (rate limited)
- `GET /api/projects` and `GET /api/projects/:id` — project listings and details
- `GET /api/skills` — skills
- `GET /api/experiences` — experience
- `GET /api/education` — education
- `GET /api/about` — About content
- `GET /api/site-settings` — public site configuration

## Protected API

- `GET /api/auth/me` — current Admin or Super Admin
- `GET /api/auth/admins` — list admin accounts (Super Admin only)
- `POST /api/auth/admins` — create a regular Admin (Super Admin only)
- `PATCH /api/auth/admins/:id` — update a regular Admin (Super Admin only)
- `DELETE /api/auth/admins/:id` — delete a regular Admin (Super Admin only)
- `POST/PUT/DELETE /api/projects` — project content
- `POST/PUT/DELETE /api/skills` — skill content
- `POST/PUT/DELETE /api/experiences` — experience content
- `POST/PUT/DELETE /api/education` — education content
- `PUT /api/about` — About content
- `PUT /api/site-settings` — public site configuration

Content writes use `authenticateToken` followed by `requireAdmin`. Admin-account management uses `authenticateToken` followed by `requireSuperAdmin`. Protected requests require `Authorization: Bearer <JWT>`.

## Database models

Prisma defines `User`, `Project`, `Skill`, `Experience`, `Education`, `AboutContent`, and `SiteSettings`. Schema changes are tracked in `backend/prisma/migrations`.

## Engineering and operational considerations

- Passwords are stored as bcrypt hashes; JWTs are signed server-side.
- Express Helmet and an explicit CORS origin allowlist are enabled.
- JSON request bodies are limited to 1 MB.
- Login requests are limited to 10 attempts per client IP per 15-minute window. The counter store is process-local and should be replaced with a shared store before scaling beyond one instance.
- Validation exists for login, Admin account creation/update, Projects (partial), Skills (partial), About, and Site Settings. Experience and Education validation, URL protocols, dates, numeric fields, and cross-field rules need more comprehensive schemas.
- The frontend stores the JWT in `localStorage`; consider an HttpOnly cookie session with CSRF defenses in a separately planned security change.
- The profile picture picker limits new files to 650 KiB and avoids resending an unchanged image on unrelated settings updates. The picture is still saved as a Base64 data URL in `SiteSettings.heroImage`; object storage is the long-term solution.
- Public Site Settings responses include the configured image value; large Base64 images increase response and database size.
- The API currently has a basic JSON error handler and no structured request correlation/monitoring.
- Public collection endpoints return all records; pagination is not yet implemented.
- Core backend tests exist, but there are no frontend unit/component or end-to-end tests yet.
