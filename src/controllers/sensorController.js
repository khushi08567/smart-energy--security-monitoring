const SensorData = require("../models/SensorData");
const Device = require("../models/Device");
const { sendSuccess, sendError } = require("../utils/response");

// POST /api/sensors/data
const saveSensorData = async (req, res) => {
  try {
    const { device_id, room_id, type, value, unit } = req.body;

    if (!device_id || !room_id || !type || value === undefined) {
      return sendError(res, "device_id, room_id, type, and value are required", 400);
    }

    const device = await Device.findOne({ where: { device_id } });
    if (!device) {
      return sendError(res, "Device not registered. Register device first.", 404);
    }

    const reading = await SensorData.create({
      device_id, room_id, type, value, unit
    });

    await device.update({ last_seen: new Date() });

    const io = req.app.get("io");
    if (io) {
      const payload = { device_id, room_id, type, value, unit,
        timestamp: reading.timestamp };
      io.emit("sensor-data", payload);
      io.to(`room-${room_id}`).emit("room-data", payload);
    }

    return sendSuccess(res, reading, "Sensor data saved", 201);
  } catch (error) {
    return sendError(res, error.message);
  }
};

// GET /api/sensors/data/:deviceId
const getDeviceReadings = async (req, res) => {
  try {
    const { from, to, limit = 50 } = req.query;
    const filter = { device_id: req.params.deviceId };

    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to) filter.timestamp.$lte = new Date(to);
    }

    const readings = await SensorData.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    return sendSuccess(res, readings, "Readings fetched successfully");
  } catch (error) {
    return sendError(res, error.message);
  }
};

// GET /api/sensors/latest/:roomId
const getLatestByRoom = async (req, res) => {
  try {
    const latest = await SensorData.aggregate([
      { $match: { room_id: parseInt(req.params.roomId) } },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: "$device_id",
          device_id: { $first: "$device_id" },
          type: { $first: "$type" },
          value: { $first: "$value" },
          unit: { $first: "$unit" },
          timestamp: { $first: "$timestamp" },
        }
      }
    ]);

    return sendSuccess(res, latest, "Latest readings for room");
  } catch (error) {
    return sendError(res, error.message);
  }
};

// GET /api/sensors/history
const getSensorHistory = async (req, res) => {
  try {
    const { from, to, type, room_id, limit = 100 } = req.query;
    const filter = {};

    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to) filter.timestamp.$lte = new Date(to);
    }
    if (type) filter.type = type;
    if (room_id) filter.room_id = parseInt(room_id);

    const data = await SensorData.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    return sendSuccess(res, data, "Sensor history fetched");
  } catch (error) {
    return sendError(res, error.message);
  }
};

module.exports = {
  saveSensorData,
  getDeviceReadings,
  getLatestByRoom,
  getSensorHistory
};