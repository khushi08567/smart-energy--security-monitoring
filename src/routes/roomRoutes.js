const express = require("express");
const router = express.Router();
const {
  createRoom, getAllRooms, getRoomById,
  getFloorRooms, updateRoom, deleteRoom
} = require("../controllers/roomController");
const verifyToken = require("../middleware/authMiddleware");
const { checkRole } = require("../middleware/roleMiddleware");

// MUST be before /:id
router.get("/floor/:floorNum", verifyToken, getFloorRooms);

router.get("/", verifyToken, getAllRooms);
router.get("/:id", verifyToken, getRoomById);
router.post("/", verifyToken, checkRole("Admin", "Warden"), createRoom);
router.put("/:id", verifyToken, checkRole("Admin", "Warden"), updateRoom);
router.delete("/:id", verifyToken, checkRole("Admin"), deleteRoom);

module.exports = router;