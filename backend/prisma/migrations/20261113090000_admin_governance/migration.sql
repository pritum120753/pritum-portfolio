CREATE TABLE "AdminPermission" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "section" TEXT NOT NULL,
  "canView" BOOLEAN NOT NULL DEFAULT false,
  "canCreate" BOOLEAN NOT NULL DEFAULT false,
  "canEdit" BOOLEAN NOT NULL DEFAULT false,
  "canDelete" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdminPermission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "actorId" TEXT,
  "actorName" TEXT NOT NULL,
  "actorEmail" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "section" TEXT NOT NULL,
  "recordId" TEXT,
  "summary" TEXT NOT NULL,
  "before" JSONB,
  "after" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminRequest" (
  "id" TEXT NOT NULL,
  "requesterId" TEXT NOT NULL,
  "reviewedById" TEXT,
  "requestType" TEXT NOT NULL,
  "section" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "targetId" TEXT,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "payload" JSONB,
  "requestedPermissions" JSONB,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "reviewNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  CONSTRAINT "AdminRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminPermission_userId_section_key" ON "AdminPermission"("userId", "section");
CREATE INDEX "AdminPermission_section_idx" ON "AdminPermission"("section");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");
CREATE INDEX "AuditLog_section_createdAt_idx" ON "AuditLog"("section", "createdAt");
CREATE INDEX "AdminRequest_status_createdAt_idx" ON "AdminRequest"("status", "createdAt");
CREATE INDEX "AdminRequest_requesterId_createdAt_idx" ON "AdminRequest"("requesterId", "createdAt");

ALTER TABLE "AdminPermission"
  ADD CONSTRAINT "AdminPermission_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog"
  ADD CONSTRAINT "AuditLog_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdminRequest"
  ADD CONSTRAINT "AdminRequest_requesterId_fkey"
  FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminRequest"
  ADD CONSTRAINT "AdminRequest_reviewedById_fkey"
  FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Preserve the current access level of all existing regular admins.
-- Newly created admin accounts receive no section access until assigned by a Super Admin.
INSERT INTO "AdminPermission" (
  "id", "userId", "section", "canView", "canCreate", "canEdit", "canDelete", "updatedAt"
)
SELECT
  gen_random_uuid()::text,
  u."id",
  section_name,
  true,
  true,
  true,
  true,
  CURRENT_TIMESTAMP
FROM "User" u
CROSS JOIN (
  VALUES ('projects'), ('skills'), ('experience'), ('education'), ('about'), ('settings')
) AS sections(section_name)
WHERE u."role" = 'ADMIN';
