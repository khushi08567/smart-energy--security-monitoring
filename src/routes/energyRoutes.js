const express = require("express");
const router = express.Router();
const { getRoomDailySummary, compareRoomsByFloor, detectAnomalies, getRoomTrend, getMonthlyReport, calculateBill } = require("../controllers/energyController");
const verifyToken = require("../middleware/authMiddleware");
const { checkRole } = require("../middleware/roleMiddleware");

router.get("/anomalies", verifyToken, checkRole("Admin", "Warden"), detectAnomalies);
router.get("/compare", verifyToken, checkRole("Admin", "Warden"), compareRoomsByFloor);
router.get("/summary/:roomId", verifyToken, getRoomDailySummary);
router.get("/trend/:roomId", verifyToken, getRoomTrend);
router.get("/monthly/:roomId", verifyToken, getMonthlyReport);
router.get("/bill/:roomId", verifyToken, calculateBill);

module.exports = router;