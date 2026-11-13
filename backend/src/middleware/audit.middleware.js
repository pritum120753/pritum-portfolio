import { prisma } from "../lib/prisma.js";

const MODEL_BY_SECTION = {
  projects: "project",
  skills: "skill",
  experience: "experience",
  education: "education",
  about: "aboutContent",
  settings: "siteSettings",
};

const RESPONSE_KEY_BY_SECTION = {
  projects: "project",
  skills: "skill",
  experience: "experience",
  education: "education",
  about: "about",
  settings: "settings",
};

function safeSnapshot(value, key = "") {
  if (value == null) return value;
  if (/password|token|secret|authorization/i.test(key)) return "[redacted]";
  if (key === "heroImage" && typeof value === "string" && value.startsWith("data:")) {
    return "[image data omitted]";
  }
  if (typeof value === "string") {
    return value.length > 2500 ? `${value.slice(0, 2500)}… [truncated]` : value;
  }
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.slice(0, 100).map((item) => safeSnapshot(item));
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([field]) => !/password|token|secret/i.test(field))
        .map(([field, nested]) => [field, safeSnapshot(nested, field)])
    );
  }
  return value;
}

export function auditMutation(section, action) {
  const modelName = MODEL_BY_SECTION[section];
  const responseKey = RESPONSE_KEY_BY_SECTION[section];

  if (!modelName || !responseKey || !["CREATE", "UPDATE", "DELETE"].includes(action)) {
    throw new Error("Invalid audit mutation configuration");
  }

  return async function auditMutationMiddleware(req, res, next) {
    try {
      const delegate = prisma[modelName];
      const recordKey = ["about", "settings"].includes(section)
        ? "main"
        : req.params.id;
      let before = null;

      if (action !== "CREATE" && recordKey) {
        before = await delegate.findUnique({ where: { id: recordKey } });
      }

      const sendJson = res.json.bind(res);
      let logged = false;

      res.json = (payload) => {
        if (
          !logged &&
          res.statusCode >= 200 &&
          res.statusCode < 300 &&
          payload?.success !== false
        ) {
          logged = true;
          const after = action === "DELETE" ? null : payload?.[responseKey] || null;
          const recordId = after?.id || before?.id || req.params.id || null;
          const description = {
            CREATE: `Created ${section} record`,
            UPDATE: `Updated ${section} record`,
            DELETE: `Deleted ${section} record`,
          }[action];

          prisma.auditLog.create({
            data: {
              actorId: req.admin?.id || req.user?.userId || null,
              actorName: req.admin?.name || "Unknown admin",
              actorEmail: req.admin?.email || "",
              action,
              section,
              recordId,
              summary: description,
              before: before ? safeSnapshot(before) : undefined,
              after: after ? safeSnapshot(after) : undefined,
            },
          }).catch((error) => {
            console.error("Could not write admin audit log:", error.message);
          });
        }

        return sendJson(payload);
      };

      return next();
    } catch (error) {
      return next(error);
    }
  };
}
