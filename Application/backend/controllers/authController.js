const bcrypt = require('bcryptjs');
const { generateToken } = require('../middleware/auth');

const authController = {
  // Simple login - for demonstration purposes
  // In production, verify against a users database
  login: async (req, res) => {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // For demonstration: accept any non-empty credentials
    // In production, verify against hashed passwords in database
    if (username.length < 3 || password.length < 3) {
      return res.status(400).json({ error: 'Invalid credentials format' });
    }

    try {
      // Generate JWT token
      const token = generateToken(username);

      res.json({
        success: true,
        token,
        user: {
          username,
          userId: username,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed', details: error.message });
    }
  },

  // Verify token endpoint
  verify: (req, res) => {
    res.json({
      valid: true,
      user: req.user,
    });
  },
};

module.exports = authController;
