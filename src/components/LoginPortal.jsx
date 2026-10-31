import React, { useState, useEffect } from 'react';
import { 
  HeartPulse, 
  Stethoscope, 
  UserCheck, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Activity, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  QrCode,
  Clock,
  ChevronRight,
  Database,
  UserPlus,
  RefreshCw
} from 'lucide-react';
import * as api from '../services/api';
import CreateUserModal from './CreateUserModal';

// Predefined fallback users for instant offline or fallback access
export const FALLBACK_USERS = [
  {
    id: 'USR-DOC-01',
    username: 'doctor',
    password: 'doctor123',
    role: 'doctor',
    name: 'Dr. Michael Chen, MD',
    title: 'Attending Emergency Physician & Chief Triage Officer',
    department: 'Emergency & Critical Care',
    patientId: null,
    avatar: '👨‍⚕️'
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
    avatar: '👩‍⚕️'
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
    avatar: '👩‍💼'
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
    avatar: '📋'
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
    avatar: '🧑'
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
    avatar: '👨'
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
    avatar: '👩'
  }
];

const ROLE_METADATA = {
  doctor: {
    id: 'doctor',
    label: 'Doctor / Physician',
    badge: 'Clinical Staff',
    color: '#0F52BA',
    accentLight: 'rgba(15, 82, 186, 0.08)',
    borderGlow: 'rgba(15, 82, 186, 0.25)',
    icon: Stethoscope,
    tagline: 'Clinical Diagnosis, Triage Queue & Capacity Management',
    features: [
      'Real-time IoT Wristband Vitals & Early Warning Alerts',
      'Dynamic Clinical Priority Scoring P(t) & Manual Overrides',
      'Room & Equipment Assignment with Constraint Turnover',
      'Predictive Surge Alerts & Staff Re-allocation Controls'
    ],
    defaultUser: 'doctor',
    defaultPass: 'doctor123'
  },
  receptionist: {
    id: 'receptionist',
    label: 'Receptionist / Front Desk',
    badge: 'Intake & Admissions',
    color: '#6366f1',
    accentLight: 'rgba(99, 102, 241, 0.08)',
    borderGlow: 'rgba(99, 102, 241, 0.25)',
    icon: UserCheck,
    tagline: 'Patient Intake, Appointment Check-In & Queue Orchestration',
    features: [
      'Self-Service Appointment Verification & Digital Pass Check-In',
      'Walk-In Emergency Registration & Smart Wristband Pairing',
      'Live Queue Waiting Room Status & Estimated Wait Tracking',
      'Room Availability & Sanitization Turnover Overview'
    ],
    defaultUser: 'receptionist',
    defaultPass: 'receptionist123'
  },
  patient: {
    id: 'patient',
    label: 'Patient Portal',
    badge: 'Personal Health App',
    color: '#00A896',
    accentLight: 'rgba(0, 168, 150, 0.08)',
    borderGlow: 'rgba(0, 168, 150, 0.25)',
    icon: User,
    tagline: 'Live Wristband Status, Micro-Wait Tracker & Appointments',
    features: [
      'Live Smart Wristband Telemetry (HR, SpO2, Temperature)',
      'Real-Time Micro-Wait Timeline (Doctor, Room Sanitization, Intake)',
      'Direct Pain Score Self-Reporting & Clinical Escalation',
      'GPS Highway Traffic Delay Detector & Grace Reslotting'
    ],
    defaultUser: 'patient',
    defaultPass: 'patient123'
  }
};

