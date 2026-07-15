const SensorData = require("../models/SensorData");
const SecurityEvent = require("../models/SecurityEvent");
const Room = require("../models/Room");
const Device = require("../models/Device");
const AuditLog = require("../models/AuditLog");
const { sendDigestEmail } = require("../utils/emailHelper");
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
    }, "security hotspots analysis");
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

    // Audit log this export
    await AuditLog.create({
      userId: req.user.id,
      email: req.user.email,
      action: "EXPORT_CSV",
      details: `Exported monthly CSV report for type '${type}', period: ${monthStr}`,
    });

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

// GET /api/analytics/audit-logs
// Admin-only view of console actions
const getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100);
    return sendSuccess(res, logs, "Audit logs fetched successfully");
  } catch (error) {
    return sendError(res, error.message);
  }
};

// POST /api/analytics/email-digest
// Dispatches weekly energy + security digest
const triggerEmailDigest = async (req, res) => {
  try {
    const recipient = req.user.email;
    if (!recipient) {
      return sendError(res, "No email address found for this user account", 400);
    }

    const days = 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Aggregate statistics
    const energyResult = await SensorData.aggregate([
      { $match: { type: "energy", timestamp: { $gte: since } } },
      { $group: { _id: null, total: { $sum: { $toDouble: "$value" } } } },
    ]);

    const totalReadings = await SensorData.countDocuments({ timestamp: { $gte: since } });
    const totalEvents = await SecurityEvent.countDocuments({ timestamp: { $gte: since } });
    const resolvedEvents = await SecurityEvent.countDocuments({ timestamp: { $gte: since }, resolved: true });

    const totalKwh = energyResult.length > 0 ? energyResult[0].total : 0;
    const estimatedCost = totalKwh * 8.0;

    const html = `
      <div style="font-family: 'Outfit', -apple-system, sans-serif; background-color: #f8fafc; padding: 32px; color: #0f172a;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 32px; color: #ffffff; text-align: center;">
            <span style="font-size: 40px;">⚡</span>
            <h1 style="margin: 12px 0 4px 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Campus Monitor Portal</h1>
            <p style="margin: 0; font-size: 14px; opacity: 0.85;">Weekly Energy & Security Performance Digest</p>
          </div>
          
          <!-- Body -->
          <div style="padding: 32px;">
            <p style="margin-top: 0; font-size: 15px; line-height: 1.5; color: #475569;">
              Hello <strong>${req.user.role}</strong>, here is the automated digest overview of the Smart Monitoring system activities over the past <strong>${days} days</strong>.
            </p>
            
            <h3 style="border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 32px; font-size: 15px; text-transform: uppercase; color: #1e3a8a; letter-spacing: 0.5px;">⚡ Energy Telemetry Summary</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 12px;">
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Aggregate Power Consumption</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #3b82f6;">${totalKwh.toFixed(2)} kWh</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Estimated Electricity Cost</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #0f172a;">${estimatedCost.toFixed(2)} INR</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Active Sensors Telemetry Count</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #64748b;">${totalReadings} packets</td>
              </tr>
            </table>

            <h3 style="border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 32px; font-size: 15px; text-transform: uppercase; color: #7f1d1d; letter-spacing: 0.5px;">🚨 Security Incident Summary</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 12px;">
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Total Breaches Detected</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #ef4444;">${totalEvents} events</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Resolved / Cleared Incidents</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #10b981;">${resolvedEvents} incidents</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Current Active Breaches</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #f97316;">${totalEvents - resolvedEvents} critical cases</td>
              </tr>
            </table>

            <div style="margin-top: 40px; padding: 16px; background-color: #f1f5f9; border-radius: 8px; font-size: 12px; color: #64748b; line-height: 1.5; text-align: center;">
              This report was triggered on-demand via the Smart Monitor Console.
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px; text-align: center; font-size: 11px; color: #94a3b8;">
            © 2026 Smart Energy & Security Monitor. All rights reserved.
          </div>
        </div>
      </div>
    `;

    const result = await sendDigestEmail(recipient, `Smart Monitor Performance Summary Digest`, html);
    
    // Log email digest trigger event
    await AuditLog.create({
      userId: req.user.id,
      email: req.user.email,
      action: "SEND_EMAIL_DIGEST",
      details: `Dispatched Weekly Email Performance Digest to ${recipient}`,
    });

    return sendSuccess(res, {
      message: `Weekly Performance Digest successfully sent to ${recipient}!`,
      previewUrl: result.previewUrl || null,
    });
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
  getAuditLogs,
  triggerEmailDigest,
};