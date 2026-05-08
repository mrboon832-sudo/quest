# Graph Database Schema Design - Fraud Detection & Risk Monitoring System

## 1. Overview

This document describes the Neo4j graph schema for the Fraud Detection and Risk Monitoring System. The schema models relationships between customers, accounts, transactions, devices, and locations to enable pattern-based fraud detection.

---

## 2. Entity-Relationship to Graph Mapping

### Traditional ER Model Entities:
| Entity | Primary Key | Attributes |
|--------|-------------|------------|
| Customer | customer_id | name, email, phone, date_of_birth, risk_score, created_at |
| Account | account_id | account_type, balance, status, opened_date, risk_level |
| Transaction | transaction_id | amount, currency, timestamp, status, is_flagged, risk_score |
| Device | device_id | device_type, os, ip_address, is_flagged |
| Location | location_id | city, country, latitude, longitude, is_high_risk |

### Graph Model Transformation:
In Neo4j, entities become **Nodes**, relationships become **Relationships**, and attributes become **Properties**.

---

## 3. Node Labels & Properties

### 3.1 Customer Node
```
Label: Customer
```

| Property | Data Type | Constraint | Description |
|----------|-----------|------------|-------------|
| customer_id | String | UNIQUE | Unique customer identifier |
| name | String | - | Customer full name |
| email | String | UNIQUE | Customer email address |
| phone | String | - | Customer contact number |
| date_of_birth | Date | - | Customer date of birth |
| risk_score | Float | 0.0 - 1.0 | Computed risk score |
| created_at | DateTime | - | Account creation timestamp |

**Example:**
```cypher
{
  customer_id: 'CUST001',
  name: 'John Smith',
  email: 'john.smith@email.com',
  phone: '+266-5888-1234',
  date_of_birth: date('1985-03-15'),
  risk_score: 0.2,
  created_at: datetime()
}
```

---

### 3.2 Account Node
```
Label: Account
```

| Property | Data Type | Constraint | Description |
|----------|-----------|------------|-------------|
| account_id | String | UNIQUE | Unique account identifier |
| account_type | String | - | Type (Checking, Savings, Business) |
| balance | Float | - | Current account balance |
| status | String | - | Active, Flagged, Suspended |
| opened_date | Date | - | Account opening date |
| risk_level | String | - | Low, Medium, High |

**Example:**
```cypher
{
  account_id: 'ACC001',
  account_type: 'Checking',
  balance: 15000.00,
  status: 'Active',
  opened_date: date('2020-01-15'),
  risk_level: 'Low'
}
```

---

### 3.3 Transaction Node
```
Label: Transaction
```

| Property | Data Type | Constraint | Description |
|----------|-----------|------------|-------------|
| transaction_id | String | UNIQUE | Unique transaction identifier |
| amount | Float | > 0 | Transaction amount |
| currency | String | - | Currency code (USD, EUR, etc.) |
| timestamp | DateTime | - | Transaction date and time |
| status | String | - | Completed, Pending, Failed |
| is_flagged | Boolean | - | Fraud suspicion flag |
| risk_score | Float | 0.0 - 1.0 | Computed risk score |

**Example:**
```cypher
{
  transaction_id: 'TXN001',
  amount: 2500.00,
  currency: 'USD',
  timestamp: datetime('2026-04-01T10:30:00'),
  status: 'Completed',
  is_flagged: false,
  risk_score: 0.3
}
```

---

### 3.4 Device Node
```
Label: Device
```

| Property | Data Type | Constraint | Description |
|----------|-----------|------------|-------------|
| device_id | String | UNIQUE | Unique device identifier |
| device_type | String | - | Mobile, Desktop, Tablet |
| os | String | - | Operating system |
| ip_address | String | - | IP address used |
| is_flagged | Boolean | - | Device flagged for suspicious activity |

**Example:**
```cypher
{
  device_id: 'DEV001',
  device_type: 'Mobile',
  os: 'iOS',
  ip_address: '192.168.1.100',
  is_flagged: false
}
```

---

### 3.5 Location Node
```
Label: Location
```

| Property | Data Type | Constraint | Description |
|----------|-----------|------------|-------------|
| location_id | String | UNIQUE | Unique location identifier |
| city | String | - | City name |
| country | String | - | Country name |
| latitude | Float | - | Geographic latitude |
| longitude | Float | - | Geographic longitude |
| is_high_risk | Boolean | - | High-risk location flag |

**Example:**
```cypher
{
  location_id: 'LOC001',
  city: 'Maseru',
  country: 'Lesotho',
  latitude: -29.31,
  longitude: 27.48,
  is_high_risk: false
}
```

---

## 4. Relationship Types & Properties

### 4.1 OWNS_ACCOUNT
```
Pattern: (Customer)-[:OWNS_ACCOUNT]->(Account)
```

| Property | Data Type | Description |
|----------|-----------|-------------|
| since | Date | Date when customer started owning account |

**Purpose:** Links customers to their bank accounts. Enables detection of customers with multiple accounts.

---

### 4.2 SENT_TRANSACTION
```
Pattern: (Account)-[:SENT_TRANSACTION]->(Transaction)
```

**Properties:** None

**Purpose:** Represents money flowing out from an account. Used to track transaction patterns and identify unusual spending.

---

### 4.3 RECEIVED_TRANSACTION
```
Pattern: (Account)-[:RECEIVED_TRANSACTION]->(Transaction)
```

**Properties:** None

**Purpose:** Represents money flowing into an account. Useful for detecting money laundering patterns.

---

### 4.4 OCCURRED_AT
```
Pattern: (Transaction)-[:OCCURRED_AT]->(Location)
```

**Properties:** None

