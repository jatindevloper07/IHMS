// Appointment Routes
const express = require('express');
const router = express.Router();
const {
  getAppointments,
  createAppointment,
  checkInAppointment,
  cancelAppointment
} = require('../controllers/appointmentController');

router.get('/', getAppointments);
router.post('/', createAppointment);
router.post('/:id/checkin', checkInAppointment);
router.post('/:id/cancel', cancelAppointment);

module.exports = router;
