// System Telemetry & Health Routes
const express = require('express');
const router = express.Router();
const { getHealth, getDatabaseStats } = require('../controllers/systemController');

router.get('/health', getHealth);
router.get('/system/stats', getDatabaseStats);

module.exports = router;
