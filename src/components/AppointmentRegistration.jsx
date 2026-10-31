import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  Activity, 
  ShieldCheck, 
  QrCode, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  AlertCircle, 
  Stethoscope, 
  Car, 
  Navigation,
  Sliders,
  ChevronRight,
  UserCheck,
  X
} from 'lucide-react';

const DEPARTMENTS = [
  { id: 'General Internal Medicine', label: 'General Internal Medicine', icon: '🩺', equip: ['ENT Kit', 'ECG'], wait: 8 },
  { id: 'Cardiology & Diagnostic ECG', label: 'Cardiology & Diagnostic ECG', icon: '🫀', equip: ['ECG', 'Ultrasound'], wait: 6 },
  { id: 'Orthopedics & Diagnostic Imaging', label: 'Orthopedics & Diagnostic Imaging', icon: '🦴', equip: ['Mobile X-Ray'], wait: 10 },
  { id: 'Emergency & Acute Trauma', label: 'Emergency & Acute Trauma', icon: '🚨', equip: ['Ultrasound', 'Defibrillator', 'ECG'], wait: 3 },
  { id: 'ENT & Minor Procedures', label: 'ENT & Minor Procedures', icon: '👂', equip: ['ENT Kit'], wait: 5 },
  { id: 'Pulmonology & Respiratory', label: 'Pulmonology & Respiratory', icon: '🫁', equip: ['ECG', 'Ultrasound'], wait: 7 }
];

const RECOMMENDED_SLOTS = [
  { time: '19:30', date: 'Today', type: 'Fastest Intake Window', waitMins: 6, tag: 'AI Recommended' },
  { time: '20:00', date: 'Today', type: 'Low Congestion Buffer', waitMins: 4, tag: 'Lowest Wait' },
  { time: '20:30', date: 'Today', type: 'Evening Diagnostic Slot', waitMins: 5, tag: 'Available' },
  { time: '21:00', date: 'Today', type: 'Night Clinic Intake', waitMins: 3, tag: 'Available' }
];

