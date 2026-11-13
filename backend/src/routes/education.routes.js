import { Router } from "express";
import {
  getEducations, createEducation, updateEducation, deleteEducation,
} from "../controllers/education.controller.js";
import { authenticateToken, requireSectionPermission } from "../middleware/auth.middleware.js";
import { auditMutation } from "../middleware/audit.middleware.js";

const router = Router();

router.get("/", getEducations);
router.post("/", authenticateToken, requireSectionPermission("education", "create"), auditMutation("education", "CREATE"), createEducation);
router.put("/:id", authenticateToken, requireSectionPermission("education", "edit"), auditMutation("education", "UPDATE"), updateEducation);
router.delete("/:id", authenticateToken, requireSectionPermission("education", "delete"), auditMutation("education", "DELETE"), deleteEducation);

export default router;
