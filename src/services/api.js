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

export async function fetchAppointments() {
  const res = await fetch(`${API_BASE}/appointments`);
  if (!res.ok) throw new Error('Failed to fetch appointments');
  return res.json();
}

export async function createAppointment(appointmentData) {
  const res = await fetch(`${API_BASE}/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(appointmentData)
  });
  if (!res.ok) throw new Error('Failed to register appointment');
  return res.json();
}

export async function checkInAppointment(appointmentId) {
  const res = await fetch(`${API_BASE}/appointments/${appointmentId}/checkin`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to check in appointment');
  return res.json();
}

export async function cancelAppointment(appointmentId) {
  const res = await fetch(`${API_BASE}/appointments/${appointmentId}/cancel`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to cancel appointment');
  return res.json();
}

export async function fetchAuthUsers() {
  const res = await fetch(`${API_BASE}/auth/users`);
  if (!res.ok) throw new Error('Failed to fetch auth users');
  return res.json();
}

export async function loginUser(credentials) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Authentication failed' }));
    throw new Error(err.error || 'Authentication failed');
  }
  return res.json();
}

export async function registerUser(userData) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Registration failed' }));
    throw new Error(err.error || 'Registration failed');
  }
  return res.json();
}

export async function fetchLoginHistory() {
  const res = await fetch(`${API_BASE}/auth/logins`);
  if (!res.ok) throw new Error('Failed to fetch login history');
  return res.json();
}

export async function deleteUser(userId) {
  const res = await fetch(`${API_BASE}/auth/users/${userId}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to delete user' }));
    throw new Error(err.error || 'Failed to delete user');
  }
  return res.json();
}

export async function deletePatient(patientId) {
  const res = await fetch(`${API_BASE}/patients/${patientId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete patient');
  return res.json();
}

export async function updatePatientWaitTime(patientId, checkedInMinutesAgo) {
  const res = await fetch(`${API_BASE}/patients/${patientId}/wait-time`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ checkedInMinutesAgo })
  });
  if (!res.ok) throw new Error('Failed to update wait time');
  return res.json();
}

export async function fetchDatabaseStats() {
  const res = await fetch(`${API_BASE}/system/stats`);
  if (!res.ok) throw new Error('Failed to fetch database stats');
  return res.json();
}

// Real-Time Server-Sent Events (SSE) subscriber
export function subscribeToRealTimeEvents(onEvent, onError) {
  try {
    const eventSource = new EventSource(`${API_BASE}/events`);

    eventSource.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (onEvent) onEvent(payload);
      } catch (err) {}
    };

    const eventNames = [
      'connected',
      'patient:created',
      'patient:deleted',
      'patient:wait_updated',
      'patient:overridden',
      'patient:reslotted',
      'patient:assigned',
      'vitals:stream',
      'vitals:alert',
      'room:updated',
      'staff:reallocated',
      'surge:spike',
      'appointment:created',
      'appointment:checked_in',
      'user:registered',
      'user:login',
      'user:deleted'
    ];

    eventNames.forEach(evt => {
      eventSource.addEventListener(evt, (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (onEvent) onEvent({ event: evt, ...payload });
        } catch (err) {}
      });
    });

    eventSource.onerror = (err) => {
      if (onError) onError(err);
    };

    return () => {
      eventSource.close();
    };
  } catch (err) {
    console.warn('SSE subscription error:', err);
    return () => {};
  }
}
