# Pritum Portfolio — Full-Stack Portfolio Platform

A responsive personal portfolio with a database-driven content management dashboard. The public website presents projects, skills, experience, education, and contact information; authenticated administrators can manage portfolio content.

**[Live portfolio](https://pritum-portfolio.netlify.app/)** · **[Source code](https://github.com/pritum120753/pritum-portfolio)**

## Highlights

- Responsive portfolio interface with React, Vite, Tailwind CSS, and Framer Motion
- Dynamic projects, skills, experience, education, About section, and site settings
- Admin dashboard for content management
- REST API built with Express
- PostgreSQL persistence through Prisma ORM
- Admin authentication using JWT and bcrypt password hashing
- Contact form integrated with Netlify Forms
- Frontend deployment on Netlify; backend and database hosted separately

## Technology

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, Vite 6, Tailwind CSS 4, Framer Motion |
| Backend | Node.js, Express 4 |
| Database | PostgreSQL, Prisma 6 |
| Authentication | JWT, bcryptjs |
| Hosting | Netlify (frontend), Render (backend) |

## Architecture

```text
Visitor → Netlify-hosted React frontend → Express REST API → Prisma → PostgreSQL
Admin   → /admin dashboard → JWT-protected API routes ────────┘
```

See [architecture and API notes](docs/architecture.md) for additional details.

## Repository layout

```text
frontend/             React application and admin dashboard
  src/
    App.jsx           Public portfolio
    AdminApp.jsx      Admin dashboard
    services/api.js   API request helper
backend/              Express REST API
  src/controllers/    Request handlers
  src/routes/         Public and protected routes
  src/middleware/     Authentication and authorization
  prisma/             Schema and migrations
docs/                 Technical documentation
netlify.toml          Frontend build settings
package.json          Workspace convenience scripts
```

> The repository also contains some legacy root-level frontend files. The deployed frontend is built from `frontend/`; avoid removing legacy files until their references have been verified.

## Local setup

**Prerequisites:** Node.js 20+, npm, and a PostgreSQL database.

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

   Update `backend/.env` with a valid `DATABASE_URL`, a strong `JWT_SECRET`, and other local settings. Do not commit your `.env` files.

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

For a separate frontend deployment, configure `VITE_API_URL` to the backend origin (without `/api`). See [environment configuration](docs/configuration.md).

### Admin access

After setting `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in `backend/.env`, run:

```bash
cd backend
npm run create-admin
```

Use a unique password of at least 12 characters. This command creates or updates the account with the configured email; **do not rerun it casually in production**, because it updates the password.

The admin UI is available at `/admin`. Never publish admin credentials or tokens.

## API overview

| Method | Route | Access |
| --- | --- | --- |
| GET | `/api/health` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | Admin |
| GET | `/api/projects`, `/api/projects/:id` | Public |
| GET | `/api/skills`, `/api/experiences`, `/api/education` | Public |
| GET | `/api/about`, `/api/site-settings` | Public |
| POST/PUT/DELETE | Content resource endpoints | Admin |
| PUT | `/api/about`, `/api/site-settings` | Admin |

Admin endpoints require an `Authorization: Bearer <token>` header. See [API notes](docs/architecture.md).

## Build and deployment

```bash
npm run build:frontend
```

Netlify uses the checked-in `netlify.toml` to build `frontend/`. The backend is a separate Node.js service requiring a PostgreSQL connection and runtime environment variables.

## Security and privacy

- Never commit `.env` files, database credentials, JWT secrets, or real admin tokens.
- Content-editing routes require JWT authentication and an admin role.
- Use HTTPS and a strong, private JWT secret in production.
- Configure CORS with the exact frontend origin.
- Do not publish confidential appraisal/client data in screenshots, sample reports, or downloadable files.
- Before production use, add rate limiting, stronger request validation, and comprehensive automated tests.

## Project status

The portfolio, admin interface, REST API, and database models are implemented. Ongoing improvements include automated testing, security hardening, documentation, and performance tuning.

## Author

**Pritum Kumar Shill** · [GitHub profile](https://github.com/pritum120753)

---

This repository contains personal portfolio content and source code. No open-source license is currently granted; contact the author for reuse permissions.
