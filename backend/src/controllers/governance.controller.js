import { prisma } from "../lib/prisma.js";

export const ADMIN_SECTIONS = [
  "projects",
  "skills",
  "experience",
  "education",
  "about",
  "settings",
];

const MODEL_CONFIG = {
  projects: {
    model: "project",
    fields: ["title", "description", "image", "liveUrl", "githubUrl", "technologies", "featured", "order"],
    required: ["title", "description"],
    dateFields: [],
    booleanFields: ["featured"],
    integerFields: ["order"],
  },
  skills: {
    model: "skill",
    fields: ["name", "category", "level", "order"],
    required: ["name", "category"],
    dateFields: [],
    booleanFields: [],
    integerFields: ["level", "order"],
  },
  experience: {
    model: "experience",
    fields: ["company", "position", "description", "startDate", "endDate", "current"],
    required: ["company", "position", "description", "startDate"],
    dateFields: ["startDate", "endDate"],
    booleanFields: ["current"],
    integerFields: [],
  },
  education: {
    model: "education",
    fields: ["institution", "degree", "field", "description", "startDate", "endDate"],
    required: ["institution", "degree"],
    dateFields: ["startDate", "endDate"],
    booleanFields: [],
    integerFields: [],
  },
  about: {
    model: "aboutContent",
    fields: [
      "badge", "heading", "description", "additionalText",
      "experienceValue", "experienceTitle", "experienceSubtitle",
      "academicValue", "academicTitle", "academicSubtitle",
      "interestsValue", "interestsTitle", "interestsSubtitle",
    ],
    required: [],
    dateFields: [],
    booleanFields: [],
    integerFields: [],
    singleton: true,
  },
  settings: {
    model: "siteSettings",
    fields: [
      "heroBadge", "heroName", "heroTitles", "heroDescription", "heroPrimaryText",
      "heroPrimaryUrl", "heroResumeText", "heroResumeUrl", "heroImage", "heroBadges",
      "email", "phone", "location", "contactDescription", "githubUrl", "linkedinUrl",
      "footerName", "footerDescription", "footerCopyright", "githubUsername", "showGithubRepos",
    ],
    required: [],
    dateFields: [],
    booleanFields: ["showGithubRepos"],
    integerFields: [],
    singleton: true,
  },
};

function sendValidationError(res, message) {
  return res.status(400).json({ success: false, message });
}

function snapshot(value) {
  if (value == null) return value;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(snapshot);
  if (typeof value === "object") {
    return Object.fromEntries(Object.entries(value)
      .filter(([key]) => !/password|token|secret/i.test(key))
      .map(([key, item]) => [
        key,
        key === "heroImage" && typeof item === "string" && item.startsWith("data:")
          ? "[image data omitted]"
          : snapshot(item),
      ]));
  }
  if (typeof value === "string" && value.length > 2500) return value.slice(0, 2500) + "… [truncated]";
  return value;
}

export async function listAuditLogs(req, res, next) {
  try {
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 50));
    const where = {};
    if (req.query.section && ADMIN_SECTIONS.includes(req.query.section)) where.section = req.query.section;
    if (req.query.action) where.action = String(req.query.action).slice(0, 40);
    if (req.query.actorId) where.actorId = String(req.query.actorId);

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    const count = await prisma.auditLog.count({ where });
    return res.json({ success: true, count, logs });
  } catch (error) {
    return next(error);
  }
}

