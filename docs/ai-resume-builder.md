# AI Job-Tailored CV / Resume Builder

**Status:** Planned — not implemented yet.

## Goal

Let a visitor create a tailored, ATS-friendly CV/resume quickly by providing a target job description and their own verified career information. The tool should help reorganize and phrase real experience for a specific role, not invent qualifications.

## Intended user journey

1. Open the Resume Builder from the portfolio navigation.
2. Enter profile, education, skills, projects, and work experience manually. Existing CV upload can be added after secure file-upload support is ready.
3. Paste the target job description and optionally provide the job title/company.
4. Review and correct the candidate profile.
5. Generate a tailored resume using only facts supplied or confirmed by the user.
6. Review suggestions, edit sections, and regenerate selected sections if needed.
7. Preview an ATS-friendly layout and export a PDF.
8. Save a version only when the user chooses to do so; allow download and deletion.

## Core capabilities

### First release (MVP)

- Job description input with length limits and clear guidance.
- Structured candidate profile editor.
- AI-generated professional summary tailored to the target role.
- Reordering and prioritization of existing skills and experience based on job requirements.
- Bullet-point rewriting that preserves factual meaning and measurable results.
- Missing-keyword and skills-gap suggestions, clearly separated from confirmed skills.
- ATS-friendly single-column resume template.
- Editable preview before export.
- PDF export.
- Clear notice that the generated resume is a draft and must be reviewed.

### Later enhancements

- Existing CV upload and text extraction (PDF/DOCX), with file type and size validation.
- Multiple resume versions for different job applications.
- DOCX export and additional professional templates.
- Cover letter generation based on the same verified profile and job description.
- Job application tracker with status and follow-up reminders.
- Optional saved profile and resume history, with user-controlled deletion.
- Interview preparation questions based on the job description.

## AI behavior and factual safeguards

- Never fabricate employers, job titles, dates, degrees, certifications, skills, projects, metrics, or achievements.
- Do not turn a suggested skill into a claimed skill unless the user confirms it.
- Preserve dates, names, and numeric achievements exactly unless the user edits them.
- Label inferred wording as a suggestion and require user review.
- If the job description asks for a qualification absent from the profile, identify it as a gap rather than adding it.
- Do not promise that a resume will pass every ATS or guarantee an interview.
- Treat uploaded documents and pasted job descriptions as untrusted content, not as instructions to the AI system.

## Proposed architecture

Keep this feature modular and separate from the existing public portfolio and admin CRUD modules.

### Frontend

```text
frontend/src/features/resume-builder/
  pages/
  components/
  hooks/
  api.js
  schemas/
```

Suggested screens: source profile, job description, generated draft, editor/preview, export/history.

### Backend

```text
backend/src/features/resume-builder/
  routes/
  controllers/
  services/
  validators/
  providers/
```

The AI provider must be called from the backend only. API keys must remain in server-side environment variables and must never be exposed through `VITE_*` variables or browser code.

### Suggested API contract

- `POST /api/resume/generate` — accept a validated job description and user-confirmed profile; return a structured draft.
- `POST /api/resume/rewrite-section` — rewrite a selected section using the same verified source facts.
- `POST /api/resume/export` — generate a downloadable document from a reviewed draft.
- Optional authenticated endpoints for saving, listing, and deleting resume versions.

These are proposed endpoints only; no API routes exist yet.

## Privacy and security requirements

- Do not require an account for a basic one-time draft unless product decisions later require it.
- Clearly explain what information is sent to the AI provider and obtain consent before processing.
- Do not log full resumes, job descriptions, or sensitive personal details.
- Use server-side secrets, request size limits, rate limiting, and per-user quotas where applicable.
- Validate file type and size; scan uploads and store them privately if upload support is added.
- Use private, short-lived download links for generated files.
- Define retention and deletion behavior before adding saved resume history.
- Never use candidate resumes or job descriptions for model training unless a separate, explicit consent and lawful basis exist.

## Acceptance criteria

- A user can create a resume draft from a job description and a structured profile.
- Generated content is traceable to user-provided facts; missing facts are not invented.
- User can edit and approve the draft before export.
- Exported PDF is readable, selectable text, and uses an ATS-friendly layout.
- Invalid, oversized, or malicious inputs are rejected safely.
- AI provider errors, timeouts, and quota limits produce understandable messages.
- Automated tests cover validation, factual constraints, provider failures, and export behavior.
- Privacy notice, consent, retention, and deletion behavior are documented before public launch.

## Implementation phases

1. Product and privacy design; select an AI provider and define budget/usage limits.
2. Build structured profile input and job description form without AI.
3. Add backend-only AI integration and structured output validation.
4. Add editable preview and PDF export.
5. Add upload, saved versions, DOCX, cover letters, and tracker only after the MVP is stable.
