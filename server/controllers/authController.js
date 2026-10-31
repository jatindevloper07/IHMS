// Authentication Controller
const { db } = require('../config/database');
const { logAudit } = require('../services/priorityEngine');
const sseService = require('../services/sseService');

function getUsers(req, res) {
  try {
    const users = db.prepare(`
      SELECT id, username, role, name, title, department, patient_id, phone, email, created_at
      FROM users
      ORDER BY role ASC, name ASC
    `).all();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users from database' });
  }
}

function registerUser(req, res) {
  try {
    const { 
      userId,
      id: customId,
      username, 
      password, 
      role = 'patient', 
      name, 
      title, 
      department, 
      phone, 
      email, 
      patientId,
      wristbandId
    } = req.body;

    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'Username is required.' });
    }
    if (!password || password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters.' });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Full name is required.' });
    }

    const validRoles = ['doctor', 'receptionist', 'patient'];
    const cleanRole = validRoles.includes(role) ? role : 'patient';
    const cleanUsername = username.trim().toLowerCase();

    // Check if username already exists in database
    const existing = db.prepare('SELECT id FROM users WHERE LOWER(username) = ?').get(cleanUsername);
    if (existing) {
      return res.status(409).json({ error: `Username "${cleanUsername}" already exists. Please choose another username.` });
    }

    // Auto-generate or validate custom unique User ID based on role
    const rolePrefix = cleanRole === 'doctor' ? 'DOC' : cleanRole === 'receptionist' ? 'REC' : 'PAT';
    const providedId = (userId || customId || '').trim();
    let newId = providedId;

    if (newId) {
      // Validate uniqueness of provided User ID
      const existingId = db.prepare('SELECT id FROM users WHERE LOWER(id) = LOWER(?)').get(newId);
      if (existingId) {
        return res.status(409).json({ error: `User ID "${newId}" already exists in database. Please choose a different User ID or click generate.` });
      }
    } else {
      newId = `USR-${rolePrefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const assignedPatId = patientId || (newId.startsWith('USR-PAT-') ? newId.replace('USR-', '') : (newId.startsWith('PAT-') ? newId : `P-${Date.now().toString().slice(-4)}`));
    const assignedWbId = wristbandId || (patientId && patientId.startsWith('WB-') ? patientId : `WB-${Math.floor(1000 + Math.random() * 9000)}`);

    // For patient accounts, auto-provision matching patient in triage queue & vitals stream if not present
    if (cleanRole === 'patient') {
      try {
        const existingPat = db.prepare('SELECT id FROM patients WHERE id = ?').get(assignedPatId);
        if (!existingPat) {
          const arrivalTime = new Date().toTimeString().split(' ')[0].slice(0, 5);
          db.prepare(`
            INSERT INTO patients (
              id, name, age, gender, wristband_id, esi, chief_complaint, required_equipment,
              arrival_time, checked_in_minutes_ago, status, assigned_room_id, manual_override_boost,
              micro_wait_step, micro_wait_doctor_est_mins, micro_wait_sanitization_est_mins, micro_wait_doctor, micro_wait_target_room
            ) VALUES (
              ?, ?, ?, ?, ?, ?, ?, ?,
              ?, ?, 'waiting', NULL, 0,
              1, 6, 4, 'Dr. Sarah Lin', 'Room 102 (ICU Step-down)'
            )
          `).run(
            assignedPatId,
            name.trim(),
            32,
            'Other',
            assignedWbId,
            3,
            'Patient Registered Via Portal',
            JSON.stringify(['Micro-Wait Monitor']),
            arrivalTime,
            1
          );

          db.prepare(`
            INSERT INTO vitals_stream (patient_id, heart_rate, spo2, temperature, pain_score, deterioration_score, is_critical)
            VALUES (?, 78, 98, 37.0, 1, 0.0, 0)
          `).run(assignedPatId);

          sseService.broadcast('patient:created', { patientId: assignedPatId, name: name.trim() });
        }
      } catch (patErr) {
        console.warn('Auto-create patient queue record note:', patErr.message);
      }
    }

    const defaultTitle = cleanRole === 'doctor' 
      ? 'Attending Physician & Clinical Specialist'
      : cleanRole === 'receptionist'
        ? 'Patient Intake & Registration Specialist'
        : 'Registered Patient';

    const defaultDepartment = cleanRole === 'doctor'
      ? 'Emergency & Critical Care'
      : cleanRole === 'receptionist'
        ? 'Central Triage & Admissions Desk'
        : 'General Health Services';

    const insertStmt = db.prepare(`
      INSERT INTO users (
        id, username, password, role, name, title, department, patient_id, phone, email
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `);

    insertStmt.run(
      newId,
      cleanUsername,
      password,
      cleanRole,
      name.trim(),
      title || defaultTitle,
      department || defaultDepartment,
      cleanRole === 'patient' ? assignedPatId : null,
      phone || '+1 (555) 000-0000',
      email || `${cleanUsername}@hospital.ihms.org`
    );

    // Record audit log
    logAudit(
      db,
      'Auth Registrar',
      'USER_REGISTERED',
      newId,
      name.trim(),
      `New user account registered and saved to SQLite database. Role: [${cleanRole.toUpperCase()}], User ID: [${newId}], Username: [${cleanUsername}].`
    );

    // Save registration session into user_logins table
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Web Client';
    db.prepare(`
      INSERT INTO user_logins (id, user_id, username, role, name, ip_address, user_agent, login_status, details)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'REGISTERED', ?)
    `).run(
      `LOGIN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      newId,
      cleanUsername,
      cleanRole,
      name.trim(),
      ip,
      userAgent,
      'User account created and saved to SQLite database.'
    );

    const created = db.prepare('SELECT id, username, role, name, title, department, patient_id, phone, email, created_at FROM users WHERE id = ?').get(newId);

    // Real-time broadcast
    sseService.broadcast('user:registered', { user: created });

    res.status(201).json({
      success: true,
      message: `User ${name.trim()} successfully registered in database with User ID ${newId}.`,
      user: created
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to save new user to database' });
  }
}

