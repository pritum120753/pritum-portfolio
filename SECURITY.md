# Security policy

## Reporting a vulnerability

Please do not publish exploit details, access tokens, database credentials, or private information in a public GitHub issue. Contact the repository owner privately through the contact details on the [portfolio website](https://pritum-portfolio.netlify.app/).

## Current security controls

- HTTPS is used for the public frontend and API.
- Express Helmet security headers are enabled.
- CORS is restricted to the configured comma-separated `CLIENT_ORIGIN` allowlist.
- JSON request bodies are limited to 1 MB.
- Login validation rejects malformed email/password input and caps password length.
- Login attempts are limited to 10 attempts per client IP per 15-minute window.
- Passwords are hashed with bcrypt.
- Protected API requests verify the JWT and look up the current database role.
- Content writes require `ADMIN` or `SUPER_ADMIN`; admin-account management requires `SUPER_ADMIN`.
- Deleted or demoted accounts lose access to protected API routes even if their previous JWT has not expired.

## Important limitations and hardening work

- **Rate-limit storage:** the current login limiter is in process memory. It resets when the service restarts and is not shared across multiple backend instances. Use a shared store before horizontal scaling.
- **Session storage:** the frontend stores the admin JWT in browser `localStorage`. A successful XSS attack could expose it. Evaluate HttpOnly, Secure, SameSite cookies with an appropriate CSRF strategy before higher-risk use.
- **Request validation:** validation is not yet uniform across every field in the Project, Skill, Experience, Education, About, and Site Settings controllers. Add schema-based validation and tests before exposing more write operations.
- **Uploads:** the profile image is currently converted to a Base64 data URL and stored in the Site Settings record. It is not a dedicated private/object-storage upload pipeline; the frontend's advertised 3 MB limit also exceeds the API's 1 MB JSON body limit.
- **Backups:** document and test a database backup/restore process. The current Render Free PostgreSQL plan does not provide backups and has a limited lifetime; do not treat it as durable production storage.
- **Public repository assets:** review root-level PDFs and all downloadable files for personal or client-confidential content. Files committed to this public repository are publicly accessible even when they are outside Netlify's configured publish directory.
- **Auditability:** admin changes do not yet have a persistent audit log.

## Deployment checklist

- Store `DATABASE_URL`, `JWT_SECRET`, and provisioning credentials only in backend-host or protected GitHub environment/repository secrets.
- Set `CLIENT_ORIGIN` to the exact deployed frontend origin(s).
- Set `TRUST_PROXY=1` only when the backend is behind the trusted Render reverse proxy.
- Use a strong, unique `JWT_SECRET` and rotate it if exposed.
- Keep PostgreSQL credentials private and use a persistent database plan with backups for production.
- Review downloadable resumes, reports, and screenshots before publishing.
- Verify the frontend and backend deployments after each release; a successful CI run alone does not prove production is live.
