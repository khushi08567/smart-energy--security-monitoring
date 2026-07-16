const API_BASE = process.env.API_BASE || "http://localhost:5000/api";

let devices = [];
let token = null;
let cycleCount = 0;

// ── Value generators ──────────────────────────────────────────
function generateValue(type, simulateSpike = false) {
  switch (type) {
    case "energy":
      return simulateSpike
        ? parseFloat((Math.random() * 10 + 10).toFixed(2))  // spike: 10-20 kWh
        : parseFloat((Math.random() * 3 + 0.5).toFixed(2)); // normal: 0.5-3.5 kWh
    case "motion":
      return Math.random() > 0.6; // 40% chance of motion
    case "door":
      return Math.random() > 0.8 ? "open" : "closed"; // 20% chance open
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
    room_id: device.room_id || device.room?.id,
    type: device.type,
    value,
    unit: device.type === "energy" ? "kWh" : null,
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
        `[${new Date().toLocaleTimeString()}] ${device.device_id} → ${value} ${body.unit || ""}${spikeLabel}`
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
        room_id: device.room_id || device.room?.id,
        event_type: eventType,
        description,
      }),
    });
    const data = await res.json();
    if (data.success) {
      console.log(`🚨 Security event: ${eventType} in Room ID ${device.room_id}`);
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
        email: "admin@smartmonitor.com",
        password: "admin123",
      }),
    });
    const data = await res.json();
    if (data.token) {
      console.log("✅ Simulator logged in as Admin");
      return data.token;
    }
    console.warn("⚠️ Could not get auth token — security events won't fire");
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
async function runCycle() {
  cycleCount++;
  console.log(`\n── Cycle ${cycleCount} ──────────────────────────────`);

  for (const device of devices) {
    const roomNum = device.room?.room_number || String(device.room_id);
    const simulateSpike = device.type === "energy"
      && roomNum === "102"
      && cycleCount % 10 === 0;

    const result = await sendReading(device, { simulateSpike });

    if (!result || !token) continue;

    const { value } = result;

    // Security event triggers
    if (device.type === "motion" && value === true && isNightTime()) {
      await triggerSecurityEvent(
        device,
        "night_motion",
        `Motion detected in Room ${roomNum} during night hours`,
        token
      );
    }

    if (device.type === "door" && value === "open" && isNightTime()) {
      await triggerSecurityEvent(
        device,
        "unauthorized_entry",
        `Door opened in Room ${roomNum} during restricted hours`,
        token
      );
    }

    if (simulateSpike && value > 8) {
      await triggerSecurityEvent(
        device,
        "unauthorized_entry",
        `Energy spike detected in Room ${roomNum}: ${value} kWh (abnormal)`,
        token
      );
      console.log(`⚡ Energy spike triggered for Room ${roomNum}: ${value} kWh`);
    }
  }
}

// ── Start simulator ───────────────────────────────────────────
async function startSimulator() {
  console.log("🚀 Smart Energy & Security Simulator");
  console.log("────────────────────────────────────");

  token = await getAuthToken();
  
  // Fetch active devices from database
  try {
    const res = await fetch(`${API_BASE}/dashboard/device-health`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const data = await res.json();
    if (data.success && data.data?.devices) {
      devices = data.data.devices.filter(d => d.status === "active");
      console.log(`📡 Dynamically loaded ${devices.length} active devices from database.`);
    }
  } catch (err) {
    console.error("Failed to load devices dynamically, falling back to static list:", err.message);
  }

  if (devices.length === 0) {
    console.log("⚠️ Fallback to default devices.");
    devices = [
      { device_id: "ROOM-101-PLUG", room_id: 1, type: "energy", unit: "kWh" },
      { device_id: "ROOM-102-PLUG", room_id: 2, type: "energy", unit: "kWh" },
    ];
  }

  console.log("Sending data every 5 seconds...");
  console.log("Security events trigger automatically");
  console.log("Energy spikes simulate every 10 cycles for Room 102\n");

  await runCycle();
  setInterval(runCycle, 5000);
}

startSimulator();