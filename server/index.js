const express = require('express');
const cors = require('cors');
const { db, DB_PATH } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Helper to format patient record from SQLite rows
function formatPatient(row) {
  if (!row) return null;

  // Fetch recent vitals history
  const recentVitals = db.prepare(`
    SELECT heart_rate, spo2, temperature, pain_score, deterioration_score, is_critical
    FROM vitals_stream
    WHERE patient_id = ?
    ORDER BY id DESC
    LIMIT 10
  `).all(row.id).reverse();

  const latest = recentVitals[recentVitals.length - 1] || {
    heart_rate: 75,
    spo2: 98,
    temperature: 37.0,
    pain_score: 2,
    deterioration_score: 0,
    is_critical: 0
  };

  const hrHistory = recentVitals.map(v => v.heart_rate);

  let requiredEquipment = [];
  try {
    requiredEquipment = JSON.parse(row.required_equipment);
  } catch (e) {
    requiredEquipment = [];
  }

  return {
    id: row.id,
    name: row.name,
    age: row.age,
    gender: row.gender,
    wristbandId: row.wristband_id,
    esi: row.esi,
    chiefComplaint: row.chief_complaint,
    requiredEquipment,
    checkedInMinutesAgo: row.checked_in_minutes_ago,
    arrivalTime: row.arrival_time,
    status: row.status,
    assignedRoomId: row.assigned_room_id,
    manualOverrideBoost: row.manual_override_boost || 0,
    etaDelay: {
      isDelayed: Boolean(row.eta_delay_is_delayed),
      delayMins: row.eta_delay_mins || 0,
      lateRisk: Boolean(row.eta_delay_late_risk),
      gpsLocation: row.eta_delay_location,
      proposedReslotTime: row.eta_delay_proposed_reslot,
      transitMode: row.eta_delay_is_delayed ? 'Highway Transit' : 'Waiting Area'
    },
    liveVitals: {
      hr: latest.heart_rate,
      spo2: latest.spo2,
      temp: latest.temperature,
      pain: latest.pain_score,
      deltaV: latest.deterioration_score,
      isCritical: Boolean(latest.is_critical),
      history: hrHistory.length > 0 ? hrHistory : [latest.heart_rate]
    },
    microWait: {
      step: row.micro_wait_step || 1,
      doctorEstMins: row.micro_wait_doctor_est_mins || 4,
      sanitizationEstMins: row.micro_wait_sanitization_est_mins || 3,
      currentDoctor: row.micro_wait_doctor || 'Duty Physician',
      targetRoom: row.micro_wait_target_room || 'Assigned Room'
    }
  };
}

// -------------------------------------------------------------
// System Health & DB Statistics
// -------------------------------------------------------------
app.get('/api/health', (req, res) => {
  const patientCount = db.prepare('SELECT COUNT(*) as count FROM patients').get().count;
  const vitalsCount = db.prepare('SELECT COUNT(*) as count FROM vitals_stream').get().count;
  const roomCount = db.prepare('SELECT COUNT(*) as count FROM rooms').get().count;
  const logCount = db.prepare('SELECT COUNT(*) as count FROM audit_logs').get().count;

  res.json({
    status: 'online',
    database: 'SQLite 3 (WAL mode)',
    databaseFile: DB_PATH,
    counts: {
      patients: patientCount,
      vitalsStreamRecords: vitalsCount,
      rooms: roomCount,
      auditLogs: logCount
    }
  });
});

// -------------------------------------------------------------
// Patients Endpoints
// -------------------------------------------------------------
app.get('/api/patients', (req, res) => {
  const rows = db.prepare('SELECT * FROM patients ORDER BY checked_in_minutes_ago DESC').all();
  const formatted = rows.map(formatPatient);
  res.json(formatted);
});

