const devices = [
  { device_id: "ROOM-101-ENERGY",  room_id: 1, type: "energy",      unit: "kWh" },
  { device_id: "ROOM-101-MOTION",  room_id: 1, type: "motion" },
  { device_id: "ROOM-101-DOOR",    room_id: 1, type: "door" },
  { device_id: "ROOM-102-ENERGY",  room_id: 2, type: "energy",      unit: "kWh" },
  { device_id: "ROOM-102-MOTION",  room_id: 2, type: "motion" },
  { device_id: "ROOM-102-DOOR",    room_id: 2, type: "door" },
  { device_id: "ROOM-201-ENERGY",  room_id: 3, type: "energy",      unit: "kWh" },
  { device_id: "ROOM-201-TEMP",    room_id: 3, type: "temperature",  unit: "celsius" },
  { device_id: "ROOM-201-MOTION",  room_id: 3, type: "motion" },
];

const API_BASE = "http://localhost:5000/api";

// ── Value generators ──────────────────────────────────────────
function generateValue(type, simulateSpike = false) {
  switch (type) {
    case "energy":
      // Occasionally simulate a spike (3x normal usage)
      return simulateSpike
        ? parseFloat((Math.random() * 10 + 10).toFixed(2))  // spike: 10-20 kWh
        : parseFloat((Math.random() * 3 + 0.5).toFixed(2)); // normal: 0.5-3.5 kWh
    case "motion":
      return Math.random() > 0.4; // 60% chance of motion
    case "door":
      return Math.random() > 0.75 ? "open" : "closed"; // 25% chance open
    case "temperature":
      return parseFloat((Math.random() * 8 + 20).toFixed(1)); // 20-28°C
    default:
      return null;
  }
}

// ── Send sensor reading ───────────────────────────────────────
async function sendReading(device, options = {}) {
  const { simulateSpike = false } = options;
  const value = generateValue(device.type, simulateSpike);

  const body = {
    device_id: device.device_id,
    room_id: device.room_id,
    type: device.type,
    value,
    unit: device.unit || null,
  };

  try {
    const res = await fetch(`${API_BASE}/sensors/data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.success) {
      const spikeLabel = simulateSpike ? " ⚡ SPIKE" : "";
      console.log(
        `[${new Date().toLocaleTimeString()}] ${device.device_id} → ${value} ${device.unit || ""}${spikeLabel}`
      );
    }
    return { value, device };
  } catch (err) {
    console.error(`Failed to send ${device.device_id}:`, err.message);
    return null;
  }
}

// ── Trigger security event ────────────────────────────────────
async function triggerSecurityEvent(device, eventType, description, token) {
  try {
    const res = await fetch(`${API_BASE}/security/event`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        device_id: device.device_id,
        room_id: device.room_id,
        event_type: eventType,
        description,
      }),
    });
    const data = await res.json();
    if (data.success) {
      console.log(`🚨 Security event: ${eventType} in room ${device.room_id}`);
    }
  } catch (err) {
    console.error("Failed to trigger security event:", err.message);
  }
}

// ── Login and get token ───────────────────────────────────────
async function getAuthToken() {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "khushipathak.080@gmail.com",
        password: "123456",
      }),
    });
    const data = await res.json();
    if (data.token) {
      console.log("✅ Simulator logged in as Admin");
      return data.token;
    }
    console.warn("⚠️ Could not get auth token — security events won't fire");
    console.warn("Make sure admin@test.com / pass123 exists in your DB");
    return null;
  } catch (err) {
    console.error("Login failed:", err.message);
    return null;
  }
}

// ── Check if night time (10pm - 6am) ─────────────────────────
function isNightTime() {
  const hour = new Date().getHours();
  return hour >= 22 || hour < 6;
}

// ── Main simulator loop ───────────────────────────────────────
let cycleCount = 0;

async function runCycle(token) {
  cycleCount++;
  console.log(`\n── Cycle ${cycleCount} ──────────────────────────────`);

  for (const device of devices) {
    // Simulate energy spike every 10 cycles for room 2
    const simulateSpike = device.type === "energy"
      && device.room_id === 2
      && cycleCount % 10 === 0;

    const result = await sendReading(device, { simulateSpike });

    if (!result || !token) continue;

    const { value } = result;

    // ── Security event triggers ──────────────────────────────

    // 1. Night motion detection
    if (device.type === "motion" && value === true && isNightTime()) {
      await triggerSecurityEvent(
        device,
        "night_motion",
        `Motion detected in room ${device.room_id} during night hours`,
        token
      );
    }

    // 2. Door open at night
    if (device.type === "door" && value === "open" && isNightTime()) {
      await triggerSecurityEvent(
        device,
        "unauthorized_entry",
        `Door opened in room ${device.room_id} during restricted hours`,
        token
      );
    }

    // 3. Energy spike alert (every 10 cycles for room 2)
    if (simulateSpike && value > 8) {
      await triggerSecurityEvent(
        device,
        "unauthorized_entry",
        `Energy spike detected in room ${device.room_id}: ${value} kWh (abnormal)`,
        token
      );
      console.log(`⚡ Energy spike triggered for room ${device.room_id}: ${value} kWh`);
    }

    // 4. Random door forced event (every 20 cycles, 30% chance)
    if (device.type === "door" && cycleCount % 20 === 0 && Math.random() > 0.7) {
      await triggerSecurityEvent(
        device,
        "door_forced",
        `Possible forced entry detected on door sensor in room ${device.room_id}`,
        token
      );
    }
  }
}

// ── Start simulator ───────────────────────────────────────────
async function startSimulator() {
  console.log("🚀 Smart Energy & Security Simulator");
  console.log("────────────────────────────────────");
  console.log("Sending data every 5 seconds...");
  console.log("Security events trigger automatically");
  console.log("Energy spikes simulate every 10 cycles for room 2\n");

  // Get auth token for security events
  const token = await getAuthToken();

  // First cycle immediately
  await runCycle(token);

  // Then every 5 seconds
  setInterval(() => runCycle(token), 5000);
}

startSimulator();