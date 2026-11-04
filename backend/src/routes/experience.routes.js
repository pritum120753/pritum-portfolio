import { Router } from "express";

import {
  getExperiences,
  createExperience,
  updateExperience,
  deleteExperience,
} from "../controllers/experience.controller.js";

import {
  authenticateToken,
  requireAdmin,
} from "../middleware/auth.middleware.js";

const router = Router();

// Public route
router.get("/", getExperiences);

// Protected admin routes
router.post("/", authenticateToken, requireAdmin, createExperience);
router.put("/:id", authenticateToken, requireAdmin, updateExperience);
router.delete("/:id", authenticateToken, requireAdmin, deleteExperience);

export default router;