app.post('/api/patients', (req, res) => {
  const { name, age, gender, esi, chiefComplaint, requiredEquipment, hr, spo2, pain } = req.body;
  const newId = `P-${Date.now().toString().slice(-4)}`;
  const wristbandId = `WB-${Math.floor(1000 + Math.random() * 9000)}`;
  const arrivalTime = new Date().toTimeString().split(' ')[0].slice(0, 5);

  const stmt = db.prepare(`
    INSERT INTO patients (
      id, name, age, gender, wristband_id, esi, chief_complaint, required_equipment,
      arrival_time, checked_in_minutes_ago, status, assigned_room_id, manual_override_boost,
      micro_wait_step, micro_wait_doctor_est_mins, micro_wait_sanitization_est_mins, micro_wait_doctor, micro_wait_target_room
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, 0, 'waiting', NULL, 0,
      1, 5, 3, 'Dr. Michael Chen', 'Room 103 (Ultrasound Ready)'
    )
  `);

  stmt.run(
    newId,
    name || 'Anonymous Patient',
    parseInt(age) || 35,
    gender || 'Female',
    wristbandId,
    parseInt(esi) || 3,
    chiefComplaint || 'Acute triage symptoms',
    JSON.stringify(requiredEquipment || []),
    arrivalTime
  );

  // Initial vitals stream entry
  db.prepare(`
    INSERT INTO vitals_stream (patient_id, heart_rate, spo2, temperature, pain_score, deterioration_score, is_critical)
    VALUES (?, ?, ?, 37.0, ?, 0.0, 0)
  `).run(newId, parseInt(hr) || 80, parseInt(spo2) || 98, parseInt(pain) || 2);

  // Log in audit
  db.prepare(`
    INSERT INTO audit_logs (id, timestamp, user, action, patient_id, patient_name, details)
    VALUES (?, ?, 'Triage Reception', 'PATIENT_REGISTERED', ?, ?, ?)
  `).run(
    `LOG-${Date.now()}`,
    new Date().toTimeString().split(' ')[0],
    newId,
    name,
    `New walk-in patient triaged (ESI ${esi}). Wristband ${wristbandId} paired. Initial vitals recorded in SQLite stream.`
  );

  const created = db.prepare('SELECT * FROM patients WHERE id = ?').get(newId);
  res.status(201).json(formatPatient(created));
});

