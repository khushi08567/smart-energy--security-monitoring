# Smart Energy & Security Monitoring System
### Ultimez Technology Internship Project — Phase 1 & 2 Complete

A modern, full-stack, enterprise-grade IoT backend system designed to monitor energy usage and automate security surveillance across a campus or hostel in real time. 

---

## 📖 About the Project
The **Smart Energy & Security Monitoring System** resolves the operational challenges of managing large residential and academic facilities (hostels, campus blocks). By collecting high-frequency sensor readings, the system:
1. **Tracks Energy Consumption:** Details usage per room, floor, or building, identifies high-consumption peak hours, ranks rooms on an efficiency leaderboard, and flags idle devices wasting power (vampire load).
2. **Automates Security Monitoring:** Logs incidents (unauthorized night entries, forced door opens, etc.), calculates severity scales dynamically, triggers real-time alerts via WebSockets, and notifies wardens and admins instantly via email.
3. **Optimizes System Adaptability:** Integrates a flexible hybrid database design capable of running on PostgreSQL, MySQL, or local zero-setup SQLite, with high-write scaling in MongoDB Atlas.

---

## 🛠️ Complete Feature Set

### 1. Advanced Database Layer (Hybrid Storage)
* **Relational Storage (Sequelize):** Handles metadata with integrity. Fully adaptable database drivers:
  * **PostgreSQL:** Production-grade connector using `DATABASE_URL` (optimized for Render).
  * **SQLite:** Local zero-setup fallback (`database.sqlite`) which runs automatically if no remote SQL host is configured.
  * **MySQL:** Standard local/development relational database.
* **Non-Relational Storage (Mongoose):** Houses high-frequency time-series sensor data and security logs in **MongoDB Atlas** for high-write scaling.

### 2. Energy Analytics & Cost Calculator
* **Daily summaries:** Calculate total energy, average usage, and peak spikes per room.
* **Energy Cost Calculator:** Computes billing estimates based on custom rates (INR/kWh) and projects future monthly usage.
* **Efficiency Leaderboard:** Highlights the most and least energy-efficient rooms.
* **Peak Hour Detection:** pinpoints peak usage periods within a 24-hour cycle.
* **Vampire/Idle Device Detection:** Flags rooms drawing energy with no detected occupancy.
* **CSV Data Export:** Downloader for monthly energy usage summaries.

### 3. Smart Security & Real-Time Alerts
* **Dynamic Severity Classifier:** Automatically rates incidents from *Low* to *Critical* based on event type and time.
* **SMTP Email Notification Engine:** Instantly dispatches warning emails to facility administrators and wardens for High and Critical security breaches.
* **Night Scan Routine:** Scrapes room motion events between 10 PM and 6 AM to identify unauthorized movements.
* **Incident Resolution Pipeline:** Formal flow for wardens to log in, review unresolved incidents, and resolve them.

### 4. Real-Time Communication (Socket.io)
* **`sensor-data`:** Broadcasts new raw sensor readings immediately to all connected clients.
* **`room-data`:** Delivers targeted data streams to specific subscribed room channels.
* **`security-alert` / `security-resolved`:** Emits live security warnings and updates in real time to the frontend dashboard.

### 5. Security Hardening
* **Helmet.js:** Automatically configures HTTP headers (XSS protection, Clickjacking prevention, etc.) to harden the API against attacks.
* **Express Rate Limiting:** Restricts brute-force attempts and API abuse (limits to 100 requests per 15 minutes per IP).

### 6. Swagger API Documentation Sandbox
* Fully documented interactive endpoints using OpenAPI 3.0 specs.
* Access the sandbox at **`/api/docs`** to authenticate with your JWT token, test requests, and view detailed response schemas directly in your browser.

### 7. Automated Test Suite
* Built-in integration test suite (`tests/api.test.js`) leveraging Node.js's native test runner (`node --test`) to test server status, routing, and Swagger UI rendering.

---

## 💻 Tech Stack

| Layer | Technologies Used |
|---|---|
| **Runtime & Framework** | Node.js (v18+) + Express.js |
| **SQL Database** | PostgreSQL, SQLite, MySQL via Sequelize ORM |
| **NoSQL Database** | MongoDB Atlas via Mongoose ODM |
| **Real-Time Layer** | Socket.io |
| **Authentication** | JWT (JSON Web Tokens) + role-based middleware |
| **Security Hardening** | Helmet.js + Express Rate Limit |
| **SMTP Mailer** | Nodemailer |
| **Interactive Docs** | Swagger UI Express + OpenAPI 3.0 |
| **Testing** | Node.js Native Test Runner (`node --test`) |
| **Frontend** | React (Vite) + Tailwind CSS + Chart.js + Socket.io-client |
| **Simulation** | Custom Node.js IoT Sensor Data Simulator |

---

## 📁 Repository Structure
```text
├── client/                      # React frontend dashboard client
│   ├── src/                     # React components, pages, live socket graphs
│   └── package.json             # Frontend dependencies
├── docs/                        # Project architectural documents
│   ├── architecture.md          # Systems design and Mermaid diagram
│   └── database_schema.md       # SQL & NoSQL model configurations
├── src/                         # Backend source code
│   ├── config/                  # DB setups (database, mongo, socket, mailer)
│   ├── controllers/             # Business logic (auth, energy, security, rooms)
│   ├── middleware/              # Auth checks (JWT verify, RBAC checks)
│   ├── models/                  # DB Schemas (Sequelize SQL & Mongoose MongoDB)
│   ├── routes/                  # API endpoints routes registration
│   └── utils/                   # Shared utility and response helpers
├── tests/                       # Automated integration tests suite
│   └── api.test.js              # Native node:test runner integration specs
├── simulator/                   # IoT Hardware Simulator script
├── index.js                     # Main entrypoint (Express app setup & listener)
├── render.yaml                  # Render Infrastructure-as-code configuration
├── package.json                 # Backend dependencies & script definitions
└── README.md                    # Project documentation (this file)
```

---

## 🚀 Setup & Launch Instructions

### 1. Install Dependencies
Clone the repository and install packages:
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root folder with the following variables:
```env
PORT=5000
NODE_ENV=development

# SQL Database (Leave blank to automatically fallback to SQLite)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=smart_energy_db
DB_PORT=3306

# NoSQL MongoDB Atlas Connection
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/smart_energy_db

# Security & Mailer
JWT_SECRET=your_jwt_secret_key
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
ALERT_EMAIL=recipient_warden@gmail.com
```

### 3. Run the Backend Server
Start the development server (runs nodemon):
```bash
npm run dev
```

### 4. Run the IoT Simulator
In a second terminal, start the simulator to feed mock data:
```bash
npm run simulate
```

### 5. Run the Automated Tests
Verify code integrity:
```bash
npm test
```

### 6. Interactive API Documentation
Open your web browser and navigate to:
* **Interactive Docs:** `http://localhost:5000/api/docs`
* **JSON Schema:** `http://localhost:5000/api/docs/json`

---

## ☁️ Cloud Deployment (Render)
1. Commit your changes and push them to your GitHub repository.
2. Link your repository to a **Render Web Service**.
3. Under Render's **Environment** tab, set:
   * `DATABASE_URL` (Paste your Render PostgreSQL connection string here).
   * `MONGO_URI` (Your MongoDB Atlas connection URI).
   * `JWT_SECRET`, `EMAIL_USER`, `EMAIL_PASS`, and `ALERT_EMAIL`.
4. Deploy the service! The backend will automatically link to PostgreSQL and load the API.