import { Router } from "express";
import {
  getExperiences, createExperience, updateExperience, deleteExperience,
} from "../controllers/experience.controller.js";
import { authenticateToken, requireSectionPermission } from "../middleware/auth.middleware.js";
import { auditMutation } from "../middleware/audit.middleware.js";

const router = Router();

router.get("/", getExperiences);
router.post("/", authenticateToken, requireSectionPermission("experience", "create"), auditMutation("experience", "CREATE"), createExperience);
router.put("/:id", authenticateToken, requireSectionPermission("experience", "edit"), auditMutation("experience", "UPDATE"), updateExperience);
router.delete("/:id", authenticateToken, requireSectionPermission("experience", "delete"), auditMutation("experience", "DELETE"), deleteExperience);

export default router;
