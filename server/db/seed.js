// Database seed script for initial clinical and operational records

function seedDatabase(db) {
  // Seed Users
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (
        id, username, password, role, name, title, department, patient_id, phone, email
      ) VALUES (
        @id, @username, @password, @role, @name, @title, @department, @patientId, @phone, @email
      )
    `);

    const initialUsers = [
      {
        id: 'USR-DOC-01',
        username: 'doctor',
        password: 'doctor123',
        role: 'doctor',
        name: 'Dr. Michael Chen, MD',
        title: 'Attending Emergency Physician & Chief Triage Officer',
        department: 'Emergency & Critical Care',
        patientId: null,
        phone: '+1 (555) 301-4401',
        email: 'm.chen@hospital.ihms.org'
      },
      {
        id: 'USR-DOC-02',
        username: 'dr.brooks',
        password: 'doctor123',
        role: 'doctor',
        name: 'Dr. Amanda Brooks, MD',
        title: 'Senior Trauma Specialist',
        department: 'Ambulatory / Fast Track',
        patientId: null,
        phone: '+1 (555) 301-4402',
        email: 'a.brooks@hospital.ihms.org'
      },
      {
        id: 'USR-REC-01',
        username: 'receptionist',
        password: 'receptionist123',
        role: 'receptionist',
        name: 'Sarah Kelly, RN',
        title: 'Lead Intake Coordinator & Admissions Specialist',
        department: 'Central Triage & Intake Desk',
        patientId: null,
        phone: '+1 (555) 301-4403',
        email: 's.kelly@hospital.ihms.org'
      },
      {
        id: 'USR-REC-02',
        username: 'reception',
        password: 'receptionist123',
        role: 'receptionist',
        name: 'Elena Woods',
        title: 'Patient Registrar & Kiosk Concierge',
        department: 'Patient Services & Registration',
        patientId: null,
        phone: '+1 (555) 301-4404',
        email: 'e.woods@hospital.ihms.org'
      },
      {
        id: 'USR-PAT-01',
        username: 'patient',
        password: 'patient123',
        role: 'patient',
        name: 'Sarah Jenkins',
        title: 'Patient • Smart Wristband #WB-9421',
        department: 'General Waiting Area',
        patientId: 'P-101',
        phone: '+1 (555) 942-1001',
        email: 'sarah.jenkins@example.com'
      },
      {
        id: 'USR-PAT-02',
        username: 'marcus.c',
        password: 'patient123',
        role: 'patient',
        name: 'Marcus Chen',
        title: 'Patient • Smart Wristband #WB-5118',
        department: 'Waiting Room Lounge',
        patientId: 'P-102',
        phone: '+1 (555) 511-8002',
        email: 'marcus.chen@example.com'
      },
      {
        id: 'USR-PAT-03',
        username: 'samantha.r',
        password: 'patient123',
        role: 'patient',
        name: 'Samantha Reed',
        title: 'Scheduled Patient • Digital Pass PASS-8842',
        department: 'Cardiology Intake',
        patientId: 'APT-201',
        phone: '+1 (555) 234-5678',
        email: 'samantha.reed@example.com'
      }
    ];

    for (const u of initialUsers) {
      insertUser.run(u);
    }
  }

  // Seed Rooms
  const roomCount = db.prepare('SELECT COUNT(*) as count FROM rooms').get().count;
  if (roomCount === 0) {
    const insertRoom = db.prepare(`
      INSERT INTO rooms (
        id, name, wing, specialty, equipped, status, current_patient_id, current_patient_name,
        turnover_timer, total_sanitize_seconds, remaining_sanitize_seconds, cleaner_assigned
      ) VALUES (
        @id, @name, @wing, @specialty, @equipped, @status, @currentPatientId, @currentPatientName,
        @turnoverTimer, @totalSanitizeSeconds, @remainingSanitizeSeconds, @cleanerAssigned
      )
    `);

    const initialRooms = [
      {
        id: 'R-101',
        name: 'Trauma Bay Alpha',
        wing: 'West Wing - Critical Care',
        specialty: 'Trauma & Resuscitation',
        equipped: JSON.stringify(['Ventilator', 'Defibrillator', 'Crash Cart', 'Ultrasound']),
        status: 'Occupied',
        currentPatientId: 'P-999',
        currentPatientName: 'Code Blue Resus (In Progress)',
        turnoverTimer: 18,
        totalSanitizeSeconds: 180,
        remainingSanitizeSeconds: 0,
        cleanerAssigned: null
      },
      {
        id: 'R-102',
        name: 'Acute Exam 102',
        wing: 'West Wing - Acute',
        specialty: 'General Acute Care',
        equipped: JSON.stringify(['ECG Monitor', 'Oxygen Point', 'Infusion Pump']),
        status: 'Sanitization Pending',
        currentPatientId: null,
        currentPatientName: null,
        turnoverTimer: 0,
        totalSanitizeSeconds: 180,
        remainingSanitizeSeconds: 84,
        cleanerAssigned: 'RoboClean UV Unit #3'
      },
      {
        id: 'R-103',
        name: 'Procedure Room 103',
        wing: 'North Wing - Diagnostic',
        specialty: 'Sonography & Minor Suture',
        equipped: JSON.stringify(['Ultrasound', 'Negative Pressure', 'Surgical Lamp']),
        status: 'Available',
        currentPatientId: null,
        currentPatientName: null,
        turnoverTimer: 0,
        totalSanitizeSeconds: 120,
        remainingSanitizeSeconds: 0,
        cleanerAssigned: null
      },
      {
        id: 'R-104',
        name: 'Isolation Room 104',
        wing: 'North Wing - Airborne Iso',
        specialty: 'Infectious Disease',
        equipped: JSON.stringify(['Negative Pressure', 'Ventilator', 'HEPA Scrubber']),
        status: 'Available',
        currentPatientId: null,
        currentPatientName: null,
        turnoverTimer: 0,
        totalSanitizeSeconds: 240,
        remainingSanitizeSeconds: 0,
        cleanerAssigned: null
      },
      {
        id: 'R-105',
        name: 'Fast Track Cubicle B',
        wing: 'East Wing - Ambulatory',
        specialty: 'Non-Urgent / Suture',
        equipped: JSON.stringify(['Suture Kit', 'Standard Vitals Monitor']),
        status: 'Available',
        currentPatientId: null,
        currentPatientName: null,
        turnoverTimer: 0,
        totalSanitizeSeconds: 90,
        remainingSanitizeSeconds: 0,
        cleanerAssigned: null
      }
    ];

    for (const r of initialRooms) {
      insertRoom.run(r);
    }
  }

  // Seed Staff
  const staffCount = db.prepare('SELECT COUNT(*) as count FROM staff').get().count;
  if (staffCount === 0) {
    const insertStaff = db.prepare(`
      INSERT INTO staff (id, name, department, assigned_zone, active_patients)
      VALUES (?, ?, ?, ?, ?)
    `);

    const initialStaff = [
      ['ST-01', 'Dr. Michael Chen', 'Emergency', 'Acute Bay 101-103', 4],
      ['ST-02', 'Dr. Amanda Brooks', 'Trauma', 'Resuscitation Bay A', 1],
      ['ST-03', 'Nurse Sarah Jenkins', 'Triage', 'Intake Station 1', 6],
      ['ST-04', 'Dr. James Adams', 'General Medicine', 'Outpatient Ward B', 2],
      ['ST-05', 'Nurse Tyler Cross', 'Emergency Triage', 'Rapid Assessment', 5]
    ];

    for (const s of initialStaff) {
      insertStaff.run(...s);
    }
  }

  // Seed Surge Forecast
  const surgeCount = db.prepare('SELECT COUNT(*) as count FROM surge_forecast').get().count;
  if (surgeCount === 0) {
    const insertSurge = db.prepare(`
      INSERT INTO surge_forecast (hour, surge_prob, expected_arrivals, status)
      VALUES (?, ?, ?, ?)
    `);

    const initialSurge = [
      ['14:00', 0.22, 6, 'SURGE_LOW'],
      ['15:00', 0.88, 24, 'SURGE_SPIKE'],
      ['16:00', 0.91, 28, 'SURGE_CRITICAL'],
      ['17:00', 0.65, 18, 'SURGE_ELEVATED'],
      ['18:00', 0.40, 11, 'SURGE_MODERATE']
    ];

    for (const sf of initialSurge) {
      insertSurge.run(...sf);
    }
  }

  // Seed Patients & Vitals
  const patientCount = db.prepare('SELECT COUNT(*) as count FROM patients').get().count;
  if (patientCount === 0) {
    const insertPatient = db.prepare(`
      INSERT INTO patients (
        id, name, age, gender, wristband_id, esi, chief_complaint, required_equipment,
        arrival_time, checked_in_minutes_ago, status, assigned_room_id, manual_override_boost,
        eta_delay_is_delayed, eta_delay_mins, eta_delay_late_risk, eta_delay_location, eta_delay_proposed_reslot,
        micro_wait_step, micro_wait_doctor_est_mins, micro_wait_sanitization_est_mins, micro_wait_doctor, micro_wait_target_room
      ) VALUES (
        @id, @name, @age, @gender, @wristbandId, @esi, @chiefComplaint, @requiredEquipment,
        @arrivalTime, @checkedInMinutesAgo, @status, @assignedRoomId, @manualOverrideBoost,
        @etaDelayIsDelayed, @etaDelayMins, @etaDelayLateRisk, @etaDelayLocation, @etaDelayProposedReslot,
        @microWaitStep, @microWaitDoctorEstMins, @microWaitSanitizationEstMins, @microWaitDoctor, @microWaitTargetRoom
      )
    `);

    const insertVitals = db.prepare(`
      INSERT INTO vitals_stream (patient_id, heart_rate, spo2, temperature, pain_score, deterioration_score, is_critical)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const initialPatients = [
      {
        id: 'P-101',
        name: 'Sarah Jenkins',
        age: 58,
        gender: 'Female',
        wristbandId: 'WB-9421',
        esi: 2,
        chiefComplaint: 'Acute Abdominal Pain radiating to flank; suspected nephrolithiasis',
        requiredEquipment: JSON.stringify(['Ultrasound']),
        arrivalTime: '18:22',
        checkedInMinutesAgo: 38,
        status: 'waiting',
        assignedRoomId: null,
        manualOverrideBoost: 0,
        etaDelayIsDelayed: 0,
        etaDelayMins: 0,
        etaDelayLateRisk: 0,
        etaDelayLocation: null,
        etaDelayProposedReslot: null,
        microWaitStep: 2,
        microWaitDoctorEstMins: 4,
        microWaitSanitizationEstMins: 2,
        microWaitDoctor: 'Dr. Michael Chen',
        microWaitTargetRoom: 'Room 103 (Ultrasound Ready)'
      },
      {
        id: 'P-102',
        name: 'Marcus Chen',
        age: 42,
        gender: 'Male',
        wristbandId: 'WB-5118',
        esi: 2,
        chiefComplaint: 'Substernal chest pressure, diaphoresis; history of CAD',
        requiredEquipment: JSON.stringify(['ECG Monitor']),
        arrivalTime: '18:40',
        checkedInMinutesAgo: 20,
        status: 'waiting',
        assignedRoomId: null,
        manualOverrideBoost: 0,
        etaDelayIsDelayed: 0,
        etaDelayMins: 0,
        etaDelayLateRisk: 0,
        etaDelayLocation: null,
        etaDelayProposedReslot: null,
        microWaitStep: 1,
        microWaitDoctorEstMins: 6,
        microWaitSanitizationEstMins: 3,
        microWaitDoctor: 'Dr. Amanda Brooks',
        microWaitTargetRoom: 'Room 102 (Turnover Pending)'
      },
      {
        id: 'P-103',
        name: 'Emily Watson',
        age: 29,
        gender: 'Female',
        wristbandId: 'WB-3304',
        esi: 3,
        chiefComplaint: 'Compound radius fracture with distal numbness',
        requiredEquipment: JSON.stringify(['Suture Kit', 'Standard Vitals Monitor']),
        arrivalTime: '18:15',
        checkedInMinutesAgo: 45,
        status: 'waiting',
        assignedRoomId: null,
        manualOverrideBoost: 0,
        etaDelayIsDelayed: 1,
        etaDelayMins: 18,
        etaDelayLateRisk: 1,
        etaDelayLocation: 'Route 9 Northbound (Congestion)',
        etaDelayProposedReslot: '19:15',
        microWaitStep: 1,
        microWaitDoctorEstMins: 12,
        microWaitSanitizationEstMins: 2,
        microWaitDoctor: 'Duty Physician',
        microWaitTargetRoom: 'Fast Track 105'
      },
      {
        id: 'P-104',
        name: 'Robert Davis',
        age: 67,
        gender: 'Male',
        wristbandId: 'WB-8821',
        esi: 4,
        chiefComplaint: 'Laceration on right forearm, bleeding controlled',
        requiredEquipment: JSON.stringify(['Suture Kit']),
        arrivalTime: '18:30',
        checkedInMinutesAgo: 30,
        status: 'waiting',
        assignedRoomId: null,
        manualOverrideBoost: 0,
        etaDelayIsDelayed: 0,
        etaDelayMins: 0,
        etaDelayLateRisk: 0,
        etaDelayLocation: null,
        etaDelayProposedReslot: null,
        microWaitStep: 1,
        microWaitDoctorEstMins: 8,
        microWaitSanitizationEstMins: 2,
        microWaitDoctor: 'Duty Physician',
        microWaitTargetRoom: 'Fast Track 105'
      }
    ];

    for (const pat of initialPatients) {
      insertPatient.run(pat);
    }

    insertVitals.run('P-101', 98, 97, 37.8, 8, 0.45, 0);
    insertVitals.run('P-102', 114, 93, 37.1, 7, 0.72, 1);
    insertVitals.run('P-103', 82, 99, 36.8, 6, 0.10, 0);
    insertVitals.run('P-104', 74, 98, 36.6, 3, 0.05, 0);
  }
}

module.exports = { seedDatabase };
