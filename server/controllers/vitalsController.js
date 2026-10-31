// IoT Wristband & Vitals Controller
const { db } = require('../config/database');
const { calculateDeterioration, logAudit } = require('../services/priorityEngine');
const sseService = require('../services/sseService');

function streamVitals(req, res) {
  try {
    const patientId = req.params.id;
    const { hr, spo2, temp, pain } = req.body;

    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(patientId);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const { deltaV, isCritical } = calculateDeterioration(hr, spo2, pain);

    db.prepare(`
      INSERT INTO vitals_stream (patient_id, heart_rate, spo2, temperature, pain_score, deterioration_score, is_critical)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(patientId, hr || 80, spo2 || 98, temp || 37.0, pain || 2, deltaV, isCritical);

    if (deltaV >= 0.25) {
      logAudit(
        db,
        'IoT Wristband Stream',
        'VITALS_DETERIORATION_TRIGGERED',
        patientId,
        patient.name,
        `Vitals threshold breached: SpO2 ${spo2}%, HR ${hr} bpm, Pain ${pain}/10. Deterioration score ΔV: +${deltaV.toFixed(2)}.`
      );

      // Broadcast high priority clinical alert
      sseService.broadcast('vitals:alert', {
        patientId,
        patientName: patient.name,
        hr,
        spo2,
        pain,
        deltaV,
        isCritical: Boolean(isCritical)
      });
    }

    // Broadcast live telemetry
    sseService.broadcast('vitals:stream', {
      patientId,
      hr: hr || 80,
      spo2: spo2 || 98,
      temp: temp || 37.0,
      pain: pain || 2,
      deltaV,
      isCritical: Boolean(isCritical)
    });

    res.json({ success: true, patientId, deltaV, isCritical: Boolean(isCritical) });
  } catch (err) {
    console.error('Vitals stream error:', err);
    res.status(500).json({ error: 'Failed to record vitals stream' });
  }
}

function getPatientVitals(req, res) {
  try {
    const patientId = req.params.id;
    const vitals = db.prepare(`
      SELECT heart_rate, spo2, temperature, pain_score, deterioration_score, is_critical, recorded_at
      FROM vitals_stream
      WHERE patient_id = ?
      ORDER BY id DESC
      LIMIT 50
    `).all(patientId);

    res.json(vitals);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch patient vitals history' });
  }
}

module.exports = {
  streamVitals,
  getPatientVitals
};
