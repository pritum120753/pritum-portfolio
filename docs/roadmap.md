# Product roadmap

This roadmap is a planning document, not a claim that the listed work is already implemented. Priorities can change as the portfolio grows.

## Guiding direction

Keep the site useful as a personal portfolio today while making it straightforward to add new sections, integrations, and administrative capabilities later. Prefer small, independently testable features over a monolithic rewrite.

## Suggested phases

### Foundation and maintainability
- [x] Document current architecture and API surface
- [x] Add environment configuration template
- [x] Add CI build and schema checks
- [ ] Extract public page into reusable sections and feature modules
- [ ] Extract admin resource screens into feature modules
- [ ] Introduce shared API response and error conventions
- [ ] Add automated backend and frontend test suites

### Security and reliability
- [ ] Add login rate limiting and abuse protection
- [ ] Introduce consistent server-side request validation
- [ ] Add security tests for admin authorization and CRUD endpoints
- [ ] Review token storage and session strategy
- [ ] Add structured production logging and monitoring
- [ ] Add database backup and restore procedure

### Portfolio capabilities
- [ ] Add a reusable content-section framework
- [ ] Add project categories, tags, and filtering
- [ ] Add project detail pages
- [ ] Add media upload/storage integration with file validation
- [ ] Add SEO metadata and social sharing previews per page
- [ ] Add accessibility and responsive regression checks

### Admin experience
- [ ] Add search, filtering, and pagination for larger collections
- [ ] Add draft/published status and preview workflow
- [ ] Add content ordering controls
- [ ] Add audit history for important admin changes
- [ ] Add confirmation and recovery patterns for destructive actions

### Integrations and insights
- [ ] Add optional analytics with privacy-conscious configuration
- [ ] Add contact message delivery and spam protection
- [ ] Add integration settings with server-side secret storage
- [ ] Add export/backup tools for portfolio content

## How to prioritize

For each proposed feature, record:

- User problem and expected benefit
- Scope and non-goals
- UI changes and API contract
- Database changes and migration/rollback plan
- Security and privacy implications
- Acceptance criteria and tests
- Deployment and environment changes

Do not start a feature that requires a production schema or authentication change without a reviewed migration and rollback plan.
