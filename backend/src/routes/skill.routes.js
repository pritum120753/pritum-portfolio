import { Router } from "express";

import {
  getSkills,
  createSkill,
  updateSkill,
  deleteSkill,
} from "../controllers/skill.controller.js";

import {
  authenticateToken,
  requireAdmin,
} from "../middleware/auth.middleware.js";

const router = Router();

// Public route
router.get("/", getSkills);

// Protected admin routes
router.post("/", authenticateToken, requireAdmin, createSkill);
router.put("/:id", authenticateToken, requireAdmin, updateSkill);
router.delete("/:id", authenticateToken, requireAdmin, deleteSkill);

export default router;