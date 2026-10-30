// SQLite Database layer for IHMS
// Uses better-sqlite3 for high-performance, embedded relational storage
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'ihms.db');
const db = new Database(DB_PATH);

// Enable WAL mode for high concurrency
db.pragma('journal_mode = WAL');

// Initialize schema
function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL,
      wristband_id TEXT NOT NULL UNIQUE,
      esi INTEGER NOT NULL,
      chief_complaint TEXT NOT NULL,
      required_equipment TEXT NOT NULL,
      arrival_time TEXT NOT NULL,
      checked_in_minutes_ago INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'waiting',
      assigned_room_id TEXT,
      manual_override_boost REAL DEFAULT 0.0,
      eta_delay_is_delayed INTEGER DEFAULT 0,
      eta_delay_mins INTEGER DEFAULT 0,
      eta_delay_late_risk INTEGER DEFAULT 0,
      eta_delay_location TEXT,
      eta_delay_proposed_reslot TEXT,
      micro_wait_step INTEGER DEFAULT 1,
      micro_wait_doctor_est_mins INTEGER DEFAULT 4,
      micro_wait_sanitization_est_mins INTEGER DEFAULT 3,
      micro_wait_doctor TEXT,
      micro_wait_target_room TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS vitals_stream (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id TEXT NOT NULL,
      heart_rate INTEGER NOT NULL,
      spo2 INTEGER NOT NULL,
      temperature REAL NOT NULL,
      pain_score INTEGER NOT NULL,
      deterioration_score REAL DEFAULT 0.0,
      is_critical INTEGER DEFAULT 0,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(patient_id) REFERENCES patients(id)
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      wing TEXT NOT NULL,
      specialty TEXT NOT NULL,
      equipped TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Available',
      current_patient_id TEXT,
      current_patient_name TEXT,
      turnover_timer INTEGER DEFAULT 0,
      total_sanitize_seconds INTEGER DEFAULT 180,
      remaining_sanitize_seconds INTEGER DEFAULT 0,
      cleaner_assigned TEXT
    );

    CREATE TABLE IF NOT EXISTS staff (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      department TEXT NOT NULL,
      assigned_zone TEXT NOT NULL,
      active_patients INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS surge_forecast (
      hour TEXT PRIMARY KEY,
      surge_prob REAL NOT NULL,
      expected_arrivals INTEGER NOT NULL,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      user TEXT NOT NULL,
      action TEXT NOT NULL,
      patient_id TEXT,
      patient_name TEXT,
      details TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// Seed initial dataset if tables are empty
function seedDatabase() {
  const patientCount = db.prepare('SELECT COUNT(*) as count FROM patients').get().count;
  if (patientCount > 0) return; // Already seeded

  console.log('Seeding initial clinical and operational records into SQLite...');

  // Seed Patients
  const insertPatient = db.prepare(`
    INSERT INTO patients (
      id, name, age, gender, wristband_id, esi, chief_complaint, required_equipment,
      arrival_time, checked_in_minutes_ago, status, assigned_room_id, manual_override_boost,
      eta_delay_is_delayed, eta_delay_mins, eta_delay_late_risk, eta_delay_location, eta_delay_proposed_reslot,
      micro_wait_step, micro_wait_doctor_est_mins, micro_wait_sanitization_est_mins, micro_wait_doctor, micro_wait_target_room
    ) VALUES (
      @id, @name, @age, @gender, @wristbandId, @esi, @chiefComplaint, @requiredEquipment,
      @arrivalTime, @checkedInMinutesAgo, @status, @assignedRoomId, @manualOverrideBoost,
      @etaDelayIsDelayed, @etaDelayMins, @etaDelayLateRisk, @etaDelayLocation, @etaDelayProposedReslot,
      @microWaitStep, @microWaitDoctorEstMins, @microWaitSanitizationEstMins, @microWaitDoctor, @microWaitTargetRoom
    )
  `);

  const insertVitals = db.prepare(`
    INSERT INTO vitals_stream (patient_id, heart_rate, spo2, temperature, pain_score, deterioration_score, is_critical)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const initialPatients = [
    {
      id: 'P-101',
      name: 'Sarah Jenkins',
      age: 58,
      gender: 'Female',
      wristbandId: 'WB-9421',
      esi: 2,
      chiefComplaint: 'Acute Abdominal Pain radiating to flank; suspected nephrolithiasis',
      requiredEquipment: JSON.stringify(['Ultrasound']),
      arrivalTime: '18:22',
      checkedInMinutesAgo: 38,
      status: 'waiting',
      assignedRoomId: null,
      manualOverrideBoost: 0,
      etaDelayIsDelayed: 0,
      etaDelayMins: 0,
      etaDelayLateRisk: 0,
      etaDelayLocation: null,
      etaDelayProposedReslot: null,
      microWaitStep: 1,
      microWaitDoctorEstMins: 4,
      microWaitSanitizationEstMins: 3,
      microWaitDoctor: 'Dr. Michael Chen',
      microWaitTargetRoom: 'Room 103 (Ultrasound Ready)',
      vitals: { hr: 104, spo2: 96, temp: 37.8, pain: 8, deltaV: 0.20, isCritical: 0 }
    },
    {
      id: 'P-102',
      name: 'Marcus Chen',
      age: 34,
      gender: 'Male',
      wristbandId: 'WB-5118',
      esi: 3,
      chiefComplaint: 'Severe Persistent Migraine with photophobia and nausea',
      requiredEquipment: JSON.stringify(['ENT Kit']),
      arrivalTime: '18:15',
      checkedInMinutesAgo: 45,
      status: 'waiting',
      assignedRoomId: null,
      manualOverrideBoost: 0,
      etaDelayIsDelayed: 0,
      etaDelayMins: 0,
      etaDelayLateRisk: 0,
      etaDelayLocation: null,
      etaDelayProposedReslot: null,
      microWaitStep: 1,
      microWaitDoctorEstMins: 7,
      microWaitSanitizationEstMins: 3,
      microWaitDoctor: 'Dr. Amanda Brooks',
      microWaitTargetRoom: 'Room 104 (Fast Track)',
      vitals: { hr: 78, spo2: 99, temp: 36.9, pain: 6, deltaV: 0.0, isCritical: 0 }
    },
    {
      id: 'P-103',
      name: 'Elena Rostova',
      age: 72,
      gender: 'Female',
      wristbandId: 'WB-3084',
      esi: 3,
      chiefComplaint: 'Shortness of breath on exertion, history of CHF',
      requiredEquipment: JSON.stringify(['ECG', 'Ultrasound']),
      arrivalTime: '18:38',
      checkedInMinutesAgo: 22,
      status: 'waiting',
      assignedRoomId: null,
      manualOverrideBoost: 0,
      etaDelayIsDelayed: 0,
      etaDelayMins: 0,
      etaDelayLateRisk: 0,
      etaDelayLocation: null,
      etaDelayProposedReslot: null,
      microWaitStep: 2,
      microWaitDoctorEstMins: 2,
      microWaitSanitizationEstMins: 2,
      microWaitDoctor: 'Dr. Robert Torres',
      microWaitTargetRoom: 'Room 101 (Acute Care)',
      vitals: { hr: 118, spo2: 91, temp: 37.2, pain: 5, deltaV: 0.45, isCritical: 1 }
    },
    {
      id: 'P-104',
      name: 'David Patel',
      age: 41,
      gender: 'Male',
      wristbandId: 'WB-7729',
      esi: 4,
      chiefComplaint: 'Right ankle sprain after soccer injury; non-weight bearing',
      requiredEquipment: JSON.stringify(['Mobile X-Ray']),
      arrivalTime: '18:10',
      checkedInMinutesAgo: 50,
      status: 'waiting',
      assignedRoomId: null,
      manualOverrideBoost: 0,
      etaDelayIsDelayed: 0,
      etaDelayMins: 0,
      etaDelayLateRisk: 0,
      etaDelayLocation: null,
      etaDelayProposedReslot: null,
      microWaitStep: 1,
      microWaitDoctorEstMins: 10,
      microWaitSanitizationEstMins: 3,
      microWaitDoctor: 'Dr. Emily Vance',
      microWaitTargetRoom: 'Room 102 (General Exam)',
      vitals: { hr: 74, spo2: 98, temp: 36.8, pain: 4, deltaV: 0.0, isCritical: 0 }
    },
    {
      id: 'P-105',
      name: 'Chloe Simmons',
      age: 29,
      gender: 'Female',
      wristbandId: 'WB-1299',
      esi: 3,
      chiefComplaint: 'Scheduled Asthma checkup - In transit via vehicle',
      requiredEquipment: JSON.stringify(['ECG']),
      arrivalTime: '18:55',
      checkedInMinutesAgo: 5,
      status: 'delayed-transit',
      assignedRoomId: null,
      manualOverrideBoost: 0,
      etaDelayIsDelayed: 1,
      etaDelayMins: 22,
      etaDelayLateRisk: 1,
      etaDelayLocation: 'I-95 South Corridor (Congestion Slowdown)',
      etaDelayProposedReslot: '19:35',
      microWaitStep: 1,
      microWaitDoctorEstMins: 15,
      microWaitSanitizationEstMins: 3,
      microWaitDoctor: 'Pending Check-in',
      microWaitTargetRoom: 'Pending Transit',
      vitals: { hr: 82, spo2: 97, temp: 36.7, pain: 2, deltaV: 0.0, isCritical: 0 }
    },
    {
      id: 'P-106',
      name: 'Robert Miller',
      age: 63,
      gender: 'Male',
      wristbandId: 'WB-6842',
      esi: 4,
      chiefComplaint: 'Minor laceration on forearm requiring simple sutures',
      requiredEquipment: JSON.stringify(['ENT Kit']),
      arrivalTime: '18:45',
      checkedInMinutesAgo: 15,
      status: 'waiting',
      assignedRoomId: null,
      manualOverrideBoost: 0,
      etaDelayIsDelayed: 0,
      etaDelayMins: 0,
      etaDelayLateRisk: 0,
      etaDelayLocation: null,
      etaDelayProposedReslot: null,
      microWaitStep: 1,
      microWaitDoctorEstMins: 8,
      microWaitSanitizationEstMins: 3,
      microWaitDoctor: 'Dr. Amanda Brooks',
      microWaitTargetRoom: 'Room 104 (Fast Track)',
      vitals: { hr: 70, spo2: 99, temp: 36.6, pain: 3, deltaV: 0.0, isCritical: 0 }
    }
  ];

  const insertAll = db.transaction(() => {
    for (const p of initialPatients) {
      insertPatient.run(p);
      insertVitals.run(p.id, p.vitals.hr, p.vitals.spo2, p.vitals.temp, p.vitals.pain, p.vitals.deltaV, p.vitals.isCritical);
    }

    // Seed Rooms
    const insertRoom = db.prepare(`
      INSERT INTO rooms (
        id, name, wing, specialty, equipped, status, current_patient_name,
        turnover_timer, total_sanitize_seconds, remaining_sanitize_seconds, cleaner_assigned
      ) VALUES (
        @id, @name, @wing, @specialty, @equipped, @status, @currentPatientName,
        @turnoverTimer, @totalSanitizeSeconds, @remainingSanitizeSeconds, @cleanerAssigned
      )
    `);

    const roomsData = [
      {
        id: 'R101',
        name: 'Room 101 - Acute Trauma & Critical',
        wing: 'East Wing - Level 1',
        specialty: 'Trauma & Resuscitation',
        equipped: JSON.stringify(['Ultrasound', 'ECG', 'Defibrillator']),
        status: 'Occupied',
        currentPatientName: 'Arthur Pendelton (Cardiac Follow-up)',
        turnoverTimer: 0,
        totalSanitizeSeconds: 180,
        remainingSanitizeSeconds: 0,
        cleanerAssigned: null
      },
      {
        id: 'R102',
        name: 'Room 102 - General Consult',
        wing: 'East Wing - Level 1',
        specialty: 'General Internal Medicine',
        equipped: JSON.stringify(['ENT Kit', 'ECG']),
        status: 'Sanitization Pending',
        currentPatientName: null,
        turnoverTimer: 140,
        totalSanitizeSeconds: 180,
        remainingSanitizeSeconds: 140,
        cleanerAssigned: 'Maria Santos (Staff #44)'
      },
      {
        id: 'R103',
        name: 'Room 103 - Advanced Imaging Suite',
        wing: 'West Wing - Diagnostic Core',
        specialty: 'Ultrasound & Radiology',
        equipped: JSON.stringify(['Ultrasound', 'Mobile X-Ray']),
        status: 'Available',
        currentPatientName: null,
        turnoverTimer: 0,
        totalSanitizeSeconds: 180,
        remainingSanitizeSeconds: 0,
        cleanerAssigned: null
      },
      {
        id: 'R104',
        name: 'Room 104 - Rapid Fast-Track',
        wing: 'Ambulatory Care Area',
        specialty: 'Minor Injuries & Fast Track',
        equipped: JSON.stringify(['ENT Kit']),
        status: 'Available',
        currentPatientName: null,
        turnoverTimer: 0,
        totalSanitizeSeconds: 120,
        remainingSanitizeSeconds: 0,
        cleanerAssigned: null
      },
      {
        id: 'R105',
        name: 'Room 105 - Cardio Diagnostic Lab',
        wing: 'West Wing - Cardiology',
        specialty: 'Cardiovascular Assessment',
        equipped: JSON.stringify(['ECG', 'Defibrillator', 'Ultrasound']),
        status: 'Occupied',
        currentPatientName: 'Julian Hayes (Post-CABG Eval)',
        turnoverTimer: 0,
        totalSanitizeSeconds: 240,
        remainingSanitizeSeconds: 0,
        cleanerAssigned: null
      }
    ];

    for (const r of roomsData) insertRoom.run(r);

    // Seed Staff
    const insertStaff = db.prepare(`
      INSERT INTO staff (id, name, department, assigned_zone, active_patients)
      VALUES (?, ?, ?, ?, ?)
    `);

    const staffData = [
      ['ST-01', 'Dr. Michael Chen', 'Emergency Medicine', 'ER Triage', 4],
      ['ST-02', 'Dr. Amanda Brooks', 'Ambulatory / Fast Track', 'Outpatient Clinic A', 3],
      ['ST-03', 'Dr. Robert Torres', 'Cardiology & Critical', 'ER Acute', 2],
      ['ST-04', 'Dr. James Adams', 'Internal Medicine', 'Outpatient Clinic B', 1],
      ['ST-05', 'Nurse Sarah Kelly (RN)', 'Triage & Intake', 'Triage Desk 1', 8],
      ['ST-06', 'Nurse David Lin (RN)', 'Triage & Monitoring', 'Wristband Ingestion', 6]
    ];

    for (const s of staffData) insertStaff.run(...s);

    // Seed Surge Forecast
    const insertSurge = db.prepare(`
      INSERT INTO surge_forecast (hour, surge_prob, expected_arrivals, status)
      VALUES (?, ?, ?, ?)
    `);

    const surgeData = [
      ['13:00', 0.35, 8, 'Normal'],
      ['14:00', 0.48, 11, 'Normal'],
      ['15:00', 0.88, 24, 'SURGE_CRITICAL'],
      ['16:00', 0.92, 26, 'SURGE_CRITICAL'],
      ['17:00', 0.74, 18, 'Elevated'],
      ['18:00', 0.62, 14, 'Elevated'],
      ['19:00', 0.55, 12, 'Normal'],
      ['20:00', 0.40, 9, 'Normal'],
      ['21:00', 0.30, 6, 'Normal'],
      ['22:00', 0.25, 5, 'Normal'],
      ['23:00', 0.18, 3, 'Normal'],
      ['00:00', 0.15, 2, 'Normal']
    ];

    for (const sg of surgeData) insertSurge.run(...sg);

    // Seed Audit Logs
    const insertLog = db.prepare(`
      INSERT INTO audit_logs (id, timestamp, user, action, patient_id, patient_name, details)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertLog.run('LOG-1', '18:42:15', 'Nurse S. Kelly', 'SYSTEM_PRIORITY_RECALC', 'P-103', 'Elena Rostova', 'SpO2 dropped below 92% (recorded 91%). Deterioration score escalated from 0.0 to 0.45. Priority Index increased.');
    insertLog.run('LOG-2', '18:31:00', 'Auto-Scheduler Bot', 'DELAY_DETECTED', 'P-105', 'Chloe Simmons', 'GPS telemetry signaled 22m traffic delay on I-95. Slot offer generated for waiting walk-in pool.');
  });

  insertAll();
  console.log('SQLite database initialized & seeded successfully.');
}

initSchema();
seedDatabase();

module.exports = {
  db,
  initSchema,
  seedDatabase,
  DB_PATH
};
