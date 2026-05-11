const neo4j = require('neo4j-driver');
require('dotenv').config();

const uri = process.env.NEO4J_URI;
const username = process.env.NEO4J_USERNAME;
const password = process.env.NEO4J_PASSWORD;
const database = process.env.NEO4J_DATABASE;

const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));

const testDataQueries = [
  // Clear existing data (optional)
  'MATCH (n) DETACH DELETE n',

  // Create Accounts with correct schema
  `CREATE (acc1:Account {
    account_id: 'ACC-001',
    customer_name: 'John Doe',
    email: 'john@example.com',
    risk_level: 'Low',
    status: 'active',
    created_at: datetime('2026-01-15T00:00:00Z')
  })`,
  
  `CREATE (acc2:Account {
    account_id: 'ACC-002',
    customer_name: 'Jane Smith',
    email: 'jane@example.com',
    risk_level: 'Low',
    status: 'active',
    created_at: datetime('2026-02-01T00:00:00Z')
  })`,
  
  `CREATE (acc3:Account {
    account_id: 'ACC-003',
    customer_name: 'Bob Wilson',
    email: 'bob@example.com',
    risk_level: 'Medium',
    status: 'active',
    created_at: datetime('2026-01-20T00:00:00Z')
  })`,
  
  `CREATE (acc4:Account {
    account_id: 'ACC-004',
    customer_name: 'Alice Brown',
    email: 'alice@example.com',
    risk_level: 'High',
    status: 'suspended',
    created_at: datetime('2026-03-10T00:00:00Z')
  })`,
  
  `CREATE (acc5:Account {
    account_id: 'ACC-005',
    customer_name: 'Charlie Davis',
    email: 'charlie@example.com',
    risk_level: 'Low',
    status: 'active',
    created_at: datetime('2026-02-15T00:00:00Z')
  })`,

  // Create Transactions with correct schema
  `CREATE (txn1:Transaction {
    transaction_id: 'TXN-001',
    amount: 150.50,
    timestamp: datetime('2026-05-08T10:30:00Z'),
    type: 'purchase',
    status: 'completed',
    risk_score: 0.3,
    is_flagged: false
  })`,

  `CREATE (txn2:Transaction {
    transaction_id: 'TXN-002',
    amount: 5000.00,
    timestamp: datetime('2026-05-08T11:15:00Z'),
    type: 'transfer',
    status: 'completed',
    risk_score: 0.75,
    is_flagged: true
  })`,

  `CREATE (txn3:Transaction {
    transaction_id: 'TXN-003',
    amount: 250.75,
    timestamp: datetime('2026-05-08T14:45:00Z'),
    type: 'purchase',
    status: 'completed',
    risk_score: 0.2,
    is_flagged: false
  })`,

  `CREATE (txn4:Transaction {
    transaction_id: 'TXN-004',
    amount: 12000.00,
    timestamp: datetime('2026-05-08T16:20:00Z'),
    type: 'transfer',
    status: 'completed',
    risk_score: 0.85,
    is_flagged: true
  })`,

  `CREATE (txn5:Transaction {
    transaction_id: 'TXN-005',
    amount: 89.99,
    timestamp: datetime('2026-05-09T09:00:00Z'),
    type: 'purchase',
    status: 'completed',
    risk_score: 0.15,
    is_flagged: false
  })`,

  `CREATE (txn6:Transaction {
    transaction_id: 'TXN-006',
    amount: 3500.00,
    timestamp: datetime('2026-05-09T10:30:00Z'),
    type: 'transfer',
    status: 'completed',
    risk_score: 0.72,
    is_flagged: true
  })`,

  `CREATE (txn7:Transaction {
    transaction_id: 'TXN-007',
    amount: 8500.00,
    timestamp: datetime('2026-05-07T15:00:00Z'),
    type: 'transfer',
    status: 'completed',
    risk_score: 0.65,
    is_flagged: false
  })`,

  // Create relationships
  `MATCH (acc1:Account {account_id: 'ACC-001'}), (txn1:Transaction {transaction_id: 'TXN-001'})
   CREATE (acc1)-[:SENT_TRANSACTION {timestamp: datetime('2026-05-08T10:30:00Z')}]->(txn1)`,

  `MATCH (acc2:Account {account_id: 'ACC-002'}), (txn1:Transaction {transaction_id: 'TXN-001'})
   CREATE (txn1)<-[:RECEIVED_TRANSACTION]-(acc2)`,

  `MATCH (acc2:Account {account_id: 'ACC-002'}), (txn2:Transaction {transaction_id: 'TXN-002'})
   CREATE (acc2)-[:SENT_TRANSACTION]->(txn2)`,

  `MATCH (acc3:Account {account_id: 'ACC-003'}), (txn2:Transaction {transaction_id: 'TXN-002'})
   CREATE (txn2)<-[:RECEIVED_TRANSACTION]-(acc3)`,

  `MATCH (acc1:Account {account_id: 'ACC-001'}), (txn3:Transaction {transaction_id: 'TXN-003'})
   CREATE (acc1)-[:SENT_TRANSACTION]->(txn3)`,

  `MATCH (acc5:Account {account_id: 'ACC-005'}), (txn3:Transaction {transaction_id: 'TXN-003'})
   CREATE (txn3)<-[:RECEIVED_TRANSACTION]-(acc5)`,

  `MATCH (acc3:Account {account_id: 'ACC-003'}), (txn4:Transaction {transaction_id: 'TXN-004'})
   CREATE (acc3)-[:SENT_TRANSACTION]->(txn4)`,

  `MATCH (acc4:Account {account_id: 'ACC-004'}), (txn4:Transaction {transaction_id: 'TXN-004'})
   CREATE (txn4)<-[:RECEIVED_TRANSACTION]-(acc4)`,

  `MATCH (acc4:Account {account_id: 'ACC-004'}), (txn6:Transaction {transaction_id: 'TXN-006'})
   CREATE (acc4)-[:SENT_TRANSACTION]->(txn6)`,

  `MATCH (acc1:Account {account_id: 'ACC-001'}), (txn6:Transaction {transaction_id: 'TXN-006'})
   CREATE (txn6)<-[:RECEIVED_TRANSACTION]-(acc1)`,

  `MATCH (acc2:Account {account_id: 'ACC-002'}), (txn7:Transaction {transaction_id: 'TXN-007'})
   CREATE (acc2)-[:SENT_TRANSACTION]->(txn7)`,

  `MATCH (acc3:Account {account_id: 'ACC-003'}), (txn7:Transaction {transaction_id: 'TXN-007'})
   CREATE (txn7)<-[:RECEIVED_TRANSACTION]-(acc3)`
];

async function loadTestData() {
  const session = driver.session({ database });

  try {
    console.log('Loading test data...');
    for (const query of testDataQueries) {
      await session.run(query);
    }
    console.log('✅ Test data loaded successfully!');
  } catch (error) {
    console.error('❌ Error loading test data:', error);
  } finally {
    await session.close();
    await driver.close();
  }
}

loadTestData();
