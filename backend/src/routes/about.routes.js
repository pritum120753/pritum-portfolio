
import { Router } from "express";

import {
  getAbout,
  updateAbout,
} from "../controllers/about.controller.js";

import {
  authenticateToken,
  requireAdmin,
} from "../middleware/auth.middleware.js";

const router = Router();

// Public route
router.get("/", getAbout);

// Protected admin route
router.put("/", authenticateToken, requireAdmin, updateAbout);

export default router;
