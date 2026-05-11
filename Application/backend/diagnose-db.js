const neo4j = require('neo4j-driver');
require('dotenv').config();

const uri = process.env.NEO4J_URI;
const username = process.env.NEO4J_USERNAME;
const password = process.env.NEO4J_PASSWORD;
const database = process.env.NEO4J_DATABASE;

const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));

async function diagnoseDatabase() {
  const session = driver.session({ database });

  try {
    console.log('🔍 DATABASE DIAGNOSTIC REPORT\n');

    // Check node types
    const nodeTypesResult = await session.run(
      `MATCH (n) RETURN DISTINCT labels(n) AS labels, COUNT(*) AS count`
    );
    console.log('📊 Node Types:');
    nodeTypesResult.records.forEach(record => {
      console.log(`   ${record.get('labels').join(', ')}: ${record.get('count').toInt()}`);
    });

    // Check relationships
    const relTypesResult = await session.run(
      `MATCH (a)-[r]->(b) RETURN DISTINCT type(r) AS relType, COUNT(*) AS count`
    );
    console.log('\n🔗 Relationship Types:');
    if (relTypesResult.records.length === 0) {
      console.log('   ⚠️  NO RELATIONSHIPS FOUND');
    } else {
      relTypesResult.records.forEach(record => {
        console.log(`   ${record.get('relType')}: ${record.get('count').toInt()}`);
      });
    }

    // Sample Account data structure
    const accountResult = await session.run(
      `MATCH (a:Account) RETURN properties(a) AS props LIMIT 1`
    );
    console.log('\n💳 Sample Account Properties:');
    if (accountResult.records.length > 0) {
      const props = accountResult.records[0].get('props');
      Object.keys(props).forEach(key => {
        console.log(`   - ${key}: ${props[key]}`);
      });
    } else {
      console.log('   ⚠️  NO ACCOUNTS FOUND');
    }

    // Sample Transaction data structure
    const transactionResult = await session.run(
      `MATCH (t:Transaction) RETURN properties(t) AS props LIMIT 1`
    );
    console.log('\n💰 Sample Transaction Properties:');
    if (transactionResult.records.length > 0) {
      const props = transactionResult.records[0].get('props');
      Object.keys(props).forEach(key => {
        console.log(`   - ${key}: ${props[key]}`);
      });
    } else {
      console.log('   ⚠️  NO TRANSACTIONS FOUND');
    }

    // Test the fraud detection queries
    console.log('\n🔍 Testing Fraud Detection Queries:\n');

    const queries = {
      'Suspicious Accounts (amount > 5000)': `
        MATCH (a:Account)-[:SENT_TRANSACTION]->(t:Transaction)
        WHERE t.amount > 5000
        WITH a, t, t.amount AS amount
        WHERE amount IS NOT NULL
        RETURN COUNT(DISTINCT a) AS count
      `,
      'All transactions': `
        MATCH (t:Transaction)
        RETURN COUNT(t) AS count
      `,
      'Money Laundering Patterns': `
        MATCH (a:Account)-[:SENT_TRANSACTION]->(t1:Transaction)<-[:RECEIVED_TRANSACTION]-(b:Account)
        WHERE a.account_id <> b.account_id
        RETURN COUNT(DISTINCT a) AS count
      `,
      'Shared Device Accounts': `
        MATCH (c1:Customer)-[:USES_DEVICE]->(d:Device)<-[:USES_DEVICE]-(c2:Customer)
        WHERE c1.customer_id <> c2.customer_id
        RETURN COUNT(DISTINCT c1) AS count
      `,
      'Risk Distribution': `
        MATCH (t:Transaction)
        RETURN COUNT(t) AS count
      `
    };

    for (const [queryName, query] of Object.entries(queries)) {
      try {
        const result = await session.run(query);
        const count = result.records[0]?.get('count').toInt() || 0;
        console.log(`✓ ${queryName}: ${count} results`);
      } catch (e) {
        console.log(`✗ ${queryName}: ERROR - ${e.message.split('\n')[0]}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await session.close();
    await driver.close();
  }
}

diagnoseDatabase();
