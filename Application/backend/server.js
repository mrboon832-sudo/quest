// -------------------------------------------------------------------
// backend/server.js
// -------------------------------------------------------------------
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const yaml = require('yaml');
const swaggerUi = require('swagger-ui-express');
const http = require('http');                     // <-- needed for free‑port test
const { testConnection, driver } = require('./config/neo4j');
const { requestId, errorHandler } = require('./middleware/errorHandler');
const { requireAdmin } = require('./middleware/roleCheck');

// -------------------------------------------------
// Load environment variables & define the base port
// -------------------------------------------------
dotenv.config();
const BASE_PORT = process.env.PORT || 5000;      // <-- single source of truth

// -------------------------------------------------
// Create the Express app & apply *static* middle‑wares
// -------------------------------------------------
const app = express();

// Security
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Request tracking (X‑Request‑ID)
app.use(requestId);

// Body parser
app.use(express.json());

// -------------------------------------------------
// Swagger UI (optional)
// -------------------------------------------------
try {
  const swaggerFile = path.join(__dirname, 'swagger.yaml');
  const swaggerDoc = yaml.parse(fs.readFileSync(swaggerFile, 'utf8'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
  console.log('Swagger UI available at /api-docs');
} catch (e) {
  console.warn('⚠️  Failed to load Swagger documentation:', e.message);
}

// -------------------------------------------------
// Routes
// -------------------------------------------------
app.use('/api/auth', require('./routes/auth'));               // public
app.use('/api/accounts', require('./routes/accounts'));       // customer banking operations
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/network', require('./routes/network'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/admin', require('./routes/admin'));           // admin‑only

// Health‑check
app.get('/api/health', (req, res) =>
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
);

// -------------------------------------------------
// Global error handler (must be the last middleware)
// -------------------------------------------------
app.use(errorHandler);

// -------------------------------------------------
// Helper: find a free port (increments if busy)
// -------------------------------------------------
const findFreePort = async (start) => {
  return new Promise((resolve) => {
    const tester = http.createServer();
    tester.once('error', () => resolve(findFreePort(start + 1))); // busy → try next
    tester.once('listening', () => {
      tester.close(() => resolve(start));
    });
    tester.listen(start);
  });
};

// -------------------------------------------------
// Start the server (async so we can test Neo4j first)
// -------------------------------------------------
(async () => {
  // 1️⃣  Test Neo4j connection (optional but nice)
  const neo4jOk = await testConnection();
  if (!neo4jOk) {
    console.warn('⚠️  Neo4j connection failed – mock data will be used.');
  }

  // 2️⃣  Find a free port (starts at BASE_PORT, then 5001, 5002 …)
  const freePort = await findFreePort(BASE_PORT);

  // 3️⃣  Launch the HTTP server
  const server = app.listen(freePort, () => {
    console.log(`🚀 Quest Backend API running on port ${freePort}`);
    console.log(`🔗 Health check: http://localhost:${freePort}/api/health`);
    console.log(`📚 API docs:    http://localhost:${freePort}/api-docs`);
  });

  // -------------------------------------------------
  // Graceful shutdown (Ctrl+C / docker stop / kill)
  // -------------------------------------------------
  const gracefulShutdown = async () => {
    console.log('\n🛑 Shutting down...');
    server.close(async () => {
      console.log('🚪 HTTP server closed');
      try {
        await driver.close(); // close Neo4j driver cleanly
        console.log('🔌 Neo4j driver closed');
      } catch (e) {
        console.error('Error closing Neo4j driver:', e);
      }
      process.exit(0);
    });
  };

  process.on('SIGINT', gracefulShutdown);   // Ctrl+C
  process.on('SIGTERM', gracefulShutdown); // kill <pid>
})();
