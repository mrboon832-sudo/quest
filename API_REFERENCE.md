# Quest API Reference Guide

## Base URL
```
http://localhost:5000/api
```

---

## Authentication Endpoints

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "password123"
}

Response (200):
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-123",
    "username": "testuser",
    "role": "admin"
  }
}
```

### Logout
```http
POST /auth/logout
Authorization: Bearer <token>

Response (200):
{
  "message": "Logged out successfully"
}
```

---

## Dashboard Endpoints

### Get Dashboard Statistics
```http
GET /dashboard/stats

Response (200):
{
  "totalAccounts": 8,
  "totalTransactions": 0,
  "totalVolume": 0,
  "highRiskTransactions": 0
}
```

### Get Risk Distribution
```http
GET /dashboard/risk-distribution

Response (200):
[
  { "risk": "High", "count": 5 },
  { "risk": "Medium", "count": 8 },
  { "risk": "Low", "count": 12 }
]
```

### Get Transaction Trend (Monthly)
```http
GET /dashboard/transaction-trend

Response (200):
[
  { "year": 2026, "month": 4, "normal": 15, "flagged": 3 },
  { "year": 2026, "month": 5, "normal": 22, "flagged": 5 }
]
```

---

## Transaction Endpoints

### List All Transactions
```http
GET /transactions?limit=50&skip=0&riskLevel=High

Query Parameters:
- limit: number (default: 50) - Records per page
- skip: number (default: 0) - Pagination offset
- riskLevel: string optional - Filter by "High", "Medium", or "Low"

Response (200):
[
  {
    "id": "TXN001",
    "fromAccount": "ACC-12345",
    "toAccount": "MER-Store001",
    "amount": 250.50,
    "date": "2026-05-05T20:15:50.802Z",
    "risk": "Low",
    "status": "Cleared"
  },
  ...
]
```

### Get Transaction Details
```http
GET /transactions/TXN001

Response (200):
{
  "id": "TXN001",
  "fromAccount": "ACC-12345",
  "toAccount": "MER-Store001",
  "amount": 250.50,
  "date": "2026-05-05T20:15:50.802Z",
  "risk": "Low",
  "status": "Cleared"
}
```

### Flag Transaction (Admin Only)
```http
PUT /transactions/TXN001/flag
Authorization: Bearer <admin_token>
Content-Type: application/json

Response (200):
{
  "message": "Transaction flagged successfully",
  "transactionId": "TXN001"
}

Error (403):
{
  "error": "Access denied. This action requires admin role."
}
```

---

## Network Endpoints

### Get Fraud Network Graph
```http
GET /network/fraud-network

Response (200):
{
  "nodes": [
    {
      "id": "ACC-12345",
      "label": "Account 12345",
      "type": "Account",
      "riskLevel": "High"
    },
    {
      "id": "MER-Store001",
      "label": "Store 001 (NYC)",
      "type": "Merchant",
      "riskLevel": null
    }
  ],
  "edges": [
    {
      "id": "ACC-12345-MER-Store001",
      "source": "ACC-12345",
      "target": "MER-Store001",
      "label": "$250.50",
      "riskLevel": "Low"
    }
  ]
}
```

### Get Account Connections
```http
GET /network/connections/ACC-12345

Response (200):
[
  {
    "account": "ACC-12345",
    "merchant": "MER-Store001"
  },
  {
    "account": "ACC-12345",
    "merchant": "MER-Casino"
  }
]
```

---

## Report Endpoints

### Generate Fraud Report (Admin Only)
```http
POST /reports/generate
Authorization: Bearer <admin_token>
Content-Type: application/json

Body:
{
  "type": "fraud_detection"
}

Response (200):
{
  "reportId": "report-uuid-1234",
  "generatedAt": "2026-05-07T15:30:00.000Z",
  "type": "fraud_detection",
  "findingsCount": 8,
  "summary": "Found 2 suspicious high-value accounts | Detected 1 potential money laundering patterns | Identified 2 account pairs sharing devices | 3 high-risk transactions identified",
  "status": "Completed"
}

Error (403):
{
  "error": "Access denied. This action requires admin role."
}
```

### Get Report History
```http
GET /reports?limit=50&offset=0

Query Parameters:
- limit: number (default: 50) - Records per page
- offset: number (default: 0) - Pagination offset

Response (200):
[
  {
    "reportId": "report-uuid-1234",
    "generatedAt": "2026-05-07T15:30:00.000Z",
    "summary": "Found 2 suspicious high-value accounts | ...",
    "type": "fraud_detection",
    "status": "Completed",
    "findingsCount": 8
  }
]
```

### Download Report
```http
GET /reports/report-uuid-1234/download?format=csv

Query Parameters:
- format: string - Either "csv" or "json" (default: csv)

Response (200 - CSV):
Content-Type: text/csv
Content-Disposition: attachment; filename="report-report-uuid-1234.csv"

Report ID,Generated At,Type,Status,Findings Count
"report-uuid-1234","2026-05-07T15:30:00.000Z","fraud_detection","Completed",8

Summary:
"Found 2 suspicious high-value accounts | ..."

---

Response (200 - JSON):
Content-Type: application/json
Content-Disposition: attachment; filename="report-report-uuid-1234.json"

{
  "reportId": "report-uuid-1234",
  "generatedAt": "2026-05-07T15:30:00.000Z",
  "summary": "Found 2 suspicious high-value accounts | ...",
  "type": "fraud_detection",
  "status": "Completed",
  "findingsCount": 8
}
```

---

## Health Check

### API Health Status
```http
GET /health

Response (200):
{
  "status": "OK",
  "timestamp": "2026-05-07T15:35:42.123Z"
}
```

---

## Error Response Format

All errors follow this format:
```json
{
  "error": "Error message describing what went wrong",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-05-07T15:35:42.123Z"
}
```

### Common HTTP Status Codes
- `200 OK` - Request successful
- `400 Bad Request` - Invalid parameters
- `401 Unauthorized` - Missing or invalid authentication token
- `403 Forbidden` - Insufficient permissions (not admin)
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded (200 req/15min)
- `500 Internal Server Error` - Server error

---

## Authentication

All protected endpoints require the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

The JWT token is obtained from the `/auth/login` endpoint and should be included in all subsequent API calls.

---

## Rate Limiting

API requests are rate-limited to **200 requests per 15 minutes** per IP address.

**Headers:**
- `RateLimit-Limit: 200` - Total requests allowed in window
- `RateLimit-Remaining: 195` - Requests remaining
- `RateLimit-Reset: 1620000000` - Unix timestamp when limit resets
- `Retry-After: 240` - Seconds to wait before retrying (if 429)

---

## Request ID Tracking

Every API response includes a unique `X-Request-ID` header for tracking and debugging:
```
X-Request-ID: 550e8400-e29b-41d4-a716-446655440000
```

Use this ID when reporting issues or debugging problems.

---

## Examples

### cURL: Get Transactions with High Risk Filter
```bash
curl -X GET 'http://localhost:5000/api/transactions?riskLevel=High&limit=10' \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### cURL: Generate Report (Admin)
```bash
curl -X POST http://localhost:5000/api/reports/generate \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"fraud_detection"}'
```

### cURL: Download Report as CSV
```bash
curl -X GET 'http://localhost:5000/api/reports/report-id-123/download?format=csv' \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output report.csv
```

### JavaScript/Fetch: Get Fraud Network
```javascript
const response = await fetch('http://localhost:5000/api/network/fraud-network', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();
console.log(data.nodes, data.edges);
```

---

**Last Updated:** May 7, 2026  
**Version:** 1.0.0
