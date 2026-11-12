import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";

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

export function createRequireAdmin(findUserById = (userId) =>
  prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  })
) {
  return async function requireAdmin(req, res, next) {
    if (req.user?.role !== "ADMIN" || !req.user?.userId) {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    try {
      const user = await findUserById(req.user.userId);
      if (!user || user.role !== "ADMIN") {
        return res.status(403).json({
          success: false,
          message: "Admin access required",
        });
      }

      req.admin = { id: user.id, role: user.role };
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

export const requireAdmin = createRequireAdmin();
