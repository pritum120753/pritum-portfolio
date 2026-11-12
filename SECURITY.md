# Security policy

## Reporting a vulnerability

Please do not publish exploit details, access tokens, database credentials, or private information in a public GitHub issue. Contact the repository owner privately through the contact details on the [portfolio website](https://pritum-portfolio.netlify.app/).

## Supported deployment

This is a personal portfolio project. Security fixes should be applied to the currently deployed version.

## Deployment checklist

- Use a unique, high-entropy `JWT_SECRET` stored only in the backend host environment.
- Set `CLIENT_ORIGIN` to the exact deployed frontend origin.
- Use HTTPS for the frontend and API.
- Keep PostgreSQL credentials and admin provisioning variables out of the repository.
- Rotate compromised credentials immediately.
- Protect login endpoints against brute-force attempts (rate limiting is not yet implemented).
- Validate all incoming admin content before writing it to the database.
- Review downloadable resumes and sample reports for confidential information.
- Avoid publishing screenshots that expose customer or appraisal data.

## Known hardening opportunities

This project currently uses JWTs stored in browser localStorage. Consider secure HttpOnly cookie sessions, an appropriate CSRF strategy, rate limiting, consistent request schema validation, and automated security testing before use in a higher-risk production environment.
