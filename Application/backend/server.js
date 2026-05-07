const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const yaml = require('yaml');
const swaggerUi = require('swagger-ui-express');
const { testConnection } = require('./config/neo4j');
const { authenticateToken } = require('./middleware/auth');
const { requestId, errorHandler } = require('./middleware/errorHandler');
const { requireAdmin } = require('./middleware/roleCheck');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Request tracking
app.use(requestId);

// Middleware
app.use(express.json());

// Load and setup Swagger UI
try {
  const swaggerFile = path.join(__dirname, 'swagger.yaml');
  const swaggerDoc = yaml.parse(fs.readFileSync(swaggerFile, 'utf8'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
  console.log('Swagger UI available at /api-docs');
} catch (error) {
  console.warn('Warning: Failed to load Swagger documentation:', error.message);
}

// Auth routes (public)
app.use('/api/auth', require('./routes/auth'));

// Routes
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/network', require('./routes/network'));
app.use('/api/reports', require('./routes/reports'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const startServer = async () => {
  // Test Neo4j connection
  const neo4jConnected = await testConnection();
  
  if (!neo4jConnected) {
    console.warn('Warning: Neo4j connection failed. API will return mock data.');
  }

  app.listen(PORT, () => {
    console.log(`Quest Backend API running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log(`API Documentation: http://localhost:${PORT}/api-docs`);
  });
};

startServer();