function loginUser(req, res) {
  const { username, password, role, userId } = req.body;
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Web Client';

  let user = null;

  try {
    // 1. Direct user ID login
    if (userId) {
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    }
    // 2. Quick role-based login (default user for role)
    else if (role && !username) {
      user = db.prepare('SELECT * FROM users WHERE role = ? LIMIT 1').get(role);
    }
    // 3. Username / Password credentials login (supports matching by username OR user ID)
    else if (username) {
      user = db.prepare('SELECT * FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(id) = LOWER(?)').get(username, username);
      if (!user) {
        db.prepare(`
          INSERT INTO user_logins (id, user_id, username, role, name, ip_address, user_agent, login_status, details)
          VALUES (?, NULL, ?, ?, NULL, ?, ?, 'FAILED', 'User not found in database')
        `).run(`LOGIN-${Date.now()}-${Math.floor(Math.random() * 1000)}`, username, role || 'unknown', ip, userAgent);
        return res.status(401).json({ error: 'User not found in database. Check username or register a new account.' });
      }
      if (password && user.password !== password) {
        db.prepare(`
          INSERT INTO user_logins (id, user_id, username, role, name, ip_address, user_agent, login_status, details)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'FAILED', 'Incorrect password')
        `).run(`LOGIN-${Date.now()}-${Math.floor(Math.random() * 1000)}`, user.id, user.username, user.role, user.name, ip, userAgent);
        return res.status(401).json({ error: 'Incorrect password.' });
      }
      if (role && user.role !== role) {
        return res.status(401).json({ error: `Account is registered as ${user.role}, not ${role}.` });
      }
    }

    if (!user) {
      return res.status(400).json({ error: 'Please enter valid credentials or select an account.' });
    }

    // Save successful login information into user_logins database table
    db.prepare(`
      INSERT INTO user_logins (id, user_id, username, role, name, ip_address, user_agent, login_status, details)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'SUCCESS', ?)
    `).run(
      `LOGIN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user.id,
      user.username,
      user.role,
      user.name,
      ip,
      userAgent,
      `User authenticated successfully with role [${user.role.toUpperCase()}].`
    );

    // Save audit log entry
    logAudit(
      db,
      `${user.name} (${user.role.toUpperCase()})`,
      'USER_AUTHENTICATED',
      user.patient_id || 'SYS',
      user.name,
      `User logged in with role [${user.role.toUpperCase()}] via IHMS Gateway.`
    );

    const { password: _, ...safeUser } = user;

    // Real-time broadcast
    sseService.broadcast('user:login', {
      userId: user.id,
      name: user.name,
      role: user.role
    });

    res.json({
      success: true,
      user: safeUser,
      token: `ihms-token-${user.id}-${Date.now()}`
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server authentication error' });
  }
}

function deleteUser(req, res) {
  try {
    const userId = req.params.id;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) return res.status(404).json({ error: 'User not found in database' });

    // Protect default demo accounts from accidental deletion
    if (['USR-DOC-01', 'USR-REC-01', 'USR-PAT-01'].includes(userId)) {
      return res.status(403).json({ error: 'Default system root accounts are protected and cannot be deleted.' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(userId);

    logAudit(
      db,
      'Auth Administrator',
      'USER_DELETED',
      userId,
      user.name,
      `User account [${user.username}] (${user.role.toUpperCase()}) deleted from SQLite database.`
    );

    // Real-time broadcast
    sseService.broadcast('user:deleted', { userId, name: user.name });

    res.json({ success: true, message: `User "${user.name}" successfully deleted from database.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
}

function getLoginHistory(req, res) {
  try {
    const logins = db.prepare(`
      SELECT id, user_id, username, role, name, ip_address, user_agent, login_status, login_timestamp, details
      FROM user_logins
      ORDER BY rowid DESC
      LIMIT 60
    `).all();
    res.json(logins);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch login history from database' });
  }
}

module.exports = {
  getUsers,
  registerUser,
  loginUser,
  deleteUser,
  getLoginHistory
};
