import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  DoorOpen, 
  Smartphone, 
  TrendingUp, 
  ShieldAlert, 
  Play, 
  Pause, 
  RotateCcw, 
  AlertTriangle, 
  Sparkles, 
  Car, 
  Zap, 
  UserPlus, 
  Clock,
  HeartPulse,
  Calendar,
  LogOut,
  User,
  Stethoscope,
  UserCheck
} from 'lucide-react';
import TriageDashboard from './components/TriageDashboard';
import RoomMatrix from './components/RoomMatrix';
import PatientMobileApp from './components/PatientMobileApp';
import SurgeControlCenter from './components/SurgeControlCenter';
import AlertBanner from './components/AlertBanner';
import AppointmentRegistration from './components/AppointmentRegistration';
import LoginPortal from './components/LoginPortal';
import CreateUserModal from './components/CreateUserModal';
import { 
  INITIAL_PATIENTS, 
  INITIAL_ROOMS, 
  INITIAL_STAFF, 
  INITIAL_SURGE_HOURLY, 
  INITIAL_AUDIT_LOGS 
} from './data/initialData';
import { calculatePriorityIndex, playClinicalChime, findOptimalRoomMatch } from './utils/priorityEngine';
import * as api from './services/api';

export default function App() {
  const [patients, setPatients] = useState(INITIAL_PATIENTS);
  const [rooms, setRooms] = useState(INITIAL_ROOMS);
  const [staff, setStaff] = useState(INITIAL_STAFF);
  const [surgeData, setSurgeData] = useState(INITIAL_SURGE_HOURLY);
  const [auditLogs, setAuditLogs] = useState(INITIAL_AUDIT_LOGS);
  const [appointments, setAppointments] = useState([
    {
      id: 'APT-201',
      patientName: 'Samantha Reed',
      age: 38,
      gender: 'Female',
      phone: '+1 (555) 234-5678',
      email: 'samantha.reed@example.com',
      department: 'Cardiology & Diagnostic ECG',
      chiefComplaint: 'Intermittent heart palpitations during exercise',
      esi: 3,
      requiredEquipment: ['ECG'],
      painLevel: 2,
      appointmentTime: '19:30',
      appointmentDate: 'Today',
      slotType: 'Fastest Intake Window (Predicted Low Delay)',
      estimatedWaitMins: 6,
      distanceKm: 3.4,
      geofencingOptIn: true,
      digitalPassId: 'PASS-8842',
      status: 'Scheduled'
    },
    {
      id: 'APT-202',
      patientName: 'Julian Morris',
      age: 52,
      gender: 'Male',
      phone: '+1 (555) 876-5432',
      email: 'julian.m@example.com',
      department: 'Orthopedics & Diagnostic Imaging',
      chiefComplaint: 'Chronic knee joint pain with swelling after long walk',
      esi: 4,
      requiredEquipment: ['Mobile X-Ray'],
      painLevel: 5,
      appointmentTime: '20:15',
      appointmentDate: 'Today',
      slotType: 'Off-Peak Optimal Slot',
      estimatedWaitMins: 4,
      distanceKm: 7.1,
      geofencingOptIn: true,
      digitalPassId: 'PASS-4190',
      status: 'Scheduled'
    }
  ]);

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('ihms_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = localStorage.getItem('ihms_current_user');
      if (saved) {
        const u = JSON.parse(saved);
        if (u.role === 'patient') return 'patient';
        if (u.role === 'receptionist') return 'appointments';
      }
    } catch (e) {}
    return 'triage';
  });

  const [isSimRunning, setIsSimRunning] = useState(true);
  const [simSpeed, setSimSpeed] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [dismissedAlertId, setDismissedAlertId] = useState(null);
  const [isStaffReallocated, setIsStaffReallocated] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedWaitingPatientId, setSelectedWaitingPatientId] = useState(null);

  // Strictly resolve the active patient record for the currently logged-in patient
  const loggedInPatient = React.useMemo(() => {
    if (!currentUser || currentUser.role !== 'patient') return null;

    // 1. Direct match by patient_id in patients waiting/active queue
    if (currentUser.patient_id) {
      const match = patients.find(
        p => p.id === currentUser.patient_id || p.wristbandId === currentUser.patient_id
      );
      if (match) return match;
    }

    // 2. Match by exact or case-insensitive patient name
    if (currentUser.name) {
      const matchName = patients.find(
        p => p.name && p.name.trim().toLowerCase() === currentUser.name.trim().toLowerCase()
      );
      if (matchName) return matchName;
    }

    // 3. Match from appointments table if scheduled
    if (appointments && appointments.length) {
      const matchAppt = appointments.find(
        a => (currentUser.patient_id && a.id === currentUser.patient_id) ||
             (a.patientName && currentUser.name && a.patientName.trim().toLowerCase() === currentUser.name.trim().toLowerCase())
      );
      if (matchAppt) {
        return {
          id: matchAppt.id,
          name: matchAppt.patientName,
          age: matchAppt.age || 35,
          gender: matchAppt.gender || 'Female',
          wristbandId: matchAppt.digitalPassId || `WB-${Math.floor(1000 + Math.random() * 9000)}`,
          esi: matchAppt.esi || 3,
          chiefComplaint: matchAppt.chiefComplaint || 'Self-Scheduled Consultation',
          requiredEquipment: matchAppt.requiredEquipment || [],
          checkedInMinutesAgo: 0,
          arrivalTime: matchAppt.appointmentTime || '19:30',
          status: matchAppt.status === 'Checked-In' ? 'waiting' : 'scheduled',
          assignedRoomId: null,
          manualOverrideBoost: 0,
          etaDelay: { isDelayed: false, delayMins: 0, lateRisk: false },
          liveVitals: {
            hr: 76,
            spo2: 98,
            temp: 36.9,
            pain: matchAppt.painLevel || 2,
            deltaV: 0.0,
            isCritical: false,
            history: [74, 75, 76, 75, 76]
          },
          microWait: {
            step: 1,
            doctorEstMins: matchAppt.estimatedWaitMins || 6,
            sanitizationEstMins: 2,
            currentDoctor: 'Attending Physician',
            targetRoom: matchAppt.department || 'Examination Suite'
          }
        };
      }
    }

    // 4. Fallback: Synthesize personal verified patient profile for this exact logged-in user
    return {
      id: currentUser.patient_id || `P-${currentUser.id ? currentUser.id.slice(-4) : 'USER'}`,
      name: currentUser.name,
      age: 36,
      gender: 'Patient',
      wristbandId: currentUser.patient_id?.startsWith('WB-') ? currentUser.patient_id : `WB-${Math.floor(2000 + Math.random() * 7000)}`,
      esi: 3,
      chiefComplaint: currentUser.department ? `Intake: ${currentUser.department}` : 'Registered Patient Health Monitoring',
      requiredEquipment: [],
      checkedInMinutesAgo: 6,
      arrivalTime: new Date().toTimeString().split(' ')[0].slice(0, 5),
      status: 'waiting',
      assignedRoomId: null,
      manualOverrideBoost: 0,
      etaDelay: { isDelayed: false, delayMins: 0, lateRisk: false },
      liveVitals: {
        hr: 78,
        spo2: 98,
        temp: 37.0,
        pain: 2,
        deltaV: 0.0,
        isCritical: false,
        history: [76, 77, 78, 77, 78]
      },
      microWait: {
        step: 1,
        doctorEstMins: 6,
        sanitizationEstMins: 2,
        currentDoctor: 'Dr. Michael Chen',
        targetRoom: 'Room 103 (Diagnostic Suite)'
      }
    };
  }, [currentUser, patients, appointments]);

  // Active patient for waiting view (strictly loggedInPatient for patient role, or selected/top waiting patient for doctor)
  const activePatientForWaiting = React.useMemo(() => {
    if (currentUser?.role === 'patient') {
      return loggedInPatient;
    }
    if (selectedWaitingPatientId) {
      const match = patients.find(p => p.id === selectedWaitingPatientId);
      if (match) return match;
    }
    return patients.find(p => p.status === 'waiting') || patients[0];
  }, [currentUser, loggedInPatient, selectedWaitingPatientId, patients]);


  // Initial Load from SQLite Database & Real-Time SSE Listener
  useEffect(() => {
    async function loadFromDb() {
      try {
        const [pData, rData, sData, sgData, logs, aptData] = await Promise.all([
          api.fetchPatients(),
          api.fetchRooms(),
          api.fetchStaff(),
          api.fetchSurgeForecast(),
          api.fetchAuditLogs(),
          api.fetchAppointments().catch(() => [])
        ]);

        if (pData?.length) {
          setPatients(pData.map(p => ({
            ...p,
            waitSeconds: p.waitSeconds !== undefined ? p.waitSeconds : (p.checkedInMinutesAgo || 0) * 60
          })));
        }
        if (rData?.length) setRooms(rData);
        if (sData?.length) setStaff(sData);
        if (sgData?.length) setSurgeData(sgData);
        if (logs?.length) setAuditLogs(logs);
        if (aptData?.length) setAppointments(aptData);
      } catch (err) {
        console.warn('SQLite API backend not reachable, using seeded local fallback:', err);
      }
    }

    loadFromDb();

    // Subscribe to backend real-time push events
    const unsubscribe = api.subscribeToRealTimeEvents((payload) => {
      if (payload.event === 'patient:created' && payload.data) {
        setPatients(prev => {
          if (prev.some(p => p.id === payload.data.id)) return prev;
          return [payload.data, ...prev];
        });
      } else if (payload.event === 'patient:deleted' && payload.data) {
        setPatients(prev => prev.filter(p => p.id !== payload.data.patientId));
      } else if (payload.event === 'patient:wait_updated' && payload.data) {
        setPatients(prev => prev.map(p => p.id === payload.data.id ? { ...p, ...payload.data } : p));
      } else if (payload.event === 'room:updated' && payload.data) {
        api.fetchRooms().then(r => setRooms(r)).catch(() => {});
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Identify any critical deteriorating patient waiting in queue
  const criticalPatient = patients
    .filter(p => p.status === 'waiting')
    .map(p => ({ ...p, ...calculatePriorityIndex(p) }))
    .find(p => p.isDeteriorating && p.id !== dismissedAlertId);

  // Play chime when critical patient arrives/deteriorates
  useEffect(() => {
    if (criticalPatient && soundEnabled) {
      playClinicalChime(criticalPatient.isCritical);
    }
  }, [criticalPatient?.id, criticalPatient?.deltaV, soundEnabled]);

  // Simulation Clock Tick Effect - 1-Second Precise Real-Time Telemetry Ticker
  useEffect(() => {
    if (!isSimRunning) return;

    const interval = setInterval(() => {
      // 1. Decrement sanitization countdown for pending rooms (1 second per tick * simSpeed)
      setRooms(prevRooms => 
        prevRooms.map(room => {
          if (room.status === 'Sanitization Pending' && room.remainingSanitizeSeconds > 0) {
            const nextSecs = Math.max(0, room.remainingSanitizeSeconds - (1 * simSpeed));
            if (nextSecs === 0) {
              return {
                ...room,
                status: 'Available',
                remainingSanitizeSeconds: 0,
                cleanerAssigned: null
              };
            }
            return {
              ...room,
              remainingSanitizeSeconds: nextSecs
            };
          }
          return room;
        })
      );

      // 2. Real-time second-by-second waiting time telemetry & vital micro-fluctuations
      setPatients(prevPatients =>
        prevPatients.map(p => {
          if (p.status !== 'waiting') return p;

          const curSecs = p.waitSeconds !== undefined 
            ? p.waitSeconds 
            : (p.checkedInMinutesAgo || 0) * 60;
          const newSecs = curSecs + (1 * simSpeed);
          const newMins = Math.floor(newSecs / 60);

          // Micro-fluctuate vitals every 3 seconds
          let newHr = p.liveVitals?.hr || 75;
          let newHistory = p.liveVitals?.history || [newHr];
          if (newSecs % 3 === 0) {
            const jitter = Math.floor(Math.random() * 3) - 1;
            newHr = Math.max(50, Math.min(160, (p.liveVitals?.hr || 75) + jitter));
            newHistory = [...(p.liveVitals?.history || [newHr]), newHr].slice(-8);
          }

          return {
            ...p,
            waitSeconds: newSecs,
            checkedInMinutesAgo: newMins,
            liveVitals: {
              ...p.liveVitals,
              hr: newHr,
              history: newHistory
            }
          };
        })
      );
    }, 1000 / simSpeed);

    return () => clearInterval(interval);
  }, [isSimRunning, simSpeed]);

  // Log helper
  const addAuditLog = (action, patientId, patientName, details) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const userLabel = currentUser ? `${currentUser.name} (${currentUser.role.toUpperCase()})` : 'Triage Nurse / AI Engine';
    const newLog = {
      id: `LOG-${Date.now()}`,
      timestamp: timeStr,
      user: userLabel,
      action,
      patientId: patientId || 'SYS',
      patientName: patientName || 'General Queue',
      details
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // User Authentication Handlers (Doctor, Receptionist, Patient)
  const handleLogin = (user, remember = true) => {
    setCurrentUser(user);
    if (remember) {
      localStorage.setItem('ihms_current_user', JSON.stringify(user));
    }
    // Set default active tab tailored to role
    if (user.role === 'patient') {
      setActiveTab('patient');
    } else if (user.role === 'receptionist') {
      setActiveTab('appointments');
    } else {
      setActiveTab('triage');
    }

    addAuditLog(
      'USER_AUTHENTICATED',
      user.patient_id || 'STATION',
      user.name,
      `User signed in as [${user.role.toUpperCase()}] • ${user.title}`
    );
  };

  const handleLogout = () => {
    if (currentUser) {
      addAuditLog(
        'USER_LOGOUT',
        currentUser.patient_id || 'STATION',
        currentUser.name,
        `User session ended on workstation.`
      );
    }
    setCurrentUser(null);
    localStorage.removeItem('ihms_current_user');
  };

  // Interactive Scenario 1: Trigger Patient Vitals Deterioration (Persisted to SQLite)
  const handleTriggerVitalsSpike = async () => {
    const targetPatient = patients.find(p => p.id === 'P-101' || p.id === 'P-103') || patients[0];
    if (!targetPatient) return;

    try {
      await api.streamPatientVitals(targetPatient.id, {
        hr: 124,
        spo2: 89,
        temp: 38.1,
        pain: 9
      });
    } catch (e) {
      console.warn('API error during vitals spike:', e);
    }

    setPatients(prev =>
      prev.map(p => {
        if (p.id === targetPatient.id) {
          const newVitals = {
            ...p.liveVitals,
            spo2: 89,
            hr: 124,
            pain: 9,
            history: [...(p.liveVitals?.history || []), 124].slice(-8)
          };
          return {
            ...p,
            liveVitals: newVitals
          };
        }
        return p;
      })
    );

    setDismissedAlertId(null);
    if (soundEnabled) playClinicalChime(true);

    addAuditLog(
      'IOT_VITALS_DETERIORATION',
      targetPatient.id,
      targetPatient.name,
      'Smart Wristband flagged critical SpO2 drop (89%) and tachycardia (124 bpm). System automatically recalculated P(t) and logged to SQLite vitals_stream.'
    );

    setActiveTab('triage');
  };

  // Interactive Scenario 2: Simulate GPS Traffic Delay & Re-slotting
  const handleTriggerDelayScenario = () => {
    setPatients(prev =>
      prev.map(p => {
        if (p.id === 'P-105') {
          return {
            ...p,
            etaDelay: {
              isDelayed: true,
              delayMins: 25,
              lateRisk: true,
              gpsLocation: 'I-95 South Corridor (Crash Bottleneck)',
              originalSlotTime: '19:15',
              proposedReslotTime: '19:40',
              distanceKm: 11.2
            }
          };
        }
        return p;
      })
    );

    addAuditLog(
      'GPS_DELAY_ALERT',
      'P-105',
      'Chloe Simmons',
      'Telemetry detected 25-minute delay on I-95. Slot offer prepared for waiting walk-in pool.'
    );

    setActiveTab('patient');
  };

  // Interactive Scenario 3: Complete Room Sanitization & Trigger Constraint Match
  const handleCompleteSanitizationScenario = async () => {
    try {
      await api.completeSanitization('R102');
    } catch (e) {
      console.warn('API error:', e);
    }

    setRooms(prev =>
      prev.map(r => {
        if (r.id === 'R102') {
          return {
            ...r,
            status: 'Available',
            remainingSanitizeSeconds: 0,
            cleanerAssigned: null
          };
        }
        return r;
      })
    );

    addAuditLog(
      'ROOM_SANITIZED_AUTO_MATCH',
      'R102',
      'Room 102 - General Consult',
      'Sanitization protocol completed in SQLite. Constraint solver triggered auto-assignment matching.'
    );

    setActiveTab('rooms');
  };

  // Interactive Scenario 4: Trigger Predictive Departmental Surge Alert
  const handleTriggerSurgeScenario = async () => {
    try {
      await api.triggerSurgeSpike();
    } catch (e) {
      console.warn('API error:', e);
    }

    setSurgeData(prev =>
      prev.map(slot => {
        if (slot.hour === '15:00' || slot.hour === '16:00') {
          return {
            ...slot,
            surgeProb: 0.96,
            expectedArrivals: 32,
            status: 'SURGE_CRITICAL'
          };
        }
        return slot;
      })
    );

    setIsStaffReallocated(false);
    addAuditLog(
      'ML_SURGE_PREDICTION',
      null,
      'Departmental Intake',
      'Weather squall & highway closure correlated. 15:00 surge probability spiked to 96%. Re-allocation suggested.'
    );

    setActiveTab('surge');
  };

  // Triage Manual Override Handler (Persisted to SQLite)
  const handleManualOverride = async (patientId, boost, reason, notes) => {
    try {
      await api.overridePatientPriority(patientId, boost, reason, notes);
    } catch (e) {
      console.warn('API error during override:', e);
    }

    setPatients(prev =>
      prev.map(p => {
        if (p.id === patientId) {
          return {
            ...p,
            manualOverrideBoost: (p.manualOverrideBoost || 0) + boost
          };
        }
        return p;
      })
    );

    const pat = patients.find(p => p.id === patientId);
    addAuditLog(
      'MANUAL_TRIAGE_OVERRIDE',
      patientId,
      pat?.name,
      `Triage Nurse escalated priority by +${boost.toFixed(2)}. Reason: ${reason}. Notes: ${notes} (Saved to SQLite)`
    );
  };

  // Add Walk-in Patient Handler (Persisted to SQLite)
  const handleAddPatient = async (patientData) => {
    try {
      const created = await api.createPatient(patientData);
      setPatients(prev => [created, ...prev]);
      addAuditLog(
        'PATIENT_CHECKIN',
        created.id,
        created.name,
        `Walk-in patient triaged (ESI ${patientData.esi}). Wristband ${created.wristbandId} paired. Initial wait time: ${patientData.checkedInMinutesAgo || 0}m.`
      );
    } catch (e) {
      console.warn('API error, falling back to local state:', e);
      const newId = `P-${Date.now().toString().slice(-3)}`;
      const newWristband = `WB-${Math.floor(1000 + Math.random() * 9000)}`;

      const newPat = {
        id: newId,
        name: patientData.name,
        age: patientData.age,
        gender: patientData.gender,
        wristbandId: newWristband,
        esi: patientData.esi,
        chiefComplaint: patientData.chiefComplaint,
        requiredEquipment: patientData.requiredEquipment,
        checkedInMinutesAgo: parseInt(patientData.checkedInMinutesAgo) || 0,
        arrivalTime: patientData.arrivalTime || new Date().toTimeString().split(' ')[0].slice(0, 5),
        status: 'waiting',
        assignedRoomId: null,
        manualOverrideBoost: 0,
        etaDelay: { isDelayed: false, delayMins: 0, lateRisk: false },
        liveVitals: {
          hr: patientData.hr,
          spo2: patientData.spo2,
          temp: 37.0,
          pain: patientData.pain,
          history: [patientData.hr]
        },
        microWait: {
          step: 1,
          doctorEstMins: 6,
          sanitizationEstMins: 3,
          currentDoctor: 'Dr. Michael Chen',
          targetRoom: 'Room 103 (Ultrasound Ready)'
        }
      };

      setPatients(prev => [newPat, ...prev]);
    }
  };

  // Remove / Discharge Patient from Queue Handler (Persisted to SQLite)
  const handleRemovePatient = async (patientId, patientName) => {
    try {
      await api.deletePatient(patientId);
    } catch (e) {
      console.warn('API error deleting patient:', e);
    }

    setPatients(prev => prev.filter(p => p.id !== patientId));

    addAuditLog(
      'PATIENT_DISCHARGED',
      patientId,
      patientName || 'Triage Patient',
      `Patient removed/discharged from waiting queue. Average waiting time and remaining queue orders re-calculated.`
    );
  };

  // Real-time Update Waiting Time Handler (Interactive Quick Adjust or Inline Edit)
  const handleUpdatePatientWaitTime = async (patientId, newMinutes) => {
    const mins = Math.max(0, parseInt(newMinutes, 10) || 0);

    // Instantly update state for fluid real-time responsiveness
    setPatients(prev => prev.map(p => {
      if (p.id !== patientId) return p;
      return {
        ...p,
        checkedInMinutesAgo: mins,
        waitSeconds: mins * 60
      };
    }));

    try {
      await api.updatePatientWaitTime(patientId, mins);
    } catch (e) {
      console.warn('API error updating wait time:', e);
    }

    const patient = patients.find(p => p.id === patientId);
    addAuditLog(
      'WAIT_TIME_ADJUSTED',
      patientId,
      patient?.name || 'Waiting Patient',
      `Waiting time adjusted in real time to ${mins} mins. Priority index and queue rank re-indexed.`
    );
  };

  // Room Assignment Handler (Persisted to SQLite)
  const handleConfirmRoomAssignment = async (roomId, patientId) => {
    try {
      await api.assignRoom(roomId, patientId);
    } catch (e) {
      console.warn('API error:', e);
    }

    const patient = patients.find(p => p.id === patientId);
    const room = rooms.find(r => r.id === roomId);

    setRooms(prev =>
      prev.map(r => {
        if (r.id === roomId) {
          return {
            ...r,
            status: 'Occupied',
            currentPatientName: patient ? `${patient.name} (${patient.chiefComplaint})` : 'In Consultation',
            remainingSanitizeSeconds: 0
          };
        }
        return r;
      })
    );

    setPatients(prev =>
      prev.map(p => {
        if (p.id === patientId) {
          return {
            ...p,
            status: 'in-consultation',
            assignedRoomId: roomId,
            microWait: {
              ...p.microWait,
              step: 3,
              targetRoom: room?.name || 'Assigned Room'
            }
          };
        }
        return p;
      })
    );

    addAuditLog(
      'ROOM_ASSIGNMENT_EXECUTED',
      patientId,
      patient?.name,
      `Assigned to ${room?.name} by constraint solver matching required equipment: ${patient?.requiredEquipment?.join(', ')}.`
    );
  };

  // Room Consultation Finish & Call Cleaners (Persisted to SQLite)
  const handleConsultationFinish = async (roomId) => {
    try {
      await api.concludeConsultation(roomId);
    } catch (e) {
      console.warn('API error:', e);
    }

    const room = rooms.find(r => r.id === roomId);
    setRooms(prev =>
      prev.map(r => {
        if (r.id === roomId) {
          return {
            ...r,
            status: 'Sanitization Pending',
            currentPatientName: null,
            remainingSanitizeSeconds: r.totalSanitizeSeconds || 180,
            cleanerAssigned: 'Unit Clean Staff #12'
          };
        }
        return r;
      })
    );

    addAuditLog(
      'ROOM_CONSULT_CONCLUDED',
      roomId,
      room?.name,
      'Physician concluded visit. Room transitioned to Sanitization Pending in SQLite.'
    );
  };

  // Manual Complete Sanitization (Persisted to SQLite)
  const handleSanitizeComplete = async (roomId) => {
    try {
      await api.completeSanitization(roomId);
    } catch (e) {
      console.warn('API error:', e);
    }

    const room = rooms.find(r => r.id === roomId);
    setRooms(prev =>
      prev.map(r => {
        if (r.id === roomId) {
          return {
            ...r,
            status: 'Available',
            remainingSanitizeSeconds: 0,
            cleanerAssigned: null
          };
        }
        return r;
      })
    );

    addAuditLog(
      'SANITIZATION_VERIFIED',
      roomId,
      room?.name,
      'Housekeeping verified clinical grade sterilization. Room ready for intake.'
    );
  };

  // Patient Mobile App: Update Pain Rating (Persisted to SQLite vitals stream)
  const handleUpdatePain = async (patientId, newPainScore) => {
    const pat = patients.find(p => p.id === patientId);
    try {
      await api.streamPatientVitals(patientId, {
        hr: pat?.liveVitals?.hr || 80,
        spo2: pat?.liveVitals?.spo2 || 98,
        temp: pat?.liveVitals?.temp || 37.0,
        pain: newPainScore
      });
    } catch (e) {
      console.warn('API error:', e);
    }

    setPatients(prev =>
      prev.map(p => {
        if (p.id === patientId) {
          return {
            ...p,
            liveVitals: {
              ...p.liveVitals,
              pain: newPainScore
            }
          };
        }
        return p;
      })
    );

    addAuditLog(
      'PATIENT_SELF_REPORT',
      patientId,
      pat?.name,
      `Patient streamed updated pain rating: ${newPainScore}/10. Appended to SQLite vitals_stream.`
    );
  };

  // Patient Mobile App: Accept Re-slot (Persisted to SQLite)
  const handleAcceptReslot = async (patientId) => {
    try {
      await api.reslotPatient(patientId, true);
    } catch (e) {
      console.warn('API error:', e);
    }

    setPatients(prev =>
      prev.map(p => {
        if (p.id === patientId) {
          return {
            ...p,
            etaDelay: {
              ...p.etaDelay,
              isDelayed: false,
              lateRisk: false,
              transitMode: 'Re-slotted Grace Window'
            }
          };
        }
        return p;
      })
    );

    const pat = patients.find(p => p.id === patientId);
    addAuditLog(
      'SMART_RESLOT_ACCEPTED',
      patientId,
      pat?.name,
      'Patient accepted automated 20-minute re-slot. Prior slot released to on-site waiting pool without penalty.'
    );
  };

  // Patient Mobile App: Decline Re-slot
  const handleDeclineReslot = async (patientId) => {
    try {
      await api.reslotPatient(patientId, false);
    } catch (e) {
      console.warn('API error:', e);
    }

    setPatients(prev =>
      prev.map(p => {
        if (p.id === patientId) {
          return {
            ...p,
            etaDelay: {
              ...p.etaDelay,
              isDelayed: false
            }
          };
        }
        return p;
      })
    );
  };

  // Execute Staff Re-allocation (Persisted to SQLite)
  const handleExecuteStaffReallocation = async () => {
    try {
      await api.reallocateStaff();
    } catch (e) {
      console.warn('API error:', e);
    }

    setStaff(prev =>
      prev.map(s => {
        if (s.name.includes('Adams')) {
          return {
            ...s,
            assignedZone: 'ER Triage (Re-allocated)',
            activePatients: s.activePatients + 2
          };
        }
        return s;
      })
    );
    setIsStaffReallocated(true);

    addAuditLog(
      'STAFF_REALLOCATION_COMMITTED',
      'ST-04',
      'Dr. James Adams',
      'Reallocated from Outpatient Clinic B to ER Triage in response to predicted 15:00 surge spike (+45% vol).'
    );
  };

  // Appointment Handlers (Patient Self-Service Registration)
  const handleRegisterAppointment = async (appointmentData) => {
    try {
      const created = await api.createAppointment(appointmentData);
      setAppointments(prev => [created, ...prev]);
      addAuditLog(
        'APPOINTMENT_SCHEDULED',
        created.id,
        created.patientName,
        `Self-service appointment registered (${created.department}, ${created.appointmentTime}). Digital Pass ${created.digitalPassId} issued.`
      );
      return created;
    } catch (e) {
      console.warn('API error, using local fallback:', e);
      const newId = `APT-${Date.now().toString().slice(-4)}`;
      const passId = `PASS-${Math.floor(1000 + Math.random() * 9000)}`;
      const newAppt = {
        ...appointmentData,
        id: newId,
        digitalPassId: passId,
        status: 'Scheduled',
        createdAt: new Date().toISOString()
      };
      setAppointments(prev => [newAppt, ...prev]);
      addAuditLog(
        'APPOINTMENT_SCHEDULED',
        newId,
        appointmentData.patientName,
        `Self-service appointment registered (${appointmentData.department}, ${appointmentData.appointmentTime}). Digital Pass ${passId} issued.`
      );
      return newAppt;
    }
  };

  const handleCheckInAppointment = async (appointmentId) => {
    const appt = appointments.find(a => a.id === appointmentId);
    if (!appt) return;

    try {
      await api.checkInAppointment(appointmentId);
    } catch (e) {
      console.warn('API error during checkin:', e);
    }

    setAppointments(prev =>
      prev.map(a => a.id === appointmentId ? { ...a, status: 'Checked-In' } : a)
    );

    const newId = `P-${Date.now().toString().slice(-3)}`;
    const wristbandId = `WB-${appt.digitalPassId ? appt.digitalPassId.slice(-4) : Math.floor(1000 + Math.random() * 9000)}`;

    const newPat = {
      id: newId,
      name: appt.patientName,
      age: appt.age,
      gender: appt.gender,
      wristbandId,
      esi: appt.esi || 3,
      chiefComplaint: appt.chiefComplaint,
      requiredEquipment: appt.requiredEquipment || ['ENT Kit'],
      checkedInMinutesAgo: 0,
      arrivalTime: new Date().toTimeString().split(' ')[0].slice(0, 5),
      status: 'waiting',
      assignedRoomId: null,
      manualOverrideBoost: 0,
      etaDelay: { isDelayed: false, delayMins: 0, lateRisk: false },
      liveVitals: {
        hr: 78,
        spo2: 98,
        temp: 36.9,
        pain: appt.painLevel || 2,
        history: [78]
      },
      microWait: {
        step: 1,
        doctorEstMins: appt.estimatedWaitMins || 6,
        sanitizationEstMins: 3,
        currentDoctor: 'Dr. Michael Chen',
        targetRoom: 'Assigned Intake Room'
      }
    };

    setPatients(prev => [newPat, ...prev]);

    addAuditLog(
      'APPOINTMENT_CHECKED_IN',
      newId,
      appt.patientName,
      `Self-registered patient checked in on arrival. Admitted to live triage queue with wristband ${wristbandId}.`
    );

    setActiveTab('triage');
  };

  const handleCancelAppointment = async (appointmentId) => {
    try {
      await api.cancelAppointment(appointmentId);
    } catch (e) {
      console.warn('API error:', e);
    }

    setAppointments(prev =>
      prev.map(a => a.id === appointmentId ? { ...a, status: 'Cancelled' } : a)
    );
  };

  // If user is not logged in, enforce login requirement with role selector
  if (!currentUser) {
    return <LoginPortal onLogin={handleLogin} />;
  }

  // Calculate role-specific tab permissions
  const role = currentUser.role || 'doctor';
  const isDoctor = role === 'doctor';
  const isReceptionist = role === 'receptionist';
  const isPatient = role === 'patient';

  return (
    <div className="app-container">
      {/* High-Priority Vital Alert Banner (Visible to Clinical & Intake Staff) */}
      {!isPatient && (
        <AlertBanner
          criticalPatient={criticalPatient}
          onReviewPatient={() => {
            setActiveTab('triage');
            setDismissedAlertId(criticalPatient?.id);
          }}
          onDismiss={() => setDismissedAlertId(criticalPatient?.id)}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
        />
      )}

      {/* Main App Header */}
      {/* Main App Header */}
      <header className="app-header">
        <div className="header-inner">
          <div className="brand-section">
            <div className="brand-icon">
              <HeartPulse size={22} />
            </div>
            <div className="brand-text">
              <h1>
                IHMS
                <span className="brand-badge">Hospital</span>
              </h1>
              <p className="brand-subtitle">Intelligent Hospital Management</p>
            </div>
          </div>

          {/* Navigation Tabs (Dynamically Tailored by Role) */}
          <nav className="nav-tabs" role="tablist">
            {/* Triage Tab: Doctor & Receptionist */}
            {(isDoctor || isReceptionist) && (
              <button
                className={`nav-tab-btn ${activeTab === 'triage' ? 'active' : ''}`}
                onClick={() => setActiveTab('triage')}
                id="tab-triage"
                title={isDoctor ? 'Clinical Triage & Queue' : 'Intake & Waiting Queue'}
              >
                <Activity size={15} />
                <span>{isDoctor ? 'Triage Queue' : 'Intake Queue'}</span>
                {patients.filter(p => p.status === 'waiting' && calculatePriorityIndex(p).isDeteriorating).length > 0 && (
                  <span className="nav-badge-count">
                    {patients.filter(p => p.status === 'waiting' && calculatePriorityIndex(p).isDeteriorating).length}
                  </span>
                )}
              </button>
            )}

            {/* Rooms Tab: Doctor & Receptionist */}
            {(isDoctor || isReceptionist) && (
              <button
                className={`nav-tab-btn ${activeTab === 'rooms' ? 'active' : ''}`}
                onClick={() => setActiveTab('rooms')}
                id="tab-rooms"
                title={isDoctor ? 'Rooms & Equipment Matrix' : 'Room Turnover & Cleaning'}
              >
                <DoorOpen size={15} />
                <span>{isDoctor ? 'Rooms Matrix' : 'Room Cleaning'}</span>
              </button>
            )}

            {/* Appointments Tab: Available to All, Primary for Receptionist */}
            <button
              className={`nav-tab-btn ${activeTab === 'appointments' ? 'active' : ''}`}
              onClick={() => setActiveTab('appointments')}
              id="tab-appointments"
              title={isPatient ? 'Book / View Passes' : isReceptionist ? 'Appointment Check-In & Admissions' : 'Scheduled Intake'}
            >
              <Calendar size={15} />
              <span>{isPatient ? 'My Passes' : isReceptionist ? 'Intake & Appts' : 'Appointments'}</span>
              {appointments.filter(a => a.status === 'Scheduled').length > 0 && (
                <span className="nav-badge-count" style={{ background: 'var(--primary)' }}>
                  {appointments.filter(a => a.status === 'Scheduled').length}
                </span>
              )}
            </button>

            {/* Patient Waiting Interface Tab: Visible to Patient and Doctor Panel */}
            {(isPatient || isDoctor) && (
              <button
                className={`nav-tab-btn ${activeTab === 'patient' ? 'active' : ''}`}
                onClick={() => setActiveTab('patient')}
                id="tab-patient"
                title={isDoctor ? 'Inspect Patient Live Waiting Lounge Interface' : 'My Live Queue & Wristband Telemetry'}
              >
                <Smartphone size={15} />
                <span>{isDoctor ? 'Patient Waiting View' : 'My Health Portal'}</span>
                {isDoctor && patients.filter(p => p.status === 'waiting').length > 0 && (
                  <span className="nav-badge-count" style={{ background: 'var(--secondary)' }}>
                    {patients.filter(p => p.status === 'waiting').length}
                  </span>
                )}
              </button>
            )}

            {/* Surge Tab: Clinical Doctors / Capacity Officers */}
            {isDoctor && (
              <button
                className={`nav-tab-btn ${activeTab === 'surge' ? 'active' : ''}`}
                onClick={() => setActiveTab('surge')}
                id="tab-surge"
                title="Predictive Departmental Surge & Capacity Control"
              >
                <TrendingUp size={15} />
                <span>Surge Control</span>
              </button>
            )}
          </nav>

          {/* Header Right: Quick Actions & User Profile */}
          <div className="header-right-section">
            <button
              type="button"
              className="header-action-btn"
              onClick={() => setIsUserModalOpen(true)}
              title="Create new user account or manage registered users in database"
              id="btn-header-manage-users"
            >
              <UserPlus size={13} color="var(--primary)" />
              <span>Create User</span>
            </button>

            <div className="user-profile-header-chip">
              <div 
                className="user-profile-avatar"
                style={{
                  background: isDoctor ? '#0F52BA' : isReceptionist ? '#6366f1' : '#00A896'
                }}
              >
                {isDoctor ? <Stethoscope size={15} /> : isReceptionist ? <UserCheck size={15} /> : <User size={15} />}
              </div>
              <div className="user-profile-info">
                <span className="user-profile-name">{currentUser.name}</span>
                <span className={`user-profile-role-badge role-badge-${currentUser.role}`}>
                  {isDoctor ? 'Doctor' : isReceptionist ? 'Receptionist' : 'Patient'}
                </span>
              </div>
              <button
                className="user-logout-btn"
                onClick={handleLogout}
                title="Sign out from station and switch role"
                id="btn-logout"
              >
                <LogOut size={13} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Simulation Controls Toolbar (Or Friendly Patient Telemetry Bar) */}
      {!isPatient ? (
        <div className="sim-controls-bar">
          <div className="sim-time-panel">
            <div className="sim-clock-display">
              <div className="sim-clock-pulse" />
              <span>Telemetry Live: 19:04:22</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <button
                className="sim-btn"
                onClick={() => setIsSimRunning(!isSimRunning)}
                title={isSimRunning ? 'Pause Engine' : 'Resume Engine'}
                id="btn-toggle-sim"
              >
                {isSimRunning ? <Pause size={13} /> : <Play size={13} />}
                {isSimRunning ? 'Pause' : 'Resume'}
              </button>

              <button
                className="sim-btn"
                onClick={() => setSimSpeed(simSpeed === 1 ? 2 : simSpeed === 2 ? 5 : 1)}
                title="Simulation speed multiplier"
              >
                {simSpeed}x Speed
              </button>
            </div>
          </div>

          {/* Quick Scenario Triggers */}
          <div className="sim-actions-group">
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Simulate:
            </span>

            <button
              className="sim-btn sim-btn-danger"
              onClick={handleTriggerVitalsSpike}
              title="Demonstrate Novel Feature 3.1: Wristband vital drop & priority recalculation"
              id="sim-btn-vitals-spike"
            >
              <ShieldAlert size={13} />
              <span>SpO2 Drop</span>
            </button>

            <button
              className="sim-btn"
              onClick={handleTriggerDelayScenario}
              title="Demonstrate Novel Feature 3.5: GPS traffic delay & smart re-slotting"
              id="sim-btn-delay"
            >
              <Car size={13} color="var(--warning-amber)" />
              <span>Traffic Delay</span>
            </button>

            <button
              className="sim-btn"
              onClick={handleCompleteSanitizationScenario}
              title="Demonstrate Novel Feature 3.2: Room sanitized & constraint solver auto-assign"
              id="sim-btn-sanitize"
            >
              <Sparkles size={13} color="var(--secondary)" />
              <span>Room Cleaned</span>
            </button>

            <button
              className="sim-btn sim-btn-primary"
              onClick={handleTriggerSurgeScenario}
              title="Demonstrate Novel Feature 3.4: Predictive surge alert & staff re-allocation"
              id="sim-btn-surge"
            >
              <Zap size={13} />
              <span>Surge Spike</span>
            </button>
          </div>
        </div>
      ) : (
        <div style={{
          background: 'var(--secondary-light)',
          borderBottom: '1px solid rgba(0, 168, 150, 0.25)',
          padding: '0.45rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.78rem',
          color: 'var(--secondary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="live-dot" />
            <strong>Patient Telemetry Active:</strong> Connected to Smart IoT Wristband ({currentUser.patient_id ? `ID: ${currentUser.patient_id}` : 'Paired via Bluetooth'})
          </div>
          <span style={{ color: 'var(--slate-600)', fontSize: '0.72rem' }}>
            24/7 Clinical Monitoring • Tap below to update pain level or review doctor arrival
          </span>
        </div>
      )}

      {/* Main View Display */}
      <main className="main-view-container">
        {activeTab === 'triage' && (
          <TriageDashboard
            patients={patients}
            rooms={rooms}
            onUpdatePatientVitals={handleUpdatePain}
            onManualOverride={handleManualOverride}
            onFastTrackPatient={(patientId) => {
              const matchedRoom = findOptimalRoomMatch(patients.find(p => p.id === patientId), rooms);
              if (matchedRoom) {
                handleConfirmRoomAssignment(matchedRoom.id, patientId);
              } else {
                setActiveTab('rooms');
              }
            }}
            onAddPatient={handleAddPatient}
            onRemovePatient={handleRemovePatient}
            onUpdateWaitTime={handleUpdatePatientWaitTime}
            onViewPatientWaitingScreen={(patientId) => {
              setSelectedWaitingPatientId(patientId);
              setActiveTab('patient');
            }}
            doctorUser={currentUser}
          />
        )}

        {activeTab === 'rooms' && (
          <RoomMatrix
            rooms={rooms}
            patients={patients}
            onSanitizeComplete={handleSanitizeComplete}
            onConsultationFinish={handleConsultationFinish}
            onConfirmRoomAssignment={handleConfirmRoomAssignment}
          />
        )}

        {activeTab === 'patient' && activePatientForWaiting && (
          <PatientMobileApp
            patients={patients}
            currentPatient={activePatientForWaiting}
            onUpdatePain={handleUpdatePain}
            onAcceptReslot={handleAcceptReslot}
            onDeclineReslot={handleDeclineReslot}
            isPatientRole={isPatient}
            isDoctorRole={isDoctor}
            doctorUser={isDoctor ? currentUser : null}
            onSelectPatient={(id) => setSelectedWaitingPatientId(id)}
          />
        )}

        {activeTab === 'surge' && (
          <SurgeControlCenter
            surgeData={surgeData}
            staffRoster={staff}
            auditLogs={auditLogs}
            onExecuteStaffReallocation={handleExecuteStaffReallocation}
            isStaffReallocated={isStaffReallocated}
          />
        )}

        {activeTab === 'appointments' && (
          <AppointmentRegistration
            appointments={appointments}
            onRegisterAppointment={handleRegisterAppointment}
            onCheckInAppointment={handleCheckInAppointment}
            onCancelAppointment={handleCancelAppointment}
          />
        )}
      </main>

      {/* Create User & Account Management Interface Modal */}
      <CreateUserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onUserCreated={(newUser) => {
          addAuditLog('USER_CREATED', newUser.id, newUser.name, `New ${newUser.role.toUpperCase()} account "${newUser.name}" saved to SQLite database.`);
        }}
        onSwitchUser={(user) => {
          handleLogin(user, true);
          setIsUserModalOpen(false);
        }}
      />
    </div>
  );
}
