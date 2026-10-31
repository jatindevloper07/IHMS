const path = require('path');

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', '..', 'ihms.db');
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

module.exports = {
  PORT,
  NODE_ENV,
  DB_PATH,
  CORS_ORIGIN
};
