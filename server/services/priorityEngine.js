// Priority Engine & Patient Serialization Service

function formatPatient(row, db) {
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

  let checkedInMinutesAgo = row.checked_in_minutes_ago !== null && row.checked_in_minutes_ago !== undefined
    ? row.checked_in_minutes_ago
    : 0;

  if (row.checked_in_minutes_ago === null || row.checked_in_minutes_ago === undefined) {
    if (row.status === 'waiting' && row.arrival_time) {
      try {
        const [h, m] = row.arrival_time.split(':').map(Number);
        if (!isNaN(h) && !isNaN(m)) {
          const now = new Date();
          let diff = (now.getHours() * 60 + now.getMinutes()) - (h * 60 + m);
          if (diff < 0) diff += 24 * 60;
          if (diff >= 0 && diff < 720) {
            checkedInMinutesAgo = diff;
          }
        }
      } catch (e) {}
    }
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
    checkedInMinutesAgo,
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

function calculateDeterioration(hr, spo2, pain) {
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
  return { deltaV, isCritical };
}

function logAudit(db, user, action, patientId, patientName, details) {
  const timeStr = new Date().toTimeString().split(' ')[0];
  const id = `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  db.prepare(`
    INSERT INTO audit_logs (id, timestamp, user, action, patient_id, patient_name, details)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, timeStr, user, action, patientId, patientName, details);
  return id;
}

module.exports = {
  formatPatient,
  calculateDeterioration,
  logAudit
};
