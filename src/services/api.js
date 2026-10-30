// API client for communicating with IHMS SQLite Express backend
const API_BASE = 'http://127.0.0.1:3001/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('API server unreachable');
  return res.json();
}

export async function fetchPatients() {
  const res = await fetch(`${API_BASE}/patients`);
  if (!res.ok) throw new Error('Failed to fetch patients');
  return res.json();
}

export async function createPatient(patientData) {
  const res = await fetch(`${API_BASE}/patients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patientData)
  });
  if (!res.ok) throw new Error('Failed to create patient');
  return res.json();
}

export async function streamPatientVitals(patientId, vitals) {
  const res = await fetch(`${API_BASE}/patients/${patientId}/vitals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(vitals)
  });
  if (!res.ok) throw new Error('Failed to stream vitals');
  return res.json();
}

export async function overridePatientPriority(patientId, boost, reason, notes) {
  const res = await fetch(`${API_BASE}/patients/${patientId}/override`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ boost, reason, notes })
  });
  if (!res.ok) throw new Error('Failed to override priority');
  return res.json();
}

export async function reslotPatient(patientId, accepted) {
  const res = await fetch(`${API_BASE}/patients/${patientId}/reslot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accepted })
  });
  if (!res.ok) throw new Error('Failed to reslot patient');
  return res.json();
}

export async function fetchRooms() {
  const res = await fetch(`${API_BASE}/rooms`);
  if (!res.ok) throw new Error('Failed to fetch rooms');
  return res.json();
}

export async function assignRoom(roomId, patientId) {
  const res = await fetch(`${API_BASE}/rooms/${roomId}/assign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patientId })
  });
  if (!res.ok) throw new Error('Failed to assign room');
  return res.json();
}

export async function concludeConsultation(roomId) {
  const res = await fetch(`${API_BASE}/rooms/${roomId}/conclude`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to conclude consultation');
  return res.json();
}

export async function completeSanitization(roomId) {
  const res = await fetch(`${API_BASE}/rooms/${roomId}/sanitize-complete`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to complete sanitization');
  return res.json();
}

export async function fetchStaff() {
  const res = await fetch(`${API_BASE}/staff`);
  if (!res.ok) throw new Error('Failed to fetch staff');
  return res.json();
}

export async function reallocateStaff() {
  const res = await fetch(`${API_BASE}/staff/reallocate`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to reallocate staff');
  return res.json();
}

export async function fetchSurgeForecast() {
  const res = await fetch(`${API_BASE}/surge`);
  if (!res.ok) throw new Error('Failed to fetch surge');
  return res.json();
}

export async function triggerSurgeSpike() {
  const res = await fetch(`${API_BASE}/surge/spike`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to trigger surge');
  return res.json();
}

export async function fetchAuditLogs() {
  const res = await fetch(`${API_BASE}/audit-logs`);
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  return res.json();
}
