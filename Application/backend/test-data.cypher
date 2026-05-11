// Test Data Creation Script for Neo4j
// Run this in Neo4j Browser or through the driver

// Create Accounts
CREATE (acc1:Account {
  accountId: 'ACC-001',
  accountName: 'John Doe',
  email: 'john@example.com',
  riskLevel: 'Low',
  createdAt: timestamp()
})

CREATE (acc2:Account {
  accountId: 'ACC-002',
  accountName: 'Jane Smith',
  email: 'jane@example.com',
  riskLevel: 'Low',
  createdAt: timestamp()
})

CREATE (acc3:Account {
  accountId: 'ACC-003',
  accountName: 'Bob Wilson',
  email: 'bob@example.com',
  riskLevel: 'Medium',
  createdAt: timestamp()
})

CREATE (acc4:Account {
  accountId: 'ACC-004',
  accountName: 'Alice Brown',
  email: 'alice@example.com',
  riskLevel: 'High',
  createdAt: timestamp()
})

CREATE (acc5:Account {
  accountId: 'ACC-005',
  accountName: 'Charlie Davis',
  email: 'charlie@example.com',
  riskLevel: 'Low',
  createdAt: timestamp()
})

// Create Merchants
CREATE (mer1:Merchant {
  merchantId: 'MER-001',
  merchantName: 'Amazon Store',
  category: 'E-commerce',
  riskLevel: 'Low'
})

CREATE (mer2:Merchant {
  merchantId: 'MER-002',
  merchantName: 'Quick Cash',
  category: 'Money Transfer',
  riskLevel: 'High'
})

CREATE (mer3:Merchant {
  merchantId: 'MER-003',
  merchantName: 'Crypto Exchange',
  category: 'Cryptocurrency',
  riskLevel: 'High'
})

// Create Transactions
CREATE (txn1:Transaction {
  transactionId: 'TXN-001',
  amount: 150.50,
  timestamp: datetime('2026-05-08T10:30:00Z'),
  type: 'purchase',
  status: 'completed',
  riskLevel: 'Low'
})

CREATE (txn2:Transaction {
  transactionId: 'TXN-002',
  amount: 5000.00,
  timestamp: datetime('2026-05-08T11:15:00Z'),
  type: 'transfer',
  status: 'completed',
  riskLevel: 'High'
})

CREATE (txn3:Transaction {
  transactionId: 'TXN-003',
  amount: 250.75,
  timestamp: datetime('2026-05-08T14:45:00Z'),
  type: 'purchase',
  status: 'completed',
  riskLevel: 'Low'
})

CREATE (txn4:Transaction {
  transactionId: 'TXN-004',
  amount: 12000.00,
  timestamp: datetime('2026-05-08T16:20:00Z'),
  type: 'transfer',
  status: 'flagged',
  riskLevel: 'High'
})

CREATE (txn5:Transaction {
  transactionId: 'TXN-005',
  amount: 89.99,
  timestamp: datetime('2026-05-09T09:00:00Z'),
  type: 'purchase',
  status: 'completed',
  riskLevel: 'Low'
})

CREATE (txn6:Transaction {
  transactionId: 'TXN-006',
  amount: 3500.00,
  timestamp: datetime('2026-05-09T10:30:00Z'),
  type: 'transfer',
  status: 'flagged',
  riskLevel: 'High'
})

// Create Devices
CREATE (dev1:Device {
  deviceId: 'DEV-001',
  deviceType: 'Mobile',
  deviceName: 'iPhone 12',
  location: 'New York'
})

CREATE (dev2:Device {
  deviceId: 'DEV-002',
  deviceType: 'Desktop',
  deviceName: 'Work Laptop',
  location: 'New York'
})

CREATE (dev3:Device {
  deviceId: 'DEV-003',
  deviceType: 'Mobile',
  deviceName: 'Android Phone',
  location: 'London'
})

// Create Relationships
MATCH (acc1:Account {accountId: 'ACC-001'}), (acc2:Account {accountId: 'ACC-002'})
CREATE (acc1)-[:KNOWS {since: datetime('2026-01-01T00:00:00Z')}]->(acc2)

MATCH (acc1:Account {accountId: 'ACC-001'}), (txn1:Transaction {transactionId: 'TXN-001'})
CREATE (acc1)-[:INITIATES {timestamp: datetime('2026-05-08T10:30:00Z')}]->(txn1)

MATCH (txn1:Transaction {transactionId: 'TXN-001'}), (mer1:Merchant {merchantId: 'MER-001'})
CREATE (txn1)-[:SENT_TO]->(mer1)

MATCH (acc2:Account {accountId: 'ACC-002'}), (txn2:Transaction {transactionId: 'TXN-002'})
CREATE (acc2)-[:INITIATES]->(txn2)

MATCH (txn2:Transaction {transactionId: 'TXN-002'}), (acc3:Account {accountId: 'ACC-003'})
CREATE (txn2)-[:SENT_TO]->(acc3)

MATCH (acc3:Account {accountId: 'ACC-003'}), (txn4:Transaction {transactionId: 'TXN-004'})
CREATE (acc3)-[:INITIATES]->(txn4)

MATCH (txn4:Transaction {transactionId: 'TXN-004'}), (mer2:Merchant {merchantId: 'MER-002'})
CREATE (txn4)-[:SENT_TO]->(mer2)

MATCH (acc4:Account {accountId: 'ACC-004'}), (txn6:Transaction {transactionId: 'TXN-006'})
CREATE (acc4)-[:INITIATES]->(txn6)

MATCH (txn6:Transaction {transactionId: 'TXN-006'}), (mer3:Merchant {merchantId: 'MER-003'})
CREATE (txn6)-[:SENT_TO]->(mer3)

MATCH (acc1:Account {accountId: 'ACC-001'}), (dev1:Device {deviceId: 'DEV-001'})
CREATE (acc1)-[:USES]->(dev1)

MATCH (acc2:Account {accountId: 'ACC-002'}), (dev2:Device {deviceId: 'DEV-002'})
CREATE (acc2)-[:USES]->(dev2)

MATCH (acc3:Account {accountId: 'ACC-003'}), (dev1:Device {deviceId: 'DEV-001'})
CREATE (acc3)-[:USES]->(dev1)

MATCH (acc4:Account {accountId: 'ACC-004'}), (dev3:Device {deviceId: 'DEV-003'})
CREATE (acc4)-[:USES]->(dev3)
