# Quest - Fraud Detection Backend API

A comprehensive fraud detection and risk monitoring system built with Node.js, Express, and Neo4j. Detects suspicious transaction patterns, money laundering rings, shared device fraud, and high-risk transactions with real-time analysis and reporting.

## Features

- **Real-time Fraud Detection** - Identifies suspicious high-value accounts, money laundering patterns, and shared device fraud
- **Risk Analysis** - Categorizes transactions by risk level (Low, Medium, High)
- **Network Visualization** - Visualize fraud networks with accounts and merchants
- **Comprehensive Reporting** - Generate and download fraud detection reports in multiple formats
- **Role-Based Access Control** - Admin-only access to sensitive operations
- **Security** - Helmet.js security headers, rate limiting, JWT authentication
- **Error Handling** - Centralized error handling with request ID tracking
- **API Documentation** - Full OpenAPI/Swagger documentation

## Prerequisites

- Node.js v16+
- Neo4j Database (v4.4+)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   cd quest/Application/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   PORT=5000
   NEO4J_URI=bolt://localhost:7687
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=your-password
   JWT_SECRET=your-secret-key-change-in-production
   NODE_ENV=development
   ```

4. **Start the server**
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

## API Documentation

### Swagger UI
Access the interactive API documentation at:
```
http://localhost:5000/api-docs
```

### Base URL
```
http://localhost:5000/api
```

## Quick Start Guide

### 1. Register and Login

**Register a new user:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "analyst1",
    "password": "secure123",
    "email": "analyst@quest.local",
    "role": "analyst"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "analyst1",
    "password": "secure123"
  }'
```

Use the returned token in subsequent requests:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/dashboard/stats
```

### 2. Get Dashboard Statistics

```bash
curl http://localhost:5000/api/dashboard/stats
```

Returns:
```json
{
  "totalAccounts": 1250,
  "totalTransactions": 45820,
  "totalVolume": 5234850.50,
  "highRiskTransactions": 342
}
```

### 3. Get Transaction Trend

```bash
curl http://localhost:5000/api/dashboard/trend
```

Shows monthly breakdown of normal vs flagged transactions.

### 4. Get Fraud Network

```bash
curl http://localhost:5000/api/network
```

Returns nodes (accounts/merchants) and edges (transactions) for network visualization.

### 5. List Transactions

```bash
curl "http://localhost:5000/api/transactions?riskLevel=High&limit=20"
```

Filter transactions by risk level with pagination.

### 6. Flag a Transaction (Admin Only)

```bash
curl -X PUT http://localhost:5000/api/transactions/TXN123/flag \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Suspicious pattern detected"}'
```

### 7. Generate a Report (Admin Only)

```bash
curl -X POST http://localhost:5000/api/reports/generate \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type": "fraud_detection"}'
```

### 8. Get Report History

```bash
curl "http://localhost:5000/api/reports?limit=10&offset=0"
```

### 9. Download Report

```bash
# As CSV
curl "http://localhost:5000/api/reports/REPORT_ID/download?format=csv" \
  -o report.csv

# As JSON
curl "http://localhost:5000/api/reports/REPORT_ID/download?format=json" \
  -o report.json

# As PDF
curl "http://localhost:5000/api/reports/REPORT_ID/download?format=pdf" \
  -o report.pdf
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication.

### User Roles

- **user** - Basic access to dashboard and reports
- **analyst** - Can flag transactions, access detailed analytics
- **admin** - Full access including report generation and user management

### Protected Endpoints

- `POST /api/reports/generate` - Requires admin role
- `PUT /api/transactions/:id/flag` - Requires admin/analyst role

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Dashboard
- `GET /api/dashboard/stats` - Get overall statistics
- `GET /api/dashboard/risk-distribution` - Get risk distribution
- `GET /api/dashboard/trend` - Get monthly transaction trend

### Transactions
- `GET /api/transactions` - List transactions (with filtering)
- `GET /api/transactions/:id` - Get transaction details
- `PUT /api/transactions/:id/flag` - Flag transaction (admin)

### Network
- `GET /api/network` - Get fraud network graph
- `GET /api/network/account/:accountId` - Get account connections

### Reports
- `POST /api/reports/generate` - Generate fraud detection report (admin)
- `GET /api/reports` - Get report history
- `GET /api/reports/:id/download` - Download report (CSV/JSON/PDF)

