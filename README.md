# Pritum Kumar Shill — Full-Stack Portfolio Platform

Stage 1 upgrade of the original `pritum120753/pritum-portfolio` project.

## Stack

- Frontend: React 19, Vite 6, Tailwind CSS 4, Framer Motion
- Backend: Node.js, Express, Helmet, CORS
- Database foundation: PostgreSQL + Prisma schema scaffold
- Planned authentication: JWT + bcrypt (Stage 3)

## Structure

```text
frontend/                 Existing React app, retained as the redesign base
  src/
    services/api.js       Shared API request helper
backend/
  src/
    routes/health.routes.js
    server.js             Express API server
  prisma/schema.prisma    PostgreSQL Prisma schema foundation
  .env.example
package.json              Root workspace commands
netlify.toml               Frontend deployment configuration
```

## Requirements

- Node.js 20+
- npm
- PostgreSQL is needed from Stage 2 onward.

## Install

```bash
npm run install:all
```

## Run both apps

```bash
npm install
npm run install:all
npm run dev
```

Or run them separately with `npm run dev:frontend` and `npm run dev:backend`.

Open http://localhost:5173. The Vite dev server proxies `/api` requests to the backend at port 5000.

## Run backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Check API health at http://localhost:5000/api/health.

## Environment

Set `DATABASE_URL` to your PostgreSQL connection string and replace `JWT_SECRET` with a long random secret before database/auth features are enabled. Never commit `.env`.

## Upgrade roadmap

1. Monorepo restructure and Express API foundation — completed in this starter
2. PostgreSQL models, Prisma Client and migrations
3. JWT authentication and protected admin routes
4. Admin dashboard and CRUD APIs
5. Redesigned frontend connected to the API
6. Validation, testing and deployment
