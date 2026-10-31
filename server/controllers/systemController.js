// System & Operational Telemetry Controller
const { db, DB_PATH } = require('../config/database');
const fs = require('fs');
const sseService = require('../services/sseService');

const SERVER_START_TIME = Date.now();

function getHealth(req, res) {
  try {
    const patientCount = db.prepare('SELECT COUNT(*) as count FROM patients').get().count;
    const vitalsCount = db.prepare('SELECT COUNT(*) as count FROM vitals_stream').get().count;
    const roomCount = db.prepare('SELECT COUNT(*) as count FROM rooms').get().count;
    const logCount = db.prepare('SELECT COUNT(*) as count FROM audit_logs').get().count;
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const apptCount = db.prepare('SELECT COUNT(*) as count FROM appointments').get().count;

    res.json({
      status: 'online',
      service: 'IHMS Express Backend Service',
      version: '2.0.0 (Modularized)',
      uptimeSeconds: Math.floor((Date.now() - SERVER_START_TIME) / 1000),
      database: 'SQLite 3 (WAL Mode, Foreign Keys Active)',
      databaseFile: DB_PATH,
      activeSSEClients: sseService.getClientCount(),
      counts: {
        patients: patientCount,
        vitalsStreamRecords: vitalsCount,
        rooms: roomCount,
        auditLogs: logCount,
        users: userCount,
        appointments: apptCount
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Database health check failed', details: err.message });
  }
}

function getDatabaseStats(req, res) {
  try {
    let fileSize = 0;
    try {
      const stats = fs.statSync(DB_PATH);
      fileSize = stats.size;
    } catch (e) {}

    const tables = db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `).all().map(t => t.name);

    const tableCounts = {};
    for (const t of tables) {
      try {
        tableCounts[t] = db.prepare(`SELECT COUNT(*) as count FROM "${t}"`).get().count;
      } catch (e) {
        tableCounts[t] = 0;
      }
    }

    res.json({
      databaseFile: DB_PATH,
      sizeBytes: fileSize,
      sizeKB: Math.round(fileSize / 1024),
      tables,
      tableCounts,
      journalMode: db.pragma('journal_mode', { simple: true }),
      foreignKeys: db.pragma('foreign_keys', { simple: true }),
      walCheckpoint: 'ACTIVE'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve database stats' });
  }
}

module.exports = {
  getHealth,
  getDatabaseStats
};
