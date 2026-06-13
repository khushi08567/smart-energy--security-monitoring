const SensorData = require("../models/SensorData");
const SecurityEvent = require("../models/SecurityEvent");
const Notification = require("../models/Notification");
const EnergyReport = require("../models/EnergyReport");
const Room = require("../models/Room");
const Device = require("../models/Device");
const User = require("../models/User");
const { sendSuccess, sendError } = require("../utils/response");

// GET /api/dashboard/overview
// Total counts — rooms, devices, users, alerts
const getOverview = async (req, res) => {
  try {
    const totalRooms = await Room.count();
    const totalDevices = await Device.count();
    const totalUsers = await User.count();
    const activeDevices = await Device.count({ where: { status: "active" } });
    const offlineDevices = await Device.count({ where: { status: "offline" } });
    const occupiedRooms = await Room.count({ where: { occupancy: "occupied" } });

    const unresolvedAlerts = await SecurityEvent.countDocuments({ resolved: false });
    const criticalAlerts = await SecurityEvent.countDocuments({
      severity: "Critical", resolved: false
    });
    const unreadNotifications = await Notification.countDocuments({ is_read: false });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEvents = await SecurityEvent.countDocuments({
      timestamp: { $gte: today }
    });

    return sendSuccess(res, {
      rooms: {
        total: totalRooms,
        occupied: occupiedRooms,
        vacant: totalRooms - occupiedRooms,
      },
      devices: {
        total: totalDevices,
        active: activeDevices,
        offline: offlineDevices,
        inactive: totalDevices - activeDevices - offlineDevices,
      },
      users: {
        total: totalUsers,
      },
      security: {
        unresolved_alerts: unresolvedAlerts,
        critical_alerts: criticalAlerts,
        events_today: todayEvents,
      },
      notifications: {
        unread: unreadNotifications,
      },
    }, "Dashboard overview");
  } catch (error) {
    return sendError(res, error.message);
  }
};

// GET /api/dashboard/live-status
// Current energy + occupancy status per room
const getLiveStatus = async (req, res) => {
  try {
    const rooms = await Room.findAll({
      include: [{
        model: Device,
        as: "devices",
        attributes: ["id", "device_id", "type", "status", "last_seen"],
      }],
      order: [["floor", "ASC"], ["room_number", "ASC"]],
    });

    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);

    const roomStatus = await Promise.all(
      rooms.map(async (room) => {
        // Latest energy reading
        const energyReading = await SensorData.findOne({
          room_id: room.id,
          type: "energy",
        }).sort({ timestamp: -1 });

        // Latest motion reading
        const motionReading = await SensorData.findOne({
          room_id: room.id,
          type: "motion",
        }).sort({ timestamp: -1 });

        // Latest door reading
        const doorReading = await SensorData.findOne({
          room_id: room.id,
          type: "door",
        }).sort({ timestamp: -1 });

        // Latest temperature reading
        const tempReading = await SensorData.findOne({
          room_id: room.id,
          type: "temperature",
        }).sort({ timestamp: -1 });

        // Check if room has active unresolved alert
        const activeAlert = await SecurityEvent.findOne({
          room_id: room.id,
          resolved: false,
        }).sort({ timestamp: -1 });

        return {
          room_id: room.id,
          room_number: room.room_number,
          floor: room.floor,
          building: room.building,
          status: room.status,
          occupancy: room.occupancy,
          device_count: room.devices.length,
          sensors: {
            energy: energyReading ? {
              value: energyReading.value,
              unit: "kWh",
              timestamp: energyReading.timestamp,
            } : null,
            motion: motionReading ? {
              value: motionReading.value,
              timestamp: motionReading.timestamp,
            } : null,
            door: doorReading ? {
              value: doorReading.value,
              timestamp: doorReading.timestamp,
            } : null,
            temperature: tempReading ? {
              value: tempReading.value,
              unit: "°C",
              timestamp: tempReading.timestamp,
            } : null,
          },
          active_alert: activeAlert ? {
            event_type: activeAlert.event_type,
            severity: activeAlert.severity,
            timestamp: activeAlert.timestamp,
          } : null,
        };
      })
    );

    return sendSuccess(res, {
      total_rooms: rooms.length,
      last_updated: new Date(),
      rooms: roomStatus,
    }, "Live status fetched");
  } catch (error) {
    return sendError(res, error.message);
  }
};

