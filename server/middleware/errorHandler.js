// Centralized Error Handling Middleware

function notFoundHandler(req, res, next) {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    status: 404,
    timestamp: new Date().toISOString()
  });
}

function errorHandler(err, req, res, next) {
  console.error('[IHMS Server Error]:', err.stack || err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.name || 'InternalServerError',
    message: err.message || 'An unexpected error occurred on the server',
    status,
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
