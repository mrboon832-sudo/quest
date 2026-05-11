# Fraud Detection Queries Guide

**Database Connection:** `neo4j+s://7ade6b99.databases.neo4j.io`  
**Schema Version:** Matches `schema_design.md`  
**Status:** Production-ready

---

## Query Reference Map

### 1. `findSuspiciousAccounts`
**Purpose:** Identify accounts with large transactions in the last 7 days  
**Schema Pattern:** `(Account)-[:SENT_TRANSACTION]->(Transaction)`

**Key Features:**
- Filters transactions > 10,000 in last 7 days
- Excludes already flagged transactions
- Returns account status and risk level
- Includes transaction details with risk scores

**Response Fields:**
```json
{
  "accountId": "ACC001",
  "accountStatus": "Active|Flagged|Suspended",
  "riskLevel": "Low|Medium|High",
  "transactionCount": 5,
  "totalAmount": 75000.00,
  "lastTransaction": "2026-04-08T14:30:00Z",
  "transactions": [
    {"id": "TXN001", "amount": 15000, "risk": 0.75}
  ]
}
```

---

### 2. `findMoneyLaunderingRings`
**Purpose:** Detect circular money flows between accounts (potential laundering)  
**Schema Pattern:** `(Account)-[:SENT_TRANSACTION]->(Transaction)<-[:RECEIVED_TRANSACTION]-(Account)`

**Key Features:**
- Finds bidirectional transaction chains
- Filters by risk score > 0.6 or flagged status
- Orders by time difference between transactions
- Returns transaction amounts and risk scores

**Response Fields:**
```json
{
  "account1Id": "ACC001",
  "account2Id": "ACC002",
  "transaction1Amount": 50000,
  "transaction2Amount": 50000,
  "transaction1Risk": 0.85,
  "transaction2Risk": 0.72,
  "timeDiff": 3600
}
```

---

### 3. `findSharedDeviceAccounts`
**Purpose:** Find customers sharing devices (strong fraud indicator)  
**Schema Pattern:** `(Customer)-[:USES_DEVICE]->(Device)<-[:USES_DEVICE]-(Customer)`

**Key Features:**
- Identifies shared device usage patterns
- Flags if device is suspicious or customers are high-risk (>0.5)
- Includes last usage timestamps
- Groups by customer pair

**Response Fields:**
```json
{
  "customer1Id": "CUST001",
  "customer1Name": "John Smith",
  "customer1Risk": 0.75,
  "customer2Id": "CUST002",
  "customer2Name": "Jane Doe",
  "customer2Risk": 0.65,
  "deviceId": "DEV001",
  "deviceType": "Mobile|Desktop|Tablet",
  "ipAddress": "192.168.1.100",
  "deviceFlagged": true,
  "customer1LastUsed": "2026-04-08T10:30:00Z",
  "customer2LastUsed": "2026-04-07T15:45:00Z"
}
```

---

### 4. `getFraudNetwork`
**Purpose:** Build complete fraud network visualization  
**Schema Pattern:** `(Customer)-[:OWNS_ACCOUNT]->(Account)-[:SENT_TRANSACTION]->(Transaction)<-[:RECEIVED_TRANSACTION]-(Account)<-[:OWNS_ACCOUNT]-(Customer)`

**Key Features:**
- Creates network of all high-risk transactions
- Links customers through their accounts
- Includes customer and transaction metadata
- Returns structured fraud link objects

**Response Fields:**
```json
{
  "sourceCustomerId": "CUST001",
  "sourceCustomerName": "John Smith",
  "sourceRiskScore": 0.85,
  "sourceAccountId": "ACC001",
  "sourceAccountStatus": "Active",
  "transactionId": "TXN001",
  "transactionAmount": 50000,
  "transactionCurrency": "USD",
  "transactionRiskScore": 0.82,
  "transactionFlagged": true,
  "targetAccountId": "ACC002",
  "targetAccountStatus": "Flagged",
  "targetCustomerId": "CUST002",
  "targetCustomerName": "Jane Doe",
  "targetRiskScore": 0.72,
  "transactionTimestamp": "2026-04-08T10:30:00Z"
}
```

---

### 5. `getTransactionTrend`
**Purpose:** Analyze monthly transaction patterns  
**Schema Pattern:** `(Transaction)` aggregated by timestamp properties

**Key Features:**
- Groups transactions by year and month
- Calculates flagged vs normal transaction counts
- Computes flagged percentage
- Returns trend analysis data

**Response Fields:**
```json
{
  "year": 2026,
  "month": 4,
  "normalCount": 850,
  "flaggedCount": 42,
  "totalCount": 892,
  "flaggedPercentage": 4.71
}
```

---

### 6. `getDashboardStats`
**Purpose:** Retrieve overall dashboard statistics  
**Schema Pattern:** 
- `(Account)` - count
- `(Transaction)` - aggregates
- `(Customer)` - count

**Key Features:**
- Calculates total accounts, customers, transactions
- Computes total volume and flagged transaction count
- Returns percentages for quick insights
- Single call returns all stats

**Response Fields:**
```json
{
  "totalAccounts": 500,
  "totalCustomers": 350,
  "totalTransactions": 15420,
  "totalVolume": 2750000.00,
  "flaggedTransactions": 127,
  "flagPercentage": 0.82
}
```

---

### 7. `adminSummary`
**Purpose:** Executive-level account and customer overview  
**Schema Pattern:** `(Customer)-[:OWNS_ACCOUNT]->(Account)`

**Key Features:**
- Breaks down customers and accounts by risk level
- Distinguishes between flagged and suspended accounts
- Provides active account count
- Three-tier risk categorization

