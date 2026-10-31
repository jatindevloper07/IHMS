// Main Express Application Configuration
const express = require('express');
const cors = require('cors');
const { CORS_ORIGIN } = require('./config/env');
const { requestLogger } = require('./middleware/requestLogger');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const roomRoutes = require('./routes/roomRoutes');
const staffRoutes = require('./routes/staffRoutes');
const surgeRoutes = require('./routes/surgeRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const auditRoutes = require('./routes/auditRoutes');
const systemRoutes = require('./routes/systemRoutes');
const sseRoutes = require('./routes/sseRoutes');
const { renderApiDocs } = require('./docs/apiDocs');

const app = express();

// Global Middlewares
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// API Documentation & Interactive Explorer
app.get('/api/docs', renderApiDocs);

// Mount API Route Modules
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/surge', surgeRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api', systemRoutes);
app.use('/api', sseRoutes);

// Root redirect to API Docs
app.get('/', (req, res) => {
  res.redirect('/api/docs');
});

// Centralized Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
