// Predictive Surge & Influx Controller
const { db } = require('../config/database');
const { logAudit } = require('../services/priorityEngine');
const sseService = require('../services/sseService');

function getSurgeForecast(req, res) {
  try {
    const rows = db.prepare('SELECT * FROM surge_forecast').all().map(r => ({
      hour: r.hour,
      surgeProb: r.surge_prob,
      expectedArrivals: r.expected_arrivals,
      status: r.status
    }));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch surge forecast' });
  }
}

function triggerSurgeSpike(req, res) {
  try {
    db.prepare(`
      UPDATE surge_forecast 
      SET surge_prob = 0.96, expected_arrivals = 32, status = 'SURGE_CRITICAL'
      WHERE hour IN ('15:00', '16:00')
    `).run();

    logAudit(
      db,
      'ML Weather Correlator',
      'SURGE_PREDICTION_SPIKE',
      null,
      'Hospital Influx',
      'Severe thunderstorm squall and highway collision correlated. Surge probability elevated to 96%.'
    );

    sseService.broadcast('surge:spike', {
      hour: '15:00 - 16:00',
      surgeProb: 0.96,
      expectedArrivals: 32,
      status: 'SURGE_CRITICAL'
    });

    res.json({ success: true, status: 'SURGE_CRITICAL', surgeProb: 0.96, expectedArrivals: 32 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to trigger surge spike' });
  }
}

module.exports = {
  getSurgeForecast,
  triggerSurgeSpike
};
