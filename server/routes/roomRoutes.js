// Room Allocation Routes
const express = require('express');
const router = express.Router();
const {
  getRooms,
  assignRoom,
  concludeConsultation,
  completeSanitization
} = require('../controllers/roomController');

router.get('/', getRooms);
router.post('/:id/assign', assignRoom);
router.post('/:id/conclude', concludeConsultation);
router.post('/:id/sanitize-complete', completeSanitization);

module.exports = router;