// GET /api/dashboard/recent-alerts
// Last 10 unresolved security events
const getRecentAlerts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const alerts = await SecurityEvent.find({ resolved: false })
      .sort({ timestamp: -1 })
      .limit(limit);

    const critical = alerts.filter((a) => a.severity === "Critical").length;
    const high = alerts.filter((a) => a.severity === "High").length;

    return sendSuccess(res, {
      total_unresolved: alerts.length,
      critical,
      high,
      alerts,
    }, "Recent alerts fetched");
  } catch (error) {
    return sendError(res, error.message);
  }
};

// GET /api/dashboard/device-health
// Online/offline/degraded device count + list
const getDeviceHealth = async (req, res) => {
  try {
    const devices = await Device.findAll({
      include: [{
        model: Room,
        as: "room",
        attributes: ["room_number", "floor"],
      }],
    });

    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const enriched = devices.map((device) => {
      let health = "healthy";
      if (!device.last_seen) {
        health = "unknown";
      } else if (device.last_seen < oneDayAgo) {
        health = "offline";
      } else if (device.last_seen < thirtyMinAgo) {
        health = "degraded";
      }

      return {
        id: device.id,
        device_id: device.device_id,
        device_name: device.device_name,
        type: device.type,
        status: device.status,
        health,
        last_seen: device.last_seen,
        room: device.room,
      };
    });

    const summary = {
      total: enriched.length,
      healthy: enriched.filter((d) => d.health === "healthy").length,
      degraded: enriched.filter((d) => d.health === "degraded").length,
      offline: enriched.filter((d) => d.health === "offline").length,
      unknown: enriched.filter((d) => d.health === "unknown").length,
    };

    return sendSuccess(res, {
      summary,
      devices: enriched,
    }, "Device health status");
  } catch (error) {
    return sendError(res, error.message);
  }
};

// GET /api/dashboard/building-summary
// Energy + security stats per floor
const getBuildingSummary = async (req, res) => {
  try {
    const rooms = await Room.findAll();
    const floors = [...new Set(rooms.map((r) => r.floor))].sort();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const floorSummaries = await Promise.all(
      floors.map(async (floor) => {
        const floorRooms = rooms.filter((r) => r.floor === floor);
        const floorRoomIds = floorRooms.map((r) => r.id);

        // Energy today for this floor
        const energyData = await SensorData.aggregate([
          {
            $match: {
              room_id: { $in: floorRoomIds },
              type: "energy",
              timestamp: { $gte: today, $lt: tomorrow },
            },
          },
          {
            $group: {
              _id: null,
              total_kwh: { $sum: { $toDouble: "$value" } },
            },
          },
        ]);

        // Security events today for this floor
        const securityCount = await SecurityEvent.countDocuments({
          room_id: { $in: floorRoomIds },
          timestamp: { $gte: today },
        });

        const unresolvedCount = await SecurityEvent.countDocuments({
          room_id: { $in: floorRoomIds },
          resolved: false,
        });

        const occupiedCount = floorRooms.filter(
          (r) => r.occupancy === "occupied"
        ).length;

        return {
          floor,
          total_rooms: floorRooms.length,
          occupied_rooms: occupiedCount,
          vacant_rooms: floorRooms.length - occupiedCount,
          energy_today_kwh: energyData.length > 0
            ? parseFloat(energyData[0].total_kwh.toFixed(2)) : 0,
          security_events_today: securityCount,
          unresolved_alerts: unresolvedCount,
        };
      })
    );

    return sendSuccess(res, {
      total_floors: floors.length,
      total_rooms: rooms.length,
      date: today.toISOString().split("T")[0],
      floors: floorSummaries,
    }, "Building summary");
  } catch (error) {
    return sendError(res, error.message);
  }
};

module.exports = {
  getOverview,
  getLiveStatus,
  getRecentAlerts,
  getDeviceHealth,
  getBuildingSummary,
};