const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;            // <-- now contains userId, role, timestamp, etc.
    next();
  });
};

/**
 * Generate a JWT token.
 * Accepts either a plain `userId` string **or** an object with any payload you want
 * (e.g. { userId, role }).
 */
const generateToken = (payload) => {
  // If a plain string is passed, turn it into an object { userId: <string> }
  const tokenPayload = typeof payload === 'string' ? { userId: payload } : payload;

  return jwt.sign(
    { ...tokenPayload, timestamp: Date.now() }, // spread role, userId, etc.
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

module.exports = { authenticateToken, generateToken, JWT_SECRET };
