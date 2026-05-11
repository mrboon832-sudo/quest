const neo4j = require('neo4j-driver');
require('dotenv').config();

const uri = process.env.NEO4J_URI;
const username = process.env.NEO4J_USERNAME;
const password = process.env.NEO4J_PASSWORD;
const database = process.env.NEO4J_DATABASE;

const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));

async function loadComprehensiveData() {
  const session = driver.session({ database });

  try {
    console.log('🗑️  Clearing existing data...');
    await session.run('MATCH (n) DETACH DELETE n');

    // Create Customers
    console.log('👤 Creating customers...');
    await session.run(`
      CREATE (c1:Customer {
        customer_id: 'CUST-001',
        customer_name: 'John Doe',
        email: 'john@example.com',
        phone: '+1-555-0101',
        created_at: datetime('2026-01-15T00:00:00Z')
      }),
      (c2:Customer {
        customer_id: 'CUST-002',
        customer_name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+1-555-0102',
        created_at: datetime('2026-02-01T00:00:00Z')
      }),
      (c3:Customer {
        customer_id: 'CUST-003',
        customer_name: 'Bob Wilson',
        email: 'bob@example.com',
        phone: '+1-555-0103',
        created_at: datetime('2026-01-20T00:00:00Z')
      }),
      (c4:Customer {
        customer_id: 'CUST-004',
        customer_name: 'Alice Brown',
        email: 'alice@example.com',
        phone: '+1-555-0104',
        created_at: datetime('2026-03-10T00:00:00Z')
      }),
      (c5:Customer {
        customer_id: 'CUST-005',
        customer_name: 'Charlie Davis',
        email: 'charlie@example.com',
        phone: '+1-555-0105',
        created_at: datetime('2026-02-15T00:00:00Z')
      })
    `);

    // Create Accounts
    console.log('💳 Creating accounts...');
    await session.run(`
      CREATE (acc1:Account {
        account_id: 'ACC-001',
        customer_name: 'John Doe',
        email: 'john@example.com',
        risk_level: 'Low',
        status: 'active',
        balance: 50000.00,
        created_at: datetime('2026-01-15T00:00:00Z'),
        account_type: 'checking'
      }),
      (acc2:Account {
        account_id: 'ACC-002',
        customer_name: 'Jane Smith',
        email: 'jane@example.com',
        risk_level: 'Low',
        status: 'active',
        balance: 75000.00,
        created_at: datetime('2026-02-01T00:00:00Z'),
        account_type: 'savings'
      }),
      (acc3:Account {
        account_id: 'ACC-003',
        customer_name: 'Bob Wilson',
        email: 'bob@example.com',
        risk_level: 'Medium',
        status: 'active',
        balance: 25000.00,
        created_at: datetime('2026-01-20T00:00:00Z'),
        account_type: 'checking'
      }),
      (acc4:Account {
        account_id: 'ACC-004',
        customer_name: 'Alice Brown',
        email: 'alice@example.com',
        risk_level: 'High',
        status: 'suspended',
        balance: 5000.00,
        created_at: datetime('2026-03-10T00:00:00Z'),
        account_type: 'checking'
      }),
      (acc5:Account {
        account_id: 'ACC-005',
        customer_name: 'Charlie Davis',
        email: 'charlie@example.com',
        risk_level: 'Low',
        status: 'active',
        balance: 100000.00,
        created_at: datetime('2026-02-15T00:00:00Z'),
        account_type: 'business'
      })
    `);

    // Link customers to accounts
    console.log('🔗 Linking customers to accounts...');
    await session.run(`
      MATCH (c1:Customer {customer_id: 'CUST-001'}), (acc1:Account {account_id: 'ACC-001'})
      CREATE (c1)-[:OWNS_ACCOUNT]->(acc1)
    `);
    await session.run(`
      MATCH (c2:Customer {customer_id: 'CUST-002'}), (acc2:Account {account_id: 'ACC-002'})
      CREATE (c2)-[:OWNS_ACCOUNT]->(acc2)
    `);
    await session.run(`
      MATCH (c3:Customer {customer_id: 'CUST-003'}), (acc3:Account {account_id: 'ACC-003'})
      CREATE (c3)-[:OWNS_ACCOUNT]->(acc3)
    `);
    await session.run(`
      MATCH (c4:Customer {customer_id: 'CUST-004'}), (acc4:Account {account_id: 'ACC-004'})
      CREATE (c4)-[:OWNS_ACCOUNT]->(acc4)
    `);
    await session.run(`
      MATCH (c5:Customer {customer_id: 'CUST-005'}), (acc5:Account {account_id: 'ACC-005'})
      CREATE (c5)-[:OWNS_ACCOUNT]->(acc5)
    `);

    // Create Devices
    console.log('📱 Creating devices...');
    await session.run(`
      CREATE (d1:Device {
        device_id: 'DEV-001',
        device_type: 'mobile',
        device_name: 'iPhone 14',
        ip_address: '192.168.1.100',
        created_at: datetime('2026-01-15T00:00:00Z')
      }),
      (d2:Device {
        device_id: 'DEV-002',
        device_type: 'desktop',
        device_name: 'Dell XPS',
        ip_address: '192.168.1.101',
        created_at: datetime('2026-02-01T00:00:00Z')
      }),
      (d3:Device {
        device_id: 'DEV-003',
        device_type: 'mobile',
        device_name: 'Samsung Galaxy',
        ip_address: '192.168.1.102',
        created_at: datetime('2026-01-20T00:00:00Z')
      }),
      (d4:Device {
        device_id: 'DEV-004',
        device_type: 'tablet',
        device_name: 'iPad Pro',
        ip_address: '192.168.1.103',
        created_at: datetime('2026-03-10T00:00:00Z')
      }),
      (d5:Device {
        device_id: 'DEV-005',
        device_type: 'desktop',
        device_name: 'MacBook Pro',
        ip_address: '192.168.1.104',
        created_at: datetime('2026-02-15T00:00:00Z')
      })
    `);

    // Link customers to devices
    console.log('🔗 Linking customers to devices...');
    await session.run(`
      MATCH (c1:Customer {customer_id: 'CUST-001'}), (d1:Device {device_id: 'DEV-001'})
      CREATE (c1)-[:USES {last_accessed: datetime('2026-05-09T10:00:00Z')}]->(d1)
    `);
    await session.run(`
      MATCH (c2:Customer {customer_id: 'CUST-002'}), (d2:Device {device_id: 'DEV-002'})
      CREATE (c2)-[:USES {last_accessed: datetime('2026-05-09T11:00:00Z')}]->(d2)
    `);
    await session.run(`
      MATCH (c3:Customer {customer_id: 'CUST-003'}), (d3:Device {device_id: 'DEV-003'})
      CREATE (c3)-[:USES {last_accessed: datetime('2026-05-09T12:00:00Z')}]->(d3)
    `);
    await session.run(`
      MATCH (c4:Customer {customer_id: 'CUST-004'}), (d4:Device {device_id: 'DEV-004'})
      CREATE (c4)-[:USES {last_accessed: datetime('2026-05-09T08:00:00Z')}]->(d4)
    `);
    await session.run(`
      MATCH (c5:Customer {customer_id: 'CUST-005'}), (d5:Device {device_id: 'DEV-005'})
      CREATE (c5)-[:USES {last_accessed: datetime('2026-05-09T13:00:00Z')}]->(d5)
    `);

    // Create Locations
    console.log('📍 Creating locations...');
    await session.run(`
      CREATE (l1:Location {
        location_id: 'LOC-001',
        city: 'New York',
        country: 'USA',
        latitude: 40.7128,
        longitude: -74.0060,
        created_at: datetime('2026-01-15T00:00:00Z')
      }),
      (l2:Location {
        location_id: 'LOC-002',
        city: 'Los Angeles',
        country: 'USA',
        latitude: 34.0522,
        longitude: -118.2437,
        created_at: datetime('2026-02-01T00:00:00Z')
      }),
      (l3:Location {
        location_id: 'LOC-003',
        city: 'Chicago',
        country: 'USA',
        latitude: 41.8781,
        longitude: -87.6298,
        created_at: datetime('2026-01-20T00:00:00Z')
      }),
      (l4:Location {
        location_id: 'LOC-004',
        city: 'Houston',
        country: 'USA',
        latitude: 29.7604,
        longitude: -95.3698,
        created_at: datetime('2026-03-10T00:00:00Z')
      }),
      (l5:Location {
        location_id: 'LOC-005',
        city: 'Phoenix',
        country: 'USA',
        latitude: 33.4484,
        longitude: -112.0742,
        created_at: datetime('2026-02-15T00:00:00Z')
      })
    `);

    // Link customers to locations
    console.log('🔗 Linking customers to locations...');
    await session.run(`
      MATCH (c1:Customer {customer_id: 'CUST-001'}), (l1:Location {location_id: 'LOC-001'})
      CREATE (c1)-[:LOCATED_IN]->(l1)
    `);
    await session.run(`
      MATCH (c2:Customer {customer_id: 'CUST-002'}), (l2:Location {location_id: 'LOC-002'})
      CREATE (c2)-[:LOCATED_IN]->(l2)
    `);
    await session.run(`
      MATCH (c3:Customer {customer_id: 'CUST-003'}), (l3:Location {location_id: 'LOC-003'})
      CREATE (c3)-[:LOCATED_IN]->(l3)
    `);
    await session.run(`
      MATCH (c4:Customer {customer_id: 'CUST-004'}), (l4:Location {location_id: 'LOC-004'})
      CREATE (c4)-[:LOCATED_IN]->(l4)
    `);
    await session.run(`
      MATCH (c5:Customer {customer_id: 'CUST-005'}), (l5:Location {location_id: 'LOC-005'})
      CREATE (c5)-[:LOCATED_IN]->(l5)
    `);

    // Create Transactions with schema-aligned properties
    console.log('💰 Creating transactions...');
    await session.run(`
      CREATE (txn1:Transaction {
        transaction_id: 'TXN-001',
        amount: 150.50,
        currency: 'USD',
        timestamp: datetime('2026-05-08T10:30:00Z'),
        status: 'Completed',
        risk_score: 0.3,
        is_flagged: false
      }),
      (txn2:Transaction {
        transaction_id: 'TXN-002',
        amount: 5000.00,
        currency: 'USD',
        timestamp: datetime('2026-05-08T11:15:00Z'),
        status: 'Completed',
        risk_score: 0.75,
        is_flagged: true
      }),
      (txn3:Transaction {
        transaction_id: 'TXN-003',
        amount: 250.75,
        currency: 'USD',
        timestamp: datetime('2026-05-08T14:45:00Z'),
        status: 'Completed',
        risk_score: 0.2,
        is_flagged: false
      }),
      (txn4:Transaction {
        transaction_id: 'TXN-004',
        amount: 12000.00,
        currency: 'USD',
        timestamp: datetime('2026-05-08T16:20:00Z'),
        status: 'Completed',
        risk_score: 0.85,
        is_flagged: true
      }),
      (txn5:Transaction {
        transaction_id: 'TXN-005',
        amount: 89.99,
        currency: 'USD',
        timestamp: datetime('2026-05-09T09:00:00Z'),
        status: 'Completed',
        risk_score: 0.15,
        is_flagged: false
      }),
      (txn6:Transaction {
        transaction_id: 'TXN-006',
        amount: 3500.00,
        currency: 'USD',
        timestamp: datetime('2026-05-09T10:30:00Z'),
        status: 'Completed',
        risk_score: 0.72,
        is_flagged: true
      }),
      (txn7:Transaction {
        transaction_id: 'TXN-007',
        amount: 8500.00,
        currency: 'USD',
        timestamp: datetime('2026-05-07T15:00:00Z'),
        status: 'Completed',
        risk_score: 0.65,
        is_flagged: false
      }),
      (txn8:Transaction {
        transaction_id: 'TXN-008',
        amount: 2000.00,
        currency: 'USD',
        timestamp: datetime('2026-05-09T14:00:00Z'),
        status: 'Completed',
        risk_score: 0.55,
        is_flagged: false
      })
    `);

    // Create transaction relationships - SENT and RECEIVED
    console.log('🔗 Creating transaction relationships...');
    await session.run(`
      MATCH (acc1:Account {account_id: 'ACC-001'}), (txn1:Transaction {transaction_id: 'TXN-001'})
      CREATE (acc1)-[:SENT_TRANSACTION {timestamp: datetime('2026-05-08T10:30:00Z')}]->(txn1)
    `);
    await session.run(`
      MATCH (acc2:Account {account_id: 'ACC-002'}), (txn1:Transaction {transaction_id: 'TXN-001'})
      CREATE (acc2)-[:RECEIVED_TRANSACTION {timestamp: datetime('2026-05-08T10:30:00Z')}]->(txn1)
    `);
    await session.run(`
      MATCH (acc2:Account {account_id: 'ACC-002'}), (txn2:Transaction {transaction_id: 'TXN-002'})
      CREATE (acc2)-[:SENT_TRANSACTION {timestamp: datetime('2026-05-08T11:15:00Z')}]->(txn2)
    `);
    await session.run(`
      MATCH (acc3:Account {account_id: 'ACC-003'}), (txn2:Transaction {transaction_id: 'TXN-002'})
      CREATE (acc3)-[:RECEIVED_TRANSACTION {timestamp: datetime('2026-05-08T11:15:00Z')}]->(txn2)
    `);
    await session.run(`
      MATCH (acc3:Account {account_id: 'ACC-003'}), (txn3:Transaction {transaction_id: 'TXN-003'})
      CREATE (acc3)-[:SENT_TRANSACTION {timestamp: datetime('2026-05-08T14:45:00Z')}]->(txn3)
    `);
    await session.run(`
      MATCH (acc5:Account {account_id: 'ACC-005'}), (txn3:Transaction {transaction_id: 'TXN-003'})
      CREATE (acc5)-[:RECEIVED_TRANSACTION {timestamp: datetime('2026-05-08T14:45:00Z')}]->(txn3)
    `);
    await session.run(`
      MATCH (acc4:Account {account_id: 'ACC-004'}), (txn4:Transaction {transaction_id: 'TXN-004'})
      CREATE (acc4)-[:SENT_TRANSACTION {timestamp: datetime('2026-05-08T16:20:00Z')}]->(txn4)
    `);
    await session.run(`
      MATCH (acc1:Account {account_id: 'ACC-001'}), (txn4:Transaction {transaction_id: 'TXN-004'})
      CREATE (acc1)-[:RECEIVED_TRANSACTION {timestamp: datetime('2026-05-08T16:20:00Z')}]->(txn4)
    `);
    await session.run(`
      MATCH (acc5:Account {account_id: 'ACC-005'}), (txn5:Transaction {transaction_id: 'TXN-005'})
      CREATE (acc5)-[:SENT_TRANSACTION {timestamp: datetime('2026-05-09T09:00:00Z')}]->(txn5)
    `);
    await session.run(`
      MATCH (acc1:Account {account_id: 'ACC-001'}), (txn5:Transaction {transaction_id: 'TXN-005'})
      CREATE (acc1)-[:RECEIVED_TRANSACTION {timestamp: datetime('2026-05-09T09:00:00Z')}]->(txn5)
    `);
    await session.run(`
      MATCH (acc1:Account {account_id: 'ACC-001'}), (txn6:Transaction {transaction_id: 'TXN-006'})
      CREATE (acc1)-[:SENT_TRANSACTION {timestamp: datetime('2026-05-09T10:30:00Z')}]->(txn6)
    `);
    await session.run(`
      MATCH (acc4:Account {account_id: 'ACC-004'}), (txn6:Transaction {transaction_id: 'TXN-006'})
      CREATE (acc4)-[:RECEIVED_TRANSACTION {timestamp: datetime('2026-05-09T10:30:00Z')}]->(txn6)
    `);
    await session.run(`
      MATCH (acc3:Account {account_id: 'ACC-003'}), (txn7:Transaction {transaction_id: 'TXN-007'})
      CREATE (acc3)-[:SENT_TRANSACTION {timestamp: datetime('2026-05-07T15:00:00Z')}]->(txn7)
    `);
    await session.run(`
      MATCH (acc2:Account {account_id: 'ACC-002'}), (txn7:Transaction {transaction_id: 'TXN-007'})
      CREATE (acc2)-[:RECEIVED_TRANSACTION {timestamp: datetime('2026-05-07T15:00:00Z')}]->(txn7)
    `);
    await session.run(`
      MATCH (acc5:Account {account_id: 'ACC-005'}), (txn8:Transaction {transaction_id: 'TXN-008'})
      CREATE (acc5)-[:SENT_TRANSACTION {timestamp: datetime('2026-05-09T14:00:00Z')}]->(txn8)
    `);
    await session.run(`
      MATCH (acc1:Account {account_id: 'ACC-001'}), (txn8:Transaction {transaction_id: 'TXN-008'})
      CREATE (acc1)-[:RECEIVED_TRANSACTION {timestamp: datetime('2026-05-09T14:00:00Z')}]->(txn8)
    `);

    // Create Reports
    console.log('📊 Creating reports...');
    await session.run(`
      CREATE (r1:Report {
        report_id: 'REP-001',
        title: 'Weekly Fraud Detection Report',
        report_type: 'weekly',
        generated_at: datetime('2026-05-07T00:00:00Z'),
        findings_count: 3,
        status: 'completed',
        content: 'Detected 3 suspicious transactions'
      }),
      (r2:Report {
        report_id: 'REP-002',
        title: 'Custom Fraud Analysis',
        report_type: 'custom',
        generated_at: datetime('2026-05-06T00:00:00Z'),
        findings_count: 2,
        status: 'completed',
        content: 'Money laundering pattern detected'
      }),
      (r3:Report {
        report_id: 'REP-003',
        title: 'Monthly Risk Summary',
        report_type: 'monthly',
        generated_at: datetime('2026-04-30T00:00:00Z'),
        findings_count: 5,
        status: 'completed',
        content: 'High-risk account identified'
      })
    `);

    console.log('✅ All data loaded successfully!');
    
    // Verify data
    console.log('\n📋 Verifying data...');
    const accountCount = await session.run('MATCH (a:Account) RETURN COUNT(a) AS count');
    const customerCount = await session.run('MATCH (c:Customer) RETURN COUNT(c) AS count');
    const deviceCount = await session.run('MATCH (d:Device) RETURN COUNT(d) AS count');
    const locationCount = await session.run('MATCH (l:Location) RETURN COUNT(l) AS count');
    const transactionCount = await session.run('MATCH (t:Transaction) RETURN COUNT(t) AS count');
    const reportCount = await session.run('MATCH (r:Report) RETURN COUNT(r) AS count');

    console.log(`\n📊 Database Statistics:`);
    console.log(`   Customers: ${customerCount.records[0].get('count').toNumber()}`);
    console.log(`   Accounts: ${accountCount.records[0].get('count').toNumber()}`);
    console.log(`   Devices: ${deviceCount.records[0].get('count').toNumber()}`);
    console.log(`   Locations: ${locationCount.records[0].get('count').toNumber()}`);
    console.log(`   Transactions: ${transactionCount.records[0].get('count').toNumber()}`);
    console.log(`   Reports: ${reportCount.records[0].get('count').toNumber()}`);

  } catch (error) {
    console.error('❌ Error loading data:', error.message);
  } finally {
    await session.close();
    await driver.close();
  }
}

loadComprehensiveData();
