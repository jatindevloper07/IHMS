const Database = require('better-sqlite3');
const { DB_PATH } = require('./env');

let dbInstance = null;

function getDatabase() {
  if (!dbInstance) {
    dbInstance = new Database(DB_PATH);
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('foreign_keys = ON');
    dbInstance.pragma('synchronous = NORMAL');
  }
  return dbInstance;
}

const db = getDatabase();

module.exports = {
  db,
  getDatabase,
  DB_PATH
};
