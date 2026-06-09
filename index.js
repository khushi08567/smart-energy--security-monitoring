require("dotenv").config();

const express = require("express");
const cors = require("cors");
const sequelize = require("./src/config/database");

// Import models (needed so Sequelize knows about them before sync)
const User = require("./src/models/User");
const Room = require("./src/models/Room");
const Device = require("./src/models/Device");

// Import routes
const authRoutes = require("./src/routes/authRoutes");
const userRoutes = require("./src/routes/userRoutes");

// Import middleware
const verifyToken = require("./src/middleware/authMiddleware");

// Create app FIRST — before any app.use()
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Smart Energy & Security API is running"
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
const deviceRoutes = require("./src/routes/deviceRoutes");
app.use("/api/devices", deviceRoutes);
const roomRoutes = require("./src/routes/roomRoutes");
app.use("/api/rooms", roomRoutes);
// Test protected route
app.get("/api/protected", verifyToken, (req, res) => {
  res.json({
    message: "Protected route accessed successfully",
    user: req.user,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Start server + sync DB
sequelize
  .sync({ alter: true })
  .then(() => {
    console.log("MySQL connected and synced successfully");
    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
  });