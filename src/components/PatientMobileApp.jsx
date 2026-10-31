import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Heart, 
  Activity, 
  MapPin, 
  Navigation, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  Sparkles, 
  Wifi, 
  BatteryCharging, 
  Sliders, 
  Send, 
  User, 
  ShieldCheck, 
  Stethoscope, 
  Users, 
  ShieldAlert, 
  TrendingUp 
} from 'lucide-react';
import { calculatePriorityIndex, calculateEstimatedWaitToConsult } from '../utils/priorityEngine';

export default function PatientMobileApp({ 
  patients = [], 
  currentPatient: propPatient,
  onUpdatePain, 
  onAcceptReslot, 
  onDeclineReslot,
  initialPatientId,
  isPatientRole = false,
  isDoctorRole = false,
  doctorUser = null,
  onSelectPatient = null
}) {
  const waitingPatientsList = (patients || []).filter(p => p.status === 'waiting');
  const currentPatient = propPatient || waitingPatientsList[0] || patients?.[0] || {
    id: 'P-101',
    name: 'Verified Patient',
    wristbandId: 'WB-ACTIVE',
    esi: 3,
    status: 'waiting',
    liveVitals: { hr: 78, spo2: 98, pain: 4 },
    microWait: { step: 1, doctorEstMins: 4, sanitizationEstMins: 3 }
  };

  const [reportedPain, setReportedPain] = useState(currentPatient?.liveVitals?.pain ?? 5);
  const [showPainSubmittedToast, setShowPainSubmittedToast] = useState(false);

  useEffect(() => {
    if (currentPatient?.liveVitals?.pain !== undefined) {
      setReportedPain(currentPatient.liveVitals.pain);
    }
  }, [currentPatient?.id, currentPatient?.liveVitals?.pain]);

  const priorityInfo = calculatePriorityIndex(currentPatient);
  const vitals = currentPatient?.liveVitals || {};
  const microWait = currentPatient?.microWait || { step: 1, doctorEstMins: 4, sanitizationEstMins: 3 };
  const etaDelay = currentPatient?.etaDelay || {};

  const handlePainSubmit = (e) => {
    e.preventDefault();
    if (currentPatient?.id) {
      onUpdatePain(currentPatient.id, reportedPain);
      setShowPainSubmittedToast(true);
      setTimeout(() => setShowPainSubmittedToast(false), 3000);
    }
  };

  // Determine active doctor name for display
  const attendingDoctorName = doctorUser?.name || microWait.currentDoctor || 'Dr. Michael Chen, MD';

  // Calculate dynamic queue metrics for the waiting lounge transparency cards
  const sortedWaiting = (patients || [])
    .filter(p => p.status === 'waiting')
    .map(p => {
      const calc = calculatePriorityIndex(p);
      return { 
        ...p, 
        checkedInMinutesAgo: calc.waitMinutes ?? p.checkedInMinutesAgo ?? 0,
        ...calc 
      };
    })
    .sort((a, b) => b.priorityIndex - a.priorityIndex);

  const waitingPatients = sortedWaiting.map((p, index) => ({
    ...p,
    queueRank: index + 1,
    estimatedWaitToDoctor: calculateEstimatedWaitToConsult(index, p.esi)
  }));

  const avgElapsedWait = waitingPatients.length > 0 
    ? Math.round(waitingPatients.reduce((acc, p) => acc + (p.checkedInMinutesAgo || 0), 0) / waitingPatients.length)
    : 0;

  const avgEstConsult = waitingPatients.length > 0
    ? Math.round(waitingPatients.reduce((acc, p) => acc + (p.estimatedWaitToDoctor || 0), 0) / waitingPatients.length)
    : 0;

  const patientQueueIndex = waitingPatients.findIndex(p => p.id === currentPatient?.id);
  const patientRank = patientQueueIndex >= 0 ? patientQueueIndex + 1 : 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
      {/* 1. DOCTOR PANEL SUPERVISION BAR (Visible when Doctor is inspecting patient waiting lounge) */}
      {isDoctorRole && (
        <div style={{ 
          background: 'white', 
          padding: '0.9rem 1.4rem', 
          borderRadius: 'var(--radius-md)', 
          border: '1.5px solid var(--primary)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          width: '100%',
          maxWidth: '800px',
          boxShadow: '0 4px 15px -2px rgba(15, 82, 186, 0.12)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                background: 'var(--primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
                flexShrink: 0
              }}>
                <Stethoscope size={18} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--slate-900)' }}>
                    Doctor Panel • Live Patient Waiting Screen Inspector
                  </strong>
                  <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontSize: '0.65rem', fontWeight: 700 }}>
                    Supervision Mode
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.73rem', color: 'var(--slate-500)' }}>
                  Assigned Physician: <strong style={{ color: 'var(--primary)' }}>{attendingDoctorName}</strong> • Patient Queue View
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="live-clock-badge">
                <span className="live-clock-dot" /> LIVE QUEUE SYNC
              </span>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--slate-600)', background: 'var(--slate-100)', padding: '0.2rem 0.5rem', borderRadius: 4 }}>
                {waitingPatientsList.length} Waiting in Lounge
              </span>
            </div>
          </div>

          {/* Quick Switcher Chips: Switch between any waiting patient on doctor panel */}
          {waitingPatientsList.length > 0 && (
            <div style={{ borderTop: '1px solid var(--slate-100)', paddingTop: '0.6rem' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.35rem' }}>
                Select Waiting Patient to inspect their mobile & wristband screen:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {waitingPatientsList.map((p, idx) => {
                  const isSelected = p.id === currentPatient.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onSelectPatient?.(p.id)}
                      style={{
                        padding: '0.25rem 0.65rem',
                        fontSize: '0.72rem',
                        borderRadius: 'var(--radius-full)',
                        border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--slate-200)',
                        background: isSelected ? 'var(--primary-light)' : '#ffffff',
                        color: isSelected ? 'var(--primary)' : 'var(--slate-700)',
                        fontWeight: isSelected ? 800 : 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        transition: 'all 0.15s ease'
                      }}
                      title={`Inspect ${p.name}'s live waiting interface`}
                    >
                      <span>#{idx + 1}</span>
                      <span>{p.name}</span>
                      <code style={{ fontSize: '0.65rem', color: isSelected ? 'var(--primary)' : 'var(--slate-400)' }}>
                        {p.wristbandId}
                      </code>
                      {p.isDeteriorating && (
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--alert-crimson)' }} title="Vitals Escalation" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. PATIENT SESSION CARD */}
      <div style={{ 
        background: 'white', 
        padding: '0.85rem 1.4rem', 
        borderRadius: 'var(--radius-md)', 
        border: '1.5px solid rgba(0, 168, 150, 0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        width: '100%',
        maxWidth: '800px',
        boxShadow: '0 4px 15px -2px rgba(0, 168, 150, 0.12)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: 'var(--secondary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--secondary)',
            flexShrink: 0
          }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--slate-800)' }}>
                {currentPatient?.name || 'Verified Patient'}
              </span>
              <span style={{
                fontSize: '0.625rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                background: 'rgba(0, 168, 150, 0.1)',
                color: 'var(--secondary)',
                padding: '0.12rem 0.45rem',
                borderRadius: 'var(--radius-sm)'
              }}>
                {isDoctorRole ? `Doctor Panel Active (${attendingDoctorName})` : 'Active Login Session'}
              </span>
            </div>
            <span style={{ fontSize: '0.74rem', color: 'var(--slate-500)', fontWeight: 500 }}>
              Smart Wristband: <strong style={{ color: 'var(--slate-700)' }}>{currentPatient?.wristbandId || 'WB-ACTIVE'}</strong> • ESI Priority: Level {currentPatient?.esi || 3} • 24/7 Telemetry Stream Active
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--slate-50)', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--slate-200)' }}>
          <span className="sim-clock-pulse" />
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--slate-700)' }}>
            Status: {currentPatient?.status === 'in-consultation' ? '🩺 In Consultation' : '⏱️ Waiting in Lounge'}
          </span>
        </div>
      </div>

      {/* 3. LIVE WAITING QUEUE & TELEMETRY METRIC CARDS (Active Waiting Queue, Active Vitals Deteriorations, Average Waiting Time) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', width: '100%', maxWidth: '800px' }}>
        {/* Card 1: Active Waiting Queue */}
        <div className="card" style={{ padding: '1.1rem 1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>Active Waiting Queue</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--slate-900)', marginTop: '0.4rem' }}>
            {waitingPatients.length} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--slate-500)' }}>Patients in Lobby</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '0.3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Formula: <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)', fontWeight: 700 }}>P(t) = 0.5·U + 0.2·T + 0.3·ΔV</code></span>
            <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 700, fontSize: '0.65rem' }}>
              Your Rank: #{patientRank}
            </span>
          </div>
        </div>

        {/* Card 2: Active Vitals Deteriorations */}
        <div className="card" style={{ padding: '1.1rem 1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>Active Vitals Deteriorations</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--alert-crimson-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--alert-crimson)' }}>
              <ShieldAlert size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--alert-crimson)', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {waitingPatients.filter(p => p.isDeteriorating).length}
            {waitingPatients.filter(p => p.isDeteriorating).length > 0 ? (
              <span className="badge badge-deterioration-alert" style={{ fontSize: '0.65rem' }}>
                LIVE ESCALATION
              </span>
            ) : (
              <span className="badge" style={{ background: 'rgba(0, 168, 150, 0.12)', color: 'var(--secondary)', fontSize: '0.65rem', fontWeight: 700 }}>
                SAFE TELEMETRY
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '0.3rem' }}>
            Continuous IoT Wristband streaming every 15s
          </div>
        </div>

        {/* Card 3: Average Waiting Time */}
        <div className="card" style={{ padding: '1.1rem 1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>Average Waiting Time</span>
              <span className="live-wait-badge" title="Second-by-second real-time streaming telemetry">
                <span className="live-wait-dot" /> LIVE 1s TICK
              </span>
            </div>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--secondary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary)' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--slate-900)', marginTop: '0.4rem', display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
            <span>{waitingPatients.length > 0 ? avgElapsedWait : 0}</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--slate-500)' }}>mins elapsed</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 600, marginTop: '0.3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>
              {waitingPatients.length > 0 
                ? `Next Consult: ~${waitingPatients[0]?.estimatedWaitToDoctor || 3}m (Avg Est. ~${avgEstConsult}m)`
                : 'Queue Empty • 0 waiting'}
            </span>
            <span style={{ color: 'var(--slate-500)', fontWeight: 500, fontSize: '0.7rem' }}>
              Across {waitingPatients.length} waiting patient{waitingPatients.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      </div>

      {/* Realistic Mobile Device Frame */}
      <div className="phone-mockup-frame">
        <div className="phone-screen">
          {/* Dynamic Island Notch */}
          <div className="phone-island">
            <div className="phone-island-cam" />
          </div>

          {/* Status Bar */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '12px 24px 8px 24px', 
            fontSize: '0.75rem', 
            fontWeight: 700,
            color: 'var(--slate-900)'
          }}>
            <span>19:04</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Wifi size={13} />
              <span style={{ fontSize: '0.65rem' }}>5G</span>
              <BatteryCharging size={14} />
            </div>
          </div>

          {/* App Header Inside Phone */}
          <div style={{ 
            padding: '0.75rem 1.25rem', 
            background: 'white', 
            borderBottom: '1px solid var(--slate-100)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <span style={{ fontSize: '0.68rem', color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                IHMS Patient Portal
              </span>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--slate-900)' }}>
                {currentPatient.name}
              </h2>
            </div>
            <div style={{ 
              background: 'var(--primary-light)', 
              color: 'var(--primary)', 
              padding: '0.2rem 0.55rem', 
              borderRadius: 'var(--radius-full)', 
              fontSize: '0.68rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)' }} />
              Wristband Active
            </div>
          </div>

          {/* Scrollable Phone Body */}
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, overflowY: 'auto' }}>
            
            {/* Live Waiting Queue Transparency inside phone app */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid var(--slate-200)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--slate-800)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Clock size={13} color="var(--primary)" />
                  Live Waiting Queue Transparency
                </span>
                <span className="live-wait-badge" style={{ fontSize: '0.62rem' }}>
                  <span className="live-wait-dot" /> 1s TICK
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', textAlign: 'center' }}>
                <div style={{ background: '#ffffff', padding: '0.45rem 0.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--slate-100)' }}>
                  <span style={{ fontSize: '0.62rem', color: 'var(--slate-500)', display: 'block', fontWeight: 600 }}>In Queue</span>
                  <strong style={{ fontSize: '1.05rem', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{waitingPatients.length}</strong>
                  <span style={{ fontSize: '0.58rem', color: 'var(--slate-400)', display: 'block' }}># {patientRank} in line</span>
                </div>
                <div style={{ background: '#ffffff', padding: '0.45rem 0.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--slate-100)' }}>
                  <span style={{ fontSize: '0.62rem', color: 'var(--slate-500)', display: 'block', fontWeight: 600 }}>Avg Wait</span>
                  <strong style={{ fontSize: '1.05rem', color: 'var(--slate-800)', fontFamily: 'var(--font-mono)' }}>{avgElapsedWait}m</strong>
                  <span style={{ fontSize: '0.58rem', color: 'var(--secondary)', display: 'block' }}>Active lounge</span>
                </div>
                <div style={{ background: '#ffffff', padding: '0.45rem 0.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--slate-100)' }}>
                  <span style={{ fontSize: '0.62rem', color: 'var(--slate-500)', display: 'block', fontWeight: 600 }}>Next Consult</span>
                  <strong style={{ fontSize: '1.05rem', color: 'var(--slate-800)', fontFamily: 'var(--font-mono)' }}>~{currentPatient?.microWait?.doctorEstMins || 4}m</strong>
                  <span style={{ fontSize: '0.58rem', color: 'var(--slate-400)', display: 'block' }}>Est. call time</span>
                </div>
              </div>
            </div>

            {/* Smart Delay Assistant Banner (Novel Feature 3.5) */}
            {etaDelay.isDelayed && (
              <div style={{
                background: '#fffbeb',
                border: '1.5px solid #fde68a',
                borderRadius: 'var(--radius-md)',
                padding: '0.9rem',
                boxShadow: 'var(--shadow-sm)',
                animation: 'pulseGlow 2s infinite'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                  <Navigation size={18} color="var(--warning-amber)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <h4 style={{ fontSize: '0.825rem', fontWeight: 800, color: '#92400e' }}>
                      Smart Delay Assistant (Traffic Detected)
                    </h4>
                    <p style={{ fontSize: '0.72rem', color: '#78350f', marginTop: '0.2rem' }}>
                      GPS geofencing detected heavy traffic along {etaDelay.gpsLocation || 'your transit route'}. You are predicted to arrive ~{etaDelay.delayMins} minutes late.
                    </p>
                    <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#92400e', marginTop: '0.3rem' }}>
                      Proposed re-slot: <strong>{etaDelay.proposedReslotTime}</strong> (No queue penalty)
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '0.4rem', fontSize: '0.72rem' }}
                    onClick={() => onAcceptReslot(currentPatient.id)}
                    id="btn-accept-reslot"
                  >
                    Accept Re-Slot
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '0.4rem', fontSize: '0.72rem' }}
                    onClick={() => onDeclineReslot(currentPatient.id)}
                    id="btn-keep-slot"
                  >
                    Keep Original Slot
                  </button>
                </div>
              </div>
            )}

            {/* AI Micro-Wait Transparency & Journey Predictor (Novel Feature 3.3) */}
            <div style={{
              background: 'white',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              border: '1px solid var(--slate-200)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--slate-800)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sparkles size={14} color="var(--primary)" />
                  AI "Micro-Wait" Care Journey
                </span>
                <span style={{ 
                  fontFamily: 'var(--font-mono)', 
                  fontSize: '0.72rem', 
                  fontWeight: 700,
                  color: 'var(--primary)',
                  background: 'var(--primary-light)',
                  padding: '0.15rem 0.5rem',
                  borderRadius: 'var(--radius-full)'
                }}>
                  Est. ~{microWait.doctorEstMins + microWait.sanitizationEstMins}m Total
                </span>
              </div>

              {/* Discrete Micro-Wait Steps */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                
                {/* Step 1 */}
                <div style={{ display: 'flex', gap: '0.75rem', position: 'relative' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ 
                      width: 24, 
                      height: 24, 
                      borderRadius: '50%', 
                      background: microWait.step >= 1 ? 'var(--primary)' : 'var(--slate-200)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      zIndex: 2
                    }}>
                      {microWait.step > 1 ? '✓' : '1'}
                    </div>
                    <div style={{ width: 2, height: '100%', background: 'var(--slate-200)', position: 'absolute', top: 24, left: 11 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                      Physician Reviewing Triage Chart
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)', marginTop: '0.1rem' }}>
                      <strong style={{ color: 'var(--primary)' }}>{attendingDoctorName}</strong> is reviewing telemetry on Doctor Panel • ~{microWait.doctorEstMins || 4} mins
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div style={{ display: 'flex', gap: '0.75rem', position: 'relative' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ 
                      width: 24, 
                      height: 24, 
                      borderRadius: '50%', 
                      background: microWait.step >= 2 ? 'var(--warning-amber)' : 'var(--slate-200)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      zIndex: 2
                    }}>
                      {microWait.step > 2 ? '✓' : '2'}
                    </div>
                    <div style={{ width: 2, height: '100%', background: 'var(--slate-200)', position: 'absolute', top: 24, left: 11 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                      Room Sanitization & Tool Setup
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)', marginTop: '0.1rem' }}>
                      Hygiene protocol in progress ({microWait.targetRoom}) • ~{microWait.sanitizationEstMins} mins
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <div style={{ 
                    width: 24, 
                    height: 24, 
                    borderRadius: '50%', 
                    background: microWait.step >= 3 ? 'var(--secondary)' : 'var(--slate-200)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    zIndex: 2
                  }}>
                    3
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                      Ready for Patient Call
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)', marginTop: '0.1rem' }}>
                      Direct room entry on screen notification
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Vitals & Health Pulse Tracker (Novel Feature 3.1) */}
            <div style={{
              background: 'white',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              border: priorityInfo.isDeteriorating ? '1.5px solid var(--alert-crimson)' : '1px solid var(--slate-200)',
              boxShadow: priorityInfo.isDeteriorating ? 'var(--shadow-alert)' : 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--slate-800)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Activity size={14} color={priorityInfo.isDeteriorating ? 'var(--alert-crimson)' : 'var(--secondary)'} />
                  Wristband Pulse & Vitals Sync
                </span>
                <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)', color: 'var(--slate-500)' }}>
                  ID: {currentPatient.wristbandId}
                </span>
              </div>

              {priorityInfo.isDeteriorating && (
                <div style={{ 
                  background: 'var(--alert-crimson-light)', 
                  color: 'var(--alert-crimson)', 
                  padding: '0.5rem 0.75rem', 
                  borderRadius: 'var(--radius-sm)', 
                  fontSize: '0.72rem', 
                  fontWeight: 700,
                  marginTop: '0.6rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}>
                  <AlertCircle size={14} />
                  Vitals Deterioration Detected: Priority Index escalated to {priorityInfo.priorityIndex}
                </div>
              )}

              {/* Vitals Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '0.75rem' }}>
                <div style={{ background: '#f8fafc', padding: '0.6rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                  <Heart size={16} color={vitals.hr > 110 ? 'var(--alert-crimson)' : 'var(--slate-500)'} style={{ margin: '0 auto 0.2rem' }} />
                  <span style={{ fontSize: '0.65rem', color: 'var(--slate-500)', display: 'block' }}>Heart Rate</span>
                  <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: vitals.hr > 110 ? 'var(--alert-crimson)' : 'var(--slate-800)' }}>
                    {vitals.hr} <span style={{ fontSize: '0.6rem' }}>bpm</span>
                  </strong>
                </div>

                <div style={{ background: '#f8fafc', padding: '0.6rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                  <Activity size={16} color={vitals.spo2 < 93 ? 'var(--alert-crimson)' : 'var(--secondary)'} style={{ margin: '0 auto 0.2rem' }} />
                  <span style={{ fontSize: '0.65rem', color: 'var(--slate-500)', display: 'block' }}>SpO2</span>
                  <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: vitals.spo2 < 93 ? 'var(--alert-crimson)' : 'var(--slate-800)' }}>
                    {vitals.spo2}%
                  </strong>
                </div>

                <div style={{ background: '#f8fafc', padding: '0.6rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                  <Sliders size={16} color="var(--slate-500)" style={{ margin: '0 auto 0.2rem' }} />
                  <span style={{ fontSize: '0.65rem', color: 'var(--slate-500)', display: 'block' }}>Pain Scale</span>
                  <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: vitals.pain >= 7 ? 'var(--alert-crimson)' : 'var(--slate-800)' }}>
                    {vitals.pain}/10
                  </strong>
                </div>
              </div>

              {/* Patient Self-Report Pain Slider */}
              <form onSubmit={handlePainSubmit} style={{ marginTop: '0.85rem', borderTop: '1px solid var(--slate-100)', paddingTop: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--slate-700)' }}>
                    Self-Report Pain Level Change:
                  </label>
                  <span style={{ 
                    fontFamily: 'var(--font-mono)', 
                    fontWeight: 800, 
                    fontSize: '0.8rem',
                    color: reportedPain >= 8 ? 'var(--alert-crimson)' : reportedPain >= 5 ? 'var(--warning-amber)' : 'var(--secondary)'
                  }}>
                    {reportedPain} / 10
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={reportedPain}
                  onChange={(e) => setReportedPain(parseInt(e.target.value))}
                  style={{ width: '100%', marginTop: '0.4rem', cursor: 'pointer' }}
                  id="patient-pain-slider"
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--slate-400)', marginTop: '0.1rem' }}>
                  <span>0 (None)</span>
                  <span>5 (Moderate)</span>
                  <span>10 (Severe)</span>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '0.65rem', padding: '0.4rem', fontSize: '0.75rem' }}
                  id="btn-update-pain"
                >
                  <Send size={12} />
                  Transmit Symptom Update
                </button>

                {showPainSubmittedToast && (
                  <div style={{ 
                    marginTop: '0.4rem', 
                    fontSize: '0.7rem', 
                    color: 'var(--secondary)', 
                    textAlign: 'center',
                    fontWeight: 600
                  }}>
                    ✓ Vitals streamed to Triage Ingestion Engine!
                  </div>
                )}
              </form>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
