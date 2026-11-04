import { Router } from "express";

import {
  getEducations,
  createEducation,
  updateEducation,
  deleteEducation,
} from "../controllers/education.controller.js";

import {
  authenticateToken,
  requireAdmin,
} from "../middleware/auth.middleware.js";

const router = Router();

// Public route
router.get("/", getEducations);

// Protected admin routes
router.post("/", authenticateToken, requireAdmin, createEducation);
router.put("/:id", authenticateToken, requireAdmin, updateEducation);
router.delete("/:id", authenticateToken, requireAdmin, deleteEducation);

export default router;