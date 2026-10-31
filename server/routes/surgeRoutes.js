// Surge Forecast Routes
const express = require('express');
const router = express.Router();
const { getSurgeForecast, triggerSurgeSpike } = require('../controllers/surgeController');

router.get('/', getSurgeForecast);
router.post('/spike', triggerSurgeSpike);

module.exports = router;
