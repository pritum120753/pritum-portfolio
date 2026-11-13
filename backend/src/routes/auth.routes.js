import { loginRateLimiter } from "../middleware/login-rate-limit.middleware.js";

import { Router } from "express";
import {
  login,
  getCurrentUser,
  updateOwnProfile,
} from "../controllers/auth.controller.js";
import {
  listAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
} from "../controllers/admin.controller.js";

import {
  authenticateToken,
  requireAdmin,
  requireSuperAdmin,
} from "../middleware/auth.middleware.js";
import {
  listAuditLogs,
  listAdminRequests,
  createAdminRequest,
  reviewAdminRequest,
  updateAdminPermissions,
} from "../controllers/governance.controller.js";

const router = Router();

router.post("/login", loginRateLimiter, login);

router.get(
  "/me",
  authenticateToken,
  requireAdmin,
  getCurrentUser
);

router.patch("/profile", authenticateToken, requireAdmin, updateOwnProfile);

router.get("/requests", authenticateToken, requireAdmin, listAdminRequests);
router.post("/requests", authenticateToken, requireAdmin, createAdminRequest);
router.patch("/requests/:id/review", authenticateToken, requireSuperAdmin, reviewAdminRequest);
router.get("/audit-logs", authenticateToken, requireSuperAdmin, listAuditLogs);

router.get("/admins", authenticateToken, requireSuperAdmin, listAdmins);
router.post("/admins", authenticateToken, requireSuperAdmin, createAdmin);
router.patch("/admins/:id", authenticateToken, requireSuperAdmin, updateAdmin);
router.put("/admins/:id/permissions", authenticateToken, requireSuperAdmin, updateAdminPermissions);
router.delete("/admins/:id", authenticateToken, requireSuperAdmin, deleteAdmin);

export default router;
