// Audit Logs Controller
const { db } = require('../config/database');

function getAuditLogs(req, res) {
  try {
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 50);
    const action = req.query.action;

    let query = 'SELECT * FROM audit_logs';
    let params = [];

    if (action) {
      query += ' WHERE action = ?';
      params.push(action);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const logs = db.prepare(query).all(...params).map(l => ({
      id: l.id,
      timestamp: l.timestamp,
      user: l.user,
      action: l.action,
      patientId: l.patient_id,
      patientName: l.patient_name,
      details: l.details,
      createdAt: l.created_at
    }));

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
}

module.exports = {
  getAuditLogs
};
