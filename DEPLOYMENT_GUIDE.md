# Quest - Deployment & Setup Guide

## 🚀 Quick Start (Development)

### Prerequisites
- Node.js v14+
- Neo4j v4.0+ (local or cloud instance)
- npm or yarn

### 1. Install Backend Dependencies
```bash
cd quest/Application/backend
npm install
```

### 2. Configure Environment Variables
Create `.env` file in the `backend` directory:
```env
PORT=5000
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password
JWT_SECRET=your_super_secret_jwt_key_change_in_production
NODE_ENV=development
```

### 3. Start Backend Server
```bash
npm start
# Backend running on http://localhost:5000
```

### 4. Install Frontend Dependencies (in another terminal)
```bash
cd quest/Application/frontend
npm install
```

### 5. Start Frontend Dev Server
```bash
npm run dev
# Frontend running on http://localhost:3000
```

### 6. Access Application
- **URL:** http://localhost:3000
- **Demo Username:** testuser
- **Demo Password:** password123

---

## 🗄️ Neo4j Setup

### Option 1: Local Neo4j Installation

**Windows:**
```bash
# Download from https://neo4j.com/download/
# Follow installation wizard
# Start Neo4j Desktop or Community Edition

# Default connection:
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=neo4j  # Change after first login
```

**Linux/Mac:**
```bash
# Using Docker
docker run -d \
  -p 7474:7474 \
  -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/password \
  neo4j:5.15.0

# Or homebrew (Mac)
brew install neo4j
neo4j start
```

### Option 2: Neo4j Cloud (AuraDB)

1. Sign up at https://neo4j.com/cloud/aura/
2. Create a free instance
3. Copy connection URI and password
4. Update `.env`:
```env
NEO4J_URI=neo4j+s://your-instance-id.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_generated_password
```

---

## 👤 Admin User Setup

### Create Admin User (First Time)

1. Login with demo credentials
2. Contact system administrator to set admin role
3. Or use Neo4j Browser to directly update user:

```cypher
MATCH (u:User {username: 'testuser'})
SET u.role = 'admin'
RETURN u
```

### User Roles

- **admin**: Can generate reports, flag transactions, view all data
- **user**: Can view transactions and reports only

---

## 🔒 Security Configuration for Production

### 1. Change JWT Secret
```env
# .env
JWT_SECRET=use_a_very_long_random_string_with_special_characters_!@#$%
```

Generate a strong secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Set Environment to Production
```env
NODE_ENV=production
```

### 3. Configure CORS for Specific Domain
```javascript
// In server.js
app.use(cors({
  origin: 'https://your-domain.com',
  credentials: true
}));
```

### 4. Update Database Credentials
```env
NEO4J_USER=your_neo4j_user
NEO4J_PASSWORD=your_very_strong_password
```

### 5. SSL/TLS Certificate
For production Neo4j connections:
```env
NEO4J_ENCRYPTION=ENCRYPTION_ON
NEO4J_TRUST=TRUST_SYSTEM_CA_SIGNED_CERTIFICATES
```

---

## 🐳 Docker Deployment

### Build Docker Image

**Create Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY backend/ .

# Expose port
EXPOSE 5000

# Start server
CMD ["npm", "start"]
```

### Build and Run

```bash
# Build image
docker build -t quest-fraud-detection .

# Run container
docker run -p 5000:5000 \
  -e NEO4J_URI=bolt://neo4j:7687 \
  -e NEO4J_USER=neo4j \
  -e NEO4J_PASSWORD=password \
  -e JWT_SECRET=your_secret \
  quest-fraud-detection
```

### Docker Compose (with Neo4j)

**Create docker-compose.yml:**
```yaml
version: '3.8'

services:
  neo4j:
    image: neo4j:5.15.0
    environment:
      NEO4J_AUTH: neo4j/your_password
    ports:
      - "7474:7474"
      - "7687:7687"
    volumes:
      - neo4j_data:/data
    networks:
      - quest-network

  backend:
    build: ./backend
    environment:
      PORT: 5000
      NEO4J_URI: bolt://neo4j:7687
      NEO4J_USER: neo4j
      NEO4J_PASSWORD: your_password
      JWT_SECRET: your_jwt_secret
      NODE_ENV: production
    ports:
      - "5000:5000"
    depends_on:
      - neo4j
    networks:
      - quest-network

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      REACT_APP_API_URL: http://localhost:5000/api
    networks:
      - quest-network

volumes:
  neo4j_data:

networks:
  quest-network:
    driver: bridge
```

**Run with Docker Compose:**
```bash
docker-compose up -d
```

---

## 🔍 Monitoring & Logging

### View Logs

**Backend Logs:**
```bash
# If running in Docker
docker logs <container_id> -f

# If running locally
# Logs appear in terminal where npm start was executed
```

### Request Tracking

Every request includes a `X-Request-ID` header for tracking:
```bash
curl -v http://localhost:5000/api/health
# See: X-Request-ID: 550e8400-e29b-41d4-a716-446655440000
```

Use this ID to trace requests through logs.

---

## 📊 Database Backups

### Neo4j Local Backup
```bash
# Using Neo4j Admin
neo4j-admin backup --to=/path/to/backup --database=neo4j

# Using Docker
docker exec <neo4j_container> neo4j-admin backup --to=/data/backups
```

### Neo4j Aura Backup
- Automatic daily backups included
- Manual backups available in Aura console

---

## 🧪 Testing

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Login Test
```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'
```

### Rate Limit Test
```bash
# Make 201 requests within 15 minutes from same IP
# 201st request should return 429 Too Many Requests
for i in {1..201}; do
  curl http://localhost:5000/api/health
done
```

---

## 🚨 Troubleshooting

### Port Already in Use

**Port 5000 (Backend):**
```bash
# Find process
lsof -i :5000
# Kill process
kill -9 <PID>
```

**Port 3000 (Frontend):**
```bash
lsof -i :3000
kill -9 <PID>
```

### Neo4j Connection Failed

1. Check Neo4j is running
2. Verify credentials in `.env`
3. Check firewall settings
4. Test connection:
```bash
cypher-shell -a bolt://localhost:7687 -u neo4j -p password "RETURN 1"
```

### JWT Token Expired

- Session duration: typically 24 hours
- Solution: Re-login to get new token
- Check token in LocalStorage: `localStorage.getItem('authToken')`

### Rate Limit Issues

Reset rate limiting by:
1. Waiting 15 minutes, or
2. Restarting backend server

---

## 📈 Performance Optimization

### Database Indexing
```cypher
CREATE INDEX account_id FOR (a:Account) ON (a.accountId);
CREATE INDEX merchant_id FOR (m:Merchant) ON (m.merchantId);
CREATE INDEX report_id FOR (r:Report) ON (r.reportId);
```

### Query Optimization
```cypher
// Instead of: MATCH (t:Transaction)
// Use: MATCH (a:Account)-[t:TRANSACTED_WITH]->(m:Merchant)
```

### Connection Pooling
Already configured in neo4j-driver (default: 100 connections)

---

## 🔄 Updates & Patches

### Update Dependencies
```bash
npm update
npm outdated  # Check for newer versions
```

### Database Migrations
Check [Neo4j Migration Guide](https://neo4j.com/docs/upgrade-migration-guide/)

---

## 📞 Support & Resources

- **Neo4j Documentation:** https://neo4j.com/docs/
- **Express.js Guide:** https://expressjs.com/
- **React Documentation:** https://react.dev/
- **Issue Tracker:** [Your GitHub Issues URL]

---

**Last Updated:** May 7, 2026  
**Version:** 1.0.0
