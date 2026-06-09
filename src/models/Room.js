const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Room = sequelize.define("Room", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  room_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  floor: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  building: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "Main Building",
  },
  status: {
    type: DataTypes.ENUM("active", "inactive", "maintenance"),
    defaultValue: "active",
  },
  occupancy: {
    type: DataTypes.ENUM("occupied", "vacant"),
    defaultValue: "vacant",
  },
}, {
  tableName: "rooms",
  timestamps: true,
});

module.exports = Room;