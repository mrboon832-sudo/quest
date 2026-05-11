const neo4j = require('neo4j-driver');
require('dotenv').config();

const uri = process.env.NEO4J_URI;
const username = process.env.NEO4J_USERNAME;
const password = process.env.NEO4J_PASSWORD;
const database = process.env.NEO4J_DATABASE;

const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));

const testQueries = [
  // Create a new test customer for 2026
  `CREATE (c1:Customer {
    customer_id: 'CUST-TEST-2026',
    name: 'Sarah Mitchell Test',
    email: 'sarah.test@example.com',
    phone: '+1-555-0123',
    date_of_birth: date('1990-07-15'),
    risk_score: 0.45,
    created_at: datetime('2026-01-01T00:00:00Z')
  })`,

  // Create existing customer for fraud connection
  `CREATE (c2:Customer {
    customer_id: 'CUST-FRAUD-2026',
    name: 'Michael Fraud Account',
    email: 'michael.fraud@example.com',
    phone: '+1-555-9999',
    date_of_birth: date('1988-03-20'),
    risk_score: 0.85,
    created_at: datetime('2025-06-01T00:00:00Z')
  })`,

  // Create accounts for test customer
  `CREATE (a1:Account {
    account_id: 'ACC-TEST-001',
    account_type: 'Checking',
    balance: 25000.00,
    status: 'active',
    opened_date: date('2026-01-05'),
    risk_level: 'Medium',
    currency: 'USD'
  })`,

  `CREATE (a2:Account {
    account_id: 'ACC-TEST-002',
    account_type: 'Savings',
    balance: 50000.00,
    status: 'active',
    opened_date: date('2025-12-01'),
    risk_level: 'Low',
    currency: 'USD'
  })`,

  // Create account for fraud customer
  `CREATE (a3:Account {
    account_id: 'ACC-FRAUD-001',
    account_type: 'Checking',
    balance: 15000.00,
    status: 'suspended',
    opened_date: date('2025-06-15'),
    risk_level: 'High',
    currency: 'USD'
  })`,

  // Create devices used by test customer
  `CREATE (d1:Device {
    device_id: 'DEV-TEST-001',
    device_type: 'Mobile',
    os: 'iOS',
    ip_address: '192.168.1.100',
    is_flagged: false,
    created_at: datetime('2026-01-10T00:00:00Z')
  })`,

  `CREATE (d2:Device {
    device_id: 'DEV-TEST-002',
    device_type: 'Desktop',
    os: 'Windows',
    ip_address: '10.0.0.50',
    is_flagged: true,
    created_at: datetime('2026-02-01T00:00:00Z')
  })`,

  `CREATE (d3:Device {
    device_id: 'DEV-FRAUD-001',
    device_type: 'Mobile',
    os: 'Android',
    ip_address: '203.0.113.45',
    is_flagged: true,
    created_at: datetime('2025-08-20T00:00:00Z')
  })`,

  // Create high-risk transactions for fraud network
  `CREATE (t1:Transaction {
    transaction_id: 'TXN-TEST-001',
    amount: 7500.00,
    currency: 'USD',
    timestamp: datetime('2026-05-09T14:30:00Z'),
    status: 'completed',
    is_flagged: true,
    risk_score: 0.75,
    type: 'transfer'
  })`,

  `CREATE (t2:Transaction {
    transaction_id: 'TXN-TEST-002',
    amount: 12000.00,
    currency: 'USD',
    timestamp: datetime('2026-05-09T15:45:00Z'),
    status: 'completed',
    is_flagged: true,
    risk_score: 0.82,
    type: 'transfer'
  })`,

  `CREATE (t3:Transaction {
    transaction_id: 'TXN-TEST-003',
    amount: 5500.00,
    currency: 'USD',
    timestamp: datetime('2026-05-09T16:20:00Z'),
    status: 'completed',
    is_flagged: true,
    risk_score: 0.68,
    type: 'transfer'
  })`,

  `CREATE (t4:Transaction {
    transaction_id: 'TXN-TEST-004',
    amount: 9200.00,
    currency: 'USD',
    timestamp: datetime('2026-05-10T08:15:00Z'),
    status: 'completed',
    is_flagged: true,
    risk_score: 0.79,
    type: 'transfer'
  })`,

  // Create normal transaction (control)
  `CREATE (t5:Transaction {
    transaction_id: 'TXN-TEST-005',
    amount: 250.00,
    currency: 'USD',
    timestamp: datetime('2026-05-10T09:00:00Z'),
    status: 'completed',
    is_flagged: false,
    risk_score: 0.15,
    type: 'purchase'
  })`,

  // Create relationships: Customer owns accounts
  `MATCH (c1:Customer {customer_id: 'CUST-TEST-2026'}), (a1:Account {account_id: 'ACC-TEST-001'})
   CREATE (c1)-[:OWNS_ACCOUNT]->(a1)`,

  `MATCH (c1:Customer {customer_id: 'CUST-TEST-2026'}), (a2:Account {account_id: 'ACC-TEST-002'})
   CREATE (c1)-[:OWNS_ACCOUNT]->(a2)`,

  `MATCH (c2:Customer {customer_id: 'CUST-FRAUD-2026'}), (a3:Account {account_id: 'ACC-FRAUD-001'})
   CREATE (c2)-[:OWNS_ACCOUNT]->(a3)`,

  // Create relationships: Customer uses devices
  `MATCH (c1:Customer {customer_id: 'CUST-TEST-2026'}), (d1:Device {device_id: 'DEV-TEST-001'})
   CREATE (c1)-[:USES_DEVICE {last_used: datetime('2026-05-09T14:30:00Z')}]->(d1)`,

  `MATCH (c1:Customer {customer_id: 'CUST-TEST-2026'}), (d2:Device {device_id: 'DEV-TEST-002'})
   CREATE (c1)-[:USES_DEVICE {last_used: datetime('2026-05-09T15:45:00Z')}]->(d2)`,

  `MATCH (c2:Customer {customer_id: 'CUST-FRAUD-2026'}), (d3:Device {device_id: 'DEV-FRAUD-001'})
   CREATE (c2)-[:USES_DEVICE {last_used: datetime('2026-05-10T08:15:00Z')}]->(d3)`,

  // Create transaction relationships - Test user sends HIGH RISK transactions to fraud account
  `MATCH (a1:Account {account_id: 'ACC-TEST-001'}), (t1:Transaction {transaction_id: 'TXN-TEST-001'})
   CREATE (a1)-[:SENT_TRANSACTION {timestamp: datetime('2026-05-09T14:30:00Z')}]->(t1)`,

  `MATCH (a3:Account {account_id: 'ACC-FRAUD-001'}), (t1:Transaction {transaction_id: 'TXN-TEST-001'})
   CREATE (t1)<-[:RECEIVED_TRANSACTION]-(a3)`,

  `MATCH (a1:Account {account_id: 'ACC-TEST-001'}), (t2:Transaction {transaction_id: 'TXN-TEST-002'})
   CREATE (a1)-[:SENT_TRANSACTION]->(t2)`,

  `MATCH (a3:Account {account_id: 'ACC-FRAUD-001'}), (t2:Transaction {transaction_id: 'TXN-TEST-002'})
   CREATE (t2)<-[:RECEIVED_TRANSACTION]-(a3)`,

  // Circular fraud pattern: Fraud account sends back
  `MATCH (a3:Account {account_id: 'ACC-FRAUD-001'}), (t3:Transaction {transaction_id: 'TXN-TEST-003'})
   CREATE (a3)-[:SENT_TRANSACTION]->(t3)`,

  `MATCH (a2:Account {account_id: 'ACC-TEST-002'}), (t3:Transaction {transaction_id: 'TXN-TEST-003'})
   CREATE (t3)<-[:RECEIVED_TRANSACTION]-(a2)`,

  `MATCH (a3:Account {account_id: 'ACC-FRAUD-001'}), (t4:Transaction {transaction_id: 'TXN-TEST-004'})
   CREATE (a3)-[:SENT_TRANSACTION]->(t4)`,

  `MATCH (a1:Account {account_id: 'ACC-TEST-001'}), (t4:Transaction {transaction_id: 'TXN-TEST-004'})
   CREATE (t4)<-[:RECEIVED_TRANSACTION]-(a1)`,

  // Normal transaction (should not appear in fraud network)
  `MATCH (a2:Account {account_id: 'ACC-TEST-002'}), (t5:Transaction {transaction_id: 'TXN-TEST-005'})
   CREATE (a2)-[:SENT_TRANSACTION]->(t5)`,

  `MATCH (a1:Account {account_id: 'ACC-TEST-001'}), (t5:Transaction {transaction_id: 'TXN-TEST-005'})
   CREATE (t5)<-[:RECEIVED_TRANSACTION]-(a1)`
];

