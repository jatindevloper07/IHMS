// Authentication Routes
const express = require('express');
const router = express.Router();
const {
  getUsers,
  registerUser,
  loginUser,
  deleteUser,
  getLoginHistory
} = require('../controllers/authController');

router.get('/users', getUsers);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.delete('/users/:id', deleteUser);
router.get('/logins', getLoginHistory);

module.exports = router;
