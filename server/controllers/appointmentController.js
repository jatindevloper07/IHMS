// Patient Self-Service Appointments Controller
const { db } = require('../config/database');
const { logAudit, formatPatient } = require('../services/priorityEngine');
const sseService = require('../services/sseService');

function getAppointments(req, res) {
  try {
    const rows = db.prepare('SELECT * FROM appointments ORDER BY created_at DESC').all();
    const formatted = rows.map(a => ({
      id: a.id,
      patientName: a.patient_name,
      age: a.age,
      gender: a.gender,
      phone: a.phone,
      email: a.email,
      department: a.department,
      chiefComplaint: a.chief_complaint,
      esi: a.esi,
      requiredEquipment: JSON.parse(a.required_equipment || '[]'),
      painLevel: a.pain_level,
      appointmentTime: a.appointment_time,
      appointmentDate: a.appointment_date,
      slotType: a.slot_type,
      estimatedWaitMins: a.estimated_wait_mins,
      distanceKm: a.distance_km,
      geofencingOptIn: Boolean(a.geofencing_opt_in),
      digitalPassId: a.digital_pass_id,
      status: a.status,
      createdAt: a.created_at
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
}

function createAppointment(req, res) {
  try {
    const {
      patientName,
      age,
      gender,
      phone,
      email,
      department,
      chiefComplaint,
      esi,
      requiredEquipment,
      painLevel,
      appointmentTime,
      appointmentDate,
      slotType,
      estimatedWaitMins,
      distanceKm,
      geofencingOptIn
    } = req.body;

    const id = `APT-${Date.now().toString().slice(-4)}`;
    const digitalPassId = `PASS-${Math.floor(1000 + Math.random() * 9000)}`;

    db.prepare(`
      INSERT INTO appointments (
        id, patient_name, age, gender, phone, email, department, chief_complaint, esi,
        required_equipment, pain_level, appointment_time, appointment_date, slot_type,
        estimated_wait_mins, distance_km, geofencing_opt_in, digital_pass_id, status
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, 'Scheduled'
      )
    `).run(
      id,
      patientName,
      parseInt(age) || 30,
      gender || 'Female',
      phone || '',
      email || '',
      department || 'General Internal Medicine',
      chiefComplaint || 'Self-registered symptom intake',
      parseInt(esi) || 3,
      JSON.stringify(requiredEquipment || []),
      parseInt(painLevel) || 2,
      appointmentTime || '19:30',
      appointmentDate || 'Today',
      slotType || 'AI Smart Intake Slot',
      parseInt(estimatedWaitMins) || 8,
      parseFloat(distanceKm) || 4.2,
      geofencingOptIn !== false ? 1 : 0,
      digitalPassId
    );

    logAudit(
      db,
      'Patient Self-Service',
      'APPOINTMENT_SCHEDULED',
      id,
      patientName,
      `Self-registered appointment created (${department}, ${appointmentTime}). Digital Pass ${digitalPassId} issued.`
    );

    const created = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id);
    const result = {
      id: created.id,
      patientName: created.patient_name,
      age: created.age,
      gender: created.gender,
      phone: created.phone,
      email: created.email,
      department: created.department,
      chiefComplaint: created.chief_complaint,
      esi: created.esi,
      requiredEquipment: JSON.parse(created.required_equipment || '[]'),
      painLevel: created.pain_level,
      appointmentTime: created.appointment_time,
      appointmentDate: created.appointment_date,
      slotType: created.slot_type,
      estimatedWaitMins: created.estimated_wait_mins,
      distanceKm: created.distance_km,
      geofencingOptIn: Boolean(created.geofencing_opt_in),
      digitalPassId: created.digital_pass_id,
      status: created.status,
      createdAt: created.created_at
    };

    sseService.broadcast('appointment:created', result);

    res.status(201).json(result);
  } catch (err) {
    console.error('Create appointment error:', err);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
}

function checkInAppointment(req, res) {
  try {
    const apptId = req.params.id;
    const appt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(apptId);
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });

    // Update appointment status
    db.prepare("UPDATE appointments SET status = 'Checked-In' WHERE id = ?").run(apptId);

    // Admit patient into the live waiting queue
    const patientId = `P-${Date.now().toString().slice(-4)}`;
    const wristbandId = `WB-${appt.digital_pass_id ? appt.digital_pass_id.slice(-4) : Math.floor(1000 + Math.random() * 9000)}`;
    const arrivalTime = new Date().toTimeString().split(' ')[0].slice(0, 5);

    db.prepare(`
      INSERT INTO patients (
        id, name, age, gender, wristband_id, esi, chief_complaint, required_equipment,
        arrival_time, checked_in_minutes_ago, status, assigned_room_id, manual_override_boost,
        micro_wait_step, micro_wait_doctor_est_mins, micro_wait_sanitization_est_mins, micro_wait_doctor, micro_wait_target_room
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, 0, 'waiting', NULL, 0,
        1, 4, 3, 'Duty Physician', 'Assigned Room'
      )
    `).run(
      patientId,
      appt.patient_name,
      appt.age,
      appt.gender,
      wristbandId,
      appt.esi,
      appt.chief_complaint,
      appt.required_equipment,
      arrivalTime
    );

    // Initial vitals stream entry
    db.prepare(`
      INSERT INTO vitals_stream (patient_id, heart_rate, spo2, temperature, pain_score, deterioration_score, is_critical)
      VALUES (?, 78, 98, 36.9, ?, 0.0, 0)
    `).run(patientId, appt.pain_level || 2);

    logAudit(
      db,
      'Self-Service Kiosk',
      'APPOINTMENT_CHECKED_IN',
      patientId,
      appt.patient_name,
      `Self-scheduled patient checked in. Admitted into live waiting queue with wristband ${wristbandId}.`
    );

    const createdPat = db.prepare('SELECT * FROM patients WHERE id = ?').get(patientId);
    const formattedPatient = formatPatient(createdPat, db);

    sseService.broadcast('appointment:checked_in', { appointmentId: apptId, patientId, wristbandId });
    sseService.broadcast('patient:created', formattedPatient);

    res.json({ success: true, appointmentId: apptId, patientId, wristbandId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check in appointment' });
  }
}

function cancelAppointment(req, res) {
  try {
    const apptId = req.params.id;
    db.prepare("UPDATE appointments SET status = 'Cancelled' WHERE id = ?").run(apptId);
    sseService.broadcast('appointment:cancelled', { appointmentId: apptId });
    res.json({ success: true, appointmentId: apptId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
}

module.exports = {
  getAppointments,
  createAppointment,
  checkInAppointment,
  cancelAppointment
};
