const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");

const {
  register,
  login,
  getSessions,
  terminateSession,
} = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);

// Session management
router.get("/sessions", verifyToken, getSessions);
router.post("/sessions/:id/terminate", verifyToken, terminateSession);

module.exports = router;