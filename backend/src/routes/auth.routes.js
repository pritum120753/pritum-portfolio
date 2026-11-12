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
} from "../middleware/auth.middleware.js";

const router = Router();

router.post("/login", loginRateLimiter, login);

router.get(
  "/me",
  authenticateToken,
  requireAdmin,
  getCurrentUser
);

router.get("/admins", authenticateToken, requireAdmin, listAdmins);
router.post("/admins", authenticateToken, requireAdmin, createAdmin);
router.patch("/admins/:id", authenticateToken, requireAdmin, updateAdmin);
router.delete("/admins/:id", authenticateToken, requireAdmin, deleteAdmin);

export default router;
