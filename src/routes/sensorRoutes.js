const express = require("express");
const router = express.Router();
const {
  saveSensorData,
  getDeviceReadings,
  getLatestByRoom,
  getSensorHistory
} = require("../controllers/sensorController");
const verifyToken = require("../middleware/authMiddleware");

// POST — no auth needed, devices send data directly
router.post("/data", saveSensorData);

// GET routes — login required
router.get("/history", verifyToken, getSensorHistory);
router.get("/latest/:roomId", verifyToken, getLatestByRoom);
router.get("/data/:deviceId", verifyToken, getDeviceReadings);

module.exports = router;