const mongoose = require("mongoose");

const securityEventSchema = new mongoose.Schema({
  device_id: {
    type: String,
    required: true,
    index: true,
  },
  room_id: {
    type: Number,
    required: true,
    index: true,
  },
  event_type: {
    type: String,
    enum: ["unauthorized_entry", "motion_detected", "door_forced", "door_open_too_long", "night_motion"],
    required: true,
  },
  severity: {
    type: String,
    enum: ["Low", "Medium", "High", "Critical"],
    default: "Low",
  },
  description: {
    type: String,
    required: true,
  },
  resolved: {
    type: Boolean,
    default: false,
  },
  resolved_at: {
    type: Date,
    default: null,
  },
  resolved_by: {
    type: Number, // user id
    default: null,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

module.exports = mongoose.model("SecurityEvent", securityEventSchema);