const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  user_id: {
    type: Number,
    default: null,
    index: true,
    // null = broadcast to all
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["security", "energy", "device", "system"],
    required: true,
  },
  severity: {
    type: String,
    enum: ["info", "warning", "danger", "critical"],
    default: "info",
  },
  is_read: {
    type: Boolean,
    default: false,
  },
  read_at: {
    type: Date,
    default: null,
  },
  reference_id: {
    type: String,
    default: null,
    // ID of related security event or sensor reading
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

module.exports = mongoose.model("Notification", notificationSchema);