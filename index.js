require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const sequelize = require("./src/config/database");
const setupSocket = require("./src/config/socketHandler");
const verifyToken = require("./src/middleware/authMiddleware");

// Models
const User = require("./src/models/User");
const Room = require("./src/models/Room");
const Device = require("./src/models/Device");

// Routes
const authRoutes = require("./src/routes/authRoutes");
const userRoutes = require("./src/routes/userRoutes");
const deviceRoutes = require("./src/routes/deviceRoutes");
const roomRoutes = require("./src/routes/roomRoutes");
const sensorRoutes = require("./src/routes/sensorRoutes");
const energyRoutes = require("./src/routes/energyRoutes");
const securityRoutes = require("./src/routes/securityRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");
const dashboardRoutes = require("./src/routes/dashboardRoutes");
const analyticsRoutes = require("./src/routes/analyticsRoutes");
const docsRoutes = require("./src/routes/docsRoutes");

// Create app FIRST
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// Make io available in all controllers
app.set("io", io);

// Middleware
app.use(cors());
app.use(express.json());

// Security Hardening: Helmet (Security Headers) & Rate Limiting
app.use(helmet({
  contentSecurityPolicy: false // Disable CSP to allow Swagger UI resources to load
}));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per 15 mins
  message: {
    success: false,
    message: "Too many requests from this IP. Please try again after 15 minutes."
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use("/api", apiLimiter);

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Smart Energy & Security API is running",
    version: "2.0.0",
    endpoints: {
      auth:          "/api/auth",
      users:         "/api/users",
      rooms:         "/api/rooms",
      devices:       "/api/devices",
      sensors:       "/api/sensors",
      energy:        "/api/energy",
      security:      "/api/security",
      notifications: "/api/notifications",
      dashboard:     "/api/dashboard",
      analytics:     "/api/analytics",
      docs:          "/api/docs"
    }
  });
});

// All routes
app.use("/api/auth",          authRoutes);
app.use("/api/users",         userRoutes);
app.use("/api/devices",       deviceRoutes);
app.use("/api/rooms",         roomRoutes);
app.use("/api/sensors",       sensorRoutes);
app.use("/api/energy",        energyRoutes);
app.use("/api/security",      securityRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/dashboard",     dashboardRoutes);
app.use("/api/analytics",     analyticsRoutes);
app.use("/api/docs",          docsRoutes);

// Protected test route
app.get("/api/protected", verifyToken, (req, res) => {
  res.json({
    message: "Protected route accessed successfully",
    user: req.user
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

// Setup Socket.io
setupSocket(io);

// Start server
const startServer = async () => {
  // Connect MongoDB
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }

  // Connect MySQL — don't crash if it fails on Render
  // Connect MySQL — don't crash if it fails on Render
sequelize.authenticate()
  .then(async () => {
    console.log("MySQL connected");

    try {
      await sequelize.sync({ alter: true });
      console.log("MySQL synced successfully");
    } catch (err) {
      console.warn("MySQL sync failed:", err.message);
    }
  })
  .catch((err) => {
    console.warn(
      "MySQL not available, running without MySQL:",
      err.message
    );
  });
  // Start server regardless
  server.listen(process.env.PORT || 5000, "0.0.0.0", () => {
    console.log(`Server running on port ${process.env.PORT || 5000}`);
    console.log("Socket.io is ready for connections");
  });
};

if (require.main === module) {
  startServer();
}

module.exports = { app, server, startServer };