// Schema definition for IHMS SQLite Database

function initSchema(db) {
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

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      patient_name TEXT NOT NULL,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      department TEXT NOT NULL,
      chief_complaint TEXT NOT NULL,
      esi INTEGER NOT NULL DEFAULT 3,
      required_equipment TEXT NOT NULL,
      pain_level INTEGER DEFAULT 2,
      appointment_time TEXT NOT NULL,
      appointment_date TEXT NOT NULL,
      slot_type TEXT NOT NULL,
      estimated_wait_mins INTEGER DEFAULT 10,
      distance_km REAL DEFAULT 5.0,
      geofencing_opt_in INTEGER DEFAULT 1,
      digital_pass_id TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'Scheduled',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      name TEXT NOT NULL,
      title TEXT NOT NULL,
      department TEXT NOT NULL,
      patient_id TEXT,
      phone TEXT,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_logins (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      username TEXT NOT NULL,
      role TEXT,
      name TEXT,
      ip_address TEXT,
      user_agent TEXT,
      login_status TEXT NOT NULL,
      login_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      details TEXT
    );
  `);
}

module.exports = { initSchema };
