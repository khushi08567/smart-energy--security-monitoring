require("dotenv").config();

const express = require("express");
const sequelize = require("./src/config/database");
const User = require("./src/models/User");
const Room = require("./src/models/Room");
const Device = require("./src/models/Device");
const authRoutes = require("./src/routes/authRoutes");

const app = express();

app.use(express.json());
app.use("/api/auth", authRoutes);
const verifyToken = require("./src/middleware/authMiddleware");

app.get("/api/protected", verifyToken, (req, res) => {
  res.json({
    message: "Protected route accessed successfully",
    user: req.user,
  });
});

sequelize
  .sync({ alter: true })
  .then(() => {
    console.log("Database connected successfully");

    app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
  });