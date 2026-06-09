const express = require("express");
const router = express.Router();

const {
  createDevice,
  getAllDevices,
  getDeviceById,
  getDevicesByRoom,
  updateDevice,
  deleteDevice,
} = require("../controllers/deviceController");

const verifyToken = require("../middleware/authMiddleware");
const { checkRole } = require("../middleware/roleMiddleware");

// GET /api/devices/room/:roomId — MUST be before /:id
router.get("/room/:roomId", verifyToken, getDevicesByRoom);

// GET /api/devices — all roles can view
router.get("/", verifyToken, getAllDevices);

// GET /api/devices/:id — all roles can view
router.get("/:id", verifyToken, getDeviceById);

// POST /api/devices — Admin and Warden only
router.post("/", verifyToken, checkRole("Admin", "Warden"), createDevice);

// PUT /api/devices/:id — Admin and Warden only
router.put("/:id", verifyToken, checkRole("Admin", "Warden"), updateDevice);

// DELETE /api/devices/:id — Admin only
router.delete("/:id", verifyToken, checkRole("Admin"), deleteDevice);

module.exports = router;