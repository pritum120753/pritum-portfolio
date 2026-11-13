import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import {
  validateAdminCreateInput,
  validateAdminUpdateInput,
  getAdminDeletionError,
} from "../lib/validate-admin-input.js";

const ADMIN_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  permissions: {
    select: {
      section: true,
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
    },
  },
};

export async function listAdmins(_req, res, next) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
      select: ADMIN_SELECT,
      orderBy: [{ role: "desc" }, { createdAt: "asc" }],
    });

    return res.json({ success: true, admins });
  } catch (error) {
    return next(error);
  }
}

export async function createAdmin(req, res, next) {
  try {
    const validation = validateAdminCreateInput(req.body);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const { name, email, password } = validation.data;
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      return res.status(409).json({ success: false, message: "An account with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const admin = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: "ADMIN" },
      select: ADMIN_SELECT,
    });

    return res.status(201).json({
      success: true,
      message: "Admin account created successfully",
      admin,
    });
  } catch (error) {
    if (error?.code === "P2002") {
      return res.status(409).json({ success: false, message: "An account with this email already exists" });
    }
    return next(error);
  }
}

export async function updateAdmin(req, res, next) {
  try {
    const validation = validateAdminUpdateInput(req.body);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const target = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, role: true },
    });
    if (!target || target.role !== "ADMIN") {
      return res.status(404).json({ success: false, message: "Regular admin account not found" });
    }

    const data = { ...validation.data };
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 12);
    }

    const admin = await prisma.user.update({
      where: { id: target.id },
      data,
      select: ADMIN_SELECT,
    });

    return res.json({
      success: true,
      message: "Admin account updated successfully",
      admin,
    });
  } catch (error) {
    if (error?.code === "P2002") {
      return res.status(409).json({ success: false, message: "An account with this email already exists" });
    }
    if (error?.code === "P2025") {
      return res.status(404).json({ success: false, message: "Admin account not found" });
    }
    return next(error);
  }
}

export async function deleteAdmin(req, res, next) {
  try {
    const outcome = await prisma.$transaction(async (transaction) => {
      const target = await transaction.user.findUnique({
        where: { id: req.params.id },
        select: { id: true, role: true },
      });

      if (!target || target.role !== "ADMIN") {
        return { status: 404, message: "Regular admin account not found" };
      }

      const adminCount = await transaction.user.count({
        where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
      });
      const deletionError = getAdminDeletionError({
        actorId: req.user.userId,
        targetId: target.id,
        adminCount,
      });

      if (deletionError) {
        return { status: 409, message: deletionError };
      }

      await transaction.user.delete({ where: { id: target.id } });
      return { status: 200 };
    }, { isolationLevel: "Serializable" });

    if (outcome.status !== 200) {
      return res.status(outcome.status).json({ success: false, message: outcome.message });
    }

    return res.json({ success: true, message: "Admin account deleted successfully" });
  } catch (error) {
    if (error?.code === "P2034") {
      return res.status(409).json({
        success: false,
        message: "Admin accounts changed during this request. Please refresh and try again.",
      });
    }
    if (error?.code === "P2025") {
      return res.status(404).json({ success: false, message: "Admin account not found" });
    }
    return next(error);
  }
}
