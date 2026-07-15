const mongoose = require("mongoose");

const AuditLogSchema = new mongoose.Schema({
  userId: { type: String, required: false },
  email: { type: String, required: false },
  action: { type: String, required: true },
  details: { type: String, required: false },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("AuditLog", AuditLogSchema);
