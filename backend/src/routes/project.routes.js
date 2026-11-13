import { Router } from "express";
import {
  getProjects, getProjectById, createProject, updateProject, deleteProject,
} from "../controllers/project.controller.js";
import { authenticateToken, requireSectionPermission } from "../middleware/auth.middleware.js";
import { auditMutation } from "../middleware/audit.middleware.js";

const router = Router();

router.get("/", getProjects);
router.get("/:id", getProjectById);
router.post("/", authenticateToken, requireSectionPermission("projects", "create"), auditMutation("projects", "CREATE"), createProject);
router.put("/:id", authenticateToken, requireSectionPermission("projects", "edit"), auditMutation("projects", "UPDATE"), updateProject);
router.delete("/:id", authenticateToken, requireSectionPermission("projects", "delete"), auditMutation("projects", "DELETE"), deleteProject);

export default router;
