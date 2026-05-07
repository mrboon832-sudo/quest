// Request ID middleware
const requestId = (req, res, next) => {
  req.id = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
};

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  const requestId = req.id || 'unknown';
  
  console.error(`[${requestId}] Error:`, {
    message: err.message,
    status: err.status || 500,
    path: req.path,
    method: req.method,
    stack: err.stack,
  });

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    error: message,
    requestId,
    timestamp: new Date().toISOString(),
  });
};

module.exports = { requestId, errorHandler };