### Health
- `GET /api/health` - API health check

## Error Handling

All errors follow a consistent format with request tracking:

```json
{
  "error": "Error message",
  "details": "Additional details if available",
  "requestId": "unique-request-id",
  "timestamp": "2026-05-07T10:30:00Z"
}
```

The `requestId` field helps correlate logs and debug issues. Each request is assigned a unique ID for tracking.

## Security Features

### 1. Helmet Security Headers
Protects against common vulnerabilities:
- XSS (Cross-Site Scripting)
- Click-jacking
- MIME-sniffing
- Other attack vectors

### 2. Rate Limiting
- **Limit**: 200 requests per IP per 15 minutes
- **Message**: Shown when limit exceeded

### 3. JWT Authentication
- Token-based authentication
- 24-hour token expiration
- Configurable secret key

### 4. CORS
- Configurable cross-origin requests
- Default: localhost:3000

### 5. Request ID Tracking
- Unique ID per request
- Passed to error logs
- Useful for debugging

## Database Schema

### Node Types
- **Account** - User accounts with risk levels
- **Merchant** - Merchant/business entities
- **Device** - Devices used in transactions
- **Report** - Generated fraud reports

### Relationships
- **TRANSACTED_WITH** - Account to Merchant transactions with amount and risk level
- **USES** - Account uses Device connection

## Project Structure

```
backend/
├── config/
│   └── neo4j.js           # Neo4j connection
├── controllers/
│   ├── authController.js       # Authentication logic
│   ├── dashboardController.js  # Dashboard endpoints
│   ├── networkController.js    # Network visualization
│   ├── reportController.js     # Report generation
│   └── transactionController.js # Transaction management
├── middleware/
│   ├── auth.js            # JWT authentication
│   ├── errorHandler.js    # Error handling & logging
│   └── roleCheck.js       # Role-based access control
├── queries/
│   └── fraudDetection.js  # Cypher queries
├── routes/
│   ├── auth.js            # Auth routes
│   ├── dashboard.js       # Dashboard routes
│   ├── network.js         # Network routes
│   ├── reports.js         # Report routes
│   └── transactions.js    # Transaction routes
├── server.js              # Express app & middleware setup
├── package.json           # Dependencies
├── swagger.yaml           # API documentation
└── README.md              # This file
```

## Development

### Running Tests
```bash
npm test
```

### Code Style
This project follows Node.js best practices. Use ESLint for linting:
```bash
npm run lint
```

### Debugging
Enable debug logging:
```bash
DEBUG=quest:* npm start
```

## Deployment

### Production Checklist
- [ ] Set strong `JWT_SECRET` in environment
- [ ] Configure Neo4j connection for production database
- [ ] Enable HTTPS for all connections
- [ ] Set `NODE_ENV=production`
- [ ] Configure CORS for frontend domain
- [ ] Set up monitoring and alerting
- [ ] Enable database backups
- [ ] Configure rate limiting for production scale
- [ ] Set up centralized logging

### Docker Deployment
```bash
docker build -t quest-backend .
docker run -p 5000:5000 --env-file .env quest-backend
```

## Common Issues

### Neo4j Connection Failed
- Verify Neo4j is running: `neo4j start`
- Check NEO4J_URI in `.env`
- Verify credentials are correct
- Check Neo4j logs for errors

### JWT Token Expired
- Re-login to get a new token
- Token expiration can be adjusted in `middleware/auth.js`

### Rate Limit Exceeded
- Wait 15 minutes for the limit to reset
- Use different IP or adjust limit in `server.js`

## Contributing

When making changes:
1. Follow the existing code style
2. Update API documentation in `swagger.yaml`
3. Test authentication and authorization
4. Add error handling for edge cases
5. Update this README with new features

## License

MIT License - See LICENSE file for details

## Support

For issues or questions:
1. Check this README
2. Review error logs with request ID
3. Check Swagger documentation at `/api-docs`
4. Contact: support@quest-fraud.local

## Version History

### v1.0.0 (2026-05-07)
- Initial release
- Core fraud detection features
- Dashboard analytics
- Network visualization
- Report generation
- Role-based access control
- Security hardening (Helmet, rate limiting)
- Comprehensive API documentation
