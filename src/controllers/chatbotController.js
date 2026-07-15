const SensorData = require("../models/SensorData");
const SecurityEvent = require("../models/SecurityEvent");
const Room = require("../models/Room");
const Device = require("../models/Device");
const { sendSuccess, sendError } = require("../utils/response");

const handleChatQuery = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return sendError(res, "Query is required", 400);
    }

    const user = req.user; // Decoded by verifyToken middleware
    const role = user.role;
    const wardenFloor = role === "Warden" 
      ? (user.email.match(/\d+/) ? parseInt(user.email.match(/\d+/)[0]) : 1)
      : null;

    const lowerQuery = query.toLowerCase();

    // Predefined supported intents and target extraction
    let intent = null;
    let target = null;

    if (lowerQuery.includes("navigate") || lowerQuery.includes("go to") || lowerQuery.includes("open") || lowerQuery.includes("show") || lowerQuery.includes("view")) {
      if (lowerQuery.includes("alert") || lowerQuery.includes("incident") || lowerQuery.includes("security") || lowerQuery.includes("breach")) {
        intent = "navigate";
        target = "alerts";
      } else if (lowerQuery.includes("live") || lowerQuery.includes("chart") || lowerQuery.includes("analytics") || lowerQuery.includes("plot")) {
        intent = "navigate";
        target = "live";
      } else if (lowerQuery.includes("room") || lowerQuery.includes("directory")) {
        intent = "navigate";
        target = "rooms";
      } else if (lowerQuery.includes("device") || lowerQuery.includes("health") || lowerQuery.includes("diagnostic") || lowerQuery.includes("hardware")) {
        intent = "navigate";
        target = "devices";
      } else if (lowerQuery.includes("admin") || lowerQuery.includes("control") || lowerQuery.includes("setting")) {
        intent = "navigate";
        target = "admin";
      } else if (lowerQuery.includes("doc") || lowerQuery.includes("architecture") || lowerQuery.includes("about")) {
        intent = "navigate";
        target = "/docs";
      } else if (lowerQuery.includes("overview") || lowerQuery.includes("summary") || lowerQuery.includes("console")) {
        intent = "navigate";
        target = "overview";
      }
    }

    if (lowerQuery.includes("filter") || lowerQuery.includes("floor")) {
      const match = lowerQuery.match(/floor\s*(\d+)/);
      if (match) {
        intent = "filter";
        target = match[1];
      }
    }

    if (lowerQuery.includes("download") || lowerQuery.includes("export") || lowerQuery.includes("print")) {
      if (lowerQuery.includes("csv")) {
        intent = "export";
        target = "csv";
      } else if (lowerQuery.includes("pdf") || lowerQuery.includes("print")) {
        intent = "export";
        target = "pdf";
      }
    }

    // Role-based constraints validation on parsed intent target
    if (role === "Warden" && wardenFloor) {
      if (intent === "filter" && parseInt(target) !== wardenFloor) {
        return sendSuccess(res, {
          response: `🔒 Access Denied. As Warden of Floor ${wardenFloor}, you can only filter and query details for Floor ${wardenFloor}.`,
          intent: null,
          target: null
        }, "Chatbot query handled");
      }
    }

    if (role !== "Admin" && intent === "navigate" && target === "admin") {
      return sendSuccess(res, {
        response: `🔒 Access Denied. Only system administrators can access the Admin Controls dashboard.`,
        intent: null,
        target: null
      }, "Chatbot query handled");
    }

    if (role === "Viewer" && intent === "navigate" && target === "alerts") {
      return sendSuccess(res, {
        response: `🔒 Access Denied. As a Viewer, you do not have permission to view active security alerts.`,
        intent: null,
        target: null
      }, "Chatbot query handled");
    }

    // Gating rules for VIEWER role (No security queries allowed)
    const isSecurityQuery = lowerQuery.includes("security") || 
                            lowerQuery.includes("alert") || 
                            lowerQuery.includes("breach") || 
                            lowerQuery.includes("incident") || 
                            lowerQuery.includes("intrusion") || 
                            lowerQuery.includes("motion") || 
                            lowerQuery.includes("door");
    
    if (role === "Viewer" && isSecurityQuery) {
      return sendSuccess(res, {
        response: "🔒 Access Denied. As a Viewer, you do not have permission to query security alerts or surveillance timeline logs.",
        intent: null,
        target: null
      }, "Chatbot query handled");
    }

    // Gating and filtering for WARDEN (Floor filtering)
    const floorMatch = lowerQuery.match(/floor\s*(\d+)/);
    if (floorMatch) {
      const requestedFloor = parseInt(floorMatch[1]);
      if (wardenFloor && requestedFloor !== wardenFloor) {
        return sendSuccess(res, {
          response: `🔒 Access Denied. As Warden of Floor ${wardenFloor}, you can only query details for Floor ${wardenFloor}.`,
          intent: null,
          target: null
        }, "Chatbot query handled");
      }
    }

    // Check if query is asking for a specific room on another floor
    const roomMatch = lowerQuery.match(/room\s*(\d+)/);
    let targetedRoom = null;
    if (roomMatch) {
      const roomNum = roomMatch[1];
      targetedRoom = await Room.findOne({ where: { room_number: roomNum } });
      if (targetedRoom && wardenFloor && parseInt(targetedRoom.floor) !== wardenFloor) {
        return sendSuccess(res, {
          response: `🔒 Access Denied. Room ${roomNum} is located on Floor ${targetedRoom.floor}. As Warden of Floor ${wardenFloor}, you can only query room details on Floor ${wardenFloor}.`,
          intent: null,
          target: null
        }, "Chatbot query handled");
      }
    }

    // Get all rooms
    const rooms = await Room.findAll();
    const visibleRooms = rooms.filter(r => !wardenFloor || parseInt(r.floor) === wardenFloor);

    // ── SCENARIO A: SECURITY ALERTS ──
    if (isSecurityQuery) {
      const activeAlerts = await SecurityEvent.find({ resolved: false });
      const visibleAlerts = activeAlerts.filter(a => {
        if (!wardenFloor) return true;
        const roomObj = rooms.find(r => r.id === a.room_id || String(r.room_number) === String(a.room_id));
        return roomObj && parseInt(roomObj.floor) === wardenFloor;
      });

      if (visibleAlerts.length === 0) {
        return sendSuccess(res, {
          response: "✅ The campus is currently fully secure. No active security alerts or breaches detected.",
          intent,
          target
        }, "Chatbot query handled");
      } else {
        const list = visibleAlerts.map(a => `- Room ${a.room_id}: ${a.event_type.replace(/_/g, " ").toUpperCase()} (${a.severity} severity)`).join("\n");
        return sendSuccess(res, {
          response: `🚨 Active security alerts detected:\n${list}`,
          intent,
          target
        }, "Chatbot query handled");
      }
    }

    // ── SCENARIO B: ENERGY / POWER USAGE ──
    if (lowerQuery.includes("energy") || lowerQuery.includes("power") || lowerQuery.includes("usage") || lowerQuery.includes("kwh") || lowerQuery.includes("electricity") || lowerQuery.includes("watt")) {
      
      // B1. Specific room energy
      if (targetedRoom) {
        const latestEnergy = await SensorData.findOne({
          room_id: targetedRoom.id,
          type: "energy"
        }).sort({ timestamp: -1 });

        if (!latestEnergy) {
          return sendSuccess(res, {
            response: `🔌 Room ${targetedRoom.room_number} is registered, but no energy readings have been reported yet.`,
            intent,
            target
          }, "Chatbot query handled");
        }
        return sendSuccess(res, {
          response: `⚡ Current energy usage for Room ${targetedRoom.room_number} is **${latestEnergy.value} kWh** (Floor ${targetedRoom.floor}).`,
          intent,
          target
        }, "Chatbot query handled");
      }

      // B2. Specific floor energy
      if (floorMatch) {
        const requestedFloor = parseInt(floorMatch[1]);
        const floorRooms = rooms.filter(r => parseInt(r.floor) === requestedFloor);
        const floorRoomIds = floorRooms.map(r => r.id);

        let totalEnergy = 0;
        let activeSensors = 0;
        for (const roomId of floorRoomIds) {
          const reading = await SensorData.findOne({ room_id: roomId, type: "energy" }).sort({ timestamp: -1 });
          if (reading) {
            totalEnergy += parseFloat(reading.value);
            activeSensors++;
          }
        }

        return sendSuccess(res, {
          response: `⚡ Total live power draw on Floor ${requestedFloor} is **${totalEnergy.toFixed(2)} kWh** across ${activeSensors} sensor nodes.`,
          intent: "filter",
          target: String(requestedFloor)
        }, "Chatbot query handled");
      }

      // B3. General energy summary
      let totalEnergy = 0;
      let activeSensors = 0;
      for (const room of visibleRooms) {
        const reading = await SensorData.findOne({ room_id: room.id, type: "energy" }).sort({ timestamp: -1 });
        if (reading) {
          totalEnergy += parseFloat(reading.value);
          activeSensors++;
        }
      }

      const scopeText = wardenFloor ? `for Floor ${wardenFloor}` : "across the entire campus block";
      return sendSuccess(res, {
        response: `⚡ Current aggregate power consumption ${scopeText} is **${totalEnergy.toFixed(2)} kWh** across ${activeSensors} active IoT nodes.`,
        intent,
        target
      }, "Chatbot query handled");
    }

    // ── SCENARIO C: DEVICE HEALTH / OFFLINE DEVICES ──
    if (lowerQuery.includes("device") || lowerQuery.includes("hardware") || lowerQuery.includes("sensor") || lowerQuery.includes("node") || lowerQuery.includes("offline")) {
      const devices = await Device.findAll();
      const visibleDevices = devices.filter(d => {
        if (!wardenFloor) return true;
        const roomObj = rooms.find(r => r.id === d.room_id);
        return roomObj && parseInt(roomObj.floor) === wardenFloor;
      });

      const offline = visibleDevices.filter(d => d.status === "offline");
      const active = visibleDevices.filter(d => d.status === "active");

      const scopeText = wardenFloor ? `on Floor ${wardenFloor}` : "in the system";

      if (lowerQuery.includes("offline")) {
        if (offline.length === 0) {
          return sendSuccess(res, {
            response: `✅ All registered IoT hardware nodes ${scopeText} are currently **healthy and online**.`,
            intent,
            target
          }, "Chatbot query handled");
        }
        const offlineList = offline.map(d => `- ${d.device_name} (ID: ${d.device_id})`).join("\n");
        return sendSuccess(res, {
          response: `⚠️ There are **${offline.length} offline devices** ${scopeText}:\n${offlineList}`,
          intent,
          target
        }, "Chatbot query handled");
      }

      return sendSuccess(res, {
        response: `🔧 IoT Hardware Health Summary:\n- Total Nodes: ${visibleDevices.length}\n- Active/Online: ${active.length}\n- Offline/Degraded: ${offline.length}`,
        intent,
        target
      }, "Chatbot query handled");
    }

    // ── SCENARIO D: ROOM STATUS ──
    if (targetedRoom) {
      const occupancyText = targetedRoom.occupancy === "occupied" ? "Occupied" : "Vacant";
      const statusText = targetedRoom.status === "active" ? "Active" : "Inactive";
      
      const latestEnergy = await SensorData.findOne({ room_id: targetedRoom.id, type: "energy" }).sort({ timestamp: -1 });
      const energyInfo = latestEnergy ? `${latestEnergy.value} kWh` : "No readings yet";

      return sendSuccess(res, {
        response: `🏠 Status of Room ${targetedRoom.room_number}:\n- Floor: ${targetedRoom.floor}\n- Block: ${targetedRoom.building}\n- Occupancy: **${occupancyText}**\n- State: ${statusText}\n- Live Energy: **${energyInfo}**`,
        intent,
        target
      }, "Chatbot query handled");
    }

    // ── SCENARIO E: GENERAL STATUS / INTRO ──
    const scopeText = wardenFloor ? `Floor ${wardenFloor} Warden Console` : "Campus Management Portal";
    return sendSuccess(res, {
      response: `👋 Hello! I am the Smart Monitor AI Assistant. I can trigger actions based on your input:\n- "Go to security tab"\n- "Download report CSV"\n- "Print report PDF"\n- "Filter by floor 2"`,
      intent: null,
      target: null
    }, "Chatbot query handled");

  } catch (error) {
    return sendError(res, error.message);
  }
};

module.exports = { handleChatQuery };
