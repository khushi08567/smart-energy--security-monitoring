const express = require("express");
const router = express.Router();
const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
} = require("../controllers/notificationController");
const verifyToken = require("../middleware/authMiddleware");

// Specific routes BEFORE /:id
router.get("/unread-count", verifyToken, getUnreadCount);
router.put("/read-all",     verifyToken, markAllAsRead);

// General routes
router.get("/",             verifyToken, getMyNotifications);

// /:id routes LAST
router.put("/:id/read",     verifyToken, markAsRead);
router.delete("/:id",       verifyToken, deleteNotification);

module.exports = router;