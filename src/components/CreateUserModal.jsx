import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Users, 
  Stethoscope, 
  UserCheck, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  Database, 
  X, 
  RefreshCw, 
  Trash2, 
  Search, 
  QrCode,
  KeyRound,
  ArrowRight,
  Sparkles,
  Edit2
} from 'lucide-react';
import * as api from '../services/api';

const ROLE_INFO = {
  doctor: {
    id: 'doctor',
    label: 'Doctor / Physician',
    badge: 'Clinical Staff',
    color: '#0F52BA',
    accentBg: 'rgba(15, 82, 186, 0.08)',
    icon: Stethoscope,
    avatar: '👨‍⚕️',
    defaultTitle: 'Attending Emergency Physician',
    defaultDept: 'Emergency & Critical Care',
    privileges: [
      'Full Clinical Diagnosis & Vital Deterioration Triage',
      'Clinical Priority Scoring P(t) & Nurse Manual Overrides',
      'Room & Equipment Assignment with Turnover Tracker',
      'Surge Control & Staff Re-allocation Authority'
    ]
  },
  receptionist: {
    id: 'receptionist',
    label: 'Receptionist / Front Desk',
    badge: 'Intake & Admissions',
    color: '#6366f1',
    accentBg: 'rgba(99, 102, 241, 0.08)',
    icon: UserCheck,
    avatar: '👩‍💼',
    defaultTitle: 'Patient Admissions & Triage Registrar',
    defaultDept: 'Central Intake & Admissions Desk',
    privileges: [
      'Walk-In Emergency Registration & Smart Wristband Pairing',
      'Self-Service Appointment Check-In & Digital Pass QR',
      'Live Queue Waiting Room Status & Estimated Wait Tracking',
      'Room Availability & Sanitization Turnover Overview'
    ]
  },
  patient: {
    id: 'patient',
    label: 'Patient / Client Portal',
    badge: 'Personal Telemetry',
    color: '#00A896',
    accentBg: 'rgba(0, 168, 150, 0.08)',
    icon: User,
    avatar: '🧑',
    defaultTitle: 'Registered Hospital Patient',
    defaultDept: 'General Patient Services',
    privileges: [
      '24/7 Smart IoT Wristband Vitals Telemetry (HR, SpO2, Temp)',
      'Real-Time Micro-Wait Timeline (Doctor, Sanitization, Exam)',
      'Direct Pain Score Self-Reporting with Instant Alert Trigger',
      'Digital Appointment Passes & Geofenced Arrival Verification'
    ]
  }
};

const SUGGESTED_DEPTS = [
  'Emergency & Critical Care',
  'Trauma & Acute Surgery',
  'Cardiology & Diagnostic Lab',
  'Fast-Track & Ambulatory',
  'Central Admissions Desk',
  'Outpatient Clinic'
];

