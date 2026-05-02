# Quest - Fraud Detection & Risk Monitoring System

A comprehensive full-stack fraud detection and risk monitoring application built with React, Node.js/Express, and Neo4j AuraDB for university group projects.

## 📋 Project Overview

Quest is a sophisticated fraud detection system designed to identify, analyze, and monitor suspicious financial transactions in real-time. The system uses graph database technology (Neo4j) to analyze transaction networks, detect money laundering patterns, and flag high-risk accounts.

### Key Features

- **Real-time Dashboard**: Live statistics on accounts, transactions, and fraud metrics
- **Transaction Management**: View, filter, and flag suspicious transactions
- **Fraud Network Visualization**: Interactive graph visualization of transaction networks with risk coloring
- **Automated Report Generation**: Generate comprehensive fraud detection reports from database queries
- **JWT Authentication**: Secure login with token-based authorization
- **Risk Analysis**: Automatic risk scoring and distribution analysis
- **Account Risk Assessment**: Identify high-value transaction patterns and suspicious behavior

## 🛠️ Prerequisites

Before running the application, ensure you have:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Neo4j AuraDB Account** - [Create Free Account](https://neo4j.com/cloud/aura-free/)
- **Git** (for cloning the repository)

## 📦 Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/mrboon832-sudo/quest.git
cd quest
```

### 2. Backend Setup

```bash
cd Application/backend

# Install dependencies
npm install

# Create .env file with Neo4j credentials
echo "NEO4J_URI=neo4j+s://your-instance-id.databases.neo4j.io" > .env
echo "NEO4J_USERNAME=your-username" >> .env
echo "NEO4J_PASSWORD=your-password" >> .env
echo "NEO4J_DATABASE=your-database-name" >> .env
echo "PORT=5000" >> .env
echo "JWT_SECRET=your-secret-key-change-in-production" >> .env
```

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install
```

### 4. Verify Installation

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Test backend dependencies
cd ../backend
npm list

# Test frontend dependencies
cd ../frontend
npm list
```

## 🚀 How to Run

### Start the Backend Server

```bash
cd Application/backend
npm start
```

Expected output:
```
Neo4j connection successful
Quest Backend API running on port 5000
Health check: http://localhost:5000/api/health
```

### Start the Frontend Dev Server

In a new terminal:

```bash
cd Application/frontend
npm run dev
```

Expected output:
```
VITE v5.4.21  ready in 898 ms
➜  Local:   http://localhost:3000/
```

### Access the Application

Open your browser and navigate to: **http://localhost:3000**

Login with any credentials (demo mode):
- Username: `testuser`
- Password: `password123`

## 🔐 Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# Neo4j Database Configuration
NEO4J_URI=neo4j+s://your-instance-id.databases.neo4j.io
NEO4J_USERNAME=your-username
NEO4J_PASSWORD=your-password
NEO4J_DATABASE=your-database-name
AURA_INSTANCEID=your-instance-id
AURA_INSTANCENAME=Free instance

# Server Configuration
PORT=5000

# JWT Authentication
JWT_SECRET=your-secret-key-change-in-production

# Optional: Frontend API URL (if different from localhost)
VITE_API_URL=http://localhost:5000/api
```

## 📁 Project Structure

```
quest/
├── Application/
│   ├── backend/
│   │   ├── config/
│   │   │   └── neo4j.js              # Neo4j database configuration
│   │   ├── controllers/
│   │   │   ├── authController.js     # Login and authentication
│   │   │   ├── dashboardController.js
│   │   │   ├── transactionController.js
│   │   │   ├── networkController.js
│   │   │   └── reportController.js
│   │   ├── middleware/
│   │   │   └── auth.js               # JWT verification middleware
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── dashboard.js
│   │   │   ├── transactions.js
│   │   │   ├── network.js
│   │   │   └── reports.js
│   │   ├── queries/
│   │   │   └── fraudDetection.js     # Cypher queries for fraud detection
│   │   ├── server.js                 # Express app initialization
│   │   ├── package.json
│   │   └── .env                      # Environment variables (create this)
│   │
│   └── frontend/
│       ├── src/
│       │   ├── pages/
│       │   │   ├── LoginPage.jsx
│       │   │   ├── DashboardPage.jsx
│       │   │   ├── TransactionListPage.jsx
│       │   │   ├── NetworkViewPage.jsx
│       │   │   └── ReportsPage.jsx
│       │   ├── services/
│       │   │   └── api.js            # Axios API client with interceptors
│       │   ├── App.jsx
│       │   ├── main.jsx
│       │   └── index.css
│       ├── package.json
│       ├── vite.config.js
│       └── index.html
│
└── README.md
```

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/login` - User login (returns JWT token)
- `GET /api/auth/verify` - Verify token validity (protected)

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/risk-distribution` - Get risk level distribution
- `GET /api/dashboard/transaction-trend` - Get monthly transaction trends

### Transactions
- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/:id` - Get transaction details
- `PUT /api/transactions/:id/flag` - Flag transaction as fraudulent (protected)

### Network
- `GET /api/network/fraud-network` - Get fraud network graph data
- `GET /api/network/connections/:accountId` - Get account connections

### Reports
- `GET /api/reports` - Get report history
- `POST /api/reports/generate` - Generate new fraud detection report (protected)

### Health Check
- `GET /api/health` - Server health status

## 🧠 Fraud Detection Algorithms

The system implements four main fraud detection strategies:

### 1. Suspicious High-Value Accounts
Identifies accounts with high transaction velocity (>$10,000 in 7 days)

```cypher
MATCH (a:Account)-[t:TRANSACTED_WITH]->(m:Merchant)
WHERE t.amount > 10000 AND t.timestamp > datetime() - duration({days: 7})
RETURN a.accountId, count(t) AS transactionCount, sum(t.amount) AS totalAmount
ORDER BY totalAmount DESC LIMIT 20
```

### 2. Money Laundering Rings
Detects circular transaction patterns (3-5 hops)

```cypher
MATCH path = (a1:Account)-[:TRANSACTED_WITH*3..5]->(a1)
WHERE all(r IN relationships(path) WHERE r.timestamp > datetime() - duration({days: 30}))
RETURN path LIMIT 10
```

### 3. Shared Device Fraud
Identifies multiple accounts using the same devices (>2 shared devices)

```cypher
MATCH (a1:Account)-[:USES]->(d:Device)<-[:USES]-(a2:Account)
WHERE a1 <> a2 WITH a1, a2, count(d) AS sharedDevices WHERE sharedDevices > 2
RETURN a1.accountId AS account1, a2.accountId AS account2, sharedDevices
ORDER BY sharedDevices DESC
```

### 4. Risk Scoring
Calculates risk score based on transaction patterns (0-100 scale)

## 🎨 Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | React | 18.2.0 |
| **Frontend Build** | Vite | 5.0.8 |
| **UI Framework** | Ant Design | 5.12.0 |
| **Visualization** | ReactFlow | 11.10.0 |
| **Charts** | Recharts | 2.10.0 |
| **HTTP Client** | Axios | 1.6.0 |
| **Backend** | Express.js | 4.18.2 |
| **Runtime** | Node.js | v20+ |
| **Database** | Neo4j | 5.x |
| **Auth** | JWT (jsonwebtoken) | 9.x |
| **Password Hash** | bcryptjs | 2.4.3 |

## 📊 Database Schema

### Node Labels

- **Account**: User bank accounts with properties (accountId, riskLevel)
- **Merchant**: Payment merchants with properties (merchantId, category)
- **Device**: Device fingerprints with properties (deviceId, ipAddress)
- **Transaction**: Transaction records with properties (transactionId, amount, timestamp, riskLevel)
- **Report**: Generated fraud detection reports (reportId, findingsCount, summary)

### Relationship Types

- `TRANSACTED_WITH`: Account to Merchant transaction with properties (amount, timestamp, riskLevel, status)
- `USES`: Account to Device relationship

## 🔒 Security Features

- **JWT Authentication**: Token-based authorization for protected endpoints
- **Password Hashing**: bcryptjs for secure password storage (ready for production)
- **HTTPS Ready**: Neo4j connection uses `neo4j+s://` secure protocol
- **Input Validation**: Server-side validation on all endpoints
- **CORS Protection**: Configured CORS middleware
- **Token Expiration**: JWT tokens expire after 24 hours

## 🐛 Troubleshooting

### Neo4j Connection Failed

```
Error: Could not perform discovery. No routing servers available.
```

**Solution:**
1. Verify Neo4j Aura instance is active (Free instances auto-pause after 3 days)
2. Check credentials in `.env` file match your Aura dashboard
3. Test connection: `npm run test-db` in backend

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution:**
```bash
# Find and kill process on port 5000
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :5000
kill -9 <PID>
```

### CORS Errors in Browser

**Solution:** Ensure backend is running on port 5000 and frontend on port 3000

### Login Not Working

**Solution:**
1. Verify JWT_SECRET is set in `.env`
2. Check browser console for error messages
3. Ensure localStorage is enabled in browser

## 📈 Performance Optimization

- Neo4j queries use LIMIT to prevent large data transfers
- Frontend implements pagination (10 items per page)
- Axios interceptors cache authentication tokens
- React hooks optimize re-renders

## 🚢 Deployment

### Deploy Backend (Heroku)

```bash
cd Application/backend
heroku create your-app-name
heroku config:set NEO4J_URI=your-uri
heroku config:set NEO4J_USERNAME=your-username
heroku config:set NEO4J_PASSWORD=your-password
git push heroku main
```

### Deploy Frontend (Vercel)

```bash
cd Application/frontend
npm install -g vercel
vercel
```

## 📝 Development Notes

- All Neo4j queries are in `backend/queries/fraudDetection.js`
- Ant Design is the only UI library (no additional UI frameworks)
- React Hooks pattern used throughout frontend
- Middleware-based error handling in backend

## 🤝 Contributing

For group projects, follow these guidelines:
1. Create feature branches: `git checkout -b feature/your-feature`
2. Commit messages: `git commit -m "Add: description of changes"`
3. Push to branch: `git push origin feature/your-feature`
4. Create Pull Request on GitHub

## 📞 Support

For issues and questions:
1. Check the Troubleshooting section above
2. Review error messages in console (F12 Developer Tools)
3. Check Neo4j Aura dashboard for database status
4. Review backend logs: `npm start` output

## 📄 License

This project is for educational purposes as part of a university group project.

## 🎓 Project Team

Group Project 2026 - Fraud Detection System

---

**Last Updated:** May 1, 2026
**Version:** 1.0.0
