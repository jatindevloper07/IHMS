# IHMS Backend Service Architecture

The **Intelligent Hospital Management System (IHMS)** backend is a modular, high-performance Node.js / Express service backed by **SQLite 3 (WAL mode)** with foreign key enforcement and real-time Server-Sent Events (SSE).

---

## 📁 Directory Structure

```
server/
├── app.js                     # Express application configuration & route mounting
├── index.js                   # Server entry point, DB bootstrap & graceful shutdown
├── db.js                      # Backward-compatible database export
├── package.json               # Server package definition
│
├── config/                    # Configuration Layer
│   ├── env.js                 # Environment variables (PORT, DB_PATH, CORS_ORIGIN)
│   └── database.js            # SQLite connection with WAL & foreign keys
│
├── db/                        # Database Layer
│   ├── schema.js              # SQLite DDL tables (patients, vitals, rooms, users, etc.)
│   └── seed.js                # Initial clinical and demo dataset seeder
│
├── middleware/                # Middleware Layer
│   ├── requestLogger.js       # HTTP request telemetry & duration logging
│   ├── errorHandler.js        # Standardized 404 & 500 JSON error handling
│   └── authMiddleware.js      # Role authorization helper
│
├── controllers/               # Business Logic & Controllers
│   ├── authController.js      # Register, login, delete user, session telemetry
│   ├── patientController.js   # Triage CRUD, wait times, nurse overrides, reslotting
│   ├── vitalsController.js    # IoT wristband vitals streaming & deterioration alert
│   ├── roomController.js      # Room allocations, turnover timers, sterilization
│   ├── staffController.js     # Staff directory & dynamic surge reallocations
│   ├── surgeController.js     # Predictive surge ML forecast & spike trigger
│   ├── appointmentController.js # Self-service appointment scheduling & kiosk checkin
│   ├── auditController.js     # System audit trail queries
│   └── systemController.js    # Health check & database statistics
│
├── routes/                    # API Routing Layer
│   ├── authRoutes.js          # /api/auth/*
│   ├── patientRoutes.js       # /api/patients/*
│   ├── roomRoutes.js          # /api/rooms/*
│   ├── staffRoutes.js         # /api/staff/*
│   ├── surgeRoutes.js         # /api/surge/*
│   ├── appointmentRoutes.js   # /api/appointments/*
│   ├── auditRoutes.js         # /api/audit-logs
│   ├── systemRoutes.js        # /api/health, /api/system/stats
│   └── sseRoutes.js           # /api/events (Real-Time Server-Sent Events)
│
├── services/                  # Shared Domain Services
│   ├── priorityEngine.js      # Clinical priority index & deltaV calculation
│   └── sseService.js          # Real-time pub/sub event broadcaster
│
└── docs/                      # Documentation Layer
    └── apiDocs.js             # Interactive Dark-Mode API Explorer (/api/docs)
```

---

## 🚀 Running the Backend

From the project root:
```bash
npm run server
```

Or from inside `server/`:
```bash
cd server
npm start
```

Runs on **http://127.0.0.1:3001**.

---

## 📚 Interactive API Documentation & Explorer

Visit **http://127.0.0.1:3001/api/docs** in your browser.  
You can test endpoints directly from the browser with live server responses, latency metrics, and example payloads.

---

## ⚡ Real-Time Server-Sent Events (`/api/events`)

The backend broadcasts live push notifications to connected clients:
- `patient:created`
- `patient:deleted`
- `patient:wait_updated`
- `patient:overridden`
- `vitals:stream`
- `vitals:alert` (critical deterioration threshold breach)
- `room:updated`
- `user:registered`
- `user:login`
- `user:deleted`

---

## 💾 Database Schema (`ihms.db`)

1. **`users`**: User accounts (Doctor, Receptionist, Patient) with hashed/plain passwords, roles, and profiles.
2. **`user_logins`**: Session telemetry audit logging all login attempts (`SUCCESS`, `FAILED`, `REGISTERED`), IP, and client user-agents.
3. **`patients`**: Live triage records, arrival times, wait times, ESI scores, delay telemetry, assigned rooms.
4. **`vitals_stream`**: IoT telemetry time-series (heart rate, SpO2, temp, pain score, deterioration score $\Delta V$).
5. **`rooms`**: Hospital suites, equipment list, occupancy, and UV sterilization turnover countdowns.
6. **`staff`**: Clinical staff rosters, assigned zones, and surge load.
7. **`surge_forecast`**: Predictive hourly surge probability and arrival volume.
8. **`appointments`**: Patient self-scheduled visits, digital passes, and geofenced ETA intake.
9. **`audit_logs`**: Tamper-evident clinical compliance audit trail.