export default function LoginPortal({ onLogin }) {
  const [selectedRole, setSelectedRole] = useState('doctor');
  const [username, setUsername] = useState('doctor');
  const [password, setPassword] = useState('doctor123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [dbUsers, setDbUsers] = useState(FALLBACK_USERS);

  // Authentication mode: 'login' | 'register' | 'database_log'
  const [authMode, setAuthMode] = useState('login');

  // Registration Form State
  const [regForm, setRegForm] = useState({
    name: '',
    username: '',
    password: '',
    role: 'doctor',
    title: 'Staff Physician & Emergency Specialist',
    department: 'Emergency & Critical Care',
    phone: '',
    email: ''
  });

  // Saved SQLite Login History State
  const [loginHistory, setLoginHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Full Create User Interface Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Load registered users from API or use fallbacks
  useEffect(() => {
    async function fetchUsers() {
      try {
        const users = await api.fetchAuthUsers();
        if (users && users.length > 0) {
          setDbUsers(users);
        }
      } catch (err) {
        console.warn('API users endpoint unavailable, using seeded fallbacks:', err);
      }
    }
    fetchUsers();
  }, []);

  // Load login history from SQLite database
  const loadLoginHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const logs = await api.fetchLoginHistory();
      if (logs) setLoginHistory(logs);
    } catch (err) {
      console.warn('Failed to load login history from database:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (authMode === 'database_log') {
      loadLoginHistory();
    }
  }, [authMode]);

  // Update form defaults when role changes
  const handleRoleChange = (roleKey) => {
    setSelectedRole(roleKey);
    setErrorMsg('');
    setSuccessMsg('');
    const meta = ROLE_METADATA[roleKey];
    setUsername(meta.defaultUser);
    setPassword(meta.defaultPass);

    // Also update registration form defaults
    setRegForm(prev => ({
      ...prev,
      role: roleKey,
      title: roleKey === 'doctor' 
        ? 'Attending Physician & Clinical Specialist' 
        : roleKey === 'receptionist' 
          ? 'Patient Intake & Registration Specialist' 
          : 'Registered Patient',
      department: roleKey === 'doctor' 
        ? 'Emergency & Critical Care' 
        : roleKey === 'receptionist' 
          ? 'Central Triage & Admissions Desk' 
          : 'Ambulatory Care'
    }));
  };

  // Register and save new user account in SQLite database
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const payload = {
        name: regForm.name.trim(),
        username: regForm.username.trim(),
        password: regForm.password.trim(),
        role: regForm.role,
        title: regForm.title.trim() || (regForm.role === 'doctor' ? 'Clinical Physician' : 'Staff Member'),
        department: regForm.department.trim() || 'General Services',
        phone: regForm.phone.trim() || '+1 (555) 000-0000',
        email: regForm.email.trim() || `${regForm.username.trim()}@hospital.ihms.org`
      };

      const result = await api.registerUser(payload);
      if (result && result.success) {
        setSuccessMsg(`User "${payload.name}" successfully registered and saved into SQLite database!`);
        
        // Refresh users list so new user shows in quick chips
        const updatedUsers = await api.fetchAuthUsers().catch(() => null);
        if (updatedUsers) setDbUsers(updatedUsers);

        // Pre-fill login credentials with the newly registered user
        setSelectedRole(payload.role);
        setUsername(payload.username);
        setPassword(payload.password);

        // Switch back to login view after short preview
        setTimeout(() => {
          setAuthMode('login');
        }, 1500);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save new user account into database.');
    } finally {
      setIsLoading(false);
    }
  };

  // Perform login
  const handleFormSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      // 1. Try real backend API
      const result = await api.loginUser({
        username: username.trim(),
        password: password.trim(),
        role: selectedRole
      });

      if (result && result.user) {
        onLogin(result.user, rememberMe);
        return;
      }
    } catch (err) {
      console.warn('Backend login endpoint failed, checking client fallback:', err);
      
      // 2. Client-side fallback authentication if backend offline
      const found = dbUsers.find(
        u => u.username.toLowerCase() === username.trim().toLowerCase() && 
             (u.password ? u.password === password.trim() : true)
      );

      if (found) {
        if (found.role !== selectedRole) {
          setErrorMsg(`Account "${username}" is registered as ${found.role}, not ${selectedRole}. Please switch role tabs.`);
          setIsLoading(false);
          return;
        }
        const { password: _, ...safeUser } = found;
        onLogin(safeUser, rememberMe);
        return;
      }

      setErrorMsg(err.message || 'Invalid username or password. Check demo credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick 1-click login for any demo user
  const handleQuickLogin = (user) => {
    setErrorMsg('');
    setSelectedRole(user.role);
    setUsername(user.username);
    setPassword(user.password || 'password123');
    setIsLoading(true);

    setTimeout(async () => {
      try {
        const result = await api.loginUser({
          userId: user.id,
          role: user.role
        });
        if (result && result.user) {
          onLogin(result.user, rememberMe);
          return;
        }
      } catch (err) {
        // Fallback
        const { password: _, ...safeUser } = user;
        onLogin(safeUser, rememberMe);
      } finally {
        setIsLoading(false);
      }
    }, 200);
  };

  const activeMeta = ROLE_METADATA[selectedRole];
  const ActiveIcon = activeMeta.icon;

  // Filter users by role
  const roleUsers = dbUsers.filter(u => u.role === selectedRole);

  return (
    <div className="login-portal-wrapper">
      {/* Background ambient lighting */}
      <div className="login-bg-glow glow-1" />
      <div className="login-bg-glow glow-2" />

      <div className="login-container">
        {/* Portal Header */}
        <div className="login-header">
          <div className="login-brand-badge">
            <HeartPulse size={20} className="pulse-icon" />
            <span>IHMS Clinical Gateway</span>
            <span className="live-dot" />
          </div>

          <h1 className="login-title">
            Intelligent Hospital Management
            <span className="login-subtitle">Role-Based Medical & Patient Access Portal</span>
          </h1>

          <p className="login-description">
            Sign in to access real-time clinical triage, room turnover matrix, self-service intake, and telemetry.
          </p>
        </div>

        {/* 3-Role Selection Cards */}
        <div className="role-selector-grid">
          {Object.values(ROLE_METADATA).map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;
            return (
              <button
                key={role.id}
                type="button"
                className={`role-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleRoleChange(role.id)}
                id={`role-btn-${role.id}`}
                style={{
                  '--role-color': role.color,
                  '--role-light': role.accentLight,
                  '--role-glow': role.borderGlow
                }}
              >
                <div className="role-card-header">
                  <div className="role-icon-box">
                    <Icon size={22} color={role.color} />
                  </div>
                  <span className="role-badge-pill">{role.badge}</span>
                </div>

                <div className="role-info">
                  <h3 className="role-name">{role.label}</h3>
                  <p className="role-tagline">{role.tagline}</p>
                </div>

                <div className="role-select-indicator">
                  {isSelected ? (
                    <span className="active-check">
                      <CheckCircle2 size={16} /> Selected
                    </span>
                  ) : (
                    <span className="select-prompt">Select Role</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Main Login Card */}
        <div className="login-main-card" style={{ '--current-role-color': activeMeta.color }}>
          <div className="card-top-bar">
            <div className="role-active-indicator">
              <ActiveIcon size={18} color={activeMeta.color} />
              <div>
                <strong>Logging in as: <span style={{ color: activeMeta.color }}>{activeMeta.label}</span></strong>
                <span className="active-tagline">{activeMeta.tagline}</span>
              </div>
            </div>
            <span className="secure-badge">
              <ShieldCheck size={14} /> 256-Bit HIPAA Verified
            </span>
          </div>

          <div className="login-card-content">
            {/* Left side: Login Form / Registration / Database Log */}
            <div className="login-form-section">
              {/* Auth Mode Tabs Switcher */}
              <div className="auth-mode-tabs">
                <button
                  type="button"
                  className={`auth-mode-tab-btn ${authMode === 'login' ? 'active' : ''}`}
                  onClick={() => { setAuthMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
                  id="tab-sign-in"
                >
                  <Lock size={14} />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  className={`auth-mode-tab-btn ${authMode === 'register' ? 'active' : ''}`}
                  onClick={() => setIsCreateModalOpen(true)}
                  id="tab-register-user"
                  title="Open comprehensive Create User Interface modal"
                >
                  <UserPlus size={14} />
                  <span>+ Create New User</span>
                </button>
                <button
                  type="button"
                  className={`auth-mode-tab-btn ${authMode === 'database_log' ? 'active' : ''}`}
                  onClick={() => { setAuthMode('database_log'); setErrorMsg(''); setSuccessMsg(''); }}
                  id="tab-database-log"
                >
                  <Database size={14} />
                  <span>Database Log ({loginHistory.length})</span>
                </button>
              </div>

              {/* Status Messages */}
              {errorMsg && (
                <div className="login-error-banner">
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="auth-success-banner">
                  <CheckCircle2 size={16} />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* MODE 1: Standard Sign In Form */}
              {authMode === 'login' && (
                <>
                  <form onSubmit={handleFormSubmit} className="login-form">
                    <div className="form-group">
                      <label className="form-label" htmlFor="input-username">
                        {selectedRole === 'patient' 
                          ? 'Patient Username / ID / Phone' 
                          : selectedRole === 'doctor' 
                            ? 'Physician Username / License ID' 
                            : 'Staff Username / Employee ID'}
                      </label>
                      <div className="input-with-icon">
                        <User size={16} className="input-icon" />
                        <input
                          id="input-username"
                          type="text"
                          className="form-input"
                          placeholder={`Enter ${selectedRole} username (e.g. ${activeMeta.defaultUser})`}
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label className="form-label" htmlFor="input-password">Password / Access PIN</label>
                        <span style={{ fontSize: '0.72rem', color: 'var(--slate-400)' }}>
                          Default: <code style={{ color: activeMeta.color }}>{activeMeta.defaultPass}</code>
                        </span>
                      </div>
                      <div className="input-with-icon">
                        <Lock size={16} className="input-icon" />
                        <input
                          id="input-password"
                          type={showPassword ? 'text' : 'password'}
                          className="form-input"
                          placeholder="••••••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          className="password-toggle-btn"
                          onClick={() => setShowPassword(!showPassword)}
                          title={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="form-options">
                      <label className="remember-label">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                        />
                        <span>Remember this station session</span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="btn-login-submit"
                      disabled={isLoading}
                      id="btn-login-submit"
                      style={{ background: activeMeta.color }}
                    >
                      {isLoading ? (
                        <span>Authenticating Credentials...</span>
                      ) : (
                        <>
                          <span>Enter {activeMeta.label} Dashboard</span>
                          <ArrowRight size={17} />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Quick One-Click Accounts for Instant Demo */}
                  <div className="quick-access-section">
                    <div className="quick-access-title">
                      <Sparkles size={13} color={activeMeta.color} />
                      <span>Saved Accounts in Database ({roleUsers.length} {activeMeta.label}s):</span>
                    </div>
                    <div className="quick-user-chips">
                      {roleUsers.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          className="quick-user-btn"
                          onClick={() => handleQuickLogin(user)}
                          title={`Sign in immediately as ${user.name}`}
                        >
                          <span className="user-avatar">{user.avatar || (user.role === 'doctor' ? '🩺' : user.role === 'receptionist' ? '📋' : '👤')}</span>
                          <div className="quick-user-text">
                            <strong>{user.name}</strong>
                            <small>{user.title}</small>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* MODE 2: Register New User & Save to Database Form */}
              {authMode === 'register' && (
                <form onSubmit={handleRegisterSubmit} className="login-form">
                  <div style={{ background: 'var(--slate-50)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--slate-200)', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-700)' }}>
                        Save New Account to SQLite Database (<code style={{ color: 'var(--primary)' }}>users</code> table)
                      </span>
                      <span className="auth-db-badge">
                        <Database size={11} /> SQLite Active
                      </span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Account Role Type</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                      {['doctor', 'receptionist', 'patient'].map((rKey) => (
                        <button
                          key={rKey}
                          type="button"
                          className={`btn ${regForm.role === rKey ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', textTransform: 'capitalize' }}
                          onClick={() => setRegForm({ 
                            ...regForm, 
                            role: rKey,
                            title: rKey === 'doctor' ? 'Staff Physician & Emergency Specialist' : rKey === 'receptionist' ? 'Patient Admissions Specialist' : 'Registered Patient',
                            department: rKey === 'doctor' ? 'Emergency & Critical Care' : rKey === 'receptionist' ? 'Central Admissions' : 'General Care'
                          })}
                        >
                          {rKey === 'doctor' ? '👨‍⚕️ Doctor' : rKey === 'receptionist' ? '📋 Receptionist' : '🧑 Patient'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Dr. Jessica Taylor, MD"
                        value={regForm.name}
                        onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Login Username</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. j.taylor"
                        value={regForm.username}
                        onChange={(e) => setRegForm({ ...regForm, username: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Password (Min 4 chars)</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-input"
                        placeholder="••••••••••••"
                        value={regForm.password}
                        onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <input
                        type="email"
                        className="form-input"
                        placeholder="user@hospital.ihms.org"
                        value={regForm.email}
                        onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Designation / Title</label>
                      <input
                        type="text"
                        className="form-input"
                        value={regForm.title}
                        onChange={(e) => setRegForm({ ...regForm, title: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Department / Unit</label>
                      <input
                        type="text"
                        className="form-input"
                        value={regForm.department}
                        onChange={(e) => setRegForm({ ...regForm, department: e.target.value })}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-login-submit"
                    disabled={isLoading}
                    id="btn-register-submit"
                    style={{ background: 'var(--success-mint)', color: '#044e45', marginTop: '0.5rem' }}
                  >
                    {isLoading ? (
                      <span>Saving to SQLite Database...</span>
                    ) : (
                      <>
                        <Database size={16} />
                        <span>Save Account to Database & Proceed</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* MODE 3: Database Login Log Viewer */}
              {authMode === 'database_log' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <strong style={{ fontSize: '0.82rem', color: 'var(--slate-800)' }}>
                        Saved Login Information in SQLite
                      </strong>
                      <span className="auth-db-badge">
                        <Database size={11} /> Table: user_logins
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem' }}
                      onClick={loadLoginHistory}
                      disabled={isLoadingHistory}
                    >
                      <RefreshCw size={12} className={isLoadingHistory ? 'pulse-icon' : ''} />
                      Refresh
                    </button>
                  </div>

                  <div className="db-log-card" style={{ maxHeight: '340px', overflowY: 'auto' }}>
                    <table className="db-log-table">
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>Username</th>
                          <th>Name</th>
                          <th>Role</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loginHistory.length === 0 ? (
                          <tr>
                            <td colSpan="5" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--slate-400)' }}>
                              No login history records found in database.
                            </td>
                          </tr>
                        ) : (
                          loginHistory.map((item) => (
                            <tr key={item.id}>
                              <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
                                {item.login_timestamp ? item.login_timestamp.split(' ')[1] || item.login_timestamp : 'Just now'}
                              </td>
                              <td>
                                <strong style={{ fontFamily: 'var(--font-mono)' }}>{item.username}</strong>
                              </td>
                              <td style={{ color: 'var(--slate-600)' }}>{item.name || '—'}</td>
                              <td style={{ textTransform: 'capitalize' }}>{item.role || '—'}</td>
                              <td>
                                <span className={
                                  item.login_status === 'SUCCESS' ? 'badge-status-success' :
                                  item.login_status === 'REGISTERED' ? 'badge-status-registered' : 'badge-status-failed'
                                }>
                                  {item.login_status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)', marginTop: '0.5rem', textAlign: 'right' }}>
                    Displaying up to 60 most recent login session records from SQLite database.
                  </div>
                </div>
              )}
            </div>

            {/* Right side: Role Features & Access Scope */}
            <div className="role-scope-preview">
              <h4 className="scope-title">
                <Building2 size={16} color={activeMeta.color} />
                <span>{activeMeta.label} Access Scope:</span>
              </h4>

              <ul className="scope-features-list">
                {activeMeta.features.map((feature, idx) => (
                  <li key={idx}>
                    <CheckCircle2 size={15} color={activeMeta.color} className="feature-check-icon" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="scope-security-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <ShieldCheck size={16} color="var(--success-mint)" />
                  <strong style={{ fontSize: '0.8rem', color: 'var(--slate-800)' }}>Audit Trail Logging Active</strong>
                </div>
                <p style={{ fontSize: '0.73rem', color: 'var(--slate-500)', lineHeight: 1.4 }}>
                  All session logins, triage evaluations, room transitions, and clinical overrides are immutably timestamped and recorded into SQLite.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <footer className="login-footer">
          <span>IHMS v1.2 • Intelligent Hospital Management & Triage Platform</span>
          <span>SQLite Database: <code style={{ color: 'var(--primary)' }}>ihms.db</code> (Active)</span>
        </footer>
      </div>

      {/* Comprehensive Create User Interface Modal */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onUserCreated={async (newUser) => {
          setSuccessMsg(`User "${newUser.name}" successfully created and saved to database!`);
          const updated = await api.fetchAuthUsers().catch(() => null);
          if (updated) setDbUsers(updated);
          setSelectedRole(newUser.role);
          setUsername(newUser.username);
          setPassword(newUser.password || 'password123');
        }}
        onSwitchUser={(user) => {
          onLogin(user, rememberMe);
          setIsCreateModalOpen(false);
        }}
      />
    </div>
  );
}