export async function listAdminRequests(req, res, next) {
  try {
    const where = req.admin.role === "SUPER_ADMIN"
      ? {}
      : { requesterId: req.admin.id };

    const requests = await prisma.adminRequest.findMany({
      where,
      include: {
        requester: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return res.json({ success: true, requests });
  } catch (error) {
    return next(error);
  }
}

export async function createAdminRequest(req, res, next) {
  try {
    const { requestType, section, action, targetId, title, message, payload, requestedPermissions } = req.body || {};

    if (!["PERMISSION", "DATA_CHANGE"].includes(requestType)) {
      return sendValidationError(res, "Request type must be PERMISSION or DATA_CHANGE.");
    }
    if (!ADMIN_SECTIONS.includes(section)) {
      return sendValidationError(res, "Choose a valid portfolio section.");
    }
    if (typeof title !== "string" || !title.trim() || title.trim().length > 120) {
      return sendValidationError(res, "Request title is required and must be under 120 characters.");
    }
    if (typeof message !== "string" || !message.trim() || message.trim().length > 3000) {
      return sendValidationError(res, "Please provide a message under 3,000 characters.");
    }

    if (requestType === "PERMISSION") {
      if (!requestedPermissions || typeof requestedPermissions !== "object" || Array.isArray(requestedPermissions)) {
        return sendValidationError(res, "Requested permission values are required.");
      }
      for (const key of ["canView", "canCreate", "canEdit", "canDelete"]) {
        if (requestedPermissions[key] !== undefined && typeof requestedPermissions[key] !== "boolean") {
          return sendValidationError(res, `${key} must be true or false.`);
        }
      }
    } else {
      if (!["CREATE", "UPDATE", "DELETE"].includes(action)) {
        return sendValidationError(res, "Data-change action must be CREATE, UPDATE, or DELETE.");
      }
      if (action !== "CREATE" && typeof targetId !== "string") {
        return sendValidationError(res, "The target record is required for updates and deletions.");
      }
      if (action !== "DELETE" && (!payload || typeof payload !== "object" || Array.isArray(payload))) {
        return sendValidationError(res, "Provide the proposed data as an object.");
      }
      if (payload && JSON.stringify(payload).length > 50000) {
        return sendValidationError(res, "The proposed data is too large. Keep requests under 50 KB.");
      }
      if (section === "settings" && typeof payload?.heroImage === "string" && payload.heroImage.startsWith("data:")) {
        return sendValidationError(res, "Image data cannot be submitted in an approval request. Use an image URL.");
      }
    }

    const request = await prisma.adminRequest.create({
      data: {
        requesterId: req.admin.id,
        requestType,
        section,
        action: requestType === "PERMISSION" ? "GRANT_PERMISSION" : action,
        targetId: targetId || null,
        title: title.trim(),
        message: message.trim(),
        payload: payload ?? undefined,
        requestedPermissions: requestedPermissions ?? undefined,
      },
      include: {
        requester: { select: { id: true, name: true, email: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.admin.id,
        actorName: req.admin.name,
        actorEmail: req.admin.email,
        action: "REQUEST_SUBMITTED",
        section,
        recordId: request.id,
        summary: `Submitted ${requestType.toLowerCase()} request: ${request.title}`,
        after: { requestType, section, action: request.action, title: request.title, status: request.status },
      },
    });

    return res.status(201).json({ success: true, message: "Request submitted to the Super Admin.", request });
  } catch (error) {
    return next(error);
  }
}

function prepareRequestedData(section, payload) {
  const config = MODEL_CONFIG[section];
  if (!config || !payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Invalid data-change payload.");
  }

  const data = {};
  for (const [key, value] of Object.entries(payload)) {
    if (!config.fields.includes(key)) continue;
    if (config.dateFields.includes(key)) {
      if (value === null || value === "") {
        data[key] = null;
      } else {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) throw new Error(`${key} must be a valid date.`);
        data[key] = date;
      }
      continue;
    }
    if (config.booleanFields.includes(key)) {
      if (typeof value !== "boolean") throw new Error(`${key} must be true or false.`);
      data[key] = value;
      continue;
    }
    if (config.integerFields.includes(key)) {
      if (!Number.isInteger(value)) throw new Error(`${key} must be an integer.`);
      if (key === "level" && (value < 0 || value > 100)) throw new Error("Skill level must be between 0 and 100.");
      data[key] = value;
      continue;
    }
    if (key === "technologies") {
      if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
        throw new Error("Technologies must be an array of strings.");
      }
      data[key] = value.map((item) => item.trim()).filter(Boolean);
      continue;
    }
    if (typeof value !== "string") throw new Error(`${key} must be a string.`);
    if (value.length > 20000) throw new Error(`${key} is too long.`);
    data[key] = value.trim();
  }

  for (const field of config.required) {
    if (typeof data[field] !== "string" || !data[field].trim()) {
      throw new Error(`${field} is required for this section.`);
    }
  }
  return data;
}

async function applyApprovedDataChange(transaction, request) {
  const config = MODEL_CONFIG[request.section];
  if (!config) throw new Error("Unsupported request section.");
  const delegate = transaction[config.model];

  if (request.action === "DELETE") {
    if (!request.targetId) throw new Error("A target record is required.");
    const existing = await delegate.findUnique({ where: { id: request.targetId } });
    if (!existing) throw new Error("The requested record no longer exists.");
    await delegate.delete({ where: { id: request.targetId } });
    return { before: snapshot(existing), after: null, recordId: existing.id };
  }

  const data = prepareRequestedData(request.section, request.payload);
  if (request.action === "CREATE" && !config.singleton) {
    const created = await delegate.create({ data });
    return { before: null, after: snapshot(created), recordId: created.id };
  }

  if (config.singleton) {
    const before = await delegate.findUnique({ where: { id: "main" } });
    const updated = await delegate.upsert({
      where: { id: "main" },
      update: data,
      create: { id: "main", ...data },
    });
    return { before: snapshot(before), after: snapshot(updated), recordId: "main" };
  }

  if (request.action !== "UPDATE" || !request.targetId) {
    throw new Error("A valid target record is required for this update.");
  }
  const before = await delegate.findUnique({ where: { id: request.targetId } });
  if (!before) throw new Error("The requested record no longer exists.");
  const updated = await delegate.update({ where: { id: request.targetId }, data });
  return { before: snapshot(before), after: snapshot(updated), recordId: updated.id };
}

export async function reviewAdminRequest(req, res, next) {
  try {
    const { status, reviewNote } = req.body || {};
    if (!["APPROVED", "REJECTED"].includes(status)) {
      return sendValidationError(res, "Decision must be APPROVED or REJECTED.");
    }
    if (reviewNote !== undefined && (typeof reviewNote !== "string" || reviewNote.length > 3000)) {
      return sendValidationError(res, "Review note must be under 3,000 characters.");
    }

    const outcome = await prisma.$transaction(async (transaction) => {
      const request = await transaction.adminRequest.findUnique({
        where: { id: req.params.id },
        include: { requester: { select: { id: true, name: true, email: true, role: true } } },
      });
      if (!request) return { statusCode: 404, message: "Request not found." };
      if (request.status !== "PENDING") return { statusCode: 409, message: "This request has already been reviewed." };
      if (request.requester.role !== "ADMIN") return { statusCode: 409, message: "Requests from inactive or privileged accounts cannot be approved." };

      let change = null;
      if (status === "APPROVED" && request.requestType === "PERMISSION") {
        const requested = request.requestedPermissions;
        if (!requested || typeof requested !== "object") throw new Error("The permission request is incomplete.");
        for (const key of ["canView", "canCreate", "canEdit", "canDelete"]) {
          if (requested[key] !== undefined && typeof requested[key] !== "boolean") {
            throw new Error("The requested permission values are invalid.");
          }
        }
        const permission = await transaction.adminPermission.upsert({
          where: { userId_section: { userId: request.requesterId, section: request.section } },
          create: {
            userId: request.requesterId,
            section: request.section,
            canView: Boolean(requested.canView),
            canCreate: Boolean(requested.canCreate),
            canEdit: Boolean(requested.canEdit),
            canDelete: Boolean(requested.canDelete),
          },
          update: {
            canView: Boolean(requested.canView),
            canCreate: Boolean(requested.canCreate),
            canEdit: Boolean(requested.canEdit),
            canDelete: Boolean(requested.canDelete),
          },
        });
        change = { after: snapshot(permission) };
      } else if (status === "APPROVED" && request.requestType === "DATA_CHANGE") {
        change = await applyApprovedDataChange(transaction, request);
      }

      const reviewed = await transaction.adminRequest.update({
        where: { id: request.id },
        data: {
          status,
          reviewNote: typeof reviewNote === "string" ? reviewNote.trim() || null : null,
          reviewedById: req.admin.id,
          reviewedAt: new Date(),
        },
        include: {
          requester: { select: { id: true, name: true, email: true } },
          reviewer: { select: { id: true, name: true, email: true } },
        },
      });

      await transaction.auditLog.create({
        data: {
          actorId: req.admin.id,
          actorName: req.admin.name,
          actorEmail: req.admin.email,
          action: status === "APPROVED" ? "REQUEST_APPROVED" : "REQUEST_REJECTED",
          section: request.section,
          recordId: change?.recordId || request.targetId || request.id,
          summary: `${status === "APPROVED" ? "Approved" : "Rejected"} ${request.requestType.toLowerCase()} request from ${request.requester.name}: ${request.title}`,
          before: change?.before ?? undefined,
          after: change?.after ?? { requestStatus: status },
        },
      });

      return { statusCode: 200, request: reviewed };
    }, { isolationLevel: "Serializable" });

    if (outcome.statusCode !== 200) {
      return res.status(outcome.statusCode).json({ success: false, message: outcome.message });
    }
    return res.json({ success: true, message: `Request ${status.toLowerCase()} successfully.`, request: outcome.request });
  } catch (error) {
    if (error?.code === "P2034") {
      return res.status(409).json({ success: false, message: "The request changed during review. Refresh and try again." });
    }
    if (error instanceof Error && !error.code) {
      return sendValidationError(res, error.message);
    }
    return next(error);
  }
}

export async function updateAdminPermissions(req, res, next) {
  try {
    const target = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, name: true, email: true, role: true },
    });
    if (!target || target.role !== "ADMIN") {
      return res.status(404).json({ success: false, message: "Regular Admin account not found." });
    }

    const entries = req.body?.permissions;
    if (!Array.isArray(entries) || entries.length !== ADMIN_SECTIONS.length) {
      return sendValidationError(res, "Provide permissions for every section.");
    }

    const seen = new Set();
    for (const item of entries) {
      if (!ADMIN_SECTIONS.includes(item?.section) || seen.has(item.section)) {
        return sendValidationError(res, "Section permissions are invalid or duplicated.");
      }
      seen.add(item.section);
      for (const key of ["canView", "canCreate", "canEdit", "canDelete"]) {
        if (typeof item[key] !== "boolean") return sendValidationError(res, `${key} must be true or false.`);
      }
      if ((item.canCreate || item.canEdit || item.canDelete) && !item.canView) {
        return sendValidationError(res, "Create, Edit and Delete permissions require View permission.");
      }
    }

    const updated = await prisma.$transaction(async (transaction) => {
      const permissions = [];
      for (const item of entries) {
        permissions.push(await transaction.adminPermission.upsert({
          where: { userId_section: { userId: target.id, section: item.section } },
          create: { userId: target.id, ...item },
          update: {
            canView: item.canView,
            canCreate: item.canCreate,
            canEdit: item.canEdit,
            canDelete: item.canDelete,
          },
        }));
      }
      await transaction.auditLog.create({
        data: {
          actorId: req.admin.id,
          actorName: req.admin.name,
          actorEmail: req.admin.email,
          action: "PERMISSIONS_UPDATED",
          section: "permissions",
          recordId: target.id,
          summary: `Updated section permissions for ${target.name}`,
          after: snapshot(permissions),
        },
      });
      return permissions;
    });

    return res.json({ success: true, message: "Admin permissions updated.", permissions: updated });
  } catch (error) {
    return next(error);
  }
}
