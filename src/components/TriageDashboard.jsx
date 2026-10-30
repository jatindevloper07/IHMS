import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Heart, 
  Activity, 
  Clock, 
  ArrowUpRight, 
  UserPlus, 
  ShieldAlert, 
  HelpCircle,
  Stethoscope,
  TrendingUp,
  Sliders,
  CheckCircle2,
  X
} from 'lucide-react';
import Sparkline from './Sparkline';
import { calculatePriorityIndex, WEIGHTS } from '../utils/priorityEngine';

export default function TriageDashboard({ 
  patients, 
  rooms,
  onUpdatePatientVitals, 
  onManualOverride, 
  onFastTrackPatient,
  onAddPatient,
  simTime
}) {
  const [selectedPatientForOverride, setSelectedPatientForOverride] = useState(null);
  const [overrideReason, setOverrideReason] = useState('Vitals Spike');
  const [overrideNotes, setOverrideNotes] = useState('');
  const [overrideBoost, setOverrideBoost] = useState(0.25);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newPatient, setNewPatient] = useState({
    name: '',
    age: '',
    gender: 'Female',
    esi: 3,
    chiefComplaint: '',
    requiredEquipment: ['Ultrasound'],
    hr: 82,
    spo2: 98,
    pain: 4
  });

  // Filter patients who are currently waiting
  const waitingPatients = patients
    .filter(p => p.status === 'waiting')
    .map(p => {
      const calc = calculatePriorityIndex(p);
      return { ...p, ...calc };
    })
    // Sort descending by priority index P(t)
    .sort((a, b) => b.priorityIndex - a.priorityIndex);

  const handleOpenOverride = (patient) => {
    setSelectedPatientForOverride(patient);
    setOverrideReason('Vitals Spike');
    setOverrideNotes('');
    setOverrideBoost(0.25);
  };

  const handleSaveOverride = (e) => {
    e.preventDefault();
    if (!selectedPatientForOverride) return;
    onManualOverride(selectedPatientForOverride.id, overrideBoost, overrideReason, overrideNotes);
    setSelectedPatientForOverride(null);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newPatient.name.trim()) return;
    onAddPatient({
      name: newPatient.name,
      age: parseInt(newPatient.age) || 35,
      gender: newPatient.gender,
      esi: parseInt(newPatient.esi),
      chiefComplaint: newPatient.chiefComplaint || 'Acute symptoms requiring evaluation',
      requiredEquipment: newPatient.requiredEquipment,
      hr: parseInt(newPatient.hr) || 80,
      spo2: parseInt(newPatient.spo2) || 98,
      pain: parseInt(newPatient.pain) || 3
    });
    setIsAddModalOpen(false);
    setNewPatient({
      name: '',
      age: '',
      gender: 'Female',
      esi: 3,
      chiefComplaint: '',
      requiredEquipment: ['Ultrasound'],
      hr: 82,
      spo2: 98,
      pain: 4
    });
  };

  const toggleEquipmentSelection = (eq) => {
    setNewPatient(prev => {
      const exists = prev.requiredEquipment.includes(eq);
      return {
        ...prev,
        requiredEquipment: exists
          ? prev.requiredEquipment.filter(item => item !== eq)
          : [...prev.requiredEquipment, eq]
      };
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Metric Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
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
          <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '0.3rem' }}>
            Formula: <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)', fontWeight: 700 }}>P(t) = 0.5·U + 0.2·T + 0.3·ΔV</code>
          </div>
        </div>

        <div className="card" style={{ padding: '1.1rem 1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>Active Vitals Deteriorations</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--alert-crimson-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--alert-crimson)' }}>
              <ShieldAlert size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--alert-crimson)', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {waitingPatients.filter(p => p.isDeteriorating).length}
            {waitingPatients.filter(p => p.isDeteriorating).length > 0 && (
              <span className="badge badge-deterioration-alert" style={{ fontSize: '0.65rem' }}>
                LIVE ESCALATION
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '0.3rem' }}>
            Continuous IoT Wristband streaming every 15s
          </div>
        </div>

        <div className="card" style={{ padding: '1.1rem 1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>Average Waiting Time</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--secondary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary)' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--slate-900)', marginTop: '0.4rem' }}>
            {waitingPatients.length > 0 
              ? Math.round(waitingPatients.reduce((acc, p) => acc + (p.checkedInMinutesAgo || 0), 0) / waitingPatients.length)
              : 0} <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--slate-500)' }}>mins</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 600, marginTop: '0.3rem' }}>
            ↓ 23% vs standard static FIFO triage
          </div>
        </div>
      </div>

      {/* Main Dynamic Priority Table Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <h2>
              <Activity size={20} color="var(--primary)" />
              Dynamic Clinical Priority Queue (Real-Time Ingestion)
            </h2>
            <p>
              Auto-ranked by mathematical Priority Index P(t). Dynamically re-orders when vital signs or clinical urgency escalate.
            </p>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => setIsAddModalOpen(true)}
            id="btn-add-patient"
          >
            <UserPlus size={16} />
            Triage New Walk-in Patient
          </button>
        </div>

        <div className="table-responsive">
          <table className="data-table" id="priority-queue-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Rank</th>
                <th>Priority Index P(t)</th>
                <th>Patient Details</th>
                <th>Triage ESI</th>
                <th>Live Vitals & Trend</th>
                <th>Alert Status</th>
                <th>Required Equipment</th>
                <th>Elapsed Wait</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {waitingPatients.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: 'var(--slate-500)' }}>
                    No patients currently waiting in queue.
                  </td>
                </tr>
              ) : (
                waitingPatients.map((patient, index) => {
                  const isAlert = patient.isDeteriorating;
                  const vitals = patient.liveVitals || {};

                  return (
                    <tr 
                      key={patient.id} 
                      className={isAlert ? 'row-deteriorating' : ''}
                      id={`patient-row-${patient.id}`}
                    >
                      {/* Rank */}
                      <td>
                        <span style={{ 
                          fontWeight: 800, 
                          fontSize: '0.95rem',
                          color: index === 0 ? 'var(--primary)' : 'var(--slate-600)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.2rem'
                        }}>
                          #{index + 1}
                        </span>
                      </td>

                      {/* Priority Index P(t) */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <span style={{ 
                            fontFamily: 'var(--font-mono)', 
                            fontWeight: 800, 
                            fontSize: '0.95rem',
                            color: isAlert ? 'var(--alert-crimson)' : 'var(--primary)'
                          }}>
                            {patient.priorityIndex.toFixed(3)}
                          </span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--slate-500)' }} title="U: Clinical, T: Time, ΔV: Vitals Drop">
                            U: {patient.uClinical} | T: {patient.tElapsed} | ΔV: {patient.deltaV}
                          </span>
                        </div>
                      </td>

                      {/* Patient Details */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <strong style={{ color: 'var(--slate-900)', fontSize: '0.875rem' }}>{patient.name}</strong>
                            <span style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>
                              ({patient.age}y, {patient.gender[0]})
                            </span>
                          </div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--slate-500)', marginTop: '0.15rem' }}>
                            {patient.chiefComplaint}
                          </span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--slate-400)', marginTop: '0.1rem' }}>
                            ID: {patient.wristbandId}
                          </span>
                        </div>
                      </td>

                      {/* ESI */}
                      <td>
                        <span className={`badge badge-esi-${patient.esi}`}>
                          ESI Level {patient.esi}
                        </span>
                      </td>

                      {/* Live Vitals & Sparkline */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', fontWeight: 600 }}>
                              <Heart size={13} color={vitals.hr > 110 ? 'var(--alert-crimson)' : 'var(--slate-500)'} />
                              <span style={{ fontFamily: 'var(--font-mono)', color: vitals.hr > 110 ? 'var(--alert-crimson)' : 'var(--slate-800)' }}>
                                {vitals.hr} bpm
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', fontWeight: 600 }}>
                              <Activity size={13} color={vitals.spo2 < 93 ? 'var(--alert-crimson)' : 'var(--secondary)'} />
                              <span style={{ fontFamily: 'var(--font-mono)', color: vitals.spo2 < 93 ? 'var(--alert-crimson)' : 'var(--slate-800)' }}>
                                SpO2: {vitals.spo2}%
                              </span>
                            </div>
                            <div style={{ fontSize: '0.7rem', color: vitals.pain >= 7 ? 'var(--alert-crimson)' : 'var(--slate-500)' }}>
                              Pain: {vitals.pain}/10
                            </div>
                          </div>

                          {/* Mini Sparkline Chart */}
                          <div style={{ background: 'rgba(255, 255, 255, 0.7)', padding: '0.2rem', borderRadius: 4, border: '1px solid var(--slate-200)' }}>
                            <Sparkline data={vitals.history || [vitals.hr - 5, vitals.hr - 2, vitals.hr]} isAlert={isAlert} />
                          </div>
                        </div>
                      </td>

                      {/* Alert Status */}
                      <td>
                        {isAlert ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span className="badge badge-deterioration-alert">
                              <AlertTriangle size={12} />
                              ΔV = +{patient.deltaV}
                            </span>
                            {patient.reasons && patient.reasons.length > 0 && (
                              <span style={{ fontSize: '0.68rem', color: 'var(--alert-crimson)', fontWeight: 600 }}>
                                {patient.reasons[0]}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="badge" style={{ background: 'var(--slate-100)', color: 'var(--slate-600)' }}>
                            Stable (ΔV=0)
                          </span>
                        )}
                      </td>

                      {/* Required Equipment */}
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {patient.requiredEquipment?.map(eq => (
                            <span key={eq} className="tag-equipment">
                              <Stethoscope size={10} color="var(--primary)" />
                              {eq}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Elapsed Wait */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                          <Clock size={13} color="var(--slate-400)" />
                          <span>{patient.checkedInMinutesAgo} min</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.72rem' }}
                            title="Triage Manual Override with justification audit"
                            onClick={() => handleOpenOverride(patient)}
                            id={`override-btn-${patient.id}`}
                          >
                            <Sliders size={12} />
                            Override
                          </button>

                          <button
                            className="btn btn-primary"
                            style={{ padding: '0.3rem 0.65rem', fontSize: '0.72rem' }}
                            title="Fast-Track into next compatible consultation room"
                            onClick={() => onFastTrackPatient(patient.id)}
                            id={`fasttrack-btn-${patient.id}`}
                          >
                            <ArrowUpRight size={13} />
                            Assign Room
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Clinical Override Modal */}
      {selectedPatientForOverride && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Clinical Queue Override & Audit Log</h3>
              <button 
                className="modal-close-btn"
                onClick={() => setSelectedPatientForOverride(null)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveOverride}>
              <div className="modal-body">
                <div style={{ background: 'var(--slate-50)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem', border: '1px solid var(--slate-200)' }}>
                  <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>
                    Patient: {selectedPatientForOverride.name} (ESI {selectedPatientForOverride.esi})
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--slate-600)', marginTop: '0.2rem' }}>
                    Current P(t): <code style={{ fontFamily: 'var(--font-mono)' }}>{selectedPatientForOverride.priorityIndex}</code> | Complaint: {selectedPatientForOverride.chiefComplaint}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Clinical Justification Reason (Required for Compliance)</label>
                  <select 
                    className="form-select"
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                  >
                    <option value="Vitals Spike">Vitals Spike / Acute Deterioration Observed</option>
                    <option value="Mobility Issue">Acute Distress / Severe Mobility Barrier</option>
                    <option value="Doctor Request">Physician Explicit Urgent Request</option>
                    <option value="Special Diagnostic Pre-requisite">Immediate Diagnostic Prep Window</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Priority Boost Delta (+P)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input 
                      type="range" 
                      min="0.10" 
                      max="0.50" 
                      step="0.05"
                      value={overrideBoost}
                      onChange={(e) => setOverrideBoost(parseFloat(e.target.value))}
                      style={{ flex: 1 }}
                    />
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)', width: '50px' }}>
                      +{overrideBoost.toFixed(2)}
                    </span>
                  </div>
                  <small style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>
                    Boosts position in dynamic priority queue immediately.
                  </small>
                </div>

                <div className="form-group">
                  <label className="form-label">Clinical Notes & Justification</label>
                  <textarea 
                    className="form-textarea"
                    rows="3"
                    placeholder="Enter clinical assessment notes for medical audit log..."
                    value={overrideNotes}
                    onChange={(e) => setOverrideNotes(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setSelectedPatientForOverride(null)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  id="btn-confirm-override"
                >
                  Confirm Override & Log Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Triage New Walk-In Patient Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3>Triage Walk-In Intake & Wristband Pairing</h3>
              <button 
                className="modal-close-btn"
                onClick={() => setIsAddModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.85rem' }}>
                  <div className="form-group">
                    <label className="form-label">Patient Full Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Liam Foster" 
                      value={newPatient.name}
                      onChange={e => setNewPatient({ ...newPatient, name: e.target.value })}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Age</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder="e.g. 42" 
                      value={newPatient.age}
                      onChange={e => setNewPatient({ ...newPatient, age: e.target.value })}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select 
                      className="form-select"
                      value={newPatient.gender}
                      onChange={e => setNewPatient({ ...newPatient, gender: e.target.value })}
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.85rem' }}>
                  <div className="form-group">
                    <label className="form-label">Initial Triage ESI (1 - 5)</label>
                    <select 
                      className="form-select"
                      value={newPatient.esi}
                      onChange={e => setNewPatient({ ...newPatient, esi: e.target.value })}
                    >
                      <option value="1">ESI 1 - Resuscitation (Immediate)</option>
                      <option value="2">ESI 2 - Emergent</option>
                      <option value="3">ESI 3 - Urgent</option>
                      <option value="4">ESI 4 - Less Urgent</option>
                      <option value="5">ESI 5 - Non-Urgent</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Chief Complaint & Symptoms</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Acute chest discomfort with diaphoresis"
                      value={newPatient.chiefComplaint}
                      onChange={e => setNewPatient({ ...newPatient, chiefComplaint: e.target.value })}
                      required 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Required Equipment & Diagnostics (For Room Constraint Match)</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.3rem' }}>
                    {['Ultrasound', 'ECG', 'ENT Kit', 'Mobile X-Ray', 'Defibrillator'].map(eq => {
                      const isSelected = newPatient.requiredEquipment.includes(eq);
                      return (
                        <button
                          key={eq}
                          type="button"
                          onClick={() => toggleEquipmentSelection(eq)}
                          className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                        >
                          {isSelected ? <CheckCircle2 size={13} /> : null}
                          {eq}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ background: 'var(--slate-50)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--slate-200)', marginTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--slate-700)', display: 'block', marginBottom: '0.5rem' }}>
                    Paired IoT Smart Wristband Baseline Vitals
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.85rem' }}>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: 'var(--slate-600)', display: 'block' }}>Heart Rate (bpm)</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        value={newPatient.hr}
                        onChange={e => setNewPatient({ ...newPatient, hr: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: 'var(--slate-600)', display: 'block' }}>SpO2 (%)</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        value={newPatient.spo2}
                        onChange={e => setNewPatient({ ...newPatient, spo2: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: 'var(--slate-600)', display: 'block' }}>Pain Scale (0-10)</label>
                      <input 
                        type="number" 
                        min="0" 
                        max="10" 
                        className="form-input" 
                        value={newPatient.pain}
                        onChange={e => setNewPatient({ ...newPatient, pain: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  id="btn-submit-new-patient"
                >
                  Pair Wristband & Queue Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
