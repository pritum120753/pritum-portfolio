# Environment configuration

Create `backend/.env` from `backend/.env.example`. Never commit real secrets.

| Variable | Used by | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Backend | PostgreSQL connection string |
| `JWT_SECRET` | Backend | Long, unpredictable signing secret for admin sessions |
| `JWT_EXPIRES_IN` | Backend | Optional token lifetime (default: `1d`) |
| `CLIENT_ORIGIN` | Backend | Allowed frontend origin for CORS; no trailing slash |
| `PORT` | Backend | Optional HTTP port (default: `5000`) |
| `ADMIN_NAME` | Admin setup script | Name used when creating the admin |
| `ADMIN_EMAIL` | Admin setup script | Email used for admin login |
| `ADMIN_PASSWORD` | Admin setup script | Strong password, minimum 12 characters |
| `VITE_API_URL` | Frontend | Backend origin without `/api` (empty for local Vite proxy) |

## Deployment notes

Netlify builds `frontend/` using `npm run build` and publishes `dist`. Set `VITE_API_URL` in the Netlify environment to the deployed backend origin.

The backend requires `DATABASE_URL`, `JWT_SECRET`, and `CLIENT_ORIGIN` in its host environment. Run Prisma migrations against the intended database as part of the deployment process.

Do not store passwords, secrets, private keys, or connection strings in GitHub, README screenshots, or frontend environment variables. Variables prefixed `VITE_` are bundled into public frontend code.

## Admin provisioning

`npm run create-admin` performs an upsert for the configured admin email and **replaces the password** if that account exists. Use it deliberately and clear provisioning variables when they are no longer needed.


## Reverse proxy and login protection

The API includes an in-process login rate limiter (10 attempts per client IP per 15 minutes). When deploying behind one trusted reverse proxy such as Render, set `TRUST_PROXY=1` in the backend service environment so Express can identify the original client IP correctly. Keep it at `0` for direct/local development unless a trusted proxy is configured.

The limiter stores counters in process memory. It is a useful single-instance baseline, but it is not shared across multiple backend instances and resets on process restart. For horizontally scaled production deployments, move rate-limit state to a shared store such as Redis before scaling beyond one instance.

## Multiple admin accounts

The Admin Dashboard includes an **Admin Management** page at `/admin/admins`. Any active `ADMIN` account can list, create, edit, and delete other admin accounts. New passwords must be 12–128 characters and are hashed with bcrypt before storage.

For safety:
- An admin cannot delete their own account from the dashboard.
- The last remaining admin account cannot be deleted.
- Deleting an account immediately revokes its access to protected API routes, even when that account still has an unexpired JWT.
- All admins currently have the same full-access role; per-admin permissions are not implemented.

Create at least one initial admin using the existing provisioning script before using the dashboard's Admin Management page. Do not place real credentials in source files or commit them to Git.
