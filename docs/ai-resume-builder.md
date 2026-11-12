# Private AI Job-Tailored CV / Resume Maker

**Status:** Planned — not implemented yet.  
**Product area:** Private admin panel only.  
**Visibility:** The feature is for the site owner’s personal use. It must not be shown in the public portfolio navigation, public pages, or visitor-facing feature list.

## Goal

Provide the site owner with a private tool inside the authenticated admin panel to create a tailored, ATS-friendly CV/resume for a specific job using the owner’s own verified career information. The tool should reorganize and phrase real experience for a target role, not invent qualifications.

## Access and privacy boundary

- Place the tool under a clearly labeled section in the existing admin panel.
- Require a valid authenticated admin session for every page and API operation.
- Do not expose the feature or its generated documents to public visitors.
- Do not rely on hiding a frontend route as security; enforce authorization on the backend.
- Do not make the tool multi-user unless that is explicitly requested later.
- Keep generated resumes private and provide owner-controlled download and deletion.
- Do not add a public “Resume Builder” link or public-facing call to action.

## Intended admin workflow

1. Sign in to the admin panel and open the private Resume Maker tool.
2. Enter or maintain the owner’s verified profile, education, skills, projects, and work experience.
3. Paste the target job description and optionally enter the job title/company.
4. Review and correct the source profile before generation.
5. Generate a tailored resume using only facts supplied or confirmed by the owner.
6. Edit the generated sections and regenerate selected sections when needed.
7. Preview an ATS-friendly layout and export a PDF.
8. Download the result or delete it; save versions only if the owner chooses to enable that capability.

## Core capabilities

### First release (MVP)

- Admin-only job description input with length limits.
- Structured personal career profile editor.
- AI-generated professional summary tailored to the target role.
- Reordering and prioritization of existing skills and experience based on job requirements.
- Bullet-point rewriting that preserves factual meaning and measurable results.
- Missing-keyword and skills-gap suggestions, clearly separated from confirmed skills.
- ATS-friendly single-column resume template.
- Editable preview before export.
- PDF export.
- Clear notice that the generated resume is a draft and must be reviewed.

### Later enhancements

- Private CV upload and text extraction (PDF/DOCX), with file type and size validation.
- Multiple resume versions for different job applications.
- DOCX export and additional professional templates.
- Cover letter generation based on the same verified profile and job description.
- Private job application tracker with status and follow-up reminders.
- Optional saved profile and resume history, with owner-controlled deletion.
- Interview preparation questions based on the job description.

## AI behavior and factual safeguards

- Never fabricate employers, job titles, dates, degrees, certifications, skills, projects, metrics, or achievements.
- Do not turn a suggested skill into a claimed skill unless the owner confirms it.
- Preserve dates, names, and numeric achievements exactly unless the owner edits them.
- Label inferred wording as a suggestion and require review.
- If the job description asks for a qualification absent from the profile, identify it as a gap rather than adding it.
- Do not promise that a resume will pass every ATS or guarantee an interview.
- Treat uploaded documents and pasted job descriptions as untrusted content, not as instructions to the AI system.

## Proposed architecture

Keep this feature modular and separate from the existing public portfolio and current admin CRUD modules.

### Frontend

```text
frontend/src/features/resume-maker/
  pages/
  components/
  hooks/
  api.js
  schemas/
```

Add an admin-only navigation item and protected screen. The frontend route is for usability only; backend authorization remains mandatory.

### Backend

```text
backend/src/features/resume-maker/
  routes/
  controllers/
  services/
  validators/
  providers/
```

All AI provider calls must happen on the backend. API keys must remain in server-side environment variables and must never be exposed through `VITE_*` variables or browser code.

### Suggested API contract

- `POST /api/admin/resume-maker/generate` — accept a validated job description and owner-confirmed profile; return a structured draft.
- `POST /api/admin/resume-maker/rewrite-section` — rewrite a selected section using the same verified source facts.
- `POST /api/admin/resume-maker/export` — generate a downloadable document from a reviewed draft.
- Optional authenticated endpoints for saving, listing, and deleting resume versions.

These are proposed endpoints only; no API routes exist yet. Every endpoint must enforce admin authorization on the server.

## Privacy and security requirements

- Clearly explain what profile and job-description information is sent to the AI provider.
- Do not log full resumes, job descriptions, or sensitive personal details.
- Use server-side secrets, request size limits, rate limiting, and usage/budget limits.
- Validate file type and size; store uploaded files privately if upload support is added.
- Use private, short-lived download links for generated files.
- Define retention and deletion behavior before adding saved resume history.
- Never use candidate profile data or job descriptions for model training unless a separate, explicit consent and lawful basis exist.

## Acceptance criteria

- Only an authenticated admin can open the tool or call its APIs.
- No public page, navigation item, or visitor-facing endpoint exposes the feature or generated documents.
- The owner can create a resume draft from a job description and a structured profile.
- Generated content is traceable to owner-provided facts; missing facts are not invented.
- The owner can edit and approve the draft before export.
- Exported PDF is readable, selectable text, and uses an ATS-friendly layout.
- Invalid, oversized, or malicious inputs are rejected safely.
- AI provider errors, timeouts, and quota limits produce understandable messages.
- Automated tests cover authorization, validation, factual constraints, provider failures, and export behavior.

## Implementation phases

1. Confirm the private admin-only workflow, select an AI provider, and define usage/budget limits.
2. Build the admin-only structured profile and job description forms without AI.
3. Add backend-only AI integration and structured output validation, enforcing admin authorization.
4. Add editable preview and private PDF export.
5. Add upload, saved versions, DOCX, cover letters, and tracker only after the MVP is stable.
