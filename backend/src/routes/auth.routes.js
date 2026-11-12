import { loginRateLimiter } from "../middleware/login-rate-limit.middleware.js";

import { Router } from "express";
import {
  login,
  getCurrentUser,
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

const router = Router();

router.post("/login", loginRateLimiter, login);

router.get(
  "/me",
  authenticateToken,
  requireAdmin,
  getCurrentUser
);

router.get("/admins", authenticateToken, requireSuperAdmin, listAdmins);
router.post("/admins", authenticateToken, requireSuperAdmin, createAdmin);
router.patch("/admins/:id", authenticateToken, requireSuperAdmin, updateAdmin);
router.delete("/admins/:id", authenticateToken, requireSuperAdmin, deleteAdmin);

export default router;
