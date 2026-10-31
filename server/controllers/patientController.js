// Patient & Clinical Triage Controller
const { db } = require('../config/database');
const { formatPatient, logAudit } = require('../services/priorityEngine');
const sseService = require('../services/sseService');

function getPatients(req, res) {
  try {
    const rows = db.prepare('SELECT * FROM patients ORDER BY checked_in_minutes_ago DESC').all();
    const formatted = rows.map(r => formatPatient(r, db));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch patients from database' });
  }
}

function getPatientById(req, res) {
  try {
    const row = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Patient not found' });
    res.json(formatPatient(row, db));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
}

function createPatient(req, res) {
  try {
    const { 
      name, 
      age, 
      gender, 
      esi, 
      chiefComplaint, 
      requiredEquipment, 
      hr, 
      spo2, 
      pain,
      arrivalTime: customArrivalTime,
      checkedInMinutesAgo: customWait
    } = req.body;

    const newId = `P-${Date.now().toString().slice(-4)}`;
    const wristbandId = `WB-${Math.floor(1000 + Math.random() * 9000)}`;
    const arrivalTime = customArrivalTime || new Date().toTimeString().split(' ')[0].slice(0, 5);
    const initialWait = customWait !== undefined && customWait !== null ? Math.max(0, parseInt(customWait)) : 0;

    const stmt = db.prepare(`
      INSERT INTO patients (
        id, name, age, gender, wristband_id, esi, chief_complaint, required_equipment,
        arrival_time, checked_in_minutes_ago, status, assigned_room_id, manual_override_boost,
        micro_wait_step, micro_wait_doctor_est_mins, micro_wait_sanitization_est_mins, micro_wait_doctor, micro_wait_target_room
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, 'waiting', NULL, 0,
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
      arrivalTime,
      initialWait
    );

    // Initial vitals stream entry
    db.prepare(`
      INSERT INTO vitals_stream (patient_id, heart_rate, spo2, temperature, pain_score, deterioration_score, is_critical)
      VALUES (?, ?, ?, 37.0, ?, 0.0, 0)
    `).run(newId, parseInt(hr) || 80, parseInt(spo2) || 98, parseInt(pain) || 2);

    // Record audit log
    logAudit(
      db,
      'Triage Reception',
      'PATIENT_REGISTERED',
      newId,
      name || 'Anonymous Patient',
      `New walk-in patient triaged (ESI ${esi}). Wristband ${wristbandId} paired. Initial wait time: ${initialWait}m.`
    );

    const created = db.prepare('SELECT * FROM patients WHERE id = ?').get(newId);
    const formatted = formatPatient(created, db);

    // Broadcast real-time event
    sseService.broadcast('patient:created', formatted);

    res.status(201).json(formatted);
  } catch (err) {
    console.error('Create patient error:', err);
    res.status(500).json({ error: 'Failed to create patient' });
  }
}

function deletePatient(req, res) {
  try {
    const patientId = req.params.id;
    const pat = db.prepare('SELECT * FROM patients WHERE id = ?').get(patientId);
    if (!pat) return res.status(404).json({ error: 'Patient not found' });

    // Delete associated vitals_stream rows and patient
    db.prepare('DELETE FROM vitals_stream WHERE patient_id = ?').run(patientId);
    db.prepare('DELETE FROM patients WHERE id = ?').run(patientId);

    // If patient was in a room, release room
    if (pat.assigned_room_id) {
      db.prepare(`
        UPDATE rooms 
        SET status = 'Available', current_patient_id = NULL, current_patient_name = NULL 
        WHERE id = ?
      `).run(pat.assigned_room_id);
      sseService.broadcast('room:updated', { roomId: pat.assigned_room_id, status: 'Available' });
    }

    logAudit(
      db,
      'Triage Coordinator',
      'PATIENT_DISCHARGED_OR_REMOVED',
      patientId,
      pat.name,
      'Patient removed/discharged from triage queue. Average waiting time and remaining queue positions re-indexed.'
    );

    // Broadcast real-time event
    sseService.broadcast('patient:deleted', { patientId, patientName: pat.name });

    res.json({ success: true, patientId, patientName: pat.name });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete patient' });
  }
}

function updateWaitTime(req, res) {
  try {
    const patientId = req.params.id;
    const { checkedInMinutesAgo } = req.body;
    const mins = Math.max(0, parseInt(checkedInMinutesAgo, 10) || 0);

    const pat = db.prepare('SELECT * FROM patients WHERE id = ?').get(patientId);
    if (!pat) return res.status(404).json({ error: 'Patient not found' });

    db.prepare('UPDATE patients SET checked_in_minutes_ago = ? WHERE id = ?').run(mins, patientId);

    logAudit(
      db,
      'Triage Coordinator',
      'WAIT_TIME_ADJUSTED',
      patientId,
      pat.name,
      `Waiting time updated in real time to ${mins} minutes. Priority index and queue rank re-indexed.`
    );

    const updated = db.prepare('SELECT * FROM patients WHERE id = ?').get(patientId);
    const formatted = formatPatient(updated, db);

    // Broadcast real-time event
    sseService.broadcast('patient:wait_updated', formatted);

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update wait time' });
  }
}

function overridePriority(req, res) {
  try {
    const patientId = req.params.id;
    const { boost, reason, notes } = req.body;

    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(patientId);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const newBoost = (patient.manual_override_boost || 0) + (parseFloat(boost) || 0.25);
    db.prepare('UPDATE patients SET manual_override_boost = ? WHERE id = ?').run(newBoost, patientId);

    logAudit(
      db,
      'Triage Nurse',
      'MANUAL_TRIAGE_OVERRIDE',
      patientId,
      patient.name,
      `Manual triage boost +${parseFloat(boost).toFixed(2)}. Reason: ${reason}. Clinical notes: ${notes}`
    );

    const updated = db.prepare('SELECT * FROM patients WHERE id = ?').get(patientId);
    const formatted = formatPatient(updated, db);

    // Broadcast real-time event
    sseService.broadcast('patient:overridden', formatted);

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to override priority' });
  }
}

function reslotPatient(req, res) {
  try {
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

      logAudit(
        db,
        'Auto-Scheduler Bot',
        'SMART_RESLOT_ACCEPTED',
        patientId,
        patient.name,
        'Patient accepted 20-min re-slot. Priority preserved; prior slot given to walk-in pool.'
      );
    } else {
      db.prepare('UPDATE patients SET eta_delay_is_delayed = 0 WHERE id = ?').run(patientId);
    }

    const updated = db.prepare('SELECT * FROM patients WHERE id = ?').get(patientId);
    const formatted = formatPatient(updated, db);

    // Broadcast real-time event
    sseService.broadcast('patient:reslotted', formatted);

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to reslot patient' });
  }
}

module.exports = {
  getPatients,
  getPatientById,
  createPatient,
  deletePatient,
  updateWaitTime,
  overridePriority,
  reslotPatient
};
