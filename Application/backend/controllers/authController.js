const bcrypt = require('bcryptjs');
const { generateToken } = require('../middleware/auth');
const { driver } = require('../config/neo4j');
const crypto = require('crypto'); // Used for safe UUID generation

const authController = {
  // -------------------  USER REGISTRATION  -------------------
  register: async (req, res) => {
    const { fullName, email, password, phone, role = 'customer' } = req.body;
    
    // 1. Validate role
    const validRoles = ['customer', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be: customer or admin' });
    }

    if (!fullName || !email || !password || !phone) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const session = driver.session();
    try {
      // 2. Check if email already exists
      const exists = await session.run(
        'MATCH (c:Customer {email: $email}) RETURN c',
        { email }
      );
      if (exists.records.length > 0) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      // 3. Hash password
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(password, salt);

      // 4. Generate IDs in JS to avoid Neo4j version conflicts
      const customerId = crypto.randomUUID();
      const accountId = `ACC-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;

      // 5. Create Customer & Account + relationship
      // We use the exact properties from your schema_design.md
      const result = await session.run(
        `
        CREATE (c:Customer {
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
        RETURN c.customer_id AS customerId, a.account_id AS accountNumber
        `,
        { 
          customerId, 
          fullName, 
          email, 
          phone, 
          hashed, 
          role, 
          accountId 
        }
      );

      const rec = result.records[0];
      const finalCustomerId = rec.get('customerId');
      
      // Generate JWT
      const token = generateToken({ userId: finalCustomerId, role });

      res.status(201).json({
        success: true,
        token,
        user: {
          id: finalCustomerId,
          name: fullName,
          email,
          accountNumber: rec.get('accountNumber'),
          role,
        },
      });
    } catch (err) {
      console.error('Detailed Registration Error:', err);
      res.status(500).json({ error: 'Registration failed', details: err.message });
    } finally {
      await session.close();
    }
  },

  // -------------------  LOGIN (admin OR user)  -------------------
  login: async (req, res) => {
    const { username, password } = req.body;

    // ---- ADMIN BYPASS ----
    if (username === 'admin' && password === 'admin123') {
      const token = generateToken({ userId: 'admin', role: 'admin' });
      return res.json({ success: true, token, user: { username: 'admin', role: 'admin', name: 'System Admin' } });
    }

    // ---- REGULAR USER ----
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
      const storedPassword = rec.get('password');
      const match = await bcrypt.compare(password, storedPassword);
      
      if (!match) return res.status(401).json({ error: 'Invalid credentials' });

      const customerId = rec.get('customerId');
      const userRole = rec.get('role') || 'customer';
      const token = generateToken({ userId: customerId, role: userRole });

      res.json({
        success: true,
        token,
        user: {
          username: rec.get('email'),
          name: rec.get('name'),
          role: userRole,
          userId: customerId,
        },
      });
    } catch (e) {
      console.error('Login error:', e);
      res.status(500).json({ error: 'Login failed', details: e.message });
    } finally {
      await session.close();
    }
  },


  verify: async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not found in token' });
      }
      res.json({ valid: true, user: req.user });
    } catch (error) {
      res.status(500).json({ error: 'Verification failed' });
    }
  },
};

module.exports = authController;

