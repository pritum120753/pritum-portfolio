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
