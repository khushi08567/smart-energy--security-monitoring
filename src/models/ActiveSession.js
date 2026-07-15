const mongoose = require("mongoose");

const ActiveSessionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  email: { type: String, required: true },
  userAgent: { type: String, required: false },
  ipAddress: { type: String, required: false },
  loginTime: { type: Date, default: Date.now },
  lastSeen: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ActiveSession", ActiveSessionSchema);
