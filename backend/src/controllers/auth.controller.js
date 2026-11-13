import { validateLoginInput } from "../lib/validate-login-input.js";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";

export async function login(req, res, next) {
  try {
    const credentials = validateLoginInput(req.body);

    if (!credentials.valid) {
      return res.status(400).json({
        success: false,
        message: credentials.message,
      });
    }

    const { email, password } = credentials;

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Authentication is not configured",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );

    return res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.role === "SUPER_ADMIN" ? [] : await prisma.adminPermission.findMany({
          where: { userId: user.id },
          select: { section: true, canView: true, canCreate: true, canEdit: true, canDelete: true },
        }),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getCurrentUser(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const permissions = user.role === "SUPER_ADMIN"
      ? []
      : await prisma.adminPermission.findMany({
          where: { userId: user.id },
          select: { section: true, canView: true, canCreate: true, canEdit: true, canDelete: true },
        });

    return res.json({
      success: true,
      user: { ...user, permissions },
    });
  } catch (error) {
    next(error);
  }
}


export async function updateOwnProfile(req, res, next) {
  try {
    const { name, currentPassword, newPassword } = req.body || {};
    const data = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim() || name.trim().length > 80) {
        return res.status(400).json({ success: false, message: "Name must be between 1 and 80 characters." });
      }
      data.name = name.trim();
    }

    if (newPassword !== undefined || currentPassword !== undefined) {
      if (typeof currentPassword !== "string" || !currentPassword ||
          typeof newPassword !== "string" || newPassword.length < 12 || newPassword.length > 128) {
        return res.status(400).json({
          success: false,
          message: "To change your password, provide your current password and a new password between 12 and 128 characters.",
        });
      }

      const account = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { password: true },
      });
      if (!account || !(await bcrypt.compare(currentPassword, account.password))) {
        return res.status(400).json({ success: false, message: "Current password is incorrect." });
      }
      data.password = await bcrypt.hash(newPassword, 12);
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ success: false, message: "No profile changes were provided." });
    }

    const before = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, name: true, email: true, role: true },
    });
    const updated = await prisma.user.update({
      where: { id: req.user.userId },
      data,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    await prisma.auditLog.create({
      data: {
        actorId: updated.id,
        actorName: updated.name,
        actorEmail: updated.email,
        action: "PROFILE_UPDATE",
        section: "profile",
        recordId: updated.id,
        summary: "Updated own profile",
        before,
        after: updated,
      },
    });

    return res.json({ success: true, message: "Profile updated successfully.", user: updated });
  } catch (error) {
    return next(error);
  }
}
