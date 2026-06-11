const SensorData = require("../models/SensorData");
const EnergyReport = require("../models/EnergyReport");
const Room = require("../models/Room");
const { sendSuccess, sendError } = require("../utils/response");

const getDayRange = (dateStr) => {
  const start = new Date(dateStr);
  start.setHours(0, 0, 0, 0);
  const end = new Date(dateStr);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// GET /api/energy/summary/:roomId?date=YYYY-MM-DD
const getRoomDailySummary = async (req, res) => {
  try {
    const { roomId } = req.params;
    const date = req.query.date || new Date().toISOString().split("T")[0];
    const { start, end } = getDayRange(date);

    const readings = await SensorData.find({
      room_id: parseInt(roomId),
      type: "energy",
      timestamp: { $gte: start, $lte: end },
    });

    if (readings.length === 0) {
      return sendSuccess(res, { room_id: parseInt(roomId), date, total_kwh: 0, average_kwh: 0, peak_kwh: 0, reading_count: 0 }, "No energy data for this date");
    }

    const values = readings.map((r) => parseFloat(r.value));
    const total = values.reduce((a, b) => a + b, 0);
    const average = total / values.length;
    const peak = Math.max(...values);

    return sendSuccess(res, {
      room_id: parseInt(roomId), date,
      total_kwh: parseFloat(total.toFixed(2)),
      average_kwh: parseFloat(average.toFixed(2)),
      peak_kwh: parseFloat(peak.toFixed(2)),
      reading_count: readings.length,
    }, "Daily energy summary");
  } catch (error) {
    return sendError(res, error.message);
  }
};

// GET /api/energy/compare?floor=1&date=YYYY-MM-DD
const compareRoomsByFloor = async (req, res) => {
  try {
    const floor = parseInt(req.query.floor) || 1;
    const date = req.query.date || new Date().toISOString().split("T")[0];
    const { start, end } = getDayRange(date);

    const rooms = await Room.findAll({ where: { floor } });
    if (rooms.length === 0) return sendError(res, "No rooms found on this floor", 404);

    const roomIds = rooms.map((r) => r.id);

    const results = await SensorData.aggregate([
      { $match: { room_id: { $in: roomIds }, type: "energy", timestamp: { $gte: start, $lte: end } } },
      { $group: { _id: "$room_id", total_kwh: { $sum: { $toDouble: "$value" } }, reading_count: { $sum: 1 } } },
      { $sort: { total_kwh: -1 } },
    ]);

    const comparison = rooms.map((room) => {
      const data = results.find((r) => r._id === room.id);
      return {
        room_id: room.id, room_number: room.room_number, floor: room.floor,
        total_kwh: data ? parseFloat(data.total_kwh.toFixed(2)) : 0,
        reading_count: data ? data.reading_count : 0,
      };
    }).sort((a, b) => b.total_kwh - a.total_kwh);

    return sendSuccess(res, { floor, date, rooms: comparison }, "Floor energy comparison");
  } catch (error) {
    return sendError(res, error.message);
  }
};

// GET /api/energy/anomalies?date=YYYY-MM-DD
const detectAnomalies = async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split("T")[0];
    const { start, end } = getDayRange(date);

    const results = await SensorData.aggregate([
      { $match: { type: "energy", timestamp: { $gte: start, $lte: end } } },
      { $group: { _id: "$room_id", total_kwh: { $sum: { $toDouble: "$value" } } } },
    ]);

    if (results.length === 0) return sendSuccess(res, [], "No energy data found");

    const totalAll = results.reduce((a, b) => a + b.total_kwh, 0);
    const overallAverage = totalAll / results.length;
    const threshold = overallAverage * 2;

    const anomalies = results
      .filter((r) => r.total_kwh > threshold)
      .map((r) => ({
        room_id: r._id,
        total_kwh: parseFloat(r.total_kwh.toFixed(2)),
        average_kwh: parseFloat(overallAverage.toFixed(2)),
        times_over_average: parseFloat((r.total_kwh / overallAverage).toFixed(1)),
        reason: `Using ${(r.total_kwh / overallAverage).toFixed(1)}x the average energy`,
      }));

    return sendSuccess(res, {
      date, overall_average_kwh: parseFloat(overallAverage.toFixed(2)),
      anomaly_threshold_kwh: parseFloat(threshold.toFixed(2)),
      anomaly_count: anomalies.length, anomalies,
    }, anomalies.length > 0 ? "Anomalies detected!" : "No anomalies detected");
  } catch (error) {
    return sendError(res, error.message);
  }
};

