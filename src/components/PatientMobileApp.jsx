import React, { useState } from 'react';
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
  User
} from 'lucide-react';
import { calculatePriorityIndex } from '../utils/priorityEngine';

export default function PatientMobileApp({ 
  patients, 
  onUpdatePain, 
  onAcceptReslot, 
  onDeclineReslot 
}) {
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || 'P-101');
  const [reportedPain, setReportedPain] = useState(6);
  const [showPainSubmittedToast, setShowPainSubmittedToast] = useState(false);

  const currentPatient = patients.find(p => p.id === selectedPatientId) || patients[0];
  const priorityInfo = calculatePriorityIndex(currentPatient);
  const vitals = currentPatient?.liveVitals || {};
  const microWait = currentPatient?.microWait || { step: 1, doctorEstMins: 4, sanitizationEstMins: 3 };
  const etaDelay = currentPatient?.etaDelay || {};

  const handlePainSubmit = (e) => {
    e.preventDefault();
    onUpdatePain(currentPatient.id, reportedPain);
    setShowPainSubmittedToast(true);
    setTimeout(() => setShowPainSubmittedToast(false), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
      {/* Patient Switcher Bar */}
      <div style={{ 
        background: 'white', 
        padding: '0.85rem 1.5rem', 
        borderRadius: 'var(--radius-md)', 
        border: '1px solid var(--slate-200)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        width: '100%',
        maxWidth: '800px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <User size={18} color="var(--primary)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--slate-800)' }}>
            Viewing Patient Mobile App As:
          </span>
        </div>
        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '260px', padding: '0.4rem 0.8rem' }}
          value={selectedPatientId}
          onChange={(e) => {
            setSelectedPatientId(e.target.value);
            const pat = patients.find(p => p.id === e.target.value);
            if (pat) setReportedPain(pat.liveVitals?.pain || 5);
          }}
          id="patient-mobile-switcher"
        >
          {patients.map(p => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.wristbandId}) — ESI {p.esi} {p.etaDelay?.isDelayed ? '• [In Transit Delay]' : ''}
            </option>
          ))}
        </select>
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
                      Physician Finalizing Prior Patient
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)', marginTop: '0.1rem' }}>
                      {microWait.currentDoctor} is completing notes • ~{microWait.doctorEstMins} mins
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
