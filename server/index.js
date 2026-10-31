// IHMS Backend Server Entry Point
const app = require('./app');
const { PORT, DB_PATH } = require('./config/env');
const { db } = require('./config/database');
const { initSchema } = require('./db/schema');
const { seedDatabase } = require('./db/seed');

// Initialize database schema and seeds
try {
  initSchema(db);
  seedDatabase(db);
  console.log(`[IHMS DB] SQLite Database initialized at ${DB_PATH}`);
} catch (err) {
  console.error('[IHMS DB Error] Database initialization failed:', err);
}

// Start HTTP Server
const server = app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  IHMS Intelligent Hospital Management Backend Service`);
  console.log(`======================================================`);
  console.log(`  🚀 API Server:       http://127.0.0.1:${PORT}`);
  console.log(`  📚 API Docs & Live:  http://127.0.0.1:${PORT}/api/docs`);
  console.log(`  ⚡ Real-Time Events: http://127.0.0.1:${PORT}/api/events`);
  console.log(`  💾 SQLite Database:  ${DB_PATH}`);
  console.log(`======================================================\n`);
});

// Graceful Shutdown
function handleShutdown(signal) {
  console.log(`\nReceived ${signal}. Shutting down IHMS backend gracefully...`);
  server.close(() => {
    try {
      db.close();
      console.log('SQLite database connection closed.');
    } catch (e) {}
    process.exit(0);
  });
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

module.exports = { server, app };
