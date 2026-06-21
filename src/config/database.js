const { Sequelize } = require("sequelize");
require("dotenv").config();

let sequelize;

if (process.env.DATABASE_URL) {
  // Option B: PostgreSQL (e.g., Render managed database)
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false
  });
  console.log("Sequelize: Using PostgreSQL database connection");
} else if (process.env.DB_DIALECT === "sqlite" || !process.env.DB_HOST || (process.env.DB_HOST === "localhost" && process.env.NODE_ENV === "production")) {
  // Option A: SQLite fallback
  sequelize = new Sequelize({
    dialect: "sqlite",
    storage: "./database.sqlite",
    logging: false
  });
  console.log("Sequelize: Using local SQLite database (production fallback)");
} else {
  // Option C: Traditional MySQL
  sequelize = new Sequelize(
    process.env.DB_NAME || "smart_energy_db",
    process.env.DB_USER || "root",
    process.env.DB_PASSWORD || "",
    {
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 3306,
      dialect: "mysql",
      logging: false,
      dialectOptions: {
        connectTimeout: 3000,
      },
      pool: {
        max: 5,
        min: 0,
        acquire: 3000,
        idle: 10000,
      },
    }
  );
  console.log("Sequelize: Using MySQL database connection");
}

module.exports = sequelize;