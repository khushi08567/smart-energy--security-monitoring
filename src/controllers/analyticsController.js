const SensorData = require("../models/SensorData");
const SecurityEvent = require("../models/SecurityEvent");
const Room = require("../models/Room");
const Device = require("../models/Device");
const { Parser } = require("json2csv");
const { sendSuccess, sendError } = require("../utils/response");

// GET /api/analytics/energy-leaderboard?date=YYYY-MM-DD
// Rooms ranked by energy efficiency
const getEnergyLeaderboard = async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split("T")[0];
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const results = await SensorData.aggregate([
      { $match: { type: "energy", timestamp: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: "$room_id",
          total_kwh: { $sum: { $toDouble: "$value" } },
          reading_count: { $sum: 1 },
        },
      },
      { $sort: { total_kwh: 1 } },
    ]);

    if (results.length === 0) {
      return sendSuccess(res, { most_efficient: [], least_efficient: [] },
        "No energy data available");
    }

    const enriched = await Promise.all(
      results.map(async (r) => {
        const room = await Room.findByPk(r._id);
        return {
          room_id: r._id,
          room_number: room ? room.room_number : "Unknown",
          floor: room ? room.floor : null,
          total_kwh: parseFloat(r.total_kwh.toFixed(2)),
          reading_count: r.reading_count,
          efficiency_rank: 0,
        };
      })
    );

    // Assign ranks
    enriched.forEach((r, i) => { r.efficiency_rank = i + 1; });

    return sendSuccess(res, {
      date,
      total_rooms: enriched.length,
      most_efficient: enriched.slice(0, 3),
      least_efficient: [...enriched].reverse().slice(0, 3),
      full_ranking: enriched,
    }, "Energy leaderboard");
  } catch (error) {
    return sendError(res, error.message);
  }
};

// GET /api/analytics/peak-hours?date=YYYY-MM-DD
// Which hours across all rooms use most energy
const getPeakHoursAll = async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split("T")[0];
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const results = await SensorData.aggregate([
      { $match: { type: "energy", timestamp: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { $hour: "$timestamp" },
          total_kwh: { $sum: { $toDouble: "$value" } },
          reading_count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const hours = results.map((r) => ({
      hour: r._id,
      hour_label: `${String(r._id).padStart(2, "0")}:00`,
      total_kwh: parseFloat(r.total_kwh.toFixed(2)),
      reading_count: r.reading_count,
    }));

    const peakHour = hours.length > 0
      ? hours.reduce((a, b) => a.total_kwh > b.total_kwh ? a : b)
      : null;

    const offPeakHour = hours.length > 0
      ? hours.reduce((a, b) => a.total_kwh < b.total_kwh ? a : b)
      : null;

    return sendSuccess(res, {
      date,
      peak_hour: peakHour,
      off_peak_hour: offPeakHour,
      hourly_breakdown: hours,
    }, "Peak hours analysis");
  } catch (error) {
    return sendError(res, error.message);
  }
};

// GET /api/analytics/security-hotspots
// Rooms with most security incidents
const getSecurityHotspots = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const since = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    const results = await SecurityEvent.aggregate([
      { $match: { timestamp: { $gte: since } } },
      {
        $group: {
          _id: "$room_id",
          total_events: { $sum: 1 },
          critical: {
            $sum: { $cond: [{ $eq: ["$severity", "Critical"] }, 1, 0] }
          },
          high: {
            $sum: { $cond: [{ $eq: ["$severity", "High"] }, 1, 0] }
          },
          unresolved: {
            $sum: { $cond: [{ $eq: ["$resolved", false] }, 1, 0] }
          },
        },
      },
      { $sort: { total_events: -1 } },
    ]);

    const enriched = await Promise.all(
      results.map(async (r) => {
        const room = await Room.findByPk(r._id);
        return {
          room_id: r._id,
          room_number: room ? room.room_number : "Unknown",
          floor: room ? room.floor : null,
          total_events: r.total_events,
          critical_events: r.critical,
          high_events: r.high,
          unresolved_events: r.unresolved,
          risk_level: r.critical > 0 ? "Critical"
            : r.high > 2 ? "High"
            : r.total_events > 5 ? "Medium" : "Low",
        };
      })
    );

    return sendSuccess(res, {
      period_days: parseInt(days),
      since: since.toISOString().split("T")[0],
      total_hotspots: enriched.length,
      hotspots: enriched,
    }, "Security hotspots analysis");
  } catch (error) {
    return sendError(res, error.message);
  }
};