**Purpose:** Links transactions to geographic locations. Enables detection of transactions from high-risk areas.

---

### 4.5 USES_DEVICE
```
Pattern: (Customer)-[:USES_DEVICE]->(Device)
```

| Property | Data Type | Description |
|----------|-----------|-------------|
| last_used | DateTime | Last time device was used by customer |

**Purpose:** Links customers to devices they use. Critical for detecting shared devices (fraud indicator).

---

### 4.6 USED_AT
```
Pattern: (Device)-[:USED_AT]->(Location)
```

**Properties:** None

**Purpose:** Links devices to locations. Helps identify suspicious device-location combinations.

---

## 5. Graph Schema Diagram

```
┌─────────────┐     OWNS_ACCOUNT      ┌─────────────┐
│  Customer   │◄──────────────────────│   Account   │
│             │        (since)         │             │
│ customer_id │                        │ account_id  │
│ name        │                        │ balance     │
│ email       │                        │ status      │
│ risk_score  │                        └──────┬──────┘
└──────┬──────┘                               │
       │                                      │
       │ USES_DEVICE                   SENT_TRANSACTION │
       │   (last_used)               RECEIVED_TRANSACTION
       ▼                                      ▼
┌─────────────┐                        ┌─────────────┐
│   Device    │                        │ Transaction │
│             │                        │             │
│ device_id   │                        │ trans_id    │
│ ip_address  │                        │ amount      │
│ is_flagged  │                        │ risk_score  │
└──────┬──────┘                        └──────┬──────┘
       │                                      │
       │ USED_AT                              │ OCCURRED_AT
       ▼                                      ▼
┌─────────────┐                        ┌─────────────┐
│  Location   │◄───────────────────────│  Location   │
│             │                        │             │
│ city        │                        │ city        │
│ country     │                        │ country     │
│ is_high_risk│                        │ is_high_risk│
└─────────────┘                        └─────────────┘
```

---

## 6. Schema Design Rationale

### 6.1 Why Graph Database for Fraud Detection?

1. **Relationship-Centric**: Fraud patterns are inherently relational (shared devices, linked accounts, transaction networks)
2. **Deep Traversals**: Graph databases excel at multi-hop queries (e.g., "find all customers who used the same device as a flagged customer")
3. **Real-Time Analysis**: Cypher queries can detect patterns in real-time without complex JOINs
4. **Flexible Schema**: Easy to add new node types or relationships as fraud patterns evolve

### 6.2 Design Decisions

| Decision | Rationale |
|----------|-----------|
| Transactions as nodes (not relationships) | Enables rich metadata and multiple relationship types |
| Risk scores on multiple entities | Allows multi-level risk aggregation |
| Device tracking | Shared devices are strong fraud indicators |
| Geographic locations | Enables detection of high-risk location patterns |
| Boolean flags (is_flagged, is_high_risk) | Quick filtering without computing scores |

---

## 7. Constraints & Indexes

### 7.1 Uniqueness Constraints
```cypher
CREATE CONSTRAINT customer_id_unique FOR (c:Customer) REQUIRE c.customer_id IS UNIQUE;
CREATE CONSTRAINT account_id_unique FOR (a:Account) REQUIRE a.account_id IS UNIQUE;
CREATE CONSTRAINT transaction_id_unique FOR (t:Transaction) REQUIRE t.transaction_id IS UNIQUE;
CREATE CONSTRAINT device_id_unique FOR (d:Device) REQUIRE d.device_id IS UNIQUE;
CREATE CONSTRAINT location_id_unique FOR (l:Location) REQUIRE l.location_id IS UNIQUE;
CREATE CONSTRAINT email_unique FOR (c:Customer) REQUIRE c.email IS UNIQUE;
```

### 7.2 Performance Indexes
```cypher
CREATE INDEX transaction_timestamp FOR (t:Transaction) ON (t.timestamp);
CREATE INDEX transaction_amount FOR (t:Transaction) ON (t.amount);
CREATE INDEX customer_risk_score FOR (c:Customer) ON (c.risk_score);
CREATE INDEX account_status FOR (a:Account) ON (a.status);
CREATE INDEX location_country FOR (l:Location) ON (l.country);
```

---

## 8. Fraud Pattern Detection Strategies

### 8.1 Patterns Enabled by This Schema

| Fraud Pattern | Detection Method |
|---------------|------------------|
| Shared device usage | Find multiple customers using same device |
| High-frequency transfers | Count transactions per account in time window |
| High-risk location transactions | Match transactions to flagged locations |
| Account linking | Find customers with multiple accounts |
| Circular transactions | Detect money loops between accounts |
| Unusual transaction amounts | Statistical outlier detection |
| Device-location mismatch | Compare device location vs customer location |

---

## 9. Scalability Considerations

### 9.1 Current Design Limits
- Optimized for datasets up to 1 million nodes
- Index-based lookups for O(log n) performance
- Constraints ensure data integrity

### 9.2 Future Enhancements
- Add temporal properties for time-series analysis
- Implement graph algorithms (PageRank, Community Detection)
- Partition by date for archival strategies
- Add full-text indexes for name/email search

---

## 10. Data Security & Integrity

### 10.1 Security Measures
- Password-protected database access
- Role-based access control (Neo4j Enterprise)
- Encrypted connections (bolt+s protocol)
- Audit logging for all write operations

### 10.2 Data Integrity
- Unique constraints prevent duplicate entities
- Required properties enforced at application layer
- Transaction isolation ensures consistency
- Regular backups via APOC export

---

**Document Version**: 1.0  
**Last Updated**: April 9, 2026  
**Course**: Database Systems (BIDB2210)  
**Project**: Fraud Detection & Risk Monitoring System
