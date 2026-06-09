const mongoose = require("mongoose");

const sensorDataSchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: ["energy", "motion", "door", "temperature"],
    required: true,
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    // energy: number (kWh), motion: boolean, door: string (open/closed), temperature: number (°C)
  },
  unit: {
    type: String,
    default: null,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

module.exports = mongoose.model("SensorData", sensorDataSchema);