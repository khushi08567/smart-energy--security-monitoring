const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Room = require("./Room");

const Device = sequelize.define("Device", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  device_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: "Custom ID e.g. ROOM-101-ENERGY",
  },
  device_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM("energy", "motion", "door", "temperature"),
    allowNull: false,
  },
  room_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Room,
      key: "id",
    },
  },
  status: {
    type: DataTypes.ENUM("active", "inactive", "offline"),
    defaultValue: "active",
  },
  last_seen: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: "devices",
  timestamps: true,
});

// Association: Device belongs to Room
Device.belongsTo(Room, { foreignKey: "room_id", as: "room" });
Room.hasMany(Device, { foreignKey: "room_id", as: "devices" });

module.exports = Device;