// GET /api/analytics/export/monthly?month=2026-06&type=energy
// Export monthly report as CSV
const exportMonthlyCSV = async (req, res) => {
  try {
    const monthStr = req.query.month || new Date().toISOString().slice(0, 7);
    const type = req.query.type || "energy";
    const [year, month] = monthStr.split("-").map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const data = await SensorData.find({
      type,
      timestamp: { $gte: start, $lte: end },
    }).sort({ timestamp: 1 });

    if (data.length === 0) {
      return sendError(res, "No data found for this period", 404);
    }

    const rows = data.map((d) => ({
      device_id: d.device_id,
      room_id: d.room_id,
      type: d.type,
      value: d.value,
      unit: d.unit || "",
      timestamp: new Date(d.timestamp).toLocaleString(),
    }));

    const parser = new Parser({
      fields: ["device_id", "room_id", "type", "value", "unit", "timestamp"],
    });

    const csv = parser.parse(rows);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=report_${type}_${monthStr}.csv`
    );

    return res.send(csv);
  } catch (error) {
    return sendError(res, error.message);
  }
};

// GET /api/analytics/device-usage
// Which devices are most/least active
const getDeviceUsage = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const since = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    const results = await SensorData.aggregate([
      { $match: { timestamp: { $gte: since } } },
      {
        $group: {
          _id: "$device_id",
          reading_count: { $sum: 1 },
          last_reading: { $max: "$timestamp" },
          room_id: { $first: "$room_id" },
          type: { $first: "$type" },
        },
      },
      { $sort: { reading_count: -1 } },
    ]);

    const enriched = await Promise.all(
      results.map(async (r) => {
        const device = await Device.findOne({ where: { device_id: r._id } });
        return {
          device_id: r._id,
          device_name: device ? device.device_name : "Unknown",
          type: r.type,
          room_id: r.room_id,
          reading_count: r.reading_count,
          last_reading: r.last_reading,
          avg_readings_per_day: parseFloat(
            (r.reading_count / parseInt(days)).toFixed(1)
          ),
        };
      })
    );

    return sendSuccess(res, {
      period_days: parseInt(days),
      total_devices: enriched.length,
      most_active: enriched.slice(0, 5),
      least_active: [...enriched].reverse().slice(0, 5),
      all_devices: enriched,
    }, "Device usage analysis");
  } catch (error) {
    return sendError(res, error.message);
  }
};

// GET /api/analytics/summary
// Overall system analytics summary
const getAnalyticsSummary = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const since = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    // Total energy in period
    const energyResult = await SensorData.aggregate([
      { $match: { type: "energy", timestamp: { $gte: since } } },
      { $group: { _id: null, total: { $sum: { $toDouble: "$value" } } } },
    ]);

    // Total sensor readings
    const totalReadings = await SensorData.countDocuments({
      timestamp: { $gte: since },
    });

    // Security events
    const totalEvents = await SecurityEvent.countDocuments({
      timestamp: { $gte: since },
    });

    const resolvedEvents = await SecurityEvent.countDocuments({
      timestamp: { $gte: since },
      resolved: true,
    });

    // Most active room
    const activeRooms = await SensorData.aggregate([
      { $match: { timestamp: { $gte: since } } },
      { $group: { _id: "$room_id", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);

    const mostActiveRoom = activeRooms.length > 0
      ? await Room.findByPk(activeRooms[0]._id)
      : null;

    return sendSuccess(res, {
      period_days: parseInt(days),
      since: since.toISOString().split("T")[0],
      energy: {
        total_kwh: energyResult.length > 0
          ? parseFloat(energyResult[0].total.toFixed(2)) : 0,
        estimated_cost_inr: energyResult.length > 0
          ? parseFloat((energyResult[0].total * 8).toFixed(2)) : 0,
      },
      sensor_readings: {
        total: totalReadings,
        avg_per_day: parseFloat((totalReadings / parseInt(days)).toFixed(0)),
      },
      security: {
        total_events: totalEvents,
        resolved: resolvedEvents,
        unresolved: totalEvents - resolvedEvents,
        resolution_rate: totalEvents > 0
          ? `${((resolvedEvents / totalEvents) * 100).toFixed(1)}%` : "N/A",
      },
      most_active_room: mostActiveRoom ? {
        room_id: mostActiveRoom.id,
        room_number: mostActiveRoom.room_number,
        floor: mostActiveRoom.floor,
      } : null,
    }, "Analytics summary");
  } catch (error) {
    return sendError(res, error.message);
  }
};

module.exports = {
  getEnergyLeaderboard,
  getPeakHoursAll,
  getSecurityHotspots,
  exportMonthlyCSV,
  getDeviceUsage,
  getAnalyticsSummary,
};