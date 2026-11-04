import { Router } from "express";
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from "../controllers/project.controller.js";

import {
  authenticateToken,
  requireAdmin,
} from "../middleware/auth.middleware.js";

const router = Router();

// Public routes
router.get("/", getProjects);
router.get("/:id", getProjectById);

// Protected admin routes
router.post("/", authenticateToken, requireAdmin, createProject);
router.put("/:id", authenticateToken, requireAdmin, updateProject);
router.delete("/:id", authenticateToken, requireAdmin, deleteProject);

export default router;