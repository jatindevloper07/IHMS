// Staff Routes
const express = require('express');
const router = express.Router();
const { getStaff, reallocateStaff } = require('../controllers/staffController');

router.get('/', getStaff);
router.post('/reallocate', reallocateStaff);

module.exports = router;
