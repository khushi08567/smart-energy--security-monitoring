const mongoose = require("mongoose");

const energyReportSchema = new mongoose.Schema({
  room_id: { type: Number, required: true, index: true },
  room_number: { type: String, required: true },
  date: { type: String, required: true, index: true },
  total_kwh: { type: Number, required: true, default: 0 },
  average_kwh: { type: Number, default: 0 },
  peak_kwh: { type: Number, default: 0 },
  reading_count: { type: Number, default: 0 },
  is_anomaly: { type: Boolean, default: false },
  anomaly_reason: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

energyReportSchema.index({ room_id: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("EnergyReport", energyReportSchema);