# Admin Governance Guide

This guide describes the Admin profile, section permissions, approval requests, and Super Admin audit history.

## Roles

### Super Admin

The Super Admin has access to every portfolio section and can:

- Create, update, and delete regular Admin accounts.
- Grant or revoke each regular Admin's section permissions.
- Review and approve/reject permission requests.
- Review and approve/reject proposed data changes.
- View the Admin activity and audit history.

The Super Admin account is not editable or deletable through Admin Management.

### Regular Admin

A regular Admin can:

- Update their own display name and password.
- Use the sections and actions explicitly granted by the Super Admin.
- Submit a request for additional section permissions.
- Submit a proposed create/update/delete data change for Super Admin approval.
- View the status and review note for their own requests.

A new Admin account starts with no content-section permissions. The Super Admin must assign access under **Permission Control**.

## Section permission matrix

The permission screen supports the following sections:

- Projects
- Skills
- Experience
- Education
- About Me
- Website Settings

Each section has four independent permissions:

| Permission | What it allows |
| --- | --- |
| View | Open the section and see its records in the Admin UI |
| Create | Add a new record |
| Edit | Update an existing record |
| Delete | Delete an existing record |

Create, Edit, and Delete require View. The backend checks each write permission on every protected API request; hiding a button in the frontend is not the security boundary.

The governance migration grants the pre-existing regular Admin accounts all current content permissions to preserve their existing access. Newly created accounts start with no section permissions.

## Admin profile

Open **My Profile** to update the display name. A password change requires the current password and a new password of 12–128 characters. Login email is read-only in the self-service screen.

Profile changes are recorded in the audit history. Password values are never stored in audit snapshots.

## Requests and approvals

Open **Requests** to submit either request type.

### Permission request

Choose a section and request View/Create/Edit/Delete access. The Super Admin can approve or reject it. Approval updates the Admin's permission matrix.

### Data-change request

Choose a section and request Create, Update, or Delete. Provide a title, reason, and proposed JSON object for Create/Update. Update/Delete requests must include the target record ID.

When the Super Admin approves a data-change request, the backend applies the allowlisted fields in a database transaction, updates the request status, and writes an audit entry. If validation fails or the target record no longer exists, the approval transaction is rolled back.

Data-change request payloads are limited to 50 KB. Do not include secrets, passwords, tokens, confidential client information, or embedded Base64 images. Use an image URL for image fields.

The first supported request sections are Projects, Skills, Experience, Education, About, and Website Settings. About and Website Settings are singleton records and cannot be deleted.

## Audit history

Only Super Admin can open **Activity History** or call the audit-log API.

The audit trail records:

- Project, Skill, Experience, Education, About, and Website Settings create/update/delete actions.
- Admin profile updates.
- Admin account create/update/delete actions.
- Permission changes.
- Request submission and approval/rejection.

Content changes include before/after snapshots where available. Passwords, tokens, secrets, and embedded image data are excluded from snapshots. Audit records have no edit/delete API in the application.

Audit history is operational accountability, not a replacement for database backups. The database itself must still be backed up and protected.

## Important operational notes

- Apply the Prisma migration before deploying the new backend code. The Render build currently runs `prisma migrate deploy`.
- Preserve the database when rolling back application code; do not delete the governance tables after activity has been recorded.
- Test a permission change with a non-Super Admin account before relying on it for a production team.
- Existing Admins keep their current access after the migration. Review and adjust each account in Permission Control.
