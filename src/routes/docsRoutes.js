const express = require("express");
const router = express.Router();
const swaggerUi = require("swagger-ui-express");

const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Smart Energy & Security Monitoring System API Docs",
    version: "2.0.0",
    description: "API documentation for the Ultimez Technology IoT Hostel/Campus Monitoring System. Contains endpoints for Auth, Users, Rooms, Devices, Sensors, Energy reports, Security events, and Live Dashboards.",
    contact: {
      name: "Ultimez Technologies Developer Support",
      email: "khushipathak.080@gmail.com"
    }
  },
  servers: [
    {
      url: "http://localhost:5000/api",
      description: "Local Development Server"
    },
    {
      url: "/api",
      description: "Production Server (Render)"
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your JWT token in the format: `Bearer <token>`"
      }
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "John Doe" },
          email: { type: "string", format: "email", example: "john@example.com" },
          role: { type: "string", enum: ["Admin", "Warden", "Viewer"], example: "Warden" },
          isActive: { type: "boolean", example: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      },
      Room: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          room_number: { type: "string", example: "ROOM-101" },
          floor: { type: "integer", example: 1 },
          building: { type: "string", example: "Main Building" },
          status: { type: "string", enum: ["active", "inactive", "maintenance"], example: "active" },
          occupancy: { type: "string", enum: ["occupied", "vacant"], example: "occupied" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      },
      Device: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          device_id: { type: "string", example: "ROOM-101-ENERGY" },
          device_name: { type: "string", example: "Energy Meter Floor 1" },
          type: { type: "string", enum: ["energy", "motion", "door", "temperature"], example: "energy" },
          room_id: { type: "integer", example: 1 },
          status: { type: "string", enum: ["active", "inactive", "offline"], example: "active" },
          last_seen: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      },
      SensorData: {
        type: "object",
        properties: {
          device_id: { type: "string", example: "ROOM-101-ENERGY" },
          room_id: { type: "integer", example: 1 },
          type: { type: "string", enum: ["energy", "motion", "door", "temperature"], example: "energy" },
          value: { type: "object", example: 12.45 },
          unit: { type: "string", example: "kWh", nullable: true },
          timestamp: { type: "string", format: "date-time" }
        }
      },
      SecurityEvent: {
        type: "object",
        properties: {
          id: { type: "string", example: "648f572a1cf9a4a7541b52a7" },
          device_id: { type: "string", example: "ROOM-101-MOTION" },
          room_id: { type: "integer", example: 1 },
          event_type: { type: "string", enum: ["unauthorized_entry", "motion_detected", "door_forced", "door_open_too_long", "night_motion"], example: "unauthorized_entry" },
          severity: { type: "string", enum: ["Low", "Medium", "High", "Critical"], example: "High" },
          description: { type: "string", example: "Motion detected in Room 101 outside of normal hours." },
          resolved: { type: "boolean", example: false },
          resolved_at: { type: "string", format: "date-time", nullable: true },
          resolved_by: { type: "integer", nullable: true },
          timestamp: { type: "string", format: "date-time" }
        }
      },
      Notification: {
        type: "object",
        properties: {
          id: { type: "string", example: "648f572a1cf9a4a7541b52bc" },
          user_id: { type: "integer", nullable: true, example: 1 },
          title: { type: "string", example: "Security Alert" },
          message: { type: "string", example: "Intrusion detected in Room 102" },
          type: { type: "string", enum: ["security", "energy", "device", "system"], example: "security" },
          severity: { type: "string", enum: ["info", "warning", "danger", "critical"], example: "danger" },
          is_read: { type: "boolean", example: false },
          read_at: { type: "string", format: "date-time", nullable: true },
          reference_id: { type: "string", nullable: true },
          timestamp: { type: "string", format: "date-time" }
        }
      }
    }
  },
  security: [
    {
      BearerAuth: []
    }
  ],
  paths: {
    "/auth/register": {
      post: {
        summary: "Register a new user",
        tags: ["Auth"],
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string", example: "Alice Johnson" },
                  email: { type: "string", format: "email", example: "alice@example.com" },
                  password: { type: "string", format: "password", example: "password123" },
                  role: { type: "string", enum: ["Admin", "Warden", "Viewer"], default: "Viewer" }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: "User registered successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "User registered successfully" },
                    user: { $ref: "#/components/schemas/User" }
                  }
                }
              }
            }
          },
          400: { description: "Invalid input or user already exists" }
        }
      }
    },
    "/auth/login": {
      post: {
        summary: "Login a user",
        tags: ["Auth"],
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email", example: "john@example.com" },
                  password: { type: "string", format: "password", example: "password123" }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Login successful, token returned",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Login successful" },
                    token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
                    user: { $ref: "#/components/schemas/User" }
                  }
                }
              }
            }
          },
          401: { description: "Invalid credentials" }
        }
      }
    },
    "/users/me": {
      get: {
        summary: "Get current user profile",
        tags: ["Users"],
        responses: {
          200: {
            description: "Profile data retrieved",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    user: { $ref: "#/components/schemas/User" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/users": {
      get: {
        summary: "Get all users (Admin/Warden only)",
        tags: ["Users"],
        responses: {
          200: {
            description: "List of users",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/User" }
                }
              }
            }
          }
        }
      }
    },
    "/users/{id}": {
      get: {
        summary: "Get user by ID (Admin/Warden only)",
        tags: ["Users"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } }
        ],
        responses: {
          200: {
            description: "User details",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" }
              }
            }
          }
        }
      },
      put: {
        summary: "Update user (Admin only)",
        tags: ["Users"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  role: { type: "string", enum: ["Admin", "Warden", "Viewer"] },
                  isActive: { type: "boolean" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "User updated successfully" }
        }
      },
      delete: {
        summary: "Delete user (Admin only)",
        tags: ["Users"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } }
        ],
        responses: {
          200: { description: "User deleted successfully" }
        }
      }
    },
    "/rooms": {
      get: {
        summary: "Get all rooms",
        tags: ["Rooms"],
        responses: {
          200: {
            description: "List of rooms",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Room" }
                }
              }
            }
          }
        }
      },
      post: {
        summary: "Create a room (Admin/Warden only)",
        tags: ["Rooms"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["room_number", "floor"],
                properties: {
                  room_number: { type: "string", example: "ROOM-202" },
                  floor: { type: "integer", example: 2 },
                  building: { type: "string", example: "Main Building" }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Room created successfully" }
        }
      }
    },
    "/rooms/floor/{floorNum}": {
      get: {
        summary: "Get rooms by floor number",
        tags: ["Rooms"],
        parameters: [
          { name: "floorNum", in: "path", required: true, schema: { type: "integer" } }
        ],
        responses: {
          200: {
            description: "Rooms on specified floor",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Room" }
                }
              }
            }
          }
        }
      }
    },
    "/rooms/{id}": {
      put: {
        summary: "Update room details (Admin/Warden only)",
        tags: ["Rooms"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  room_number: { type: "string" },
                  floor: { type: "integer" },
                  building: { type: "string" },
                  status: { type: "string", enum: ["active", "inactive", "maintenance"] },
                  occupancy: { type: "string", enum: ["occupied", "vacant"] }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Room updated successfully" }
        }
      },
      delete: {
        summary: "Delete room (Admin only)",
        tags: ["Rooms"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } }
        ],
        responses: {
          200: { description: "Room deleted successfully" }
        }
      }
    },
    "/devices": {
      get: {
        summary: "Get all IoT devices",
        tags: ["Devices"],
        responses: {
          200: {
            description: "List of devices",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Device" }
                }
              }
            }
          }
        }
      },
      post: {
        summary: "Add new IoT device (Admin/Warden only)",
        tags: ["Devices"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["device_id", "device_name", "type", "room_id"],
                properties: {
                  device_id: { type: "string", example: "ROOM-101-ENERGY" },
                  device_name: { type: "string", example: "Energy Meter Floor 1" },
                  type: { type: "string", enum: ["energy", "motion", "door", "temperature"] },
                  room_id: { type: "integer", example: 1 }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Device registered successfully" }
        }
      }
    },
    "/devices/room/{roomId}": {
      get: {
        summary: "Get devices by Room ID",
        tags: ["Devices"],
        parameters: [
          { name: "roomId", in: "path", required: true, schema: { type: "integer" } }
        ],
        responses: {
          200: {
            description: "Devices in specified room",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Device" }
                }
              }
            }
          }
        }
      }
    },
    "/devices/{id}": {
      put: {
        summary: "Update device info (Admin/Warden only)",
        tags: ["Devices"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  device_name: { type: "string" },
                  type: { type: "string", enum: ["energy", "motion", "door", "temperature"] },
                  status: { type: "string", enum: ["active", "inactive", "offline"] }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Device updated successfully" }
        }
      },
      delete: {
        summary: "Delete device (Admin only)",
        tags: ["Devices"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } }
        ],
        responses: {
          200: { description: "Device deleted successfully" }
        }
      }
    },
    "/sensors/data": {
      post: {
        summary: "Inbound webhook to post sensor data (No Authentication)",
        tags: ["Sensors"],
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["device_id", "type", "value"],
                properties: {
                  device_id: { type: "string", example: "ROOM-101-ENERGY" },
                  type: { type: "string", enum: ["energy", "motion", "door", "temperature"] },
                  value: { type: "object", example: 1.25 }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Data logged successfully" }
        }
      }
    },
    "/sensors/history": {
      get: {
        summary: "Get general sensor readings history",
        tags: ["Sensors"],
        parameters: [
          { name: "type", in: "query", schema: { type: "string" }, description: "Filter by type" },
          { name: "limit", in: "query", schema: { type: "integer", default: 50 }, description: "Page limit" }
        ],
        responses: {
          200: {
            description: "List of sensor historical data",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/SensorData" }
                }
              }
            }
          }
        }
      }
    },
    "/sensors/latest/{roomId}": {
      get: {
        summary: "Get latest sensor readings for a room",
        tags: ["Sensors"],
        parameters: [
          { name: "roomId", in: "path", required: true, schema: { type: "integer" } }
        ],
        responses: {
          200: {
            description: "Latest sensor data object map",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/SensorData" }
                }
              }
            }
          }
        }
      }
    },
    "/sensors/data/{deviceId}": {
      get: {
        summary: "Get all historical readings for a device",
        tags: ["Sensors"],
        parameters: [
          { name: "deviceId", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          200: {
            description: "Readings for the device",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/SensorData" }
                }
              }
            }
          }
        }
      }
    },
    "/energy/anomalies": {
      get: {
        summary: "Detect energy anomalies (Admin/Warden only)",
        tags: ["Energy Analytics"],
        responses: {
          200: { description: "Anomalies details" }
        }
      }
    },
    "/energy/compare": {
      get: {
        summary: "Compare rooms/floors energy usage (Admin/Warden only)",
        tags: ["Energy Analytics"],
        responses: {
          200: { description: "Comparison results" }
        }
      }
    },
    "/energy/leaderboard": {
      get: {
        summary: "Get rooms ranked by energy consumption (Admin/Warden only)",
        tags: ["Energy Analytics"],
        responses: {
          200: { description: "Energy ranking leaderboard" }
        }
      }
    },
    "/energy/idle-devices": {
      get: {
        summary: "Detect idle devices consuming vampire power (Admin/Warden only)",
        tags: ["Energy Analytics"],
        responses: {
          200: { description: "Idle devices list" }
        }
      }
    },
    "/energy/summary/{roomId}": {
      get: {
        summary: "Get room daily summary",
        tags: ["Energy Analytics"],
        parameters: [
          { name: "roomId", in: "path", required: true, schema: { type: "integer" } }
        ],
        responses: {
          200: { description: "Daily energy metrics summary" }
        }
      }
    },
    "/energy/trend/{roomId}": {
      get: {
        summary: "Get room consumption trend",
        tags: ["Energy Analytics"],
        parameters: [
          { name: "roomId", in: "path", required: true, schema: { type: "integer" } }
        ],
        responses: {
          200: { description: "Trend graph values" }
        }
      }
    },
    "/energy/monthly/{roomId}": {
      get: {
        summary: "Get monthly usage report",
        tags: ["Energy Analytics"],
        parameters: [
          { name: "roomId", in: "path", required: true, schema: { type: "integer" } }
        ],
        responses: {
          200: { description: "Monthly usage details" }
        }
      }
    },
    "/energy/bill/{roomId}": {
      get: {
        summary: "Estimate room bill",
        tags: ["Energy Analytics"],
        parameters: [
          { name: "roomId", in: "path", required: true, schema: { type: "integer" } }
        ],
        responses: {
          200: { description: "Estimated billing report" }
        }
      }
    },
    "/energy/peak-hours/{roomId}": {
      get: {
        summary: "Identify high-consumption hours for room",
        tags: ["Energy Analytics"],
        parameters: [
          { name: "roomId", in: "path", required: true, schema: { type: "integer" } }
        ],
        responses: {
          200: { description: "Peak usage hours list" }
        }
      }
    },
    "/security/unresolved": {
      get: {
        summary: "Get unresolved security events (Admin/Warden only)",
        tags: ["Security"],
        responses: {
          200: {
            description: "List of unresolved events",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/SecurityEvent" }
                }
              }
            }
          }
        }
      }
    },
    "/security/night-check": {
      get: {
        summary: "Trigger scan for security active check (Admin/Warden only)",
        tags: ["Security"],
        responses: {
          200: { description: "Night checks logs" }
        }
      }
    },
    "/security/stats": {
      get: {
        summary: "Get security incident statistics (Admin/Warden only)",
        tags: ["Security"],
        responses: {
          200: { description: "Dashboard summary stats" }
        }
      }
    },
    "/security/events": {
      get: {
        summary: "Get all security incidents (Admin/Warden only)",
        tags: ["Security"],
        responses: {
          200: {
            description: "All security events",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/SecurityEvent" }
                }
              }
            }
          }
        }
      }
    },
    "/security/event": {
      post: {
        summary: "Post a manual security incident (Admin/Warden only)",
        tags: ["Security"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["device_id", "room_id", "event_type", "severity", "description"],
                properties: {
                  device_id: { type: "string" },
                  room_id: { type: "integer" },
                  event_type: { type: "string" },
                  severity: { type: "string", enum: ["Low", "Medium", "High", "Critical"] },
                  description: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Event saved successfully" }
        }
      }
    },
    "/security/events/{id}": {
      get: {
        summary: "Get single security event (Admin/Warden only)",
        tags: ["Security"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          200: {
            description: "Event info",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SecurityEvent" }
              }
            }
          }
        }
      }
    },
    "/security/events/{id}/resolve": {
      put: {
        summary: "Mark security event as resolved (Admin/Warden only)",
        tags: ["Security"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          200: { description: "Event resolved" }
        }
      }
    },
    "/notifications/unread-count": {
      get: {
        summary: "Get unread notification count",
        tags: ["Notifications"],
        responses: {
          200: { description: "Count value returned" }
        }
      }
    },
    "/notifications/read-all": {
      put: {
        summary: "Mark all user notifications read",
        tags: ["Notifications"],
        responses: {
          200: { description: "All marked as read" }
        }
      }
    },
    "/notifications": {
      get: {
        summary: "Get notifications list",
        tags: ["Notifications"],
        responses: {
          200: {
            description: "Array of notifications",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Notification" }
                }
              }
            }
          }
        }
      }
    },
    "/notifications/{id}/read": {
      put: {
        summary: "Mark specific notification read",
        tags: ["Notifications"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          200: { description: "Notification marked read" }
        }
      }
    },
    "/notifications/{id}": {
      delete: {
        summary: "Delete notification record",
        tags: ["Notifications"],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          200: { description: "Notification deleted" }
        }
      }
    },
    "/dashboard/overview": {
      get: {
        summary: "Get overview counts (Admin/Warden only)",
        tags: ["Dashboard"],
        responses: {
          200: { description: "General metrics overview counts" }
        }
      }
    },
    "/dashboard/live-status": {
      get: {
        summary: "Get active live status of system (Admin/Warden only)",
        tags: ["Dashboard"],
        responses: {
          200: { description: "Active system nodes status" }
        }
      }
    },
    "/dashboard/recent-alerts": {
      get: {
        summary: "Get recent critical alerts (Admin/Warden only)",
        tags: ["Dashboard"],
        responses: {
          200: { description: "Recent alert log" }
        }
      }
    },
    "/dashboard/device-health": {
      get: {
        summary: "Get health status count of all hardware (Admin/Warden only)",
        tags: ["Dashboard"],
        responses: {
          200: { description: "Health states" }
        }
      }
    },
    "/dashboard/building-summary": {
      get: {
        summary: "Get overview split by campus buildings (Admin/Warden only)",
        tags: ["Dashboard"],
        responses: {
          200: { description: "Buildings breakdown values" }
        }
      }
    },
    "/analytics/energy-leaderboard": {
      get: {
        summary: "Get historical leaderboard (Admin/Warden only)",
        tags: ["Analytics"],
        responses: {
          200: { description: "Analytics leader list" }
        }
      }
    },
    "/analytics/peak-hours": {
      get: {
        summary: "Get historical peak usage hours (Admin/Warden only)",
        tags: ["Analytics"],
        responses: {
          200: { description: "Peak usage hour report list" }
        }
      }
    },
    "/analytics/security-hotspots": {
      get: {
        summary: "Get incident heavy hotspots locations (Admin/Warden only)",
        tags: ["Analytics"],
        responses: {
          200: { description: "Hotspot locations" }
        }
      }
    },
    "/analytics/device-usage": {
      get: {
        summary: "Get devices usage intervals (Admin/Warden only)",
        tags: ["Analytics"],
        responses: {
          200: { description: "Usage durations" }
        }
      }
    },
    "/analytics/summary": {
      get: {
        summary: "Get analytics general summary (Admin/Warden only)",
        tags: ["Analytics"],
        responses: {
          200: { description: "Analytics details object" }
        }
      }
    },
    "/analytics/export/monthly": {
      get: {
        summary: "Export monthly analytics CSV report (Admin/Warden only)",
        tags: ["Analytics"],
        responses: {
          200: {
            description: "CSV File Download",
            content: {
              "text/csv": {
                schema: { type: "string" }
              }
            }
          }
        }
      }
    }
  }
};

router.use("/", swaggerUi.serve);
router.get("/", swaggerUi.setup(swaggerDocument));
router.get("/json", (req, res) => {
  res.json(swaggerDocument);
});

module.exports = router;
