require("dotenv").config();
const sequelize = require("./src/config/database");
const connectMongoDB = require("./src/config/mongoDb");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// SQL Models
const User = require("./src/models/User");
const Room = require("./src/models/Room");
const Device = require("./src/models/Device");

// MongoDB Models
const SensorData = require("./src/models/SensorData");
const SecurityEvent = require("./src/models/SecurityEvent");
const AuditLog = require("./src/models/AuditLog");
const ActiveSession = require("./src/models/ActiveSession");
const Notification = require("./src/models/Notification");

async function runSeed() {
  try {
    console.log("📡 Connecting databases...");
    await sequelize.authenticate();
    await connectMongoDB();
    console.log("🟢 Databases connected successfully.");

    // Sync SQL models (wipes previous tables)
    console.log("🗑️ Re-syncing database tables...");
    await sequelize.sync({ force: true });
    console.log("✅ SQL tables synchronized.");

    // Clear MongoDB collections
    console.log("🗑️ Clearing MongoDB documents...");
    await SensorData.deleteMany({});
    await SecurityEvent.deleteMany({});
    await AuditLog.deleteMany({});
    await ActiveSession.deleteMany({});
    await Notification.deleteMany({});
    console.log("✅ MongoDB collections cleared.");

    // 1. Seed User Accounts
    console.log("👤 Seeding roles and user credentials...");
    const hashedAdminPwd = await bcrypt.hash("admin123", 10);
    const hashedWardenPwd = await bcrypt.hash("warden123", 10);
    const hashedViewerPwd = await bcrypt.hash("viewer123", 10);

    const admin = await User.create({
      name: "Console Admin",
      email: "admin@smartmonitor.com",
      password: hashedAdminPwd,
      role: "Admin",
    });

    const warden = await User.create({
      name: "Floor 2 Warden",
      email: "warden2@smartmonitor.com",
      password: hashedWardenPwd,
      role: "Warden",
    });

    const viewer = await User.create({
      name: "Guest Viewer",
      email: "viewer@smartmonitor.com",
      password: hashedViewerPwd,
      role: "Viewer",
    });

    console.log("✅ Users populated (Admin, Warden, Viewer).");

    // 2. Seed Campus Rooms
    console.log("🏠 Seeding campus floor layouts...");
    const roomsData = [];
    for (let floor = 1; floor <= 3; floor++) {
      for (let rm = 1; rm <= 5; rm++) {
        const roomNumber = `${floor}0${rm}`;
        roomsData.push({
          room_number: roomNumber,
          floor: floor,
          building: "Main Block",
          status: "active",
          occupancy: rm % 2 === 0 ? "vacant" : "occupied",
        });
      }
    }
    const createdRooms = await Room.bulkCreate(roomsData);
    console.log(`✅ ${createdRooms.length} rooms created.`);

    // 3. Seed Simulated Devices
    console.log("🔌 Seeding simulated IoT nodes...");
    const devicesData = [];
    const now = new Date();
    
    const healthyTime = now;
    const degradedTime = new Date(now.getTime() - 45 * 60 * 1000); // 45 mins ago (Degraded health)
    const offlineTime = new Date(now.getTime() - 48 * 60 * 60 * 1000); // 48 hrs ago (Offline health)

    createdRooms.forEach((room, idx) => {
      const roomNum = room.room_number;
      
      // Every room gets an energy smart plug
      let status = "active";
      let lastSeen = healthyTime;
      
      if (roomNum === "103") {
        status = "offline";
        lastSeen = offlineTime;
      } else if (roomNum === "204") {
        status = "active";
        lastSeen = degradedTime;
      } else if (roomNum === "302") {
        status = "offline";
        lastSeen = offlineTime;
      }

      devicesData.push({
        device_id: `ROOM-${roomNum}-PLUG`,
        device_name: `Smart Plug Room ${roomNum}`,
        type: "energy",
        room_id: room.id,
        status: status === "offline" ? "offline" : "active",
        last_seen: lastSeen,
      });

      // Odd rooms get door locks
      if (idx % 2 === 1) {
        devicesData.push({
          device_id: `ROOM-${roomNum}-DOOR`,
          device_name: `Door Lock Room ${roomNum}`,
          type: "door",
          room_id: room.id,
          status: "active",
          last_seen: healthyTime,
        });
      }

      // Floors 2 & 3 get security motion sensors
      if (room.floor > 1 && idx % 3 === 0) {
        devicesData.push({
          device_id: `ROOM-${roomNum}-MOTION`,
          device_name: `Motion Detector Room ${roomNum}`,
          type: "motion",
          room_id: room.id,
          status: "active",
          last_seen: healthyTime,
        });
      }
    });

    const createdDevices = await Device.bulkCreate(devicesData);
    console.log(`✅ ${createdDevices.length} simulated IoT devices seeded.`);

    // 4. Seed 30 Days of Historical Energy Telemetry
    console.log("⚡ Seeding 30 days of hourly energy metrics...");
    const sensorDataRecords = [];
    const daysToSeed = 30;
    const energyDevices = createdDevices.filter(d => d.type === "energy" && d.status === "active");

    for (let day = daysToSeed; day >= 0; day--) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - day);
      const isWeekend = targetDate.getDay() === 0 || targetDate.getDay() === 6; // Saturday/Sunday
      
      for (let hour = 0; hour < 24; hour++) {
        const recordTime = new Date(targetDate);
        recordTime.setHours(hour, 0, 0, 0);

        // Peak usage 8am - 10pm
        const isPeak = hour >= 8 && hour <= 22;
        
        energyDevices.forEach((device) => {
          let baseValue = isPeak ? 1.8 : 0.3;
          
          // Weekend dip
          if (isWeekend) {
            baseValue *= 0.65; // 35% reduction
          }

          const roomObj = createdRooms.find(r => r.id === device.room_id);
          const floorMultiplier = 1.0 + (roomObj.floor * 0.1);
          const noise = Math.random() * 0.5 - 0.25; // +/- 0.25 kW fluctuation

          const finalValue = Math.max(0.08, (baseValue * floorMultiplier) + noise);

          sensorDataRecords.push({
            device_id: device.device_id,
            room_id: device.room_id,
            type: "energy",
            value: parseFloat(finalValue.toFixed(2)),
            unit: "kWh",
            timestamp: recordTime,
          });
        });
      }
    }

    console.log(`⚡ Uploading ${sensorDataRecords.length} historical readings...`);
    const chunkSize = 1000;
    for (let i = 0; i < sensorDataRecords.length; i += chunkSize) {
      const chunk = sensorDataRecords.slice(i, i + chunkSize);
      await SensorData.insertMany(chunk);
    }
    console.log("⚡ Energy logs uploaded successfully.");

    // 5. Seed Security Incident logs
    console.log("🚨 Seeding historical security timeline incidents...");
    const securityEvents = [];
    const doorDevices = createdDevices.filter(d => d.type === "door");
    const motionDevices = createdDevices.filter(d => d.type === "motion");

    for (let day = 28; day >= 1; day -= 2) {
      const eventDate = new Date();
      eventDate.setDate(eventDate.getDate() - day);
      
      if (doorDevices.length > 0) {
        const dev = doorDevices[day % doorDevices.length];
        securityEvents.push({
          device_id: dev.device_id,
          room_id: dev.room_id,
          event_type: "unauthorized_entry",
          severity: "High",
          description: `Unauthorized entry attempt registered on door lock for Room ${dev.device_id.split("-")[1]}.`,
          resolved: day > 4, // older resolved, newer unresolved
          resolved_at: day > 4 ? new Date(eventDate.getTime() + 10 * 60 * 1000) : null,
          resolved_by: day > 4 ? admin.id : null,
          timestamp: new Date(eventDate.setHours(22, 15, 0, 0)),
        });
      }

      if (motionDevices.length > 0 && day % 3 === 0) {
        const dev = motionDevices[day % motionDevices.length];
        securityEvents.push({
          device_id: dev.device_id,
          room_id: dev.room_id,
          event_type: "night_motion",
          severity: "Medium",
          description: `Motion detected inside Room ${dev.device_id.split("-")[1]} past curfew hours.`,
          resolved: day > 8,
          resolved_at: day > 8 ? new Date(eventDate.getTime() + 20 * 60 * 1000) : null,
          resolved_by: day > 8 ? warden.id : null,
          timestamp: new Date(eventDate.setHours(1, 40, 0, 0)),
        });
      }

      if (doorDevices.length > 0 && day % 5 === 0) {
        const dev = doorDevices[(day + 1) % doorDevices.length];
        securityEvents.push({
          device_id: dev.device_id,
          room_id: dev.room_id,
          event_type: "door_forced",
          severity: "Critical",
          description: `Forced tampering warning on lock for Room ${dev.device_id.split("-")[1]}.`,
          resolved: false, // unresolved
          timestamp: new Date(eventDate.setHours(15, 30, 0, 0)),
        });
      }
    }

    await SecurityEvent.insertMany(securityEvents);
    console.log(`🚨 ${securityEvents.length} security alerts populated.`);

    // 6. Seed Audit Logs
    console.log("📜 Seeding historical console audit logs...");
    const auditLogs = [
      {
        email: "admin@smartmonitor.com",
        action: "LOGIN",
        details: "Administrator logged in from console client IP 127.0.0.1",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        email: "admin@smartmonitor.com",
        action: "UPDATE_THRESHOLD",
        details: "Updated power alert threshold to 8.0 kWh",
        timestamp: new Date(Date.now() - 1.8 * 60 * 60 * 1000)
      },
      {
        email: "warden2@smartmonitor.com",
        action: "LOGIN",
        details: "Floor 2 Warden authenticated successfully",
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000)
      },
      {
        email: "warden2@smartmonitor.com",
        action: "RESOLVE_ALERT",
        details: "Resolved unauthorized night motion incident in Room 203",
        timestamp: new Date(Date.now() - 45 * 60 * 1000)
      },
      {
        email: "admin@smartmonitor.com",
        action: "TERMINATE_SESSION",
        details: "Forced terminated active session of suspended client",
        timestamp: new Date(Date.now() - 15 * 60 * 1000)
      }
    ];
    await AuditLog.insertMany(auditLogs);
    console.log(`📜 ${auditLogs.length} audit logs populated.`);

    // 7. Seed Active Sessions
    console.log("🔒 Seeding mock active user sessions...");
    const activeSessions = [
      {
        userId: admin.id || "admin-mock-id",
        email: "admin@smartmonitor.com",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0",
        ipAddress: "127.0.0.1",
        loginTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        lastSeen: new Date()
      },
      {
        userId: warden.id || "warden-mock-id",
        email: "warden2@smartmonitor.com",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/15.6",
        ipAddress: "192.168.1.45",
        loginTime: new Date(Date.now() - 1 * 60 * 60 * 1000),
        lastSeen: new Date(Date.now() - 5 * 60 * 1000)
      }
    ];
    await ActiveSession.insertMany(activeSessions);
    console.log(`🔒 ${activeSessions.length} active sessions populated.`);

    console.log("🏆 Seeding successfully completed!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failure:", error);
    process.exit(1);
  }
}

runSeed();