// Stream IoT vitals reading for patient
app.post('/api/patients/:id/vitals', (req, res) => {
  const patientId = req.params.id;
  const { hr, spo2, temp, pain } = req.body;

  const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(patientId);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  // Calculate deterioration
  let deltaV = 0.0;
  let isCritical = 0;
  if (spo2 < 88) { deltaV += 0.65; isCritical = 1; }
  else if (spo2 < 92) { deltaV += 0.45; isCritical = 1; }
  else if (spo2 < 95) { deltaV += 0.20; }

  if (hr > 135) { deltaV += 0.45; isCritical = 1; }
  else if (hr > 115) { deltaV += 0.30; }

  if (pain >= 9) { deltaV += 0.35; isCritical = 1; }
  else if (pain >= 7) { deltaV += 0.20; }

  deltaV = Math.min(1.0, deltaV);

  db.prepare(`
    INSERT INTO vitals_stream (patient_id, heart_rate, spo2, temperature, pain_score, deterioration_score, is_critical)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(patientId, hr || 80, spo2 || 98, temp || 37.0, pain || 2, deltaV, isCritical);

  if (deltaV >= 0.25) {
    db.prepare(`
      INSERT INTO audit_logs (id, timestamp, user, action, patient_id, patient_name, details)
      VALUES (?, ?, 'IoT Wristband Stream', 'VITALS_DETERIORATION_TRIGGERED', ?, ?, ?)
    `).run(
      `LOG-${Date.now()}`,
      new Date().toTimeString().split(' ')[0],
      patientId,
      patient.name,
      `Vitals threshold breached: SpO2 ${spo2}%, HR ${hr} bpm, Pain ${pain}/10. Deterioration score ΔV: +${deltaV.toFixed(2)}.`
    );
  }

  res.json({ success: true, patientId, deltaV, isCritical });
});

// Clinical triage override
app.post('/api/patients/:id/override', (req, res) => {
  const patientId = req.params.id;
  const { boost, reason, notes } = req.body;

  const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(patientId);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  const newBoost = (patient.manual_override_boost || 0) + (parseFloat(boost) || 0.25);
  db.prepare('UPDATE patients SET manual_override_boost = ? WHERE id = ?').run(newBoost, patientId);

  db.prepare(`
    INSERT INTO audit_logs (id, timestamp, user, action, patient_id, patient_name, details)
    VALUES (?, ?, 'Triage Nurse', 'MANUAL_TRIAGE_OVERRIDE', ?, ?, ?)
  `).run(
    `LOG-${Date.now()}`,
    new Date().toTimeString().split(' ')[0],
    patientId,
    patient.name,
    `Manual triage boost +${parseFloat(boost).toFixed(2)}. Reason: ${reason}. Clinical notes: ${notes}`
  );

  const updated = db.prepare('SELECT * FROM patients WHERE id = ?').get(patientId);
  res.json(formatPatient(updated));
});

// Smart delay re-slot action
app.post('/api/patients/:id/reslot', (req, res) => {
  const patientId = req.params.id;
  const { accepted } = req.body;

  const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(patientId);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  if (accepted) {
    db.prepare(`
      UPDATE patients 
      SET eta_delay_is_delayed = 0, eta_delay_late_risk = 0, status = 'waiting'
      WHERE id = ?
    `).run(patientId);

    db.prepare(`
      INSERT INTO audit_logs (id, timestamp, user, action, patient_id, patient_name, details)
      VALUES (?, ?, 'Auto-Scheduler Bot', 'SMART_RESLOT_ACCEPTED', ?, ?, ?)
    `).run(
      `LOG-${Date.now()}`,
      new Date().toTimeString().split(' ')[0],
      patientId,
      patient.name,
      'Patient accepted 20-min re-slot. Priority preserved; prior slot given to walk-in pool.'
    );
  } else {
    db.prepare('UPDATE patients SET eta_delay_is_delayed = 0 WHERE id = ?').run(patientId);
  }

  const updated = db.prepare('SELECT * FROM patients WHERE id = ?').get(patientId);
  res.json(formatPatient(updated));
});

// -------------------------------------------------------------
// Rooms Endpoints
// -------------------------------------------------------------
app.get('/api/rooms', (req, res) => {
  const rows = db.prepare('SELECT * FROM rooms').all();
  const formatted = rows.map(r => ({
    id: r.id,
    name: r.name,
    wing: r.wing,
    specialty: r.specialty,
    equipped: JSON.parse(r.equipped || '[]'),
    status: r.status,
    currentPatientName: r.current_patient_name,
    turnoverTimer: r.turnover_timer,
    totalSanitizeSeconds: r.total_sanitize_seconds,
    remainingSanitizeSeconds: r.remaining_sanitize_seconds,
    cleanerAssigned: r.cleaner_assigned
  }));
  res.json(formatted);
});

app.post('/api/rooms/:id/assign', (req, res) => {
  const roomId = req.params.id;
  const { patientId } = req.body;

  const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(patientId);
  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId);

  if (!room || !patient) return res.status(404).json({ error: 'Room or patient not found' });

  db.prepare(`
    UPDATE rooms 
    SET status = 'Occupied', current_patient_id = ?, current_patient_name = ?, remaining_sanitize_seconds = 0
    WHERE id = ?
  `).run(patientId, `${patient.name} (${patient.chief_complaint})`, roomId);

  db.prepare(`
    UPDATE patients
    SET status = 'in-consultation', assigned_room_id = ?, micro_wait_step = 3, micro_wait_target_room = ?
    WHERE id = ?
  `).run(roomId, room.name, patientId);

  db.prepare(`
    INSERT INTO audit_logs (id, timestamp, user, action, patient_id, patient_name, details)
    VALUES (?, ?, 'Constraint Solver', 'ROOM_ASSIGNED', ?, ?, ?)
  `).run(
    `LOG-${Date.now()}`,
    new Date().toTimeString().split(' ')[0],
    patientId,
    patient.name,
    `Assigned to ${room.name}. Required equipment satisfied by room tooling.`
  );

  res.json({ success: true, roomId, patientId });
});

app.post('/api/rooms/:id/conclude', (req, res) => {
  const roomId = req.params.id;
  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  db.prepare(`
    UPDATE rooms 
    SET status = 'Sanitization Pending', current_patient_id = NULL, current_patient_name = NULL, 
        remaining_sanitize_seconds = total_sanitize_seconds, cleaner_assigned = 'Housekeeping Staff #14'
    WHERE id = ?
  `).run(roomId);

  db.prepare(`
    INSERT INTO audit_logs (id, timestamp, user, action, patient_id, patient_name, details)
    VALUES (?, ?, 'Attending Physician', 'CONSULTATION_CONCLUDED', NULL, ?, ?)
  `).run(
    `LOG-${Date.now()}`,
    new Date().toTimeString().split(' ')[0],
    room.name,
    'Consultation finished. Room status transitioned to Sanitization Pending.'
  );

  res.json({ success: true, roomId });
});

app.post('/api/rooms/:id/sanitize-complete', (req, res) => {
  const roomId = req.params.id;
  const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId);
  if (!room) return res.status(404).json({ error: 'Room not found' });

  db.prepare(`
    UPDATE rooms 
    SET status = 'Available', remaining_sanitize_seconds = 0, cleaner_assigned = NULL
    WHERE id = ?
  `).run(roomId);

  db.prepare(`
    INSERT INTO audit_logs (id, timestamp, user, action, patient_id, patient_name, details)
    VALUES (?, ?, 'Housekeeping Supervisor', 'SANITIZATION_COMPLETE', NULL, ?, ?)
  `).run(
    `LOG-${Date.now()}`,
    new Date().toTimeString().split(' ')[0],
    room.name,
    'Room sterilized & reset. Constraint solver notified for new patient intake.'
  );

  res.json({ success: true, roomId });
});

// -------------------------------------------------------------
// Staff & Surge Endpoints
// -------------------------------------------------------------
app.get('/api/staff', (req, res) => {
  const staff = db.prepare('SELECT * FROM staff').all().map(s => ({
    id: s.id,
    name: s.name,
    department: s.department,
    assignedZone: s.assigned_zone,
    activePatients: s.active_patients
  }));
  res.json(staff);
});

app.post('/api/staff/reallocate', (req, res) => {
  db.prepare(`
    UPDATE staff 
    SET assigned_zone = 'ER Triage (Re-allocated)', active_patients = active_patients + 2
    WHERE name LIKE '%Adams%'
  `).run();

  db.prepare(`
    INSERT INTO audit_logs (id, timestamp, user, action, patient_id, patient_name, details)
    VALUES (?, ?, 'Surge Control AI', 'STAFF_REALLOCATION_COMMITTED', 'ST-04', 'Dr. James Adams', ?)
  `).run(
    `LOG-${Date.now()}`,
    new Date().toTimeString().split(' ')[0],
    'Reallocated to ER Triage in response to predicted 15:00 surge threshold spike (Sh > 0.85).'
  );

  res.json({ success: true, reallocated: 'Dr. James Adams' });
});

app.get('/api/surge', (req, res) => {
  const rows = db.prepare('SELECT * FROM surge_forecast').all().map(r => ({
    hour: r.hour,
    surgeProb: r.surge_prob,
    expectedArrivals: r.expected_arrivals,
    status: r.status
  }));
  res.json(rows);
});

app.post('/api/surge/spike', (req, res) => {
  db.prepare(`
    UPDATE surge_forecast 
    SET surge_prob = 0.96, expected_arrivals = 32, status = 'SURGE_CRITICAL'
    WHERE hour IN ('15:00', '16:00')
  `).run();

  db.prepare(`
    INSERT INTO audit_logs (id, timestamp, user, action, patient_id, patient_name, details)
    VALUES (?, ?, 'ML Weather Correlator', 'SURGE_PREDICTION_SPIKE', NULL, 'Hospital Influx', ?)
  `).run(
    `LOG-${Date.now()}`,
    new Date().toTimeString().split(' ')[0],
    'Severe thunderstorm squall and highway collision correlated. Surge probability elevated to 96%.'
  );

  res.json({ success: true });
});

// -------------------------------------------------------------
// Audit Logs Endpoint
// -------------------------------------------------------------
app.get('/api/audit-logs', (req, res) => {
  const logs = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50').all().map(l => ({
    id: l.id,
    timestamp: l.timestamp,
    user: l.user,
    action: l.action,
    patientId: l.patient_id,
    patientName: l.patient_name,
    details: l.details
  }));
  res.json(logs);
});

app.listen(PORT, () => {
  console.log(`IHMS Express Backend running on http://127.0.0.1:${PORT}`);
  console.log(`Connected to SQLite Database: ${DB_PATH}`);
});
