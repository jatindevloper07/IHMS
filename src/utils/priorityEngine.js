// Mathematical Formulation & Constraint Matching Engine
// Based on Section 2 & 3 of IHMS Technical Approach Document

export const WEIGHTS = {
  w1: 0.5, // Clinical Urgency weight
  w2: 0.2, // Elapsed wait time starvation weight
  w3: 0.3, // Vitals deterioration weight
};

export const MAX_WAIT_MINUTES = 60;

/**
 * Calculates normalized clinical urgency U_clinical from Emergency Severity Index (ESI 1 to 5)
 * ESI 1: 1.0, ESI 2: 0.8, ESI 3: 0.6, ESI 4: 0.4, ESI 5: 0.2
 */
export function calculateClinicalUrgency(esi) {
  const clampedESI = Math.max(1, Math.min(5, esi || 3));
  return Number(((6 - clampedESI) / 5).toFixed(3));
}

/**
 * Calculates normalized elapsed wait time T_elapsed (0.0 to 1.0)
 */
export function calculateElapsedScore(waitMinutes) {
  return Number(Math.min(1.0, Math.max(0, (waitMinutes || 0) / MAX_WAIT_MINUTES)).toFixed(3));
}

/**
 * Evaluates real-time patient vital sign deterioration score Delta_V
 * Inputs: heartRate (bpm), spO2 (%), painScore (0-10)
 * Returns: score in range [0.0, 1.0] and trigger reasons
 */
export function evaluateDeterioration(vitals = {}) {
  const hr = vitals.hr || 75;
  const spo2 = vitals.spo2 || 98;
  const pain = vitals.pain || 0;

  let score = 0;
  const reasons = [];

  // SpO2 deterioration assessment
  if (spo2 < 88) {
    score += 0.65;
    reasons.push(`Critical Hypoxemia (SpO2 ${spo2}%)`);
  } else if (spo2 < 92) {
    score += 0.45;
    reasons.push(`Severe SpO2 Drop (${spo2}%)`);
  } else if (spo2 < 95) {
    score += 0.20;
    reasons.push(`Borderline SpO2 (${spo2}%)`);
  }

  // Heart Rate deterioration assessment
  if (hr > 135) {
    score += 0.45;
    reasons.push(`Severe Tachycardia (${hr} bpm)`);
  } else if (hr > 115) {
    score += 0.30;
    reasons.push(`Elevated HR (${hr} bpm)`);
  } else if (hr < 45) {
    score += 0.40;
    reasons.push(`Severe Bradycardia (${hr} bpm)`);
  }

  // Pain scale deterioration
  if (pain >= 9) {
    score += 0.35;
    reasons.push(`Excruciating Pain (${pain}/10)`);
  } else if (pain >= 7) {
    score += 0.20;
    reasons.push(`Severe Pain Spike (${pain}/10)`);
  }

  const deltaV = Number(Math.min(1.0, score).toFixed(3));
  return {
    deltaV,
    isDeteriorating: deltaV >= 0.25,
    isCritical: deltaV >= 0.60,
    reasons,
  };
}

/**
 * Calculates accurate elapsed waiting minutes for a patient according to their
 * arrival time, check-in history, or registration timestamp.
 */
export function calculatePatientWaitTime(patient, referenceClock) {
  if (!patient) return 0;

  // 1. If checkedInMinutesAgo is explicitly provided (as a number or numeric string), prioritize it
  if (patient.checkedInMinutesAgo !== undefined && patient.checkedInMinutesAgo !== null && !isNaN(Number(patient.checkedInMinutesAgo))) {
    return Math.max(0, Number(patient.checkedInMinutesAgo));
  }

  // 2. If arrivalTime is present (format "HH:MM")
  if (patient.arrivalTime) {
    try {
      const parts = patient.arrivalTime.split(':');
      if (parts.length >= 2) {
        const arrH = parseInt(parts[0], 10);
        const arrM = parseInt(parts[1], 10);
        if (!isNaN(arrH) && !isNaN(arrM)) {
          let curH, curM;
          if (referenceClock) {
            const refParts = referenceClock.split(':');
            curH = parseInt(refParts[0], 10);
            curM = parseInt(refParts[1], 10);
          } else {
            const now = new Date();
            curH = now.getHours();
            curM = now.getMinutes();
          }

          if (!isNaN(curH) && !isNaN(curM)) {
            let diff = (curH * 60 + curM) - (arrH * 60 + arrM);
            if (diff < 0) diff += 24 * 60; // Rollover past midnight
            if (diff >= 0 && diff < 720) {
              return Math.max(0, diff);
            }
          }
        }
      }
    } catch (e) {}
  }

  // 3. If created_at or createdAt is present
  if (patient.createdAt || patient.created_at) {
    try {
      const created = new Date(patient.createdAt || patient.created_at).getTime();
      if (!isNaN(created)) {
        const diff = Math.floor((Date.now() - created) / 60000);
        if (diff >= 0 && diff < 720) {
          return diff;
        }
      }
    } catch (e) {}
  }

  return 0;
}

