import { Router } from "express";
import { getSiteSettings, updateSiteSettings } from "../controllers/site-settings.controller.js";
import { authenticateToken, requireSectionPermission } from "../middleware/auth.middleware.js";
import { auditMutation } from "../middleware/audit.middleware.js";

const router = Router();

router.get("/", getSiteSettings);
router.post("/", authenticateToken, requireSectionPermission("settings", "create"), auditMutation("settings", "CREATE"), updateSiteSettings);

export default router;
