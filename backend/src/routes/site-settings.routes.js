import { Router } from "express";
import { getSiteSettings, updateSiteSettings } from "../controllers/site-settings.controller.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.middleware.js";
const router = Router();
router.get("/", getSiteSettings);
router.put("/", authenticateToken, requireAdmin, updateSiteSettings);
export default router;
