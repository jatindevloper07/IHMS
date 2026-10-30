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
  HeartPulse
} from 'lucide-react';
import TriageDashboard from './components/TriageDashboard';
import RoomMatrix from './components/RoomMatrix';
import PatientMobileApp from './components/PatientMobileApp';
import SurgeControlCenter from './components/SurgeControlCenter';
import AlertBanner from './components/AlertBanner';
import { 
  INITIAL_PATIENTS, 
  INITIAL_ROOMS, 
  INITIAL_STAFF, 
  INITIAL_SURGE_HOURLY, 
  INITIAL_AUDIT_LOGS 
} from './data/initialData';
import { calculatePriorityIndex, playClinicalChime, findOptimalRoomMatch } from './utils/priorityEngine';

export default function App() {
  const [patients, setPatients] = useState(INITIAL_PATIENTS);
  const [rooms, setRooms] = useState(INITIAL_ROOMS);
  const [staff, setStaff] = useState(INITIAL_STAFF);
  const [surgeData, setSurgeData] = useState(INITIAL_SURGE_HOURLY);
  const [auditLogs, setAuditLogs] = useState(INITIAL_AUDIT_LOGS);

  const [activeTab, setActiveTab] = useState('triage'); // 'triage' | 'rooms' | 'patient' | 'surge'
  const [isSimRunning, setIsSimRunning] = useState(true);
  const [simSpeed, setSimSpeed] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [dismissedAlertId, setDismissedAlertId] = useState(null);
  const [isStaffReallocated, setIsStaffReallocated] = useState(false);

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

  // Simulation Clock Tick Effect
  useEffect(() => {
    if (!isSimRunning) return;

    const interval = setInterval(() => {
      // 1. Decrement sanitization countdown for pending rooms
      setRooms(prevRooms => 
        prevRooms.map(room => {
          if (room.status === 'Sanitization Pending' && room.remainingSanitizeSeconds > 0) {
            const nextSecs = Math.max(0, room.remainingSanitizeSeconds - (2 * simSpeed));
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

      // 2. Micro-fluctuate vitals for waiting patients (simulating IoT wristband streaming)
      setPatients(prevPatients =>
        prevPatients.map(p => {
          if (p.status !== 'waiting') return p;
          const currentHr = p.liveVitals?.hr || 75;
          // small random jitter: -1, 0, +1 bpm
          const jitter = Math.floor(Math.random() * 3) - 1;
          const newHr = Math.max(50, Math.min(160, currentHr + jitter));
          const newHistory = [...(p.liveVitals?.history || [currentHr]), newHr].slice(-8);

          return {
            ...p,
            liveVitals: {
              ...p.liveVitals,
              hr: newHr,
              history: newHistory
            }
          };
        })
      );
    }, 2500 / simSpeed);

    return () => clearInterval(interval);
  }, [isSimRunning, simSpeed]);

  // Log helper
  const addAuditLog = (action, patientId, patientName, details) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const newLog = {
      id: `LOG-${Date.now()}`,
      timestamp: timeStr,
      user: 'Triage Nurse / AI Engine',
      action,
      patientId: patientId || 'SYS',
      patientName: patientName || 'General Queue',
      details
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Interactive Scenario 1: Trigger Patient Vitals Deterioration
  const handleTriggerVitalsSpike = () => {
    const targetPatient = patients.find(p => p.id === 'P-101' || p.id === 'P-103') || patients[0];
    if (!targetPatient) return;

    setPatients(prev =>
      prev.map(p => {
        if (p.id === targetPatient.id) {
          const newVitals = {
            ...p.liveVitals,
            spo2: 89, // Severe drop
            hr: 124,  // Tachycardia
            pain: 9,  // Severe pain spike
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
      'Smart Wristband flagged critical SpO2 drop (89%) and tachycardia (124 bpm). System automatically recalculated P(t) and escalated priority.'
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
  const handleCompleteSanitizationScenario = () => {
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
      'Sanitization protocol completed. Constraint solver triggered auto-assignment matching.'
    );

    setActiveTab('rooms');
  };

  // Interactive Scenario 4: Trigger Predictive Departmental Surge Alert
  const handleTriggerSurgeScenario = () => {
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

  // Triage Manual Override Handler
  const handleManualOverride = (patientId, boost, reason, notes) => {
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
      `Triage Nurse escalated priority by +${boost.toFixed(2)}. Reason: ${reason}. Notes: ${notes}`
    );
  };

  // Add Walk-in Patient Handler
  const handleAddPatient = (patientData) => {
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
      checkedInMinutesAgo: 0,
      arrivalTime: new Date().toTimeString().split(' ')[0].slice(0, 5),
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
    addAuditLog(
      'PATIENT_CHECKIN',
      newId,
      patientData.name,
      `Walk-in patient triaged at ESI ${patientData.esi}. Paired with wristband ${newWristband}.`
    );
  };

  // Room Assignment Handler
  const handleConfirmRoomAssignment = (roomId, patientId) => {
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

  // Room Consultation Finish & Call Cleaners
  const handleConsultationFinish = (roomId) => {
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
      'Physician concluded visit. Room transitioned to Sanitization Pending (Turnover protocol activated).'
    );
  };

  // Manual Complete Sanitization
  const handleSanitizeComplete = (roomId) => {
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

  // Patient Mobile App: Update Pain Rating
  const handleUpdatePain = (patientId, newPainScore) => {
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

    const pat = patients.find(p => p.id === patientId);
    addAuditLog(
      'PATIENT_SELF_REPORT',
      patientId,
      pat?.name,
      `Patient streamed updated pain rating: ${newPainScore}/10 via mobile app.`
    );
  };

  // Patient Mobile App: Accept Re-slot
  const handleAcceptReslot = (patientId) => {
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
  const handleDeclineReslot = (patientId) => {
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

  // Execute Staff Re-allocation
  const handleExecuteStaffReallocation = () => {
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

  return (
    <div className="app-container">
      {/* High-Priority Vital Alert Banner */}
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

      {/* Main App Header */}
      <header className="app-header">
        <div className="header-inner">
          <div className="brand-section">
            <div className="brand-icon">
              <HeartPulse size={26} />
            </div>
            <div className="brand-text">
              <h1>
                IHMS
                <span className="brand-badge">Intelligent Hospital Management</span>
              </h1>
              <p>Dynamic Deterioration Early Warning • Equipment-Aware Turnover • Predictive Capacity</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="nav-tabs" role="tablist">
            <button
              className={`nav-tab-btn ${activeTab === 'triage' ? 'active' : ''}`}
              onClick={() => setActiveTab('triage')}
              id="tab-triage"
            >
              <Activity size={16} />
              Triage & Queue
              {patients.filter(p => p.status === 'waiting' && calculatePriorityIndex(p).isDeteriorating).length > 0 && (
                <span className="nav-badge-count">
                  {patients.filter(p => p.status === 'waiting' && calculatePriorityIndex(p).isDeteriorating).length}
                </span>
              )}
            </button>

            <button
              className={`nav-tab-btn ${activeTab === 'rooms' ? 'active' : ''}`}
              onClick={() => setActiveTab('rooms')}
              id="tab-rooms"
            >
              <DoorOpen size={16} />
              Rooms & Equipment
            </button>

            <button
              className={`nav-tab-btn ${activeTab === 'patient' ? 'active' : ''}`}
              onClick={() => setActiveTab('patient')}
              id="tab-patient"
            >
              <Smartphone size={16} />
              Patient Mobile App
            </button>

            <button
              className={`nav-tab-btn ${activeTab === 'surge' ? 'active' : ''}`}
              onClick={() => setActiveTab('surge')}
              id="tab-surge"
            >
              <TrendingUp size={16} />
              Surge & Capacity Control
            </button>
          </nav>
        </div>
      </header>

      {/* Simulation Controls Toolbar */}
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

        {/* Quick Scenario Triggers to Demonstrate Novel Features */}
        <div className="sim-actions-group">
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Simulate Scenarios:
          </span>

          <button
            className="sim-btn sim-btn-danger"
            onClick={handleTriggerVitalsSpike}
            title="Demonstrate Novel Feature 3.1: Wristband vital drop & priority recalculation"
            id="sim-btn-vitals-spike"
          >
            <ShieldAlert size={13} />
            🚨 Trigger SpO2 Drop
          </button>

          <button
            className="sim-btn"
            onClick={handleTriggerDelayScenario}
            title="Demonstrate Novel Feature 3.5: GPS traffic delay & smart re-slotting"
            id="sim-btn-delay"
          >
            <Car size={13} color="var(--warning-amber)" />
            🚗 Simulate Traffic Delay
          </button>

          <button
            className="sim-btn"
            onClick={handleCompleteSanitizationScenario}
            title="Demonstrate Novel Feature 3.2: Room sanitized & constraint solver auto-assign"
            id="sim-btn-sanitize"
          >
            <Sparkles size={13} color="var(--secondary)" />
            ✨ Room 102 Cleaned
          </button>

          <button
            className="sim-btn sim-btn-primary"
            onClick={handleTriggerSurgeScenario}
            title="Demonstrate Novel Feature 3.4: Predictive surge alert & staff re-allocation"
            id="sim-btn-surge"
          >
            <Zap size={13} />
            ⚡ Storm/Crash Surge
          </button>
        </div>
      </div>

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

        {activeTab === 'patient' && (
          <PatientMobileApp
            patients={patients}
            onUpdatePain={handleUpdatePain}
            onAcceptReslot={handleAcceptReslot}
            onDeclineReslot={handleDeclineReslot}
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
      </main>
    </div>
  );
}
