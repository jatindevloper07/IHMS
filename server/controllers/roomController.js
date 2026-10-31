// Room & Capacity Allocation Controller
const { db } = require('../config/database');
const { logAudit } = require('../services/priorityEngine');
const sseService = require('../services/sseService');

function getRooms(req, res) {
  try {
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
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
}

function assignRoom(req, res) {
  try {
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

    logAudit(
      db,
      'Constraint Solver',
      'ROOM_ASSIGNED',
      patientId,
      patient.name,
      `Assigned to ${room.name}. Required equipment satisfied by room tooling.`
    );

    sseService.broadcast('room:updated', { roomId, status: 'Occupied', patientId, patientName: patient.name });
    sseService.broadcast('patient:assigned', { patientId, roomId, roomName: room.name });

    res.json({ success: true, roomId, patientId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to assign room' });
  }
}

function concludeConsultation(req, res) {
  try {
    const roomId = req.params.id;
    const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    db.prepare(`
      UPDATE rooms 
      SET status = 'Sanitization Pending', current_patient_id = NULL, current_patient_name = NULL, 
          remaining_sanitize_seconds = total_sanitize_seconds, cleaner_assigned = 'Housekeeping Staff #14'
      WHERE id = ?
    `).run(roomId);

    logAudit(
      db,
      'Attending Physician',
      'CONSULTATION_CONCLUDED',
      null,
      room.name,
      'Consultation finished. Room status transitioned to Sanitization Pending.'
    );

    sseService.broadcast('room:updated', {
      roomId,
      status: 'Sanitization Pending',
      remainingSanitizeSeconds: room.total_sanitize_seconds
    });

    res.json({ success: true, roomId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to conclude consultation' });
  }
}

function completeSanitization(req, res) {
  try {
    const roomId = req.params.id;
    const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    db.prepare(`
      UPDATE rooms 
      SET status = 'Available', remaining_sanitize_seconds = 0, cleaner_assigned = NULL
      WHERE id = ?
    `).run(roomId);

    logAudit(
      db,
      'Housekeeping Supervisor',
      'SANITIZATION_COMPLETE',
      null,
      room.name,
      'Room sterilized & reset. Constraint solver notified for new patient intake.'
    );

    sseService.broadcast('room:updated', { roomId, status: 'Available' });

    res.json({ success: true, roomId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to complete sanitization' });
  }
}

module.exports = {
  getRooms,
  assignRoom,
  concludeConsultation,
  completeSanitization
};
