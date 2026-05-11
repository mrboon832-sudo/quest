const neo4j = require('neo4j-driver');
require('dotenv').config();

const uri = process.env.NEO4J_URI;
const username = process.env.NEO4J_USERNAME;
const password = process.env.NEO4J_PASSWORD;
const database = process.env.NEO4J_DATABASE;

const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));

async function cleanupTestData() {
  const session = driver.session({ database });

  try {
    console.log('🧹 Cleaning up old test data...\n');
    
    // Delete test data in reverse order (relationships first)
    const cleanupQueries = [
      `MATCH (c:Customer {customer_id: 'CUST-TEST-2026'}) DETACH DELETE c`,
      `MATCH (c:Customer {customer_id: 'CUST-FRAUD-2026'}) DETACH DELETE c`,
      `MATCH (a:Account {account_id: 'ACC-TEST-001'}) DETACH DELETE a`,
      `MATCH (a:Account {account_id: 'ACC-TEST-002'}) DETACH DELETE a`,
      `MATCH (a:Account {account_id: 'ACC-FRAUD-001'}) DETACH DELETE a`,
      `MATCH (d:Device {device_id: 'DEV-TEST-001'}) DETACH DELETE d`,
      `MATCH (d:Device {device_id: 'DEV-TEST-002'}) DETACH DELETE d`,
      `MATCH (d:Device {device_id: 'DEV-FRAUD-001'}) DETACH DELETE d`,
      `MATCH (t:Transaction {transaction_id: 'TXN-TEST-001'}) DETACH DELETE t`,
      `MATCH (t:Transaction {transaction_id: 'TXN-TEST-002'}) DETACH DELETE t`,
      `MATCH (t:Transaction {transaction_id: 'TXN-TEST-003'}) DETACH DELETE t`,
      `MATCH (t:Transaction {transaction_id: 'TXN-TEST-004'}) DETACH DELETE t`,
      `MATCH (t:Transaction {transaction_id: 'TXN-TEST-005'}) DETACH DELETE t`,
    ];

    for (const query of cleanupQueries) {
      try {
        await session.run(query);
      } catch (e) {
        // Silently skip if node doesn't exist
      }
    }

    console.log('✅ Cleanup complete!\n');

  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
  } finally {
    await session.close();
    await driver.close();
  }
}

cleanupTestData();