/**
 * Computes Dynamic Priority Index P(t)
 * P(t) = w1 * U_clinical + w2 * T_elapsed + w3 * Delta_V
 */
export function calculatePriorityIndex(patient, currentWaitMinutes) {
  const waitMins = currentWaitMinutes ?? calculatePatientWaitTime(patient);
  const uClinical = calculateClinicalUrgency(patient.esi);
  const tElapsed = calculateElapsedScore(waitMins);
  const vitalsEval = evaluateDeterioration(patient.liveVitals);
  const deltaV = vitalsEval.deltaV;

  // If manual override priority is set by triage nurse, factor it in
  const manualBoost = patient.manualOverrideBoost || 0;

  const rawP = (
    WEIGHTS.w1 * uClinical +
    WEIGHTS.w2 * tElapsed +
    WEIGHTS.w3 * deltaV +
    manualBoost
  );

  const finalP = Number(Math.min(1.0, Math.max(0, rawP)).toFixed(3));

  return {
    priorityIndex: finalP,
    waitMinutes: waitMins,
    uClinical,
    tElapsed,
    deltaV,
    isDeteriorating: vitalsEval.isDeteriorating,
    isCritical: vitalsEval.isCritical,
    reasons: vitalsEval.reasons,
  };
}

/**
 * Calculates dynamic predicted wait time until physician consultation
 * based on the patient's queue rank (order ahead) and ESI triage urgency.
 * - When a new patient is added ahead in queue, lower ranked patients' estimated wait increases.
 * - When a patient is removed, fast-tracked, or discharged, remaining patients' wait time decreases!
 */
export function calculateEstimatedWaitToConsult(rankIndex, esi = 3) {
  // Base consultation buffer per patient ahead in queue (~5-7 mins)
  const baseMinutesPerTurn = 6;
  const clampedESI = Math.max(1, Math.min(5, parseInt(esi) || 3));
  
  // Urgent patients have shorter consult queues, lower priority wait a bit more
  const urgencyFactor = clampedESI === 1 ? 0.35 : clampedESI === 2 ? 0.65 : clampedESI === 3 ? 1.0 : clampedESI === 4 ? 1.25 : 1.5;

  if (rankIndex <= 0) {
    return Math.max(2, Math.round(3 * urgencyFactor));
  }

  const estimated = Math.round((rankIndex * baseMinutesPerTurn) * urgencyFactor);
  return Math.max(3, estimated);
}

/**
 * Constraint Satisfaction Solver for Equipment & Specialty-Aware Room Matching
 * Match(P_i, R_j) = IsAvailable(R_j) && IsCleaned(R_j) && (ReqEquipment(P_i) subset of Equipped(R_j))
 */
export function findOptimalRoomMatch(patient, rooms) {
  if (!patient || !rooms || rooms.length === 0) return null;

  const reqEquip = patient.requiredEquipment || [];

  // Filter rooms that are Available and Cleaned (not sanitizing or occupied)
  const candidateRooms = rooms.filter(r => 
    r.status === 'Available' && 
    (r.turnoverTimer === 0 || !r.turnoverTimer)
  );

  // Score candidate rooms based on equipment match and specialty affinity
  const matched = candidateRooms.filter(room => {
    const equipped = room.equipped || [];
    // Check subset: all required equipment must be present in room
    const hasAllEquipment = reqEquip.every(item => equipped.includes(item));
    return hasAllEquipment;
  });

  if (matched.length === 0) return null;

  // Return best room (e.g., fewest excess capabilities to save specialized rooms for complex cases)
  matched.sort((a, b) => (a.equipped.length - reqEquip.length) - (b.equipped.length - reqEquip.length));
  return matched[0];
}

/**
 * Audio chime using Web Audio API for clinical notifications
 */
export function playClinicalChime(isCritical = false) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = isCritical ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(isCritical ? 880 : 587.33, ctx.currentTime); // D5 or A5
    if (isCritical) {
      osc.frequency.setValueAtTime(987.77, ctx.currentTime + 0.1); // B5
      osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.2); // D6
    } else {
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
    }

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (isCritical ? 0.45 : 0.3));

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + (isCritical ? 0.45 : 0.3));
  } catch (e) {
    console.warn('Audio chime note:', e);
  }
}
