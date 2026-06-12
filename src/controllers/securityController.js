const SecurityEvent = require("../models/SecurityEvent");
const SensorData = require("../models/SensorData");
const Room = require("../models/Room");
const { sendSuccess, sendError } = require("../utils/response");

// Helper: check if time is night (10pm - 6am)
const isNightTime = (date = new Date()) => {
  const hour = date.getHours();
  return hour >= 22 || hour < 6;
};

// Helper: assign severity based on event type + time
const getSeverity = (eventType, atNight = false) => {
  if (eventType === "door_forced") return "Critical";
  if (eventType === "unauthorized_entry") return atNight ? "Critical" : "High";
  if (eventType === "night_motion") return "High";
  if (eventType === "door_open_too_long") return "Medium";
  if (eventType === "motion_detected") return atNight ? "Medium" : "Low";
  return "Low";
};

// POST /api/security/event — log a security event manually
const logSecurityEvent = async (req, res) => {
  try {
    const { device_id, room_id, event_type, description } = req.body;

    if (!device_id || !room_id || !event_type || !description) {
      return sendError(res, "device_id, room_id, event_type, description are required", 400);
    }

    const atNight = isNightTime();
    const severity = getSeverity(event_type, atNight);

    const event = await SecurityEvent.create({
      device_id,
      room_id: parseInt(room_id),
      event_type,
      severity,
      description,
    });

    // Emit socket alert
    const io = req.app.get("io");
    if (io) {
      io.emit("security-alert", {
        event_id: event._id,
        room_id: event.room_id,
        event_type: event.event_type,
        severity: event.severity,
        description: event.description,
        timestamp: event.timestamp,
      });
    }

    return sendSuccess(res, event, "Security event logged", 201);
  } catch (error) {
    return sendError(res, error.message);
  }
};

// GET /api/security/events — list all events with filters
const getSecurityEvents = async (req, res) => {
  try {
    const {
      severity, event_type, resolved,
      room_id, from, to,
      limit = 50, page = 1
    } = req.query;

    const filter = {};
    if (severity) filter.severity = severity;
    if (event_type) filter.event_type = event_type;
    if (room_id) filter.room_id = parseInt(room_id);
    if (resolved !== undefined) filter.resolved = resolved === "true";
    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = new Date(from);
      if (to) filter.timestamp.$lte = new Date(to);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await SecurityEvent.countDocuments(filter);
    const events = await SecurityEvent.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return sendSuccess(res, {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      total_pages: Math.ceil(total / parseInt(limit)),
      events,
    }, "Security events fetched");
  } catch (error) {
    return sendError(res, error.message);
  }
};

// GET /api/security/events/:id — get one event
const getSecurityEventById = async (req, res) => {
  try {
    const event = await SecurityEvent.findById(req.params.id);
    if (!event) return sendError(res, "Security event not found", 404);
    return sendSuccess(res, event, "Security event fetched");
  } catch (error) {
    return sendError(res, error.message);
  }
};

// PUT /api/security/events/:id/resolve — mark event as resolved
const resolveSecurityEvent = async (req, res) => {
  try {
    const event = await SecurityEvent.findById(req.params.id);
    if (!event) return sendError(res, "Security event not found", 404);
    if (event.resolved) return sendError(res, "Event is already resolved", 400);

    event.resolved = true;
    event.resolved_at = new Date();
    event.resolved_by = req.user.id;
    await event.save();

    // Emit socket update
    const io = req.app.get("io");
    if (io) {
      io.emit("security-resolved", {
        event_id: event._id,
        room_id: event.room_id,
        resolved_by: req.user.id,
        resolved_at: event.resolved_at,
      });
    }

    return sendSuccess(res, event, "Security event resolved");
  } catch (error) {
    return sendError(res, error.message);
  }
};

// GET /api/security/unresolved — all unresolved events
const getUnresolvedEvents = async (req, res) => {
  try {
    const events = await SecurityEvent.find({ resolved: false })
      .sort({ severity: 1, timestamp: -1 });

    const counts = {
      Critical: events.filter((e) => e.severity === "Critical").length,
      High: events.filter((e) => e.severity === "High").length,
      Medium: events.filter((e) => e.severity === "Medium").length,
      Low: events.filter((e) => e.severity === "Low").length,
    };

    return sendSuccess(res, {
      total_unresolved: events.length,
      severity_breakdown: counts,
      events,
    }, "Unresolved security events");
  } catch (error) {
    return sendError(res, error.message);
  }
};

// GET /api/security/night-check — detect night-time motion
const checkNightMotion = async (req, res) => {
  try {
    const now = new Date();
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);

    if (!isNightTime(now)) {
      return sendSuccess(res, {
        is_night: false,
        message: "Night mode is inactive (10pm - 6am only)",
        current_hour: now.getHours(),
      }, "Not night time");
    }

    // Check for motion readings in last 30 minutes
    const motionReadings = await SensorData.find({
      type: "motion",
      value: true,
      timestamp: { $gte: thirtyMinAgo },
    });

    const alerts = [];
    for (const reading of motionReadings) {
      // Check if already logged
      const existing = await SecurityEvent.findOne({
        room_id: reading.room_id,
        event_type: "night_motion",
        timestamp: { $gte: thirtyMinAgo },
      });

      if (!existing) {
        const event = await SecurityEvent.create({
          device_id: reading.device_id,
          room_id: reading.room_id,
          event_type: "night_motion",
          severity: "High",
          description: `Night motion detected in room ${reading.room_id} at ${reading.timestamp}`,
        });
        alerts.push(event);
      }
    }

    return sendSuccess(res, {
      is_night: true,
      new_alerts_created: alerts.length,
      alerts,
    }, alerts.length > 0 ? "Night motion alerts created" : "No new night motion detected");
  } catch (error) {
    return sendError(res, error.message);
  }
};

// GET /api/security/stats — security statistics
const getSecurityStats = async (req, res) => {
  try {
    const total = await SecurityEvent.countDocuments();
    const unresolved = await SecurityEvent.countDocuments({ resolved: false });
    const critical = await SecurityEvent.countDocuments({ severity: "Critical" });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await SecurityEvent.countDocuments({
      timestamp: { $gte: today },
    });

    const byType = await SecurityEvent.aggregate([
      { $group: { _id: "$event_type", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const recentEvents = await SecurityEvent.find()
      .sort({ timestamp: -1 })
      .limit(5);

    return sendSuccess(res, {
      total_events: total,
      unresolved_events: unresolved,
      critical_events: critical,
      events_today: todayCount,
      by_event_type: byType,
      recent_events: recentEvents,
    }, "Security statistics");
  } catch (error) {
    return sendError(res, error.message);
  }
};

module.exports = {
  logSecurityEvent,
  getSecurityEvents,
  getSecurityEventById,
  resolveSecurityEvent,
  getUnresolvedEvents,
  checkNightMotion,
  getSecurityStats,
};