export default function CreateUserModal({ isOpen, onClose, onUserCreated, onSwitchUser }) {
  const generateDefaultUserId = (selectedRole) => {
    const prefix = selectedRole === 'doctor' ? 'DOC' : selectedRole === 'receptionist' ? 'REC' : 'PAT';
    const randNum = Math.floor(1000 + Math.random() * 9000);
    return `USR-${prefix}-${randNum}`;
  };

  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'manage'
  const [role, setRole] = useState('doctor');
  const [userId, setUserId] = useState(() => generateDefaultUserId('doctor'));
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [title, setTitle] = useState(ROLE_INFO.doctor.defaultTitle);
  const [department, setDepartment] = useState(ROLE_INFO.doctor.defaultDept);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [wristbandId, setWristbandId] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [createdUser, setCreatedUser] = useState(null);

  // Manage Users state
  const [usersList, setUsersList] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Load registered users from backend SQLite
  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const users = await api.fetchAuthUsers();
      if (users) setUsersList(users);
    } catch (err) {
      console.warn('Failed to fetch user accounts:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      setErrorMsg('');
      setSuccessMsg('');
      setCreatedUser(null);
      if (!userId) {
        setUserId(generateDefaultUserId(role));
      }
    }
  }, [isOpen]);

  // Handle role change and update auto-defaults
  const handleRoleSelect = (newRole) => {
    setRole(newRole);
    setTitle(ROLE_INFO[newRole].defaultTitle);
    setDepartment(ROLE_INFO[newRole].defaultDept);
    setUserId(generateDefaultUserId(newRole));
    if (newRole === 'patient') {
      setWristbandId(`WB-${Math.floor(1000 + Math.random() * 9000)}`);
    } else {
      setWristbandId('');
    }
  };

  // Generate random secure PIN / password
  const handleGeneratePin = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let pin = '';
    for (let i = 0; i < 6; i++) {
      pin += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(`ihms-${pin}`);
    setShowPassword(true);
  };

  // Quick auto-fill template for testing
  const handleQuickFill = (targetRole) => {
    const newRole = targetRole || role;
    setRole(newRole);
    setTitle(ROLE_INFO[newRole].defaultTitle);
    setDepartment(ROLE_INFO[newRole].defaultDept);
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const prefix = newRole === 'doctor' ? 'DOC' : newRole === 'receptionist' ? 'REC' : 'PAT';
    const generatedId = `USR-${prefix}-${randNum}`;
    setUserId(generatedId);

    if (newRole === 'doctor') {
      setName('Dr. Elena Rostova, MD');
      setUsername(`elena.${randNum.toString().slice(-2)}`);
      setPassword('doctor123');
      setPhone('+1 (555) 728-1920');
      setEmail(`elena.${randNum.toString().slice(-2)}@hospital.ihms.org`);
      setWristbandId('');
    } else if (newRole === 'receptionist') {
      setName('Sarah Jenkins');
      setUsername(`sarah.${randNum.toString().slice(-2)}`);
      setPassword('reception123');
      setPhone('+1 (555) 482-9912');
      setEmail(`sarah.${randNum.toString().slice(-2)}@hospital.ihms.org`);
      setWristbandId('');
    } else {
      setName('Johnathan Doe');
      setUsername(`john.${randNum.toString().slice(-2)}`);
      setPassword('patient123');
      setPhone('+1 (555) 302-8841');
      setEmail(`john.${randNum.toString().slice(-2)}@hospital.ihms.org`);
      setWristbandId(`WB-${randNum}`);
    }
    setErrorMsg('');
  };

  // Submit registration form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const effectiveUserId = (userId.trim() || generateDefaultUserId(role)).trim();
      const payload = {
        userId: effectiveUserId,
        id: effectiveUserId,
        name: name.trim(),
        username: username.trim().toLowerCase(),
        password: password.trim(),
        role,
        title: title.trim() || ROLE_INFO[role].defaultTitle,
        department: department.trim() || ROLE_INFO[role].defaultDept,
        phone: phone.trim() || '+1 (555) 000-0000',
        email: email.trim() || `${username.trim().toLowerCase()}@hospital.ihms.org`,
        patientId: role === 'patient' ? (wristbandId || `P-${Date.now().toString().slice(-4)}`) : null,
        wristbandId: role === 'patient' ? wristbandId : null
      };

      const result = await api.registerUser(payload);
      if (result && result.success) {
        setSuccessMsg(`User "${payload.name}" successfully registered with User ID "${result.user.id}" and saved to SQLite database!`);
        setCreatedUser(result.user);
        onUserCreated?.(result.user);
        loadUsers();

        // Reset form fields with new generated ID ready
        setName('');
        setUsername('');
        setPassword('');
        setPhone('');
        setEmail('');
        setUserId(generateDefaultUserId(role));
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to register new user account.');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete user from SQLite database
  const handleDeleteUser = async (targetId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}" (${targetId}) from the database?`)) {
      return;
    }
    try {
      await api.deleteUser(targetId);
      setUsersList(prev => prev.filter(u => u.id !== targetId));
      setSuccessMsg(`User "${userName}" was removed from the database.`);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete user.');
    }
  };

  if (!isOpen) return null;

  const currentRoleInfo = ROLE_INFO[role];
  const RoleIcon = currentRoleInfo.icon;

  // Filtered users for Manage tab
  const filteredUsers = usersList.filter(u => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesSearch = 
      (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.department && u.department.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesRole && matchesSearch;
  });

  return (
    <div className="modal-backdrop" style={{ zIndex: 1100 }}>
      <div className="modal-content" style={{ maxWidth: '880px', width: '95%', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
        {/* Modal Header */}
        <div className="modal-header" style={{ padding: '1rem 1.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <UserPlus size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>User Management & Registration</h3>
                <span className="auth-db-badge">
                  <Database size={11} /> SQLite Database: ihms.db
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                Create role-based hospital personnel and patient profiles with instant database persistence
              </p>
            </div>
          </div>
          <button 
            type="button"
            className="modal-close-btn" 
            onClick={onClose}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Mode Tabs */}
        <div style={{ padding: '0 1.4rem', borderBottom: '1px solid var(--slate-200)', background: 'var(--slate-50)' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="button"
              className={`nav-tab-btn ${activeTab === 'create' ? 'active' : ''}`}
              style={{ padding: '0.75rem 0.5rem', background: 'transparent', borderRadius: 0, borderBottom: activeTab === 'create' ? '2px solid var(--primary)' : '2px solid transparent' }}
              onClick={() => { setActiveTab('create'); setErrorMsg(''); }}
              id="tab-modal-create"
            >
              <UserPlus size={15} />
              <span>Create New User</span>
            </button>
            <button
              type="button"
              className={`nav-tab-btn ${activeTab === 'manage' ? 'active' : ''}`}
              style={{ padding: '0.75rem 0.5rem', background: 'transparent', borderRadius: 0, borderBottom: activeTab === 'manage' ? '2px solid var(--primary)' : '2px solid transparent' }}
              onClick={() => { setActiveTab('manage'); setErrorMsg(''); loadUsers(); }}
              id="tab-modal-manage"
            >
              <Users size={15} />
              <span>Registered Accounts ({usersList.length})</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ padding: '1.4rem', overflowY: 'auto', flex: 1 }}>
          {/* Notifications */}
          {errorMsg && (
            <div className="login-error-banner" style={{ marginBottom: '1rem' }}>
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="auth-success-banner" style={{ marginBottom: '1rem' }}>
              <CheckCircle2 size={16} />
              <div style={{ flex: 1 }}>
                <span>{successMsg}</span>
                {createdUser && onSwitchUser && (
                  <div style={{ marginTop: '0.4rem' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ padding: '0.25rem 0.65rem', fontSize: '0.72rem', background: '#059669', borderColor: '#059669' }}
                      onClick={() => {
                        onSwitchUser(createdUser);
                        onClose();
                      }}
                    >
                      <span>Sign In as {createdUser.name}</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 1: CREATE NEW USER */}
          {activeTab === 'create' && (
            <form onSubmit={handleSubmit}>
              {/* Step 1: Role Type Selection Cards */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--slate-800)' }}>
                  1. Select Account System Role
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.85rem' }}>
                  {Object.values(ROLE_INFO).map((r) => {
                    const isSelected = role === r.id;
                    const IconComponent = r.icon;
                    return (
                      <div
                        key={r.id}
                        onClick={() => handleRoleSelect(r.id)}
                        style={{
                          border: isSelected ? `2px solid ${r.color}` : '1px solid var(--slate-200)',
                          background: isSelected ? r.accentBg : '#ffffff',
                          borderRadius: 'var(--radius-md)',
                          padding: '0.85rem',
                          cursor: 'pointer',
                          transition: 'all 0.18s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.4rem',
                          boxShadow: isSelected ? 'var(--shadow-sm)' : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '1.4rem' }}>{r.avatar}</span>
                          <span 
                            style={{ 
                              fontSize: '0.65rem', 
                              fontWeight: 700, 
                              padding: '0.1rem 0.4rem', 
                              borderRadius: 'var(--radius-full)',
                              background: isSelected ? r.color : 'var(--slate-100)',
                              color: isSelected ? '#ffffff' : 'var(--slate-600)'
                            }}
                          >
                            {r.badge}
                          </span>
                        </div>
                        <strong style={{ fontSize: '0.85rem', color: isSelected ? r.color : 'var(--slate-800)' }}>
                          {r.label}
                        </strong>
                        <span style={{ fontSize: '0.68rem', color: 'var(--slate-500)', lineHeight: 1.3 }}>
                          {r.privileges[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Template Auto-Fill bar for instant testing */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem', background: 'var(--slate-50)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--slate-200)' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--slate-700)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Sparkles size={13} style={{ color: '#eab308' }} />
                  ⚡ Quick Auto-Fill Demo Accounts:
                </span>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '0.2rem 0.55rem', fontSize: '0.68rem', background: '#ffffff' }}
                    onClick={() => handleQuickFill('doctor')}
                  >
                    👨‍⚕️ Sample Doctor
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '0.2rem 0.55rem', fontSize: '0.68rem', background: '#ffffff' }}
                    onClick={() => handleQuickFill('patient')}
                  >
                    🧑 Sample Patient
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '0.2rem 0.55rem', fontSize: '0.68rem', background: '#ffffff' }}
                    onClick={() => handleQuickFill('receptionist')}
                  >
                    👩‍💼 Sample Receptionist
                  </button>
                </div>
              </div>

              {/* Step 2: Form Inputs & Live ID Card Preview */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: '1.25rem', alignItems: 'start' }}>
                {/* Left: Input Fields */}
                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--slate-800)', marginBottom: '0.65rem', display: 'block' }}>
                    2. User Credentials & Hospital Profile
                  </label>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '0.65rem' }}>
                    <div className="form-group">
                      <label className="form-label" htmlFor="reg-input-name">Full Name *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Dr. Clara Oswald, MD"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        id="reg-input-name"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label" htmlFor="reg-input-username">Login Username *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. clara.o"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        id="reg-input-username"
                      />
                    </div>
                    <div className="form-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label className="form-label" htmlFor="reg-input-userid" style={{ color: currentRoleInfo.color, fontWeight: 700 }}>
                          System User ID *
                        </label>
                        <button
                          type="button"
                          onClick={() => setUserId(generateDefaultUserId(role))}
                          style={{ background: 'none', border: 'none', color: currentRoleInfo.color, fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.15rem', padding: 0 }}
                          title="Generate a new unique ID"
                        >
                          <RefreshCw size={10} /> Auto
                        </button>
                      </div>
                      <input
                        type="text"
                        className="form-input"
                        placeholder={`e.g. USR-${role.slice(0,3).toUpperCase()}-101`}
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        required
                        id="reg-input-userid"
                        style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, borderColor: currentRoleInfo.color }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="form-label">Account Password / Access PIN *</label>
                      <button
                        type="button"
                        onClick={handleGeneratePin}
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                      >
                        <KeyRound size={11} /> Auto-Generate
                      </button>
                    </div>
                    <div className="input-with-icon">
                      <Lock size={15} className="input-icon" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-input"
                        placeholder="Enter password (minimum 4 characters)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        id="reg-input-password"
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Job Title / Designation</label>
                      <input
                        type="text"
                        className="form-input"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Attending Physician"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Department / Unit</label>
                      <input
                        type="text"
                        className="form-input"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="e.g. Emergency & Trauma"
                      />
                    </div>
                  </div>

                  {/* Department suggestions */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.85rem' }}>
                    {SUGGESTED_DEPTS.map(dept => (
                      <button
                        key={dept}
                        type="button"
                        onClick={() => setDepartment(dept)}
                        style={{
                          fontSize: '0.65rem',
                          padding: '0.15rem 0.4rem',
                          background: department === dept ? 'var(--primary-light)' : 'var(--slate-100)',
                          border: department === dept ? '1px solid var(--primary)' : '1px solid var(--slate-200)',
                          borderRadius: 'var(--radius-full)',
                          color: department === dept ? 'var(--primary)' : 'var(--slate-600)',
                          cursor: 'pointer'
                        }}
                      >
                        {dept}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input
                        type="tel"
                        className="form-input"
                        placeholder="+1 (555) 234-5678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <input
                        type="email"
                        className="form-input"
                        placeholder="user@hospital.ihms.org"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  {role === 'patient' && (
                    <div className="form-group" style={{ background: 'var(--secondary-light)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(0, 168, 150, 0.25)' }}>
                      <label className="form-label" style={{ color: 'var(--secondary)', fontWeight: 700 }}>
                        Smart IoT Wristband Telemetry ID
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={wristbandId}
                        onChange={(e) => setWristbandId(e.target.value)}
                        placeholder="e.g. WB-9421"
                      />
                      <small style={{ fontSize: '0.7rem', color: 'var(--slate-500)', marginTop: '0.2rem', display: 'block' }}>
                        Wristband connects live heart rate, SpO2, and micro-wait telemetry to the patient portal.
                      </small>
                    </div>
                  )}
                </div>

                {/* Right: Live Hospital Credential Badge Preview */}
                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--slate-800)', marginBottom: '0.65rem', display: 'block' }}>
                    3. Live Hospital Credential Badge Preview
                  </label>

                  <div 
                    style={{
                      background: '#ffffff',
                      border: `2px solid ${currentRoleInfo.color}`,
                      borderRadius: 'var(--radius-lg)',
                      overflow: 'hidden',
                      boxShadow: 'var(--shadow-md)',
                      position: 'relative'
                    }}
                  >
                    {/* Badge top ribbon */}
                    <div style={{ background: currentRoleInfo.color, padding: '0.65rem 1rem', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 800 }}>
                        <RoleIcon size={14} />
                        <span>IHMS CLINICAL ID</span>
                      </div>
                      <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'rgba(255, 255, 255, 0.2)', padding: '0.1rem 0.4rem', borderRadius: 4 }}>
                        {currentRoleInfo.badge}
                      </span>
                    </div>

                    {/* Badge body */}
                    <div style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ width: 64, height: 64, borderRadius: '50%', background: currentRoleInfo.accentBg, margin: '0 auto 0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', border: `2px solid ${currentRoleInfo.color}` }}>
                        {currentRoleInfo.avatar}
                      </div>

                      <div style={{ marginBottom: '0.35rem' }}>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Type Full Name here..."
                          style={{
                            fontSize: '1.05rem',
                            fontWeight: 800,
                            textAlign: 'center',
                            border: '1px dashed transparent',
                            background: 'transparent',
                            borderRadius: 'var(--radius-sm)',
                            width: '100%',
                            padding: '0.2rem 0.4rem',
                            color: 'var(--slate-900)',
                            outline: 'none',
                            transition: 'all 0.15s ease'
                          }}
                          onFocus={(e) => { e.target.style.background = '#f8fafc'; e.target.style.borderColor = currentRoleInfo.color; }}
                          onBlur={(e) => { e.target.style.background = 'transparent'; e.target.style.borderColor = 'transparent'; }}
                          title="Click to edit full name directly on badge"
                          id="badge-direct-name"
                        />
                        <span style={{ fontSize: '0.65rem', color: 'var(--slate-400)', display: 'block' }}>
                          ✎ Click to edit name on badge
                        </span>
                      </div>

                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: currentRoleInfo.color, display: 'block', marginTop: '0.15rem' }}>
                        {title.trim() || currentRoleInfo.defaultTitle}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--slate-500)', display: 'block', marginTop: '0.15rem' }}>
                        {department.trim() || currentRoleInfo.defaultDept}
                      </span>

                      {/* Interactive Badge Box - Direct Editable User ID and Username */}
                      <div 
                        style={{ 
                          background: 'rgba(248, 250, 252, 0.95)', 
                          padding: '0.65rem 0.75rem', 
                          borderRadius: 'var(--radius-md)', 
                          border: `2px dashed ${currentRoleInfo.color}`, 
                          marginTop: '0.85rem',
                          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.04)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: currentRoleInfo.color, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Sparkles size={11} />
                            Editable Badge Credentials:
                          </span>
                          <button
                            type="button"
                            onClick={() => setUserId(generateDefaultUserId(role))}
                            style={{ background: 'transparent', border: 'none', color: currentRoleInfo.color, fontSize: '0.65rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem', padding: '0.1rem 0.3rem', borderRadius: 4 }}
                            title="Auto-generate a new ID"
                          >
                            <RefreshCw size={10} /> Auto-Generate
                          </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', textAlign: 'left' }}>
                          <div>
                            <label 
                              htmlFor="badge-input-username" 
                              style={{ fontSize: '0.65rem', color: 'var(--slate-500)', display: 'block', fontWeight: 700, marginBottom: '0.2rem' }}
                            >
                              Username
                            </label>
                            <input
                              type="text"
                              id="badge-input-username"
                              className="form-input"
                              placeholder="username"
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                              style={{ 
                                fontSize: '0.75rem', 
                                padding: '0.3rem 0.5rem', 
                                fontFamily: 'var(--font-mono)', 
                                fontWeight: 700, 
                                background: '#ffffff',
                                border: '1px solid var(--slate-300)'
                              }}
                              title="Type your login username here"
                            />
                          </div>

                          <div>
                            <label 
                              htmlFor="badge-input-userid" 
                              style={{ fontSize: '0.65rem', color: 'var(--slate-500)', display: 'block', fontWeight: 700, marginBottom: '0.2rem' }}
                            >
                              System User ID
                            </label>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                              <input
                                type="text"
                                id="badge-input-userid"
                                className="form-input"
                                placeholder={`USR-${role.slice(0,3).toUpperCase()}-XXXX`}
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                style={{ 
                                  fontSize: '0.75rem', 
                                  padding: '0.3rem 0.5rem', 
                                  fontFamily: 'var(--font-mono)', 
                                  fontWeight: 700, 
                                  background: '#ffffff',
                                  color: currentRoleInfo.color,
                                  border: `1px solid ${currentRoleInfo.color}`
                                }}
                                title="Type or edit your User ID here"
                              />
                              <button
                                type="button"
                                onClick={() => setUserId(generateDefaultUserId(role))}
                                style={{ 
                                  padding: '0.3rem', 
                                  background: 'var(--slate-100)', 
                                  border: '1px solid var(--slate-300)', 
                                  borderRadius: 'var(--radius-sm)', 
                                  cursor: 'pointer', 
                                  color: 'var(--slate-600)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                title="Generate random unique ID"
                              >
                                <RefreshCw size={11} />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div style={{ marginTop: '0.45rem', fontSize: '0.63rem', color: 'var(--slate-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                          <CheckCircle2 size={11} style={{ color: '#10b981' }} />
                          <span>Type and create your User ID & Username directly here!</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', marginTop: '0.75rem', color: 'var(--slate-400)', fontSize: '0.65rem' }}>
                        <QrCode size={13} />
                        <span>RFID Cryptographic Smart Token Enabled</span>
                      </div>
                    </div>
                  </div>

                  {/* Privilege summary */}
                  <div style={{ background: 'var(--slate-50)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--slate-200)', marginTop: '1rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--slate-700)', display: 'block', marginBottom: '0.35rem' }}>
                      Granted Permissions ({currentRoleInfo.label}):
                    </span>
                    <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.68rem', color: 'var(--slate-600)', lineHeight: 1.5 }}>
                      {currentRoleInfo.privileges.map((p, idx) => (
                        <li key={idx}>{p}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--slate-200)' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading}
                  id="btn-modal-save-user"
                  style={{ background: currentRoleInfo.color, borderColor: currentRoleInfo.color }}
                >
                  {isLoading ? (
                    <span>Saving to SQLite Database...</span>
                  ) : (
                    <>
                      <Database size={15} />
                      <span>Create Account & Save to Database</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: MANAGE REGISTERED ACCOUNTS */}
          {activeTab === 'manage' && (
            <div>
              {/* Search and role filters */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem' }}>
                <div className="input-with-icon" style={{ flex: 1 }}>
                  <Search size={15} className="input-icon" />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Search accounts by name, username, or department..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {['all', 'doctor', 'receptionist', 'patient'].map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      className={`btn ${roleFilter === filter ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.72rem', textTransform: 'capitalize' }}
                      onClick={() => setRoleFilter(filter)}
                    >
                      {filter}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.72rem' }}
                    onClick={loadUsers}
                    title="Refresh user list from database"
                  >
                    <RefreshCw size={13} className={isLoadingUsers ? 'pulse-icon' : ''} />
                  </button>
                </div>
              </div>

              {/* Users table */}
              <div className="db-log-card" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                <table className="db-log-table">
                  <thead>
                    <tr>
                      <th>User Profile</th>
                      <th>System User ID</th>
                      <th>Username</th>
                      <th>Role</th>
                      <th>Department & Contact</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--slate-400)' }}>
                          No user accounts matched the filter query.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const isProtected = ['USR-DOC-01', 'USR-REC-01', 'USR-PAT-01'].includes(u.id);
                        return (
                          <tr key={u.id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '1.2rem' }}>
                                  {u.role === 'doctor' ? '👨‍⚕️' : u.role === 'receptionist' ? '👩‍💼' : '🧑'}
                                </span>
                                <div>
                                  <strong style={{ fontSize: '0.8rem', color: 'var(--slate-900)' }}>{u.name}</strong>
                                  <span style={{ fontSize: '0.68rem', color: 'var(--slate-500)', display: 'block' }}>
                                    {u.title}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-light)', padding: '0.15rem 0.4rem', borderRadius: 4 }}>
                                {u.id}
                              </code>
                            </td>
                            <td>
                              <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--slate-800)' }}>
                                {u.username}
                              </code>
                            </td>
                            <td>
                              <span 
                                style={{
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  padding: '0.12rem 0.45rem',
                                  borderRadius: 'var(--radius-full)',
                                  textTransform: 'capitalize',
                                  background: u.role === 'doctor' ? 'rgba(15, 82, 186, 0.1)' : u.role === 'receptionist' ? 'rgba(99, 102, 241, 0.12)' : 'rgba(0, 168, 150, 0.12)',
                                  color: u.role === 'doctor' ? '#0F52BA' : u.role === 'receptionist' ? '#6366f1' : '#00A896'
                                }}
                              >
                                {u.role}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontSize: '0.72rem', color: 'var(--slate-700)', display: 'block' }}>{u.department}</span>
                              <span style={{ fontSize: '0.65rem', color: 'var(--slate-400)' }}>{u.email}</span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                                {onSwitchUser && (
                                  <button
                                    type="button"
                                    className="btn btn-secondary"
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                                    onClick={() => {
                                      onSwitchUser(u);
                                      onClose();
                                    }}
                                    title="Sign into this account"
                                  >
                                    Switch
                                  </button>
                                )}
                                {!isProtected ? (
                                  <button
                                    type="button"
                                    className="btn btn-secondary"
                                    style={{ padding: '0.25rem 0.45rem', color: 'var(--alert-crimson)', borderColor: 'rgba(217, 4, 41, 0.25)' }}
                                    onClick={() => handleDeleteUser(u.id, u.name)}
                                    title="Delete user from database"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                ) : (
                                  <span style={{ fontSize: '0.65rem', color: 'var(--slate-400)', fontStyle: 'italic', paddingRight: '0.25rem' }}>
                                    Default
                                  </span>
                                )}
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
          )}
        </div>
      </div>
    </div>
  );
}