export default function AppointmentRegistration({ 
  appointments = [], 
  onRegisterAppointment, 
  onCheckInAppointment, 
  onCancelAppointment 
}) {
  const [currentStep, setCurrentStep] = useState(1); // 1: Info, 2: Symptoms & ESI, 3: Slots & Location, 4: Confirmed Pass
  const [recentPass, setRecentPass] = useState(null);

  const [form, setForm] = useState({
    patientName: '',
    age: '',
    gender: 'Female',
    phone: '',
    email: '',
    department: 'General Internal Medicine',
    chiefComplaint: '',
    painLevel: 3,
    hasChestPain: false,
    hasShortnessOfBreath: false,
    hasBleeding: false,
    requiredEquipment: ['ENT Kit'],
    selectedSlot: RECOMMENDED_SLOTS[0],
    distanceKm: 4.2,
    geofencingOptIn: true
  });

  // Calculate dynamic ESI estimate based on symptoms
  const calculateEstimatedESI = () => {
    if (form.hasChestPain || form.hasShortnessOfBreath) return 2; // Emergent
    if (form.painLevel >= 8 || form.hasBleeding) return 3; // Urgent
    if (form.painLevel >= 5) return 4; // Less Urgent
    return 5; // Non-Urgent
  };

  const handleDepartmentChange = (deptId) => {
    const dept = DEPARTMENTS.find(d => d.id === deptId);
    setForm(prev => ({
      ...prev,
      department: deptId,
      requiredEquipment: dept ? dept.equip : ['ENT Kit']
    }));
  };

  const toggleEquipment = (eq) => {
    setForm(prev => {
      const exists = prev.requiredEquipment.includes(eq);
      return {
        ...prev,
        requiredEquipment: exists 
          ? prev.requiredEquipment.filter(item => item !== eq)
          : [...prev.requiredEquipment, eq]
      };
    });
  };

  const handleSubmitRegistration = async (e) => {
    e.preventDefault();
    const esi = calculateEstimatedESI();

    const payload = {
      patientName: form.patientName,
      age: parseInt(form.age) || 30,
      gender: form.gender,
      phone: form.phone,
      email: form.email,
      department: form.department,
      chiefComplaint: form.chiefComplaint || 'Self-registered symptom evaluation',
      esi,
      requiredEquipment: form.requiredEquipment,
      painLevel: form.painLevel,
      appointmentTime: form.selectedSlot.time,
      appointmentDate: form.selectedSlot.date,
      slotType: form.selectedSlot.type,
      estimatedWaitMins: form.selectedSlot.waitMins,
      distanceKm: form.distanceKm,
      geofencingOptIn: form.geofencingOptIn
    };

    const created = await onRegisterAppointment(payload);
    setRecentPass(created || { ...payload, digitalPassId: `PASS-${Math.floor(1000 + Math.random() * 9000)}` });
    setCurrentStep(4);
  };

  const handleResetForm = () => {
    setForm({
      patientName: '',
      age: '',
      gender: 'Female',
      phone: '',
      email: '',
      department: 'General Internal Medicine',
      chiefComplaint: '',
      painLevel: 3,
      hasChestPain: false,
      hasShortnessOfBreath: false,
      hasBleeding: false,
      requiredEquipment: ['ENT Kit'],
      selectedSlot: RECOMMENDED_SLOTS[0],
      distanceKm: 4.2,
      geofencingOptIn: true
    });
    setRecentPass(null);
    setCurrentStep(1);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0F52BA, #00A896)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem 1.8rem',
        color: 'white',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.25rem'
      }}>
        <div style={{ maxWidth: '800px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ 
              background: 'rgba(255, 255, 255, 0.25)', 
              padding: '0.2rem 0.6rem', 
              borderRadius: 'var(--radius-full)', 
              fontSize: '0.7rem', 
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              PRD 5.1 Smart Scheduling & Intake
            </span>
            <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>
              Location-Aware • AI Wait Optimization • Dynamic Delay Protection
            </span>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.4rem' }}>
            Patient Self-Service Appointment Registration Portal
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.88)', marginTop: '0.35rem' }}>
            Pre-register your visit, stream initial symptoms to the triage engine, pick AI-recommended low-wait time slots, and receive your digital fast-track pass.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn"
            style={{ background: 'white', color: 'var(--primary)', fontWeight: 700, padding: '0.6rem 1.25rem' }}
            onClick={() => {
              handleResetForm();
              const el = document.getElementById('registration-wizard-card');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <Calendar size={16} />
            Book New Appointment
          </button>
        </div>
      </div>

      {/* Main Grid: Left Wizard + Right Registered Appointments */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(420px, 1.4fr) minmax(360px, 1fr)', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Registration Wizard Card */}
        <div className="card" id="registration-wizard-card">
          <div className="card-header">
            <div className="card-title-group">
              <h2>
                <Calendar size={18} color="var(--primary)" />
                Self-Service Appointment Wizard
              </h2>
              <p>Step {currentStep} of 4: {
                currentStep === 1 ? 'Patient Demographics' :
                currentStep === 2 ? 'Clinical Pre-Triage Symptoms' :
                currentStep === 3 ? 'AI Slot & Location Selection' :
                'Digital Fast-Track Pass Generated'
              }</p>
            </div>
          </div>

          <div className="card-body">
            
            {/* Step Indicators */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--slate-100)', paddingBottom: '1rem' }}>
              {[
                { num: 1, label: 'Demographics' },
                { num: 2, label: 'Pre-Triage' },
                { num: 3, label: 'Smart Slot' },
                { num: 4, label: 'Digital Pass' }
              ].map(s => (
                <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: currentStep >= s.num ? 'var(--primary)' : 'var(--slate-200)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}>
                    {currentStep > s.num ? '✓' : s.num}
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: currentStep === s.num ? 700 : 500, color: currentStep === s.num ? 'var(--slate-900)' : 'var(--slate-500)' }}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            {/* STEP 1: Demographics */}
            {currentStep === 1 && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.85rem' }}>
                  <div className="form-group">
                    <label className="form-label">Full Legal Name *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Jordan Vance"
                      value={form.patientName}
                      onChange={e => setForm({ ...form, patientName: e.target.value })}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Age *</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder="e.g. 42"
                      value={form.age}
                      onChange={e => setForm({ ...form, age: e.target.value })}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select 
                      className="form-select"
                      value={form.gender}
                      onChange={e => setForm({ ...form, gender: e.target.value })}
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div className="form-group">
                    <label className="form-label">Phone Number (For SMS / Delay Alerts)</label>
                    <input 
                      type="tel" 
                      className="form-input" 
                      placeholder="+1 (555) 000-0000"
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input 
                      type="email" 
                      className="form-input" 
                      placeholder="jordan.vance@example.com"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Target Medical Department / Specialty</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginTop: '0.35rem' }}>
                    {DEPARTMENTS.map(dept => {
                      const isSelected = form.department === dept.id;
                      return (
                        <div
                          key={dept.id}
                          onClick={() => handleDepartmentChange(dept.id)}
                          style={{
                            padding: '0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            border: isSelected ? '2px solid var(--primary)' : '1px solid var(--slate-200)',
                            background: isSelected ? 'var(--primary-light)' : '#ffffff',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', fontWeight: 700, color: isSelected ? 'var(--primary)' : 'var(--slate-800)' }}>
                            <span>{dept.icon}</span>
                            <span>{dept.label}</span>
                          </div>
                          <span style={{ fontSize: '0.68rem', color: 'var(--slate-500)', marginTop: '0.2rem', display: 'block' }}>
                            Avg. Wait: ~{dept.wait} mins • Diagnostic tools: {dept.equip.join(', ')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={!form.patientName.trim()}
                    onClick={() => setCurrentStep(2)}
                  >
                    Continue to Pre-Triage <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Symptoms & Pre-Triage Questionnaire */}
            {currentStep === 2 && (
              <div>
                <div className="form-group">
                  <label className="form-label">Describe Your Symptoms / Reason for Visit *</label>
                  <textarea 
                    className="form-textarea"
                    rows="3"
                    placeholder="e.g. Experiencing sharp chest tightness when breathing deeply since this morning..."
                    value={form.chiefComplaint}
                    onChange={e => setForm({ ...form, chiefComplaint: e.target.value })}
                    required
                  />
                </div>

                {/* Pain Scale */}
                <div className="form-group" style={{ background: '#f8fafc', padding: '0.9rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--slate-200)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Current Pain Severity Level:</label>
                    <strong style={{ 
                      fontFamily: 'var(--font-mono)', 
                      fontSize: '0.9rem',
                      color: form.painLevel >= 8 ? 'var(--alert-crimson)' : form.painLevel >= 5 ? 'var(--warning-amber)' : 'var(--secondary)'
                    }}>
                      {form.painLevel} / 10
                    </strong>
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="10"
                    value={form.painLevel}
                    onChange={e => setForm({ ...form, painLevel: parseInt(e.target.value) })}
                    style={{ width: '100%', marginTop: '0.5rem', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--slate-400)', marginTop: '0.2rem' }}>
                    <span>0 - No Pain</span>
                    <span>5 - Moderate</span>
                    <span>10 - Severe</span>
                  </div>
                </div>

                {/* Red Flag Checklist */}
                <div className="form-group">
                  <label className="form-label">Clinical Red-Flag Screen (Select any present):</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginTop: '0.35rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--slate-800)', cursor: 'pointer' }}>
                      <input 
                        type="checkbox"
                        checked={form.hasChestPain}
                        onChange={e => setForm({ ...form, hasChestPain: e.target.checked })}
                      />
                      <span>Chest pain, severe pressure, or pain radiating to left arm</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--slate-800)', cursor: 'pointer' }}>
                      <input 
                        type="checkbox"
                        checked={form.hasShortnessOfBreath}
                        onChange={e => setForm({ ...form, hasShortnessOfBreath: e.target.checked })}
                      />
                      <span>Sudden acute shortness of breath or difficulty speaking</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--slate-800)', cursor: 'pointer' }}>
                      <input 
                        type="checkbox"
                        checked={form.hasBleeding}
                        onChange={e => setForm({ ...form, hasBleeding: e.target.checked })}
                      />
                      <span>Active laceration, visible deformity, or acute bleeding</span>
                    </label>
                  </div>
                </div>

                {/* Pre-triage assessment box */}
                <div style={{ 
                  background: calculateEstimatedESI() <= 2 ? 'var(--alert-crimson-light)' : 'var(--secondary-light)',
                  border: `1px solid ${calculateEstimatedESI() <= 2 ? 'rgba(217, 4, 41, 0.3)' : 'rgba(0, 168, 150, 0.3)'}`,
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--slate-600)', display: 'block' }}>Pre-Triage Clinical Urgency Estimate:</span>
                    <strong style={{ 
                      fontSize: '0.9rem', 
                      color: calculateEstimatedESI() <= 2 ? 'var(--alert-crimson)' : 'var(--secondary)'
                    }}>
                      ESI Level {calculateEstimatedESI()} ({
                        calculateEstimatedESI() === 2 ? 'Emergent Priority' :
                        calculateEstimatedESI() === 3 ? 'Urgent Priority' :
                        calculateEstimatedESI() === 4 ? 'Less Urgent' : 'Routine'
                      })
                    </strong>
                  </div>
                  <span className="badge" style={{ background: 'white', color: 'var(--slate-700)' }}>
                    Auto-Configured
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.25rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setCurrentStep(1)}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setCurrentStep(3)}
                  >
                    Select Smart Time Slot <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Smart Slot & Location / GPS Geofencing */}
            {currentStep === 3 && (
              <form onSubmit={handleSubmitRegistration}>
                {/* Distance & Geofencing */}
                <div className="form-group" style={{ background: '#f8fafc', padding: '0.9rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--slate-200)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <MapPin size={15} color="var(--primary)" />
                      Estimated Transit Distance to Hospital:
                    </label>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)' }}>
                      {form.distanceKm} km (~{Math.round(form.distanceKm * 2.5)} mins drive)
                    </span>
                  </div>
                  <input 
                    type="range"
                    min="0.5"
                    max="25.0"
                    step="0.5"
                    value={form.distanceKm}
                    onChange={e => setForm({ ...form, distanceKm: parseFloat(e.target.value) })}
                    style={{ width: '100%', marginTop: '0.5rem', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.65rem' }}>
                    <input 
                      type="checkbox"
                      id="optin-geofencing"
                      checked={form.geofencingOptIn}
                      onChange={e => setForm({ ...form, geofencingOptIn: e.target.checked })}
                    />
                    <label htmlFor="optin-geofencing" style={{ fontSize: '0.75rem', color: 'var(--slate-700)', cursor: 'pointer' }}>
                      <strong>Enable Automated GPS Delay Assistant:</strong> If traffic delays occur, IHMS will automatically shift your window without queue penalties (PRD 3.5).
                    </label>
                  </div>
                </div>

                {/* AI Recommended Time Slots */}
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Sparkles size={14} color="var(--secondary)" />
                    Select AI Optimized Arrival Window:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.65rem', marginTop: '0.35rem' }}>
                    {RECOMMENDED_SLOTS.map(slot => {
                      const isSelected = form.selectedSlot.time === slot.time;
                      return (
                        <div
                          key={slot.time}
                          onClick={() => setForm({ ...form, selectedSlot: slot })}
                          style={{
                            padding: '0.85rem',
                            borderRadius: 'var(--radius-sm)',
                            border: isSelected ? '2px solid var(--primary)' : '1px solid var(--slate-200)',
                            background: isSelected ? 'var(--primary-light)' : '#ffffff',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.35rem',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 800, color: 'var(--slate-900)' }}>
                              {slot.time}
                            </span>
                            <span className="badge" style={{ 
                              background: isSelected ? 'var(--primary)' : 'var(--slate-100)', 
                              color: isSelected ? 'white' : 'var(--slate-700)',
                              fontSize: '0.65rem'
                            }}>
                              {slot.tag}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--slate-600)' }}>
                            {slot.type}
                          </span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--secondary)', fontWeight: 700 }}>
                            Predicted Wait: ~{slot.waitMins} mins
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Equipment reservation summary */}
                <div className="form-group">
                  <label className="form-label">Pre-Allocated Diagnostic Tooling:</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem' }}>
                    {['Ultrasound', 'ECG', 'ENT Kit', 'Mobile X-Ray'].map(eq => {
                      const isSelected = form.requiredEquipment.includes(eq);
                      return (
                        <button
                          key={eq}
                          type="button"
                          onClick={() => toggleEquipment(eq)}
                          className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ padding: '0.3rem 0.65rem', fontSize: '0.72rem' }}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {eq}
                        </button>
                      );
                    })}
                  </div>
                  <small style={{ fontSize: '0.68rem', color: 'var(--slate-500)', marginTop: '0.25rem', display: 'block' }}>
                    Priming the Room Constraint Matching Solver in advance for zero-wait room turnover.
                  </small>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.25rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setCurrentStep(2)}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    id="btn-confirm-appointment"
                  >
                    Confirm & Issue Digital Fast-Track Pass <CheckCircle2 size={15} />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 4: Digital Fast-Track Pass Generated */}
            {currentStep === 4 && recentPass && (
              <div style={{ textAlign: 'center', padding: '0.5rem' }}>
                <div style={{
                  background: 'linear-gradient(135deg, #f8fafc, #edf2f7)',
                  border: '2px solid var(--secondary)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.5rem',
                  maxWidth: '380px',
                  margin: '0 auto',
                  boxShadow: 'var(--shadow-md)',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed var(--slate-300)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ textAlign: 'left' }}>
                      <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--slate-500)', letterSpacing: '0.05em' }}>IHMS Fast-Track Pass</span>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--slate-900)' }}>{recentPass.patientName}</h3>
                    </div>
                    <span style={{ 
                      fontFamily: 'var(--font-mono)', 
                      fontSize: '0.85rem', 
                      fontWeight: 800,
                      color: 'var(--secondary)',
                      background: 'var(--secondary-light)',
                      padding: '0.2rem 0.6rem',
                      borderRadius: 'var(--radius-sm)'
                    }}>
                      {recentPass.digitalPassId}
                    </span>
                  </div>

                  {/* QR Code Mockup */}
                  <div style={{
                    width: 140,
                    height: 140,
                    background: '#ffffff',
                    border: '1px solid var(--slate-200)',
                    borderRadius: 'var(--radius-md)',
                    margin: '0 auto 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem'
                  }}>
                    <QrCode size={95} color="var(--slate-800)" />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--slate-500)' }}>
                      Scan at Kiosk Gate
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', textAlign: 'left', fontSize: '0.75rem' }}>
                    <div>
                      <span style={{ color: 'var(--slate-500)', display: 'block' }}>Slot Time:</span>
                      <strong>{recentPass.appointmentTime} ({recentPass.appointmentDate})</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--slate-500)', display: 'block' }}>Department:</span>
                      <strong>{recentPass.department}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--slate-500)', display: 'block' }}>Triage Priority:</span>
                      <strong style={{ color: 'var(--primary)' }}>ESI Level {recentPass.esi}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--slate-500)', display: 'block' }}>Est. Wait:</span>
                      <strong style={{ color: 'var(--secondary)' }}>~{recentPass.estimatedWaitMins} mins</strong>
                    </div>
                  </div>

                  <div style={{ marginTop: '1rem', borderTop: '1px dashed var(--slate-300)', paddingTop: '0.75rem', fontSize: '0.7rem', color: 'var(--slate-500)' }}>
                    ✓ Pre-registered in SQLite Database (`appointments` table)
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={handleResetForm}
                  >
                    Register Another Patient
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      if (recentPass.id) onCheckInAppointment(recentPass.id);
                      handleResetForm();
                    }}
                  >
                    <UserCheck size={14} />
                    Check In Now & Enter Triage Queue
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Right Side: Registered Appointments List & Tracking */}
        <div className="card">
          <div className="card-header">
            <div className="card-title-group">
              <h2>
                <Clock size={18} color="var(--primary)" />
                Upcoming Self-Service Appointments
              </h2>
              <p>Active appointments scheduled via self-service portal ({appointments.length} total)</p>
            </div>
          </div>

          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '680px', overflowY: 'auto' }}>
            {appointments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--slate-500)', fontSize: '0.85rem' }}>
                No self-service appointments booked yet. Use the wizard to schedule.
              </div>
            ) : (
              appointments.map(appt => {
                const isScheduled = appt.status === 'Scheduled';
                const isCheckedIn = appt.status === 'Checked-In';
                const isCancelled = appt.status === 'Cancelled';

                return (
                  <div
                    key={appt.id}
                    style={{
                      background: isCheckedIn ? '#f0fdf4' : isCancelled ? '#f8fafc' : '#ffffff',
                      border: isCheckedIn ? '1px solid #86efac' : isCancelled ? '1px solid var(--slate-200)' : '1px solid var(--slate-200)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.65rem',
                      boxShadow: 'var(--shadow-sm)',
                      opacity: isCancelled ? 0.6 : 1
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <strong style={{ fontSize: '0.925rem', color: 'var(--slate-900)' }}>{appt.patientName}</strong>
                          <span style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>({appt.age}y, {appt.gender})</span>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--slate-600)' }}>{appt.department}</span>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                        <span className="badge" style={{
                          background: isCheckedIn ? '#dcfce7' : isCancelled ? 'var(--slate-200)' : 'var(--primary-light)',
                          color: isCheckedIn ? '#15803d' : isCancelled ? 'var(--slate-600)' : 'var(--primary)',
                          fontSize: '0.68rem',
                          fontWeight: 700
                        }}>
                          {appt.status}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--slate-400)' }}>
                          {appt.digitalPassId}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.45rem', fontSize: '0.75rem', background: 'rgba(0,0,0,0.02)', padding: '0.5rem', borderRadius: 4 }}>
                      <div>
                        <span style={{ color: 'var(--slate-500)', display: 'block', fontSize: '0.68rem' }}>Slot & Est. Wait:</span>
                        <strong>{appt.appointmentTime} (~{appt.estimatedWaitMins}m wait)</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--slate-500)', display: 'block', fontSize: '0.68rem' }}>Triage & Tools:</span>
                        <strong>ESI {appt.esi} • {appt.requiredEquipment?.join(', ') || 'General'}</strong>
                      </div>
                    </div>

                    {/* Actions */}
                    {isScheduled && (
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                        <button
                          className="btn btn-primary"
                          style={{ flex: 1, padding: '0.35rem', fontSize: '0.75rem' }}
                          onClick={() => onCheckInAppointment(appt.id)}
                          title="Admit patient into the active waiting queue"
                        >
                          <UserCheck size={13} />
                          Check-In on Arrival
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.72rem' }}
                          onClick={() => onCancelAppointment(appt.id)}
                          title="Cancel appointment"
                        >
                          <X size={13} />
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
