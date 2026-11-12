import { loginRateLimiter } from "../middleware/login-rate-limit.middleware.js";

import { Router } from "express";
import {
  login,
  getCurrentUser,
} from "../controllers/auth.controller.js";

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

export default router;
