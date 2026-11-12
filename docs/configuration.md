# Environment configuration

Create `backend/.env` from `backend/.env.example`. Never commit real secrets.

| Variable | Used by | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Backend | PostgreSQL connection string |
| `JWT_SECRET` | Backend | Long, unpredictable signing secret for admin sessions |
| `JWT_EXPIRES_IN` | Backend | Optional token lifetime (default: `1d`) |
| `CLIENT_ORIGIN` | Backend | Allowed frontend origin for CORS; no trailing slash |
| `PORT` | Backend | Optional HTTP port (default: `5000`) |
| `TRUST_PROXY` | Backend | Set to `1` behind one trusted reverse proxy |
| `ADMIN_NAME` | Admin setup script | Name used when creating or updating an account |
| `ADMIN_EMAIL` | Admin setup script | Email used for admin login |
| `ADMIN_PASSWORD` | Admin setup script | Strong password, minimum 12 characters |
| `SUPER_ADMIN_EMAIL` | Admin setup script | Designated email for the single Super Admin account |
| `VITE_API_URL` | Frontend | Backend origin without `/api` (empty for local Vite proxy) |

## Deployment notes

Netlify builds `frontend/` using `npm run build` and publishes `dist`. Set `VITE_API_URL` in the Netlify environment to the deployed backend origin.

The backend requires `DATABASE_URL`, `JWT_SECRET`, and `CLIENT_ORIGIN` in its host environment. Run Prisma migrations against the intended database as part of the deployment process.

Do not store passwords, secrets, private keys, or connection strings in GitHub, README screenshots, or frontend environment variables. Variables prefixed `VITE_` are bundled into public frontend code.

## Admin provisioning

To safely promote an **existing Admin** without changing their password, set `SUPER_ADMIN_EMAIL` to that account's exact email in the backend environment and run:

```bash
npm run promote-super-admin
```

The promotion command only changes the role. It does not create a new account or reset the password. Any other account currently holding `SUPER_ADMIN` is automatically changed to regular `ADMIN`, so only one Super Admin remains.

The older `npm run create-admin` command is for initial account provisioning or password reset. It replaces the password for the configured `ADMIN_EMAIL`; do not use it solely for promotion unless you intend to reset that password.

The Super Admin is the only account allowed to open **Admin Management** and create, edit, or delete regular Admin accounts. Regular Admins can manage portfolio content but cannot manage user accounts. Admin Management cannot edit or delete the protected Super Admin account. Both roles are checked against the database on every protected API request, so role changes take effect even for sessions with an older JWT.

Create at least one initial admin using the existing provisioning script before using the dashboard's Admin Management page. Do not place real credentials in source files or commit them to Git.

## Reverse proxy and login protection

The API includes an in-process login rate limiter (10 attempts per client IP per 15 minutes). When deploying behind one trusted reverse proxy such as Render, set `TRUST_PROXY=1` in the backend service environment so Express can identify the original client IP correctly. Keep it at `0` for direct/local development unless a trusted proxy is configured.

The limiter stores counters in process memory. It is a useful single-instance baseline, but it is not shared across multiple backend instances and resets on process restart. For horizontally scaled production deployments, move rate-limit state to a shared store such as Redis before scaling beyond one backend instance.
