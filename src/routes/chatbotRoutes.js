const express = require("express");
const router = express.Router();
const { handleChatQuery } = require("../controllers/chatbotController");
const verifyToken = require("../middleware/authMiddleware");

// POST /api/chatbot - Authenticated user query
router.post("/", verifyToken, handleChatQuery);

module.exports = router;
