const Device = require("../models/Device");
const Room = require("../models/Room");
const { sendSuccess, sendError } = require("../utils/response");

// POST /api/devices — Register a new device
const createDevice = async (req, res) => {
  try {
    const { device_id, device_name, type, room_id, status } = req.body;

    // Validate required fields
    if (!device_id || !device_name || !type || !room_id) {
      return sendError(res, "device_id, device_name, type, and room_id are required", 400);
    }

    // Check room exists
    const room = await Room.findByPk(room_id);
    if (!room) {
      return sendError(res, "Room not found. Please provide a valid room_id", 404);
    }

    // Check device_id is unique
    const existing = await Device.findOne({ where: { device_id } });
    if (existing) {
      return sendError(res, "A device with this device_id already exists", 400);
    }

    const device = await Device.create({
      device_id,
      device_name,
      type,
      room_id,
      status: status || "active",
    });

    return sendSuccess(res, device, "Device registered successfully", 201);
  } catch (error) {
    return sendError(res, error.message);
  }
};

// GET /api/devices — List all devices with room info
const getAllDevices = async (req, res) => {
  try {
    const devices = await Device.findAll({
      include: [{ model: Room, as: "room", attributes: ["id", "room_number", "floor", "building"] }],
      order: [["createdAt", "DESC"]],
    });
    return sendSuccess(res, devices, "Devices fetched successfully");
  } catch (error) {
    return sendError(res, error.message);
  }
};

// GET /api/devices/:id — Get one device
const getDeviceById = async (req, res) => {
  try {
    const device = await Device.findByPk(req.params.id, {
      include: [{ model: Room, as: "room", attributes: ["id", "room_number", "floor", "building"] }],
    });

    if (!device) return sendError(res, "Device not found", 404);
    return sendSuccess(res, device, "Device fetched successfully");
  } catch (error) {
    return sendError(res, error.message);
  }
};

// GET /api/devices/room/:roomId — All devices in a room
const getDevicesByRoom = async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.roomId);
    if (!room) return sendError(res, "Room not found", 404);

    const devices = await Device.findAll({
      where: { room_id: req.params.roomId },
      order: [["type", "ASC"]],
    });

    return sendSuccess(res, { room, devices }, "Devices fetched for room");
  } catch (error) {
    return sendError(res, error.message);
  }
};

// PUT /api/devices/:id — Update device
const updateDevice = async (req, res) => {
  try {
    const device = await Device.findByPk(req.params.id);
    if (!device) return sendError(res, "Device not found", 404);

    const { device_name, type, status, room_id } = req.body;
    const updateData = {};
    if (device_name) updateData.device_name = device_name;
    if (type) updateData.type = type;
    if (status) updateData.status = status;
    if (room_id) {
      const room = await Room.findByPk(room_id);
      if (!room) return sendError(res, "New room_id not found", 404);
      updateData.room_id = room_id;
    }

    await device.update(updateData);
    const updated = await Device.findByPk(req.params.id, {
      include: [{ model: Room, as: "room", attributes: ["id", "room_number", "floor"] }],
    });

    return sendSuccess(res, updated, "Device updated successfully");
  } catch (error) {
    return sendError(res, error.message);
  }
};

// DELETE /api/devices/:id — Remove device (Admin only)
const deleteDevice = async (req, res) => {
  try {
    const device = await Device.findByPk(req.params.id);
    if (!device) return sendError(res, "Device not found", 404);

    await device.destroy();
    return sendSuccess(res, null, "Device deleted successfully");
  } catch (error) {
    return sendError(res, error.message);
  }
};

module.exports = {
  createDevice,
  getAllDevices,
  getDeviceById,
  getDevicesByRoom,
  updateDevice,
  deleteDevice,
};