// Staff & Resource Reallocation Controller
const { db } = require('../config/database');
const { logAudit } = require('../services/priorityEngine');
const sseService = require('../services/sseService');

function getStaff(req, res) {
  try {
    const staff = db.prepare('SELECT * FROM staff').all().map(s => ({
      id: s.id,
      name: s.name,
      department: s.department,
      assignedZone: s.assigned_zone,
      activePatients: s.active_patients
    }));
    res.json(staff);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
}

function reallocateStaff(req, res) {
  try {
    db.prepare(`
      UPDATE staff 
      SET assigned_zone = 'ER Triage (Re-allocated)', active_patients = active_patients + 2
      WHERE name LIKE '%Adams%'
    `).run();

    logAudit(
      db,
      'Surge Control AI',
      'STAFF_REALLOCATION_COMMITTED',
      'ST-04',
      'Dr. James Adams',
      'Reallocated to ER Triage in response to predicted 15:00 surge threshold spike (Sh > 0.85).'
    );

    sseService.broadcast('staff:reallocated', {
      staffId: 'ST-04',
      name: 'Dr. James Adams',
      newZone: 'ER Triage (Re-allocated)'
    });

    res.json({ success: true, reallocated: 'Dr. James Adams' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reallocate staff' });
  }
}

module.exports = {
  getStaff,
  reallocateStaff
};
