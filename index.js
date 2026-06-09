require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const sequelize = require("./src/config/database");
const connectMongoDB = require("./src/config/mongoDb");
const setupSocket = require("./src/config/socketHandler");

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

const verifyToken = require("./src/middleware/authMiddleware");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

// Make io available in all controllers
app.set("io", io);

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ success: true, message: "Smart Energy & Security API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/sensors", sensorRoutes);

app.get("/api/protected", verifyToken, (req, res) => {
  res.json({ message: "Protected route accessed", user: req.user });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

setupSocket(io);

const startServer = async () => {
  await connectMongoDB();

  sequelize.sync({ alter: true }).then(() => {
    console.log("MySQL connected and synced");
    server.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port ${process.env.PORT || 5000}`);
      console.log("Socket.io is ready for connections");
    });
  }).catch((err) => {
    console.error("MySQL connection failed:", err);
  });
};

startServer();