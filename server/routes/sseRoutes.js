// Server-Sent Events (SSE) Route
const express = require('express');
const router = express.Router();
const sseService = require('../services/sseService');

router.get('/events', (req, res) => {
  sseService.subscribe(req, res);
});

module.exports = router;