async function loadTestData() {
  const session = driver.session({ database });

  try {
    console.log('🚀 Starting fraud network test data creation...\n');
    
    for (const query of testQueries) {
      await session.run(query);
    }
    
    console.log('✅ Test data created successfully!\n');

    // Verify the data was created
    console.log('📊 Verifying created data...\n');

    // Check customers
    const custResult = await session.run(
      `MATCH (c:Customer) RETURN c.customer_id AS id, c.name AS name, c.risk_score AS risk`
    );
    console.log('Customers created:');
    custResult.records.forEach(r => {
      console.log(`  - ${r.get('id')}: ${r.get('name')} (Risk: ${r.get('risk')})`);
    });

    // Check accounts
    const accResult = await session.run(
      `MATCH (a:Account) RETURN a.account_id AS id, a.account_type AS type, a.risk_level AS risk, a.status AS status`
    );
    console.log('\nAccounts created:');
    accResult.records.forEach(r => {
      console.log(`  - ${r.get('id')}: ${r.get('type')} (${r.get('status')}, Risk: ${r.get('risk')})`);
    });

    // Check devices
    const devResult = await session.run(
      `MATCH (d:Device) RETURN d.device_id AS id, d.device_type AS type, d.ip_address AS ip, d.os AS os`
    );
    console.log('\nDevices created:');
    devResult.records.forEach(r => {
      console.log(`  - ${r.get('id')}: ${r.get('type')} (${r.get('os')}) - IP: ${r.get('ip')}`);
    });

    // Check transactions
    const txnResult = await session.run(
      `MATCH (t:Transaction) RETURN t.transaction_id AS id, t.amount AS amount, t.risk_score AS risk, t.is_flagged AS flagged`
    );
    console.log('\nTransactions created:');
    txnResult.records.forEach(r => {
      console.log(`  - ${r.get('id')}: $${r.get('amount')} (Risk: ${r.get('risk')}, Flagged: ${r.get('flagged')})`);
    });

    // Check fraud network (the actual query used by the API)
    console.log('\n🔗 FRAUD NETWORK (High-Risk Transactions Only):\n');
    const fraudResult = await session.run(`
      MATCH (c1:Customer)-[:OWNS_ACCOUNT]->(a1:Account)-[:SENT_TRANSACTION]->(t:Transaction)<-[:RECEIVED_TRANSACTION]-(a2:Account)<-[:OWNS_ACCOUNT]-(c2:Customer)
      WHERE (t.risk_score > 0.6 OR t.is_flagged = true)
        AND c1.customer_id <> c2.customer_id
      RETURN {
        sourceCustomerId: c1.customer_id,
        sourceCustomerName: c1.name,
        sourceRiskScore: c1.risk_score,
        sourceAccountId: a1.account_id,
        transactionId: t.transaction_id,
        transactionAmount: t.amount,
        transactionRiskScore: t.risk_score,
        targetAccountId: a2.account_id,
        targetCustomerId: c2.customer_id,
        targetCustomerName: c2.name,
        targetRiskScore: c2.risk_score
      } AS fraudLink
      ORDER BY t.risk_score DESC
    `);

    fraudResult.records.forEach(r => {
      const link = r.get('fraudLink');
      console.log(`Transaction: ${link.transactionId}`);
      console.log(`  Amount: $${link.transactionAmount}`);
      console.log(`  From: ${link.sourceCustomerName} (${link.sourceCustomerId}) - Account: ${link.sourceAccountId}`);
      console.log(`  To:   ${link.targetCustomerName} (${link.targetCustomerId}) - Account: ${link.targetAccountId}`);
      console.log(`  Risk Score: ${link.transactionRiskScore} (Source Risk: ${link.sourceRiskScore}, Target Risk: ${link.targetRiskScore})`);
      console.log('');
    });

    // Check device usage for test customer
    console.log('📱 DEVICE USAGE (Test Customer):\n');
    const deviceResult = await session.run(`
      MATCH (c:Customer {customer_id: 'CUST-TEST-2026'})-[r:USES_DEVICE]->(d:Device)
      RETURN c.name AS customer, d.device_id AS deviceId, d.device_type AS type, d.os AS os, d.ip_address AS ip, d.is_flagged AS flagged, r.last_used AS lastUsed
    `);
    
    deviceResult.records.forEach(r => {
      console.log(`${r.get('customer')}`);
      console.log(`  Device: ${r.get('deviceId')} (${r.get('type')} - ${r.get('os')})`);
      console.log(`  IP Address: ${r.get('ip')}`);
      console.log(`  Flagged: ${r.get('flagged')}`);
      console.log(`  Last Used: ${r.get('lastUsed')}`);
      console.log('');
    });

    console.log('✅ Verification complete!');
    console.log('\n📌 Summary:');
    console.log(`  - New test customer created: CUST-TEST-2026`);
    console.log(`  - Fraud pattern customer: CUST-FRAUD-2026`);
    console.log(`  - Test customer accounts: ACC-TEST-001, ACC-TEST-002`);
    console.log(`  - Test customer devices: DEV-TEST-001 (Mobile, iOS), DEV-TEST-002 (Desktop, Windows)`);
    console.log(`  - High-risk transactions: 4 flagged transactions ($7,500-$12,000)`);
    console.log(`  - Normal transaction: 1 normal transaction ($250, should not appear in fraud network)`);
    console.log('\n🧪 Ready to test fraud network visualization!');

  } catch (error) {
    console.error('❌ Error loading test data:', error);
    console.error(error.stack);
  } finally {
    await session.close();
    await driver.close();
  }
}

loadTestData();
