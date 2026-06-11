const express = require("express");
const router = express.Router();
const {
  getRoomDailySummary,
  compareRoomsByFloor,
  detectAnomalies,
  getRoomTrend,
  getMonthlyReport,
  calculateBill,
  getEnergyLeaderboard,
  getPeakHours,
  getIdleDevices,
} = require("../controllers/energyController");
const verifyToken = require("../middleware/authMiddleware");
const { checkRole } = require("../middleware/roleMiddleware");

// ── ALL specific routes FIRST ──
router.get("/anomalies",    verifyToken, checkRole("Admin", "Warden"), detectAnomalies);
router.get("/compare",      verifyToken, checkRole("Admin", "Warden"), compareRoomsByFloor);
router.get("/leaderboard",  verifyToken, checkRole("Admin", "Warden"), getEnergyLeaderboard);
router.get("/idle-devices", verifyToken, checkRole("Admin", "Warden"), getIdleDevices);

// ── :roomId routes AFTER ──
router.get("/summary/:roomId",     verifyToken, getRoomDailySummary);
router.get("/trend/:roomId",       verifyToken, getRoomTrend);
router.get("/monthly/:roomId",     verifyToken, getMonthlyReport);
router.get("/bill/:roomId",        verifyToken, calculateBill);
router.get("/peak-hours/:roomId",  verifyToken, getPeakHours);

module.exports = router;