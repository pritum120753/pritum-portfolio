import { Router } from "express";
import { getAbout, updateAbout } from "../controllers/about.controller.js";
import { authenticateToken, requireSectionPermission } from "../middleware/auth.middleware.js";
import { auditMutation } from "../middleware/audit.middleware.js";

const router = Router();

router.get("/", getAbout);
router.post("/", authenticateToken, requireSectionPermission("about", "create"), auditMutation("about", "CREATE"), updateAbout);

export default router;
