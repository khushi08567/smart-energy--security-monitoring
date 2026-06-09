const devices = [
  { device_id: "ROOM-101-ENERGY", room_id: 1, type: "energy", unit: "kWh" },
  { device_id: "ROOM-101-MOTION", room_id: 1, type: "motion" },
  { device_id: "ROOM-101-DOOR",   room_id: 1, type: "door" },
  { device_id: "ROOM-102-ENERGY", room_id: 2, type: "energy", unit: "kWh" },
  { device_id: "ROOM-201-TEMP",   room_id: 3, type: "temperature", unit: "celsius" },
];

const API_URL = "http://localhost:5000/api/sensors/data";

function generateValue(type) {
  switch (type) {
    case "energy":      return parseFloat((Math.random() * 5 + 0.5).toFixed(2));
    case "motion":      return Math.random() > 0.4;
    case "door":        return Math.random() > 0.7 ? "open" : "closed";
    case "temperature": return parseFloat((Math.random() * 10 + 20).toFixed(1));
    default:            return null;
  }
}

async function sendReading(device) {
  const body = {
    device_id: device.device_id,
    room_id:   device.room_id,
    type:      device.type,
    value:     generateValue(device.type),
    unit:      device.unit || null,
  };

  try {
    const res = await fetch(API_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });
    const data = await res.json();
    if (data.success) {
      console.log(`[${new Date().toLocaleTimeString()}] ${device.device_id} → ${body.value} ${body.unit || ""}`);
    }
  } catch (err) {
    console.error(`Failed to send ${device.device_id}:`, err.message);
  }
}

async function runSimulator() {
  console.log("Simulator started — sending data every 5 seconds...");
  console.log("Make sure your server is running on port 5000\n");

  // Send first batch immediately
  for (const device of devices) await sendReading(device);

  // Then repeat every 5 seconds
  setInterval(async () => {
    for (const device of devices) await sendReading(device);
  }, 5000);
}

runSimulator();