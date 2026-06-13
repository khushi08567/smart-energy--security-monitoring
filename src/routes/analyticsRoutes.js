const express = require("express");
const router = express.Router();
const {
  getEnergyLeaderboard,
  getPeakHoursAll,
  getSecurityHotspots,
  exportMonthlyCSV,
  getDeviceUsage,
  getAnalyticsSummary,
} = require("../controllers/analyticsController");
const verifyToken = require("../middleware/authMiddleware");
const { checkRole } = require("../middleware/roleMiddleware");

// All analytics routes — Admin and Warden only
router.get("/energy-leaderboard",  verifyToken, checkRole("Admin", "Warden"), getEnergyLeaderboard);
router.get("/peak-hours",          verifyToken, checkRole("Admin", "Warden"), getPeakHoursAll);
router.get("/security-hotspots",   verifyToken, checkRole("Admin", "Warden"), getSecurityHotspots);
router.get("/device-usage",        verifyToken, checkRole("Admin", "Warden"), getDeviceUsage);
router.get("/summary",             verifyToken, checkRole("Admin", "Warden"), getAnalyticsSummary);

// CSV export — returns file download
router.get("/export/monthly",      verifyToken, checkRole("Admin", "Warden"), exportMonthlyCSV);

module.exports = router;