// Patient & Triage Routes
const express = require('express');
const router = express.Router();
const {
  getPatients,
  getPatientById,
  createPatient,
  deletePatient,
  updateWaitTime,
  overridePriority,
  reslotPatient
} = require('../controllers/patientController');
const {
  streamVitals,
  getPatientVitals
} = require('../controllers/vitalsController');

router.get('/', getPatients);
router.post('/', createPatient);
router.get('/:id', getPatientById);
router.delete('/:id', deletePatient);
router.patch('/:id/wait-time', updateWaitTime);
router.post('/:id/vitals', streamVitals);
router.get('/:id/vitals', getPatientVitals);
router.post('/:id/override', overridePriority);
router.post('/:id/reslot', reslotPatient);

module.exports = router;
