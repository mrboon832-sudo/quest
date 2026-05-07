# Quest - Fraud Detection & Risk Monitoring System

A comprehensive fraud detection platform built with **Neo4j**, **Node.js**, and **React**. This system analyzes transaction patterns, identifies fraudulent activities, and visualizes fraud networks in real-time.

## 🎯 Features

- **Real-time Fraud Detection** - Analyzes transaction patterns and flags suspicious activities
- **Risk Scoring** - ML-based risk assessment for accounts and transactions
- **Network Visualization** - Interactive fraud network graph with account connections
- **Transaction Management** - Browse, search, filter, and flag transactions
- **Report Generation** - Generate downloadable fraud reports (CSV/JSON)
- **Role-Based Access Control** - Admin-only actions (report generation, transaction flagging)
- **Rate Limiting & Security** - Helmet.js + express-rate-limit for protection

## 📋 Prerequisites

- **Node.js** v14+ 
- **Neo4j** v4.0+
- **npm** or **yarn**

## 🚀 Installation

### 1. Clone Repository
```bash
cd quest/Application
```

### 2. Backend Setup
```bash
cd backend
npm install
```

**Install additional dependencies:**
```bash
npm install helmet express-rate-limit uuid
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

### 4. Environment Configuration

Create `.env` in the `backend` directory:
```env
PORT=5000
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password
JWT_SECRET=your_jwt_secret_key
```

## 🏃 Running the Application

### Start Backend Server
```bash
cd backend
npm start
# Runs on http://localhost:5000
```

### Start Frontend Dev Server (in another terminal)
```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

### Access the Application
Open browser to: **http://localhost:3000**

**Demo Credentials:**
- Username: `testuser`
- Password: `password123`

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login (returns JWT token)
- `POST /api/auth/logout` - User logout

### Dashboard
- `GET /api/dashboard/stats` - Fetch dashboard statistics
- `GET /api/dashboard/risk-distribution` - Risk distribution data
- `GET /api/dashboard/transaction-trend` - Monthly transaction trends

### Transactions
- `GET /api/transactions` - List all transactions (supports filtering & pagination)
  - Query params: `riskLevel`, `limit`, `skip`
- `GET /api/transactions/:id` - Get transaction details
- `PUT /api/transactions/:id/flag` - Flag a transaction (**Admin only**)

### Network
- `GET /api/network/fraud-network` - Fetch fraud network graph data
- `GET /api/network/connections/:accountId` - Get account connections

### Reports
- `POST /api/reports/generate` - Generate fraud report (**Admin only**)
- `GET /api/reports` - List all reports (supports pagination)
  - Query params: `limit`, `offset`
- `GET /api/reports/:id/download` - Download report (**CSV/JSON**)
  - Query params: `format=csv` or `format=json`

### Health Check
- `GET /api/health` - API health status

## 🗂️ Project Structure

```
backend/
  ├── config/
  │   └── neo4j.js           # Neo4j connection config
  ├── controllers/
  │   ├── authController.js
  │   ├── dashboardController.js
  │   ├── networkController.js
  │   ├── reportController.js
  │   └── transactionController.js
  ├── middleware/
  │   ├── auth.js            # JWT authentication
  │   ├── errorHandler.js    # Error handling & logging
  │   └── roleCheck.js       # Role-based access control
  ├── queries/
  │   └── fraudDetection.js  # Cypher queries
  ├── routes/
  │   ├── auth.js
  │   ├── dashboard.js
  │   ├── network.js
  │   ├── reports.js
  │   └── transactions.js
  └── server.js              # Express app setup

frontend/
  ├── src/
  │   ├── pages/
  │   │   ├── DashboardPage.jsx
  │   │   ├── LoginPage.jsx
  │   │   ├── NetworkViewPage.jsx
  │   │   ├── ReportsPage.jsx
  │   │   └── TransactionListPage.jsx
  │   ├── services/
  │   │   └── api.js         # API client
  │   └── App.jsx
  └── vite.config.js
```

## 🔐 Security Features

- **JWT Authentication** - Token-based auth for API access
- **Role-Based Access Control** - Admin role required for sensitive operations
- **Rate Limiting** - 200 requests/15min per IP
- **Helmet.js** - Sets secure HTTP headers
- **CORS Protection** - Configurable cross-origin requests
- **Request ID Tracking** - Unique ID per request for debugging

## 📊 Cypher Queries

### Key Queries Used

1. **Suspicious Accounts** - Identifies accounts with high transaction velocity
2. **Money Laundering Rings** - Detects circular transaction patterns
3. **Shared Device Fraud** - Finds accounts sharing devices
4. **Risk Distribution** - Aggregates transactions by risk level
5. **Transaction Trends** - Monthly aggregation of transaction volumes

## 🛠️ Development

### Adding New Endpoints

1. Create controller in `backend/controllers/`
2. Add route in `backend/routes/`
3. Mount route in `backend/server.js`
4. Add API service in `frontend/src/services/api.js`

### Database Schema

**Nodes:**
- `Account` (accountId, riskLevel)
- `Merchant` (merchantId, name, location)
- `Report` (reportId, generatedAt, summary, type, status, findingsCount)

**Relationships:**
- `Account -[TRANSACTED_WITH {amount, timestamp, riskLevel, status}]-> Merchant`
- `Account -[USES]-> Device`

## 📝 Error Handling

All API responses include:
- `error` - Error message
- `requestId` - Unique request identifier
- `timestamp` - Error timestamp

**Example:**
```json
{
  "error": "Transaction not found",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-05-07T15:30:00.000Z"
}
```

## 🐛 Troubleshooting

### Neo4j Connection Failed
```
Solution: Ensure Neo4j is running and credentials are correct in .env
```

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### JWT Token Expired
```
Solution: Re-login to get a new token
```

## 📄 License

MIT License - See LICENSE file for details

## 👥 Support

For issues or questions, contact the development team or submit an issue in the repository.

---

**Last Updated:** May 2026  
**Version:** 1.0.0