// GET /api/energy/trend/:roomId?days=7
const getRoomTrend = async (req, res) => {
  try {
    const { roomId } = req.params;
    const days = parseInt(req.query.days) || 7;
    const trend = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const { start, end } = getDayRange(dateStr);

      const readings = await SensorData.find({
        room_id: parseInt(roomId), type: "energy",
        timestamp: { $gte: start, $lte: end },
      });

      const total = readings.reduce((a, r) => a + parseFloat(r.value), 0);
      trend.push({ date: dateStr, total_kwh: parseFloat(total.toFixed(2)), reading_count: readings.length });
    }

    return sendSuccess(res, { room_id: parseInt(roomId), days, trend }, `${days}-day energy trend`);
  } catch (error) {
    return sendError(res, error.message);
  }
};

// GET /api/energy/monthly/:roomId?month=2026-06
const getMonthlyReport = async (req, res) => {
  try {
    const { roomId } = req.params;
    const monthStr = req.query.month || new Date().toISOString().slice(0, 7);
    const [year, month] = monthStr.split("-").map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const readings = await SensorData.find({
      room_id: parseInt(roomId), type: "energy",
      timestamp: { $gte: start, $lte: end },
    });

    const total = readings.reduce((a, r) => a + parseFloat(r.value), 0);
    const average = readings.length > 0 ? total / readings.length : 0;
    const peak = readings.length > 0 ? Math.max(...readings.map((r) => parseFloat(r.value))) : 0;

    return sendSuccess(res, {
      room_id: parseInt(roomId), month: monthStr,
      total_kwh: parseFloat(total.toFixed(2)),
      average_kwh: parseFloat(average.toFixed(2)),
      peak_kwh: parseFloat(peak.toFixed(2)),
      reading_count: readings.length,
    }, "Monthly energy report");
  } catch (error) {
    return sendError(res, error.message);
  }
};

// GET /api/energy/bill/:roomId?month=2026-06&rate=8
const calculateBill = async (req, res) => {
  try {
    const { roomId } = req.params;
    const monthStr = req.query.month || new Date().toISOString().slice(0, 7);
    const ratePerKwh = parseFloat(req.query.rate) || 8;
    const [year, month] = monthStr.split("-").map(Number);
    const now = new Date();
    const start = new Date(year, month - 1, 1);
    const end = now < new Date(year, month, 0) ? now : new Date(year, month, 0, 23, 59, 59);

    const readings = await SensorData.find({
      room_id: parseInt(roomId), type: "energy",
      timestamp: { $gte: start, $lte: end },
    });

    const usedSoFar = readings.reduce((a, r) => a + parseFloat(r.value), 0);
    const daysElapsed = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const totalDays = new Date(year, month, 0).getDate();
    const projectedTotal = daysElapsed > 0 ? (usedSoFar / daysElapsed) * totalDays : 0;

    return sendSuccess(res, {
      room_id: parseInt(roomId), month: monthStr, rate_per_kwh: ratePerKwh,
      days_elapsed: daysElapsed, total_days: totalDays,
      kwh_used_so_far: parseFloat(usedSoFar.toFixed(2)),
      projected_total_kwh: parseFloat(projectedTotal.toFixed(2)),
      bill_so_far: parseFloat((usedSoFar * ratePerKwh).toFixed(2)),
      projected_bill: parseFloat((projectedTotal * ratePerKwh).toFixed(2)),
      currency: "INR",
    }, "Bill estimate");
  } catch (error) {
    return sendError(res, error.message);
  }
};

module.exports = { getRoomDailySummary, compareRoomsByFloor, detectAnomalies, getRoomTrend, getMonthlyReport, calculateBill };
