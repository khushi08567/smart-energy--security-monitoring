# System Architecture
## Smart Energy & Security Monitoring System

---

## Overview
A full-stack IoT backend system that monitors energy usage
and security across a hostel/campus in real time.

---

## Architecture Diagram

```
  IoT Devices / Simulator
         │
         │ HTTP POST (sensor data)
         ▼
  ┌─────────────────────────────────────────┐
  │         Node.js + Express Server         │
  │                                         │
  │  ┌──────────┐  ┌──────────────────────┐ │
  │  │ REST APIs │  │    Socket.io Server  │ │
  │  │          │  │  (real-time events)  │ │
  │  └──────────┘  └──────────────────────┘ │
  │         │               │               │
  │         ▼               ▼               │
  │  ┌────────────┐  ┌────────────────┐    │
  │  │   MySQL     │  │    MongoDB     │    │
  │  │  (Sequelize)│  │  (Mongoose)    │    │
  │  │             │  │                │    │
  │  │ users       │  │ sensordatas    │    │
  │  │ rooms       │  │ (real-time     │    │
  │  │ devices     │  │  readings)     │    │
  │  └────────────┘  └────────────────┘    │
  └─────────────────────────────────────────┘
         │
         │ Socket.io emit
         ▼
  ┌─────────────────┐
  │  Dashboard/     │
  │  Frontend Client│
  │  (React - Day 20│
  └─────────────────┘
```

---

## Tech Stack
| Layer        | Technology              |
|--------------|-------------------------|
| Runtime      | Node.js v18+            |
| Framework    | Express.js              |
| SQL Database | MySQL + Sequelize ORM   |
| NoSQL DB     | MongoDB + Mongoose      |
| Real-time    | Socket.io               |
| Auth         | JWT + bcrypt            |
| Simulation   | Custom Node.js script   |

---

## Data Flow
1. IoT device (or simulator) sends POST to /api/sensors/data
2. Server validates device exists in MySQL
3. Reading saved to MongoDB
4. Socket.io emits reading to all connected dashboard clients
5. Dashboard updates in real time (no page refresh needed)

---

## Security
- All routes protected with JWT middleware
- Role-based access: Admin > Warden > Viewer
- Passwords hashed with bcrypt (salt rounds: 10)
- .env file for all secrets (never committed to GitHub)