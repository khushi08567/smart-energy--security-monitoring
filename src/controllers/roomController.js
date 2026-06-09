const Room = require("../models/Room");
const Device = require("../models/Device");
const { sendSuccess, sendError } = require("../utils/response");

// POST /api/rooms
const createRoom = async (req, res) => {
  try {
    const { room_number, floor, building, status, occupancy } = req.body;

    if (!room_number || !floor) {
      return sendError(res, "room_number and floor are required", 400);
    }

    const existing = await Room.findOne({ where: { room_number } });
    if (existing) {
      return sendError(res, "Room number already exists", 400);
    }

    const room = await Room.create({
      room_number,
      floor,
      building: building || "Main Building",
      status: status || "active",
      occupancy: occupancy || "vacant",
    });

    return sendSuccess(res, room, "Room created successfully", 201);
  } catch (error) {
    return sendError(res, error.message);
  }
};

// GET /api/rooms
const getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.findAll({
      include: [{ model: Device, as: "devices",
        attributes: ["id", "device_id", "device_name", "type", "status"] }],
      order: [["floor", "ASC"], ["room_number", "ASC"]],
    });
    return sendSuccess(res, rooms, "Rooms fetched successfully");
  } catch (error) {
    return sendError(res, error.message);
  }
};

// GET /api/rooms/:id
const getRoomById = async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id, {
      include: [{ model: Device, as: "devices",
        attributes: ["id", "device_id", "device_name", "type", "status", "last_seen"] }],
    });

    if (!room) return sendError(res, "Room not found", 404);
    return sendSuccess(res, room, "Room fetched successfully");
  } catch (error) {
    return sendError(res, error.message);
  }
};

// GET /api/rooms/floor/:floorNum
const getFloorRooms = async (req, res) => {
  try {
    const rooms = await Room.findAll({
      where: { floor: req.params.floorNum },
      include: [{ model: Device, as: "devices",
        attributes: ["id", "device_id", "type", "status"] }],
      order: [["room_number", "ASC"]],
    });

    return sendSuccess(res, rooms, `Rooms on floor ${req.params.floorNum}`);
  } catch (error) {
    return sendError(res, error.message);
  }
};

// PUT /api/rooms/:id
const updateRoom = async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id);
    if (!room) return sendError(res, "Room not found", 404);

    const { status, occupancy, building } = req.body;
    const updateData = {};
    if (status) updateData.status = status;
    if (occupancy) updateData.occupancy = occupancy;
    if (building) updateData.building = building;

    await room.update(updateData);
    return sendSuccess(res, room, "Room updated successfully");
  } catch (error) {
    return sendError(res, error.message);
  }
};

// DELETE /api/rooms/:id
const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id);
    if (!room) return sendError(res, "Room not found", 404);

    const deviceCount = await Device.count({ where: { room_id: req.params.id } });
    if (deviceCount > 0) {
      return sendError(res, `Cannot delete. This room has ${deviceCount} device(s) linked to it. Remove devices first.`, 400);
    }

    await room.destroy();
    return sendSuccess(res, null, "Room deleted successfully");
  } catch (error) {
    return sendError(res, error.message);
  }
};

module.exports = {
  createRoom, getAllRooms, getRoomById,
  getFloorRooms, updateRoom, deleteRoom
};