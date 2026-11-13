import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";

const ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN"]);

export function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication token required",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
}

async function findActiveAdmin(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });
}

export function createRequireAdmin(findUserById = findActiveAdmin) {
  return async function requireAdmin(req, res, next) {
    if (!ADMIN_ROLES.has(req.user?.role) || !req.user?.userId) {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    try {
      const user = await findUserById(req.user.userId);
      if (!user || !ADMIN_ROLES.has(user.role) || user.role !== req.user.role) {
        return res.status(403).json({
          success: false,
          message: "Admin access required",
        });
      }

      req.admin = {
        id: user.id,
        ...(user.name ? { name: user.name } : {}),
        ...(user.email ? { email: user.email } : {}),
        role: user.role,
      };
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

export function createRequireSuperAdmin(findUserById = findActiveAdmin) {
  return async function requireSuperAdmin(req, res, next) {
    if (req.user?.role !== "SUPER_ADMIN" || !req.user?.userId) {
      return res.status(403).json({
        success: false,
        message: "Super admin access required",
      });
    }

    try {
      const user = await findUserById(req.user.userId);
      if (!user || user.role !== "SUPER_ADMIN") {
        return res.status(403).json({
          success: false,
          message: "Super admin access required",
        });
      }

      req.admin = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      };
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

export function createRequireSectionPermission(findUserById = (userId) =>
  prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      permissions: {
        select: {
          section: true,
          canView: true,
          canCreate: true,
          canEdit: true,
          canDelete: true,
        },
      },
    },
  })
) {
  return function requireSectionPermission(section, action) {
    const permissionField = {
      view: "canView",
      create: "canCreate",
      edit: "canEdit",
      delete: "canDelete",
    }[action];

    if (!permissionField) {
      throw new Error(`Unsupported permission action: ${action}`);
    }

    return async function sectionPermissionMiddleware(req, res, next) {
      if (!req.user?.userId || !ADMIN_ROLES.has(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "Admin access required",
        });
      }

      try {
        const user = await findUserById(req.user.userId);
        if (!user || user.role !== req.user.role) {
          return res.status(403).json({
            success: false,
            message: "Admin access required",
          });
        }

        req.admin = {
          id: user.id,
          ...(user.name ? { name: user.name } : {}),
          ...(user.email ? { email: user.email } : {}),
          role: user.role,
        };

        if (user.role === "SUPER_ADMIN") {
          return next();
        }

        const permission = user.permissions?.find((item) => item.section === section);
        if (!permission?.[permissionField]) {
          return res.status(403).json({
            success: false,
            code: "SECTION_PERMISSION_REQUIRED",
            section,
            action,
            message: `You do not have permission to ${action} in ${section}. Submit a request to the Super Admin.`,
          });
        }

        return next();
      } catch (error) {
        return next(error);
      }
    };
  };
}

export const requireAdmin = createRequireAdmin();
export const requireSuperAdmin = createRequireSuperAdmin();
export const requireSectionPermission = createRequireSectionPermission();
