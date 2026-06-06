require("dotenv").config();

const express = require("express");
const sequelize = require("./src/config/database");
const User = require("./src/models/User");
const Room = require("./src/models/Room");
const Device = require("./src/models/Device");
const app = express();

sequelize.sync({ alter: true })
  .then(() => {
    console.log("Database connected successfully");

    app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
  });