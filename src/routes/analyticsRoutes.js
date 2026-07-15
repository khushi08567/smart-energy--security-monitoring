const express = require("express");
const router = express.Router();
const {
  getEnergyLeaderboard,
  getPeakHoursAll,
  getSecurityHotspots,
  exportMonthlyCSV,
  getDeviceUsage,
  getAnalyticsSummary,
  getAuditLogs,
  triggerEmailDigest,
} = require("../controllers/analyticsController");
const verifyToken = require("../middleware/authMiddleware");
const { checkRole } = require("../middleware/roleMiddleware");

// All analytics routes — Admin and Warden only
router.get("/energy-leaderboard",  verifyToken, checkRole("Admin", "Warden"), getEnergyLeaderboard);
router.get("/peak-hours",          verifyToken, checkRole("Admin", "Warden"), getPeakHoursAll);
router.get("/security-hotspots",   verifyToken, checkRole("Admin", "Warden"), getSecurityHotspots);
router.get("/device-usage",        verifyToken, checkRole("Admin", "Warden"), getDeviceUsage);
router.get("/summary",             verifyToken, checkRole("Admin", "Warden"), getAnalyticsSummary);

// Audit logs (Admin only)
router.get("/audit-logs",          verifyToken, checkRole("Admin"), getAuditLogs);

// Email Performance digest dispatches (Admin/Warden only)
router.post("/email-digest",       verifyToken, checkRole("Admin", "Warden"), triggerEmailDigest);

// CSV export
router.get("/export/monthly",      verifyToken, checkRole("Admin", "Warden"), exportMonthlyCSV);

module.exports = router;