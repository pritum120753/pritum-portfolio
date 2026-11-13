# Pritum Portfolio — Full-Stack Portfolio Platform

A responsive personal portfolio with a database-driven content management dashboard. The public website presents projects, skills, experience, education, and contact information; authenticated administrators can manage portfolio content.

**[Live portfolio](https://pritum-portfolio.netlify.app/)** · **[Source code](https://github.com/pritum120753/pritum-portfolio)**

## Highlights

- Responsive portfolio interface built with React, Vite, Tailwind CSS, and Framer Motion
- Dynamic projects, skills, experience, education, About section, and site settings
- Admin dashboard with separate **Super Admin** and **Admin** roles
- Super Admin-only account management for creating, editing, and deleting regular Admin accounts
- Section-level View/Create/Edit/Delete permissions, Admin self-service profile updates, approval requests, and Super Admin-only audit history
- REST API built with Express
- PostgreSQL persistence through Prisma ORM and tracked SQL migrations
- JWT authentication and bcrypt password hashing
- Login rate limiting and database-backed role checks
- Contact form integrated with Netlify Forms
- Frontend deployment on Netlify; backend and database hosted separately on Render

## Technology

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, Vite 6, Tailwind CSS 4, Framer Motion |
| Backend | Node.js, Express 4 |
| Database | PostgreSQL, Prisma 6 |
| Authentication | JWT, bcryptjs |
| Hosting | Netlify (frontend), Render (backend and database) |
| Automation | GitHub Actions, Dependabot |

## Architecture

```text
Visitor → Netlify-hosted React frontend → Express REST API → Prisma → PostgreSQL
Admin   → /admin dashboard → JWT-protected API routes ────────┘
```

See [architecture and API notes](docs/architecture.md), the [development guide](docs/development.md), [environment configuration](docs/configuration.md), and the [product roadmap](docs/roadmap.md).

## Repository layout

```text
frontend/                 Active React/Vite application and admin dashboard
  src/
    App.jsx               Public portfolio
    AdminApp.jsx          Admin dashboard and role-aware navigation
    admin/components/     Admin feature components
    services/api.js       Shared API request helper
backend/                  Express REST API
  src/controllers/        HTTP request handlers
  src/routes/             Public and protected API routes
  src/middleware/         Authentication, authorization, and rate limiting
  src/lib/                Prisma and input validation helpers
  prisma/                 Schema and SQL migrations
docs/                     Architecture, configuration, audit, and roadmap
.github/workflows/        CI and manual Super Admin promotion
netlify.toml              Netlify build configuration
```

> Legacy root-level `src/`, `public/`, and Vite files remain in the repository. Netlify builds from `frontend/`; do not edit or delete the legacy copy without first comparing its assets and references.

## Local setup

**Prerequisites:** Node.js 20 or newer, npm, and a PostgreSQL database.

1. Clone the repository:

   ```bash
   git clone https://github.com/pritum120753/pritum-portfolio.git
   cd pritum-portfolio
   ```

2. Install dependencies:

   ```bash
   npm install
   npm run install:all
   ```

3. Configure the backend:

   ```bash
   cp backend/.env.example backend/.env
   ```

   Update `backend/.env` with a valid `DATABASE_URL`, a strong `JWT_SECRET`, and other local settings. Never commit the file.

4. Prepare Prisma:

   ```bash
   cd backend
   npm run prisma:generate
   npm run prisma:migrate
   cd ..
   ```

5. Start the applications:

   ```bash
   npm run dev
   ```

The frontend runs at **http://localhost:5173** and the backend at **http://localhost:5000**. Vite proxies local `/api` requests to the backend.

For a separate frontend deployment, set `VITE_API_URL` to the backend origin without the `/api` suffix. See [environment configuration](docs/configuration.md).

## Admin access

The admin UI is available at `/admin`.

- **Super Admin:** can manage website content and manage regular Admin accounts.
- **Admin:** can manage website content but cannot create, edit, or delete admin accounts.

Admin passwords must be at least 12 characters and are stored as bcrypt hashes. To create an initial account, configure `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in `backend/.env`, then run:

```bash
cd backend
npm run create-admin
```

This command creates or updates the account with the configured email and replaces its password. Do not rerun it casually in production.

To promote an existing account without changing its password, use the documented `npm run promote-super-admin` command or the repository's manual **Promote Super Admin** GitHub Actions workflow. See [Admin provisioning](docs/configuration.md). Never place database credentials in source files or workflow inputs; use protected repository secrets.

## API overview

| Method | Route | Access |
| --- | --- | --- |
| GET | `/api/health` | Public |
| POST | `/api/auth/login` | Public, rate limited |
| GET | `/api/auth/me` | Admin or Super Admin |
| GET | `/api/auth/admins` | Super Admin |
| POST/PATCH/DELETE | `/api/auth/admins` and `/api/auth/admins/:id` | Super Admin |
| GET | Portfolio resource routes | Public |
| POST/PUT/DELETE | Content resource endpoints | Admin or Super Admin |
| PUT | `/api/about`, `/api/site-settings` | Admin or Super Admin |

Protected endpoints require an `Authorization: Bearer <token>` header. See [API notes](docs/architecture.md).

## Build, tests, and deployment

The GitHub Actions workflow currently checks:

- Frontend production build
- Backend JavaScript syntax
- Existing backend unit tests
- Prisma schema validity

Netlify uses the checked-in `netlify.toml` to build `frontend/`. Render hosts the separate Node.js API and PostgreSQL database. GitHub CI passing verifies the repository checks; it does not, by itself, prove that the latest frontend deployment is live.

## Security and privacy

- Never commit `.env` files, database credentials, JWT secrets, or admin tokens.
- Login attempts are limited to 10 per client IP per 15-minute window. The current limiter is process-local and is not shared across multiple backend instances.
- Admin write routes check the active database role on each request. Admin-account management requires the Super Admin role.
- Request validation is present for core login, admin-account, project, skill, About, and settings fields, but CRUD validation is not yet comprehensive.
- The browser currently stores the JWT in `localStorage`; an XSS vulnerability could expose it. A future session redesign should evaluate HttpOnly cookies and CSRF protections.
- Review downloadable documents and profile assets for personal or client-confidential information before publishing them in this public repository.
- Review the [security policy](SECURITY.md) and current [repository audit](docs/repository-audit.md).

## Project status

The core portfolio, admin dashboard, REST API, database models, role-based admin management, and CI baseline are implemented. The remaining priority work is production data durability, complete request validation and tests, asset storage, accessibility/SEO, and cleanup of legacy root-level files. See the [roadmap](docs/roadmap.md).

## Author

**Pritum Kumar Shill** · [GitHub profile](https://github.com/pritum120753)

---

This repository is public, but no open-source license is currently granted. Contact the author for reuse permissions.
