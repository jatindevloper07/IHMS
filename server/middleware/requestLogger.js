// Request Logger Middleware

function requestLogger(req, res, next) {
  const start = Date.now();
  const { method, url } = req;

  // Don't log spammy event stream heartbeats
  if (url === '/api/events') {
    return next();
  }

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const color = status >= 500 ? '\x1b[31m' : status >= 400 ? '\x1b[33m' : '\x1b[32m';
    const reset = '\x1b[0m';
    console.log(`[${new Date().toISOString().slice(11, 19)}] ${method} ${url} ${color}${status}${reset} - ${duration}ms`);
  });

  next();
}

module.exports = { requestLogger };
