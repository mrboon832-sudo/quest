const bcrypt = require('bcryptjs');
const { generateToken } = require('../middleware/auth');
const { driver } = require('../config/neo4j');
const crypto = require('crypto');

const authController = {
  register: async (req, res) => {
    const { fullName, email, password, phone, role = 'customer' } = req.body;
    
    const validRoles = ['customer', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be: customer or admin' });
    }

    if (!fullName || !email || !password || !phone) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const session = driver.session();
    try {
      const exists = await session.run('MATCH (c:Customer {email: $email}) RETURN c', { email });
      if (exists.records.length > 0) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(password, salt);
      const customerId = crypto.randomUUID();
      const accountId = `ACC-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;

      const result = await session.run(
        `CREATE (c:Customer {
          customer_id: $customerId,
          name: $fullName,
          email: $email,
          phone: $phone,
          password: $hashed,
          role: $role,
          risk_score: 0.0,
          created_at: datetime()
        })
        CREATE (a:Account {
          account_id: $accountId,
          balance: 1000.0,
          status: 'Active',
          risk_level: 'Low',
          opened_date: date()
        })
        CREATE (c)-[:OWNS_ACCOUNT]->(a)
        RETURN c.customer_id AS customerId, a.account_id AS accountNumber`,
        { customerId, fullName, email, phone, hashed, role, accountId }
      );

      const rec = result.records[0];
      const token = generateToken({ userId: rec.get('customerId'), role });

      res.status(201).json({
        success: true,
        token,
        user: { id: rec.get('customerId'), name: fullName, email, accountNumber: rec.get('accountNumber'), role },
      });
    } catch (err) {
      res.status(500).json({ error: 'Registration failed', details: err.message });
    } finally {
      await session.close();
    }
  },

  login: async (req, res) => {
    const { username, password } = req.body;

    // REMOVED ADMIN BYPASS: All users must now exist in Neo4j
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const session = driver.session();
    try {
      const result = await session.run(
        'MATCH (c:Customer {email: $email}) RETURN c.customer_id AS customerId, c.password AS password, c.email AS email, c.name AS name, c.role AS role',
        { email: username }
      );

      if (result.records.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const rec = result.records[0];
      const match = await bcrypt.compare(password, rec.get('password'));
      if (!match) return res.status(401).json({ error: 'Invalid credentials' });

      const token = generateToken({ userId: rec.get('customerId'), role: rec.get('role') });

      res.json({
        success: true,
        token,
        user: { username: rec.get('email'), name: rec.get('name'), role: rec.get('role'), userId: rec.get('customerId') },
      });
    } catch (e) {
      res.status(500).json({ error: 'Login failed', details: e.message });
    } finally {
      await session.close();
    }
  },

  verify: async (req, res) => {
    if (!req.user) return res.status(401).json({ error: 'User not found' });
    res.json({ valid: true, user: req.user });
  },
};

module.exports = authController;
