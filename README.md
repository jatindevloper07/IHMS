# Intelligent Hospital Management System (IHMS)

An intelligent, predictive, and proactive hospital management ecosystem built with React, Vite, Node.js/Express, and an embedded SQLite relational database.

![IHMS Banner](https://img.shields.io/badge/Status-Production%20Ready-00A896?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Vite%20%7C%20Express%20%7C%20SQLite-0F52BA?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-slate?style=for-the-badge)

---

## 🌟 Key Innovative & Market-Differentiator Features

### 1. Dynamic Patient Deterioration Early Warning System
- **Real-Time IoT Ingestion**: Streams continuous vital signs (Heart Rate, $\text{SpO}_2$, temperature, pain scale) from smart wristbands into the `vitals_stream` timeseries table.
- **Dynamic Priority Formula**:
  $$P(t) = w_1 \cdot U_{\text{clinical}} + w_2 \cdot T_{\text{elapsed}} + w_3 \cdot \Delta V_{\text{deterioration}}$$
  where $w_1 = 0.5$, $w_2 = 0.2$, $w_3 = 0.3$.
- **Live Re-ranking & Audible Alerts**: Immediate queue re-ordering, pulsing crimson indicators, and Web Audio API clinical chimes when patient conditions deteriorate.
- **Inline Sparklines**: Real-time SVG trendlines displaying vital shifts.

### 2. Equipment-Aware Room Turnover & Constraint Solver Matching
- **Constraint Satisfaction Algorithm**:
  $$\text{Match}(P_i, R_j) = \text{IsAvailable}(R_j) \land \text{IsCleaned}(R_j) \land (\text{ReqEquipment}(P_i) \subseteq \text{Equipped}(R_j))$$
- **Turnover Lifecycle Tracking**: Active countdown timers for sanitization transitions (`Available`, `Occupied`, `Sanitization Pending`, `Equipment Maintenance`).
- **Auto-Assignment Prompt**: Matches patients needing specialized tools (e.g., Portable Ultrasound, ENT Kit, ECG) directly to compatible rooms upon sanitization completion.

### 3. AI "Micro-Wait" Transparency & Journey Predictor
- **Patient Mobile Interface**: Realistic mobile experience featuring a 3-stage progress breakdown:
  1. *Step 1*: Physician finalizing prior patient consultation (~4 mins).
  2. *Step 2*: Room sanitization & hygiene setup (~3 mins).
  3. *Step 3*: Ready for patient call.
- **Symptom Self-Reporting**: Slider allows patients to report acute pain or symptom changes, feeding directly into the triage priority calculation and database stream.

### 4. Predictive Capacity & Departmental Surge Control Center
- **12-Hour Surge Heatmap**: Hourly surge probability forecasting ($S_h \in [0, 1]$).
- **External Feeds Ingestion**: Correlates weather alerts (squalls/thunderstorms), traffic telemetry (highway incidents), and regional disease indices.
- **Staff Re-allocation Action**: Single-click roster re-allocation when surge threshold $S_h > 0.85$ is crossed.

### 5. Automated "No-Show & Delay" Mitigation Assistant
- **GPS / ETA Telematics**: Detects transit delays before scheduled appointments.
- **Smart Delay Assistant**: Automatically re-slots delayed patients into a buffer window while offering their immediate slot to on-site walk-in patients.

---

## 🗄️ Database Architecture (SQLite)

The system is powered by an embedded, zero-config relational SQLite database (`ihms.db`) operating in high-performance Write-Ahead Logging (WAL) mode:

| Table | Description |
|---|---|
| `patients` | Patient demographics, ESI triage level, required diagnostic equipment tags, delay ETA, and care micro-wait stages. |
| `vitals_stream` | Time-series stream of heart rate, $\text{SpO}_2$, temperature, and self-reported pain ratings with deterioration flags. |
| `rooms` | Clinical examination rooms, equipped diagnostics (`[Ultrasound]`, `[ECG]`, `[ENT Kit]`, `[X-Ray]`), turnover timers, and sanitization status. |
| `staff` | Clinical staff roster and dynamic duty zone allocations (`ER Triage`, `Outpatient Clinic`). |
| `surge_forecast` | 12-hour hourly machine learning arrival forecasts and probability scores. |
| `audit_logs` | Immutable compliance trail logging clinical overrides, vital drops, and constraint solver room assignments. |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/jatindevloper07/IHMS.git

# Navigate into project directory
cd IHMS

# Install dependencies
npm install
```

### Running the Full-Stack Application
```bash
# Run both Backend API Server and Frontend Client concurrently
npm start
```

Or run them individually in separate terminals:
```bash
# Terminal 1: SQLite Express Backend API (Port 3001)
npm run server

# Terminal 2: Vite React Frontend (Port 5173)
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

---

## 📁 Repository Structure
```
IHMS/
├── docs/                      # Original specifications (PRD, UI/UX, Tech Approach)
│   ├── PRD.md
│   ├── UI_UX_SPEC.md
│   └── TECH_APPROACH.md
├── server/                    # Backend API & Database
│   ├── db.js                  # SQLite database connection & auto-seeding
│   ├── index.js               # Express REST API endpoints
│   └── package.json           # CommonJS package manifest
├── src/
│   ├── components/            # UI modules
│   │   ├── AlertBanner.jsx    # Real-time vital alert banner
│   │   ├── PatientMobileApp.jsx # Patient smartphone simulator
│   │   ├── RoomMatrix.jsx     # Room matrix & turnover tracker
│   │   ├── Sparkline.jsx      # SVG trendline generator
│   │   ├── SurgeControlCenter.jsx # Capacity & ML surge forecast
│   │   └── TriageDashboard.jsx # Clinical queue & manual override
│   ├── services/
│   │   └── api.js             # Frontend API client communicating with SQLite
│   ├── data/
│   │   └── initialData.js     # Fallback mock data
│   ├── utils/
│   │   └── priorityEngine.js  # Mathematical formulations & solver
│   ├── App.jsx                # Application orchestration
│   ├── index.css              # Design tokens & clinical styles
│   └── main.jsx
├── index.html
├── package.json
└── vite.config.js
```

---

## 📄 License
This project is licensed under the MIT License.
