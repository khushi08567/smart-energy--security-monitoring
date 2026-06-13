const express = require("express");
const router = express.Router();
const {
  getOverview,
  getLiveStatus,
  getRecentAlerts,
  getDeviceHealth,
  getBuildingSummary,
} = require("../controllers/dashboardController");
const verifyToken = require("../middleware/authMiddleware");
const { checkRole } = require("../middleware/roleMiddleware");

// All dashboard routes require login
// Admin and Warden only — these show data across all rooms

router.get("/overview",         verifyToken, checkRole("Admin", "Warden"), getOverview);
router.get("/live-status",      verifyToken, checkRole("Admin", "Warden"), getLiveStatus);
router.get("/recent-alerts",    verifyToken, checkRole("Admin", "Warden"), getRecentAlerts);
router.get("/device-health",    verifyToken, checkRole("Admin", "Warden"), getDeviceHealth);
router.get("/building-summary", verifyToken, checkRole("Admin", "Warden"), getBuildingSummary);

module.exports = router;