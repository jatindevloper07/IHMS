// Initial rich clinical and operational mock data for IHMS
// Conforms to PRD v1.1 and UI/UX Specifications

export const INITIAL_PATIENTS = [
  {
    id: 'P-101',
    name: 'Sarah Jenkins',
    age: 58,
    gender: 'Female',
    wristbandId: 'WB-9421',
    esi: 2, // Emergent
    chiefComplaint: 'Acute Abdominal Pain radiating to flank; suspected nephrolithiasis',
    requiredEquipment: ['Ultrasound'],
    checkedInMinutesAgo: 38,
    arrivalTime: '18:22',
    status: 'waiting', // 'waiting' | 'in-consultation' | 'delayed-transit'
    assignedRoomId: null,
    manualOverrideBoost: 0,
    etaDelay: {
      isDelayed: false,
      delayMins: 0,
      lateRisk: false,
      transitMode: 'On-Premises Waiting Area'
    },
    liveVitals: {
      hr: 104,
      spo2: 96,
      temp: 37.8,
      pain: 8,
      history: [92, 95, 98, 102, 104]
    },
    microWait: {
      step: 1, // 1: Doctor finishing, 2: Sanitization, 3: Call ready
      doctorEstMins: 4,
      sanitizationEstMins: 3,
      currentDoctor: 'Dr. Michael Chen',
      targetRoom: 'Room 103 (Ultrasound Ready)'
    }
  },
  {
    id: 'P-102',
    name: 'Marcus Chen',
    age: 34,
    gender: 'Male',
    wristbandId: 'WB-5118',
    esi: 3, // Urgent
    chiefComplaint: 'Severe Persistent Migraine with photophobia and nausea',
    requiredEquipment: ['ENT Kit'],
    checkedInMinutesAgo: 45,
    arrivalTime: '18:15',
    status: 'waiting',
    assignedRoomId: null,
    manualOverrideBoost: 0,
    etaDelay: {
      isDelayed: false,
      delayMins: 0,
      lateRisk: false,
      transitMode: 'Waiting Room Lounge'
    },
    liveVitals: {
      hr: 78,
      spo2: 99,
      temp: 36.9,
      pain: 6,
      history: [76, 75, 78, 77, 78]
    },
    microWait: {
      step: 1,
      doctorEstMins: 7,
      sanitizationEstMins: 3,
      currentDoctor: 'Dr. Amanda Brooks',
      targetRoom: 'Room 104 (Fast Track)'
    }
  },
  {
    id: 'P-103',
    name: 'Elena Rostova',
    age: 72,
    gender: 'Female',
    wristbandId: 'WB-3084',
    esi: 3, // Urgent initially
    chiefComplaint: 'Shortness of breath on exertion, history of CHF',
    requiredEquipment: ['ECG', 'Ultrasound'],
    checkedInMinutesAgo: 22,
    arrivalTime: '18:38',
    status: 'waiting',
    assignedRoomId: null,
    manualOverrideBoost: 0,
    etaDelay: {
      isDelayed: false,
      delayMins: 0,
      lateRisk: false,
      transitMode: 'Waiting Room Bay 2'
    },
    liveVitals: {
      hr: 118,
      spo2: 91, // Hypoxemic! Triggering deterioration alert
      temp: 37.2,
      pain: 5,
      history: [98, 96, 94, 93, 91]
    },
    microWait: {
      step: 2,
      doctorEstMins: 2,
      sanitizationEstMins: 2,
      currentDoctor: 'Dr. Robert Torres',
      targetRoom: 'Room 101 (Acute Care)'
    }
  },
  {
    id: 'P-104',
    name: 'David Patel',
    age: 41,
    gender: 'Male',
    wristbandId: 'WB-7729',
    esi: 4, // Less Urgent
    chiefComplaint: 'Right ankle sprain after soccer injury; non-weight bearing',
    requiredEquipment: ['Mobile X-Ray'],
    checkedInMinutesAgo: 50,
    arrivalTime: '18:10',
    status: 'waiting',
    assignedRoomId: null,
    manualOverrideBoost: 0,
    etaDelay: {
      isDelayed: false,
      delayMins: 0,
      lateRisk: false,
      transitMode: 'Sub-waiting Area'
    },
    liveVitals: {
      hr: 74,
      spo2: 98,
      temp: 36.8,
      pain: 4,
      history: [72, 73, 74, 75, 74]
    },
    microWait: {
      step: 1,
      doctorEstMins: 10,
      sanitizationEstMins: 3,
      currentDoctor: 'Dr. Emily Vance',
      targetRoom: 'Room 102 (General Exam)'
    }
  },
  {
    id: 'P-105',
    name: 'Chloe Simmons',
    age: 29,
    gender: 'Female',
    wristbandId: 'WB-1299',
    esi: 3, // Urgent
    chiefComplaint: 'Scheduled Asthma checkup - In transit via vehicle',
    requiredEquipment: ['ECG'],
    checkedInMinutesAgo: 5,
    arrivalTime: '18:55',
    status: 'delayed-transit',
    assignedRoomId: null,
    manualOverrideBoost: 0,
    etaDelay: {
      isDelayed: true,
      delayMins: 22,
      lateRisk: true,
      gpsLocation: 'I-95 South Corridor (Congestion Slowdown)',
      originalSlotTime: '19:15',
      proposedReslotTime: '19:35',
      distanceKm: 8.4
    },
    liveVitals: {
      hr: 82,
      spo2: 97,
      temp: 36.7,
      pain: 2,
      history: [80, 81, 82, 82, 82]
    },
    microWait: {
      step: 1,
      doctorEstMins: 15,
      sanitizationEstMins: 3,
      currentDoctor: 'Pending Check-in',
      targetRoom: 'Pending Transit'
    }
  },
  {
    id: 'P-106',
    name: 'Robert Miller',
    age: 63,
    gender: 'Male',
    wristbandId: 'WB-6842',
    esi: 4, // Less Urgent
    chiefComplaint: 'Minor laceration on forearm requiring simple sutures',
    requiredEquipment: ['ENT Kit'],
    checkedInMinutesAgo: 15,
    arrivalTime: '18:45',
    status: 'waiting',
    assignedRoomId: null,
    manualOverrideBoost: 0,
    etaDelay: {
      isDelayed: false,
      delayMins: 0,
      lateRisk: false,
      transitMode: 'Waiting Room'
    },
    liveVitals: {
      hr: 70,
      spo2: 99,
      temp: 36.6,
      pain: 3,
      history: [68, 70, 71, 70, 70]
    },
    microWait: {
      step: 1,
      doctorEstMins: 8,
      sanitizationEstMins: 3,
      currentDoctor: 'Dr. Amanda Brooks',
      targetRoom: 'Room 104 (Fast Track)'
    }
  }
];

export const INITIAL_ROOMS = [
  {
    id: 'R101',
    name: 'Room 101 - Acute Trauma & Critical',
    wing: 'East Wing - Level 1',
    equipped: ['Ultrasound', 'ECG', 'Defibrillator'],
    status: 'Occupied', // 'Available' | 'Occupied' | 'Sanitization Pending' | 'Equipment Maintenance'
    currentPatientName: 'Arthur Pendelton (Cardiac Follow-up)',
    turnoverTimer: 0,
    totalSanitizeSeconds: 180,
    remainingSanitizeSeconds: 0,
    specialty: 'Trauma & Resuscitation',
    cleanerAssigned: null
  },
  {
    id: 'R102',
    name: 'Room 102 - General Consult',
    wing: 'East Wing - Level 1',
    equipped: ['ENT Kit', 'ECG'],
    status: 'Sanitization Pending',
    currentPatientName: null,
    turnoverTimer: 140, // 2m 20s remaining
    totalSanitizeSeconds: 180,
    remainingSanitizeSeconds: 140,
    specialty: 'General Internal Medicine',
    cleanerAssigned: 'Maria Santos (Staff #44)'
  },
  {
    id: 'R103',
    name: 'Room 103 - Advanced Imaging Suite',
    wing: 'West Wing - Diagnostic Core',
    equipped: ['Ultrasound', 'Mobile X-Ray'],
    status: 'Available',
    currentPatientName: null,
    turnoverTimer: 0,
    totalSanitizeSeconds: 180,
    remainingSanitizeSeconds: 0,
    specialty: 'Ultrasound & Radiology',
    cleanerAssigned: null
  },
  {
    id: 'R104',
    name: 'Room 104 - Rapid Fast-Track',
    wing: 'Ambulatory Care Area',
    equipped: ['ENT Kit'],
    status: 'Available',
    currentPatientName: null,
    turnoverTimer: 0,
    totalSanitizeSeconds: 120,
    remainingSanitizeSeconds: 0,
    specialty: 'Minor Injuries & Fast Track',
    cleanerAssigned: null
  },
  {
    id: 'R105',
    name: 'Room 105 - Cardio Diagnostic Lab',
    wing: 'West Wing - Cardiology',
    equipped: ['ECG', 'Defibrillator', 'Ultrasound'],
    status: 'Occupied',
    currentPatientName: 'Julian Hayes (Post-CABG Eval)',
    turnoverTimer: 0,
    totalSanitizeSeconds: 240,
    remainingSanitizeSeconds: 0,
    specialty: 'Cardiovascular Assessment',
    cleanerAssigned: null
  }
];

export const INITIAL_STAFF = [
  { id: 'ST-01', name: 'Dr. Michael Chen', department: 'Emergency Medicine', assignedZone: 'ER Triage', activePatients: 4 },
  { id: 'ST-02', name: 'Dr. Amanda Brooks', department: 'Ambulatory / Fast Track', assignedZone: 'Outpatient Clinic A', activePatients: 3 },
  { id: 'ST-03', name: 'Dr. Robert Torres', department: 'Cardiology & Critical', assignedZone: 'ER Acute', activePatients: 2 },
  { id: 'ST-04', name: 'Dr. James Adams', department: 'Internal Medicine', assignedZone: 'Outpatient Clinic B', activePatients: 1 },
  { id: 'ST-05', name: 'Nurse Sarah Kelly (RN)', department: 'Triage & Intake', assignedZone: 'Triage Desk 1', activePatients: 8 },
  { id: 'ST-06', name: 'Nurse David Lin (RN)', department: 'Triage & Monitoring', assignedZone: 'Wristband Ingestion', activePatients: 6 }
];

export const INITIAL_SURGE_HOURLY = [
  { hour: '13:00', surgeProb: 0.35, expectedArrivals: 8, status: 'Normal' },
  { hour: '14:00', surgeProb: 0.48, expectedArrivals: 11, status: 'Normal' },
  { hour: '15:00', surgeProb: 0.88, expectedArrivals: 24, status: 'SURGE_CRITICAL' },
  { hour: '16:00', surgeProb: 0.92, expectedArrivals: 26, status: 'SURGE_CRITICAL' },
  { hour: '17:00', surgeProb: 0.74, expectedArrivals: 18, status: 'Elevated' },
  { hour: '18:00', surgeProb: 0.62, expectedArrivals: 14, status: 'Elevated' },
  { hour: '19:00', surgeProb: 0.55, expectedArrivals: 12, status: 'Normal' },
  { hour: '20:00', surgeProb: 0.40, expectedArrivals: 9, status: 'Normal' },
  { hour: '21:00', surgeProb: 0.30, expectedArrivals: 6, status: 'Normal' },
  { hour: '22:00', surgeProb: 0.25, expectedArrivals: 5, status: 'Normal' },
  { hour: '23:00', surgeProb: 0.18, expectedArrivals: 3, status: 'Normal' },
  { hour: '00:00', surgeProb: 0.15, expectedArrivals: 2, status: 'Normal' }
];

export const INITIAL_AUDIT_LOGS = [
  {
    id: 'LOG-1',
    timestamp: '18:42:15',
    user: 'Nurse S. Kelly',
    action: 'SYSTEM_PRIORITY_RECALC',
    patientId: 'P-103',
    patientName: 'Elena Rostova',
    details: 'SpO2 dropped below 92% (recorded 91%). Deterioration score escalated from 0.0 to 0.45. Priority Index increased to 0.895.'
  },
  {
    id: 'LOG-2',
    timestamp: '18:31:00',
    user: 'Auto-Scheduler Bot',
    action: 'DELAY_DETECTED',
    patientId: 'P-105',
    patientName: 'Chloe Simmons',
    details: 'GPS telemetry signaled 22m traffic delay on I-95. Slot offer generated for waiting walk-in pool.'
  }
];
