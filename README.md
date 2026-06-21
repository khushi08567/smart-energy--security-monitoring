# smart-energy--security-monitoring
Ultimez internship project - It is smart IoT energy securIty monitoring system for  campus/hostel 

# Smart Energy & Security Monitoring System

Ultimez Technology Internship Project — Phase 1

A real-time IoT backend system for monitoring energy usage
and security across a hostel/campus.

---

## Tech Stack
- **Backend**: Node.js + Express.js
- **SQL Database**: MySQL + Sequelize
- **NoSQL Database**: MongoDB + Mongoose
- **Real-time**: Socket.io
- **Auth**: JWT + bcrypt + Role-based access

---

## Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/khushi08567/smart-energy--security-monitoring.git
cd smart-energy--security-monitoring
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create .env file
```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=smart_energy_db
DB_PORT=3306
JWT_SECRET=your_jwt_secret
MONGO_URI=mongodb://localhost:27017/smart_energy_db
```

### 4. Start the server
```bash
npm run dev
```

### 5. Run IoT simulator (optional, second terminal)
```bash
npm run simulate
```

---

## API Endpoints & Documentation

All API endpoints are documented interactively with Swagger!
* **Swagger UI Docs Endpoint:** `http://localhost:5000/api/docs`
* **JSON Raw OpenAPI Spec:** `http://localhost:5000/api/docs/json`

Use the Swagger UI sandbox to test endpoints, authenticate using JWT bearer token, and inspect response formats.

### Main Endpoint Categories:
* **Auth (`/api/auth`)**: User signup and login
* **Users (`/api/users`)**: Fetch profile details and manage system users
* **Rooms (`/api/rooms`)**: Campus room layouts and occupancy
* **Devices (`/api/devices`)**: Registered sensor hardware nodes
* **Sensors (`/api/sensors`)**: Historical logs and webhook input
* **Energy (`/api/energy`)**: Consumption analytics, billing calculators, and idle devices
* **Security (`/api/security`)**: Security event trackers, resolve logs, and active scans
* **Notifications (`/api/notifications`)**: User alerts and read statuses
* **Dashboard (`/api/dashboard`)**: General status feeds and overview metrics
* **Analytics (`/api/analytics`)**: Detailed reports, peak hours, and CSV exports

---

### Auth
| Method | Endpoint              | Description       |
|--------|-----------------------|-------------------|
| POST   | /api/auth/register    | Register user     |
| POST   | /api/auth/login       | Login, get token  |

### Users (JWT required)
| Method | Endpoint              | Role         |
|--------|-----------------------|--------------|
| GET    | /api/users/me         | Any          |
| GET    | /api/users            | Admin/Warden |
| PUT    | /api/users/:id        | Admin        |
| DELETE | /api/users/:id        | Admin        |

### Rooms (JWT required)
| Method | Endpoint                  | Role         |
|--------|---------------------------|--------------|
| GET    | /api/rooms                | Any          |
| POST   | /api/rooms                | Admin/Warden |
| GET    | /api/rooms/floor/:floor   | Any          |
| PUT    | /api/rooms/:id            | Admin/Warden |
| DELETE | /api/rooms/:id            | Admin        |

### Devices (JWT required)
| Method | Endpoint                    | Role         |
|--------|-----------------------------|--------------|
| GET    | /api/devices                | Any          |
| POST   | /api/devices                | Admin/Warden |
| GET    | /api/devices/room/:roomId   | Any          |
| PUT    | /api/devices/:id            | Admin/Warden |
| DELETE | /api/devices/:id            | Admin        |

### Sensors
| Method | Endpoint                      | Auth  |
|--------|-------------------------------|-------|
| POST   | /api/sensors/data             | None  |
| GET    | /api/sensors/latest/:roomId   | JWT   |
| GET    | /api/sensors/data/:deviceId   | JWT   |
| GET    | /api/sensors/history          | JWT   |

---

## Real-time Events (Socket.io)
| Event       | Direction       | Description                  |
|-------------|-----------------|------------------------------|
| sensor-data | Server → Client | New reading from any device  |
| room-data   | Server → Client | New reading for specific room|
| join-room   | Client → Server | Subscribe to a room channel  |

---

## Folder Structure
```
src/
  controllers/   — business logic
  routes/        — API route definitions
  models/        — Sequelize + Mongoose models
  middleware/    — auth + role middleware
  config/        — DB connections + socket setup
  utils/         — response helpers
simulator/       — IoT data simulator
docs/            — schema docs + Postman collection
```