const express = require("express");
const router = express.Router();
const {
  logSecurityEvent,
  getSecurityEvents,
  getSecurityEventById,
  resolveSecurityEvent,
  getUnresolvedEvents,
  checkNightMotion,
  getSecurityStats,
} = require("../controllers/securityController");
const verifyToken = require("../middleware/authMiddleware");
const { checkRole } = require("../middleware/roleMiddleware");

// Specific routes BEFORE /:id
router.get("/unresolved",  verifyToken, checkRole("Admin", "Warden"), getUnresolvedEvents);
router.get("/night-check", verifyToken, checkRole("Admin", "Warden"), checkNightMotion);
router.get("/stats",       verifyToken, checkRole("Admin", "Warden"), getSecurityStats);

// General routes
router.get("/events",      verifyToken, checkRole("Admin", "Warden"), getSecurityEvents);
router.post("/event",      verifyToken, checkRole("Admin", "Warden"), logSecurityEvent);

// /:id routes LAST
router.get("/events/:id",          verifyToken, checkRole("Admin", "Warden"), getSecurityEventById);
router.put("/events/:id/resolve",  verifyToken, checkRole("Admin", "Warden"), resolveSecurityEvent);

module.exports = router;
console.log("Security routes loaded");