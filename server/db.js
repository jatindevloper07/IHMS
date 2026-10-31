// Re-export database layer for backward compatibility
const { db, DB_PATH } = require('./config/database');
const { initSchema } = require('./db/schema');
const { seedDatabase } = require('./db/seed');

function initDatabase() {
  initSchema(db);
  seedDatabase(db);
}

// Auto-run init
initDatabase();

module.exports = {
  db,
  DB_PATH,
  initDatabase,
  initSchema,
  seedDatabase
};
