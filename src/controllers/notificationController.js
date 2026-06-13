const Notification = require("../models/Notification");
const { sendSuccess, sendError } = require("../utils/response");

// Helper to create notification + emit socket
const createNotification = async (io, { user_id = null, title, message, type, severity = "info", reference_id = null }) => {
  const notification = await Notification.create({
    user_id, title, message, type, severity, reference_id,
  });

  if (io) {
    const event = user_id ? `notification-${user_id}` : "notification-all";
    io.emit(event, {
      id: notification._id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      severity: notification.severity,
      timestamp: notification.timestamp,
    });
  }

  return notification;
};

// GET /api/notifications — get my notifications
const getMyNotifications = async (req, res) => {
  try {
    const { is_read, type, limit = 20, page = 1 } = req.query;
    const filter = {
      $or: [{ user_id: req.user.id }, { user_id: null }],
    };
    if (is_read !== undefined) filter.is_read = is_read === "true";
    if (type) filter.type = type;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Notification.countDocuments(filter);
    const notifications = await Notification.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const unread_count = await Notification.countDocuments({
      ...filter,
      is_read: false,
    });

    return sendSuccess(res, {
      total, unread_count,
      page: parseInt(page),
      notifications,
    }, "Notifications fetched");
  } catch (error) {
    return sendError(res, error.message);
  }
};

// PUT /api/notifications/:id/read — mark one as read
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return sendError(res, "Notification not found", 404);

    notification.is_read = true;
    notification.read_at = new Date();
    await notification.save();

    return sendSuccess(res, notification, "Notification marked as read");
  } catch (error) {
    return sendError(res, error.message);
  }
};

// PUT /api/notifications/read-all — mark all as read
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        $or: [{ user_id: req.user.id }, { user_id: null }],
        is_read: false,
      },
      { is_read: true, read_at: new Date() }
    );

    return sendSuccess(res, null, "All notifications marked as read");
  } catch (error) {
    return sendError(res, error.message);
  }
};

// DELETE /api/notifications/:id — delete one
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return sendError(res, "Notification not found", 404);

    await notification.deleteOne();
    return sendSuccess(res, null, "Notification deleted");
  } catch (error) {
    return sendError(res, error.message);
  }
};

// GET /api/notifications/unread-count
const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      $or: [{ user_id: req.user.id }, { user_id: null }],
      is_read: false,
    });
    return sendSuccess(res, { unread_count: count }, "Unread count fetched");
  } catch (error) {
    return sendError(res, error.message);
  }
};

module.exports = {
  createNotification,
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
};