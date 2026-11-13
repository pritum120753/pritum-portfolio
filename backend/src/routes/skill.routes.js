import { Router } from "express";
import {
  getSkills, createSkill, updateSkill, deleteSkill,
} from "../controllers/skill.controller.js";
import { authenticateToken, requireSectionPermission } from "../middleware/auth.middleware.js";
import { auditMutation } from "../middleware/audit.middleware.js";

const router = Router();

router.get("/", getSkills);
router.post("/", authenticateToken, requireSectionPermission("skills", "create"), auditMutation("skills", "CREATE"), createSkill);
router.put("/:id", authenticateToken, requireSectionPermission("skills", "edit"), auditMutation("skills", "UPDATE"), updateSkill);
router.delete("/:id", authenticateToken, requireSectionPermission("skills", "delete"), auditMutation("skills", "DELETE"), deleteSkill);

export default router;