**Response Fields:**
```json
{
  "totalCustomers": 350,
  "totalAccounts": 500,
  "flaggedAccounts": 45,
  "activeAccounts": 455,
  "highRiskCustomers": 28,
  "mediumRiskCustomers": 87,
  "lowRiskCustomers": 235
}
```

---

### 8. `getRiskDistribution`
**Purpose:** Categorize transactions by risk level  
**Schema Pattern:** `(Transaction)` with risk_score categorization

**Key Features:**
- Three risk categories: High (>0.7), Medium (0.4-0.7), Low (<0.4)
- Calculates count and total amount per category
- Computes average amount and percentage
- Returns ordered by count (descending)

**Response Fields:**
```json
{
  "riskLevel": "High|Medium|Low",
  "transactionCount": 42,
  "totalAmount": 625000.00,
  "avgAmount": 14880.95,
  "percentage": 0.27
}
```

---

### 9. `getHighRiskTransactions`
**Purpose:** Find high-risk transactions with geographic data  
**Schema Pattern:** `(Transaction)-[:OCCURRED_AT]->(Location)`

**Key Features:**
- Filters by risk_score > 0.6 or flagged status
- Includes location data (city, country, coordinates)
- Identifies high-risk geographic regions
- Helpful for geo-fraud detection

**Response Fields:**
```json
{
  "transactionId": "TXN001",
  "amount": 45000,
  "currency": "USD",
  "riskScore": 0.82,
  "flagged": true,
  "status": "Completed|Pending|Failed",
  "timestamp": "2026-04-08T10:30:00Z",
  "city": "Lagos",
  "country": "Nigeria",
  "isHighRiskLocation": true,
  "latitude": 6.52,
  "longitude": 3.36
}
```

---

### 10. `getAccountRiskAssessment`
**Purpose:** Deep-dive risk analysis for a specific account  
**Schema Pattern:** `(Customer)-[:OWNS_ACCOUNT]->(Account)-[:SENT_TRANSACTION]->(Transaction)`

**Key Features:**
- Links customer profile to account transactions
- Calculates flagged vs normal transaction totals
- Shows transaction counts and timing
- Returns comprehensive risk profile

**Response Fields:**
```json
{
  "accountId": "ACC001",
  "accountType": "Checking",
  "status": "Active|Flagged|Suspended",
  "riskLevel": "Low|Medium|High",
  "balance": 25000.00,
  "customerId": "CUST001",
  "customerName": "John Smith",
  "customerRiskScore": 0.45,
  "customerEmail": "john@email.com",
  "transactionCount": 156,
  "flaggedTransactions": 8,
  "normalTransactionTotal": 850000.00,
  "flaggedTransactionTotal": 125000.00,
  "lastTransactionTime": "2026-04-08T14:30:00Z"
}
```

---

## Schema Relationships Used

| Relationship | Query | Direction |
|---|---|---|
| `OWNS_ACCOUNT` | getFraudNetwork, getAccountRiskAssessment, adminSummary | Customer → Account |
| `SENT_TRANSACTION` | findSuspiciousAccounts, findMoneyLaunderingRings, getFraudNetwork, getAccountRiskAssessment | Account → Transaction |
| `RECEIVED_TRANSACTION` | findMoneyLaunderingRings, getFraudNetwork | Account ← Transaction |
| `USES_DEVICE` | findSharedDeviceAccounts | Customer ↔ Device |
| `OCCURRED_AT` | getHighRiskTransactions | Transaction → Location |

---

## Database Performance Notes

### Recommended Indexes
```cypher
CREATE CONSTRAINT unique_customer_id ON (c:Customer) ASSERT c.customer_id IS UNIQUE;
CREATE CONSTRAINT unique_account_id ON (a:Account) ASSERT a.account_id IS UNIQUE;
CREATE CONSTRAINT unique_transaction_id ON (t:Transaction) ASSERT t.transaction_id IS UNIQUE;
CREATE CONSTRAINT unique_device_id ON (d:Device) ASSERT d.device_id IS UNIQUE;
CREATE CONSTRAINT unique_location_id ON (l:Location) ASSERT l.location_id IS UNIQUE;

CREATE INDEX ON :Transaction(is_flagged);
CREATE INDEX ON :Transaction(risk_score);
CREATE INDEX ON :Transaction(timestamp);
CREATE INDEX ON :Account(status);
CREATE INDEX ON :Account(risk_level);
CREATE INDEX ON :Customer(risk_score);
CREATE INDEX ON :Device(is_flagged);
CREATE INDEX ON :Location(is_high_risk);
```

### Query Performance Tips
1. **Limit results** - All queries include LIMIT clause for optimal performance
2. **Filter early** - Use WHERE clauses before MATCH when possible
3. **Use indexes** - risk_score and timestamp frequently queried
4. **Aggregation** - Dashboard stats calculated server-side, not client-side

---

## Integration with Backend

All queries are exported from `queries/fraudDetection.js` and integrated with controllers:

- **dashboardController** - Uses: `getDashboardStats`, `getRiskDistribution`, `getTransactionTrend`
- **networkController** - Uses: `getFraudNetwork`, `findSharedDeviceAccounts`
- **reportController** - Uses: `adminSummary`, `getAccountRiskAssessment`
- **transactionController** - Uses: `findSuspiciousAccounts`, `getHighRiskTransactions`

---

## Deployment Checklist

- [x] Queries match schema_design.md
- [x] All relationships properly defined
- [x] Property names match node definitions
- [x] Performance optimized with LIMIT clauses
- [x] Error handling in place
- [x] .env credentials loaded correctly
- [x] Database specified (7ade6b99)
- [x] Connection pooling configured
