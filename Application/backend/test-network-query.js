const neo4j = require('neo4j-driver');
require('dotenv').config();

const uri = process.env.NEO4J_URI;
const username = process.env.NEO4J_USERNAME;
const password = process.env.NEO4J_PASSWORD;
const database = process.env.NEO4J_DATABASE;

const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));

async function test() {
  const session = driver.session({ database });
  try {
    // First, check if we have any Customer-Account-Transaction relationships
    console.log('Checking database structure...\n');
    
    const check = await session.run(`
      MATCH (c:Customer)-[:OWNS_ACCOUNT]->(a:Account)
      RETURN COUNT(*) as accountCount, 
             collect(c.name) as customerNames,
             collect(a.account_id) as accountIds
    `);
    
    if (check.records.length > 0) {
      const rec = check.records[0];
      console.log('Customer-Account relationships:', rec.get('accountCount').toNumber());
      console.log('Customers:', rec.get('customerNames'));
      console.log('Accounts:', rec.get('accountIds'));
    }
    
    // Check transactions
    const txnCheck = await session.run(`
      MATCH (a:Account)-[r:SENT_TRANSACTION|RECEIVED_TRANSACTION]->(t:Transaction)
      RETURN COUNT(*) as transactionCount,
             collect(DISTINCT a.account_id) as involvedAccounts,
             collect(t.transaction_id) as transactionIds
    `);
    
    if (txnCheck.records.length > 0) {
      const rec = txnCheck.records[0];
      console.log('\nTransaction relationships:', rec.get('transactionCount').toNumber());
      console.log('Involved accounts:', rec.get('involvedAccounts'));
      console.log('Transaction IDs:', rec.get('transactionIds'));
    }
    
    // Now test the fraud network query
    console.log('\n\nTesting fraud network query...\n');
    
    const result = await session.run(`
      MATCH (c1:Customer)-[:OWNS_ACCOUNT]->(a1:Account)-[:SENT_TRANSACTION]->(t:Transaction)<-[:RECEIVED_TRANSACTION]-(a2:Account)<-[:OWNS_ACCOUNT]-(c2:Customer)
      WHERE c1.customer_id <> c2.customer_id
      RETURN {
        sourceCustomerId: c1.customer_id,
        sourceCustomerName: c1.name,
        sourceRiskScore: c1.risk_score,
        sourceAccountId: a1.account_id,
        sourceAccountStatus: a1.status,
        transactionId: t.transaction_id,
        transactionAmount: t.amount,
        transactionCurrency: t.currency,
        transactionRiskScore: t.risk_score,
        transactionFlagged: t.is_flagged,
        targetAccountId: a2.account_id,
        targetAccountStatus: a2.status,
        targetCustomerId: c2.customer_id,
        targetCustomerName: c2.name,
        targetRiskScore: c2.risk_score,
        transactionTimestamp: t.timestamp
      } AS fraudLink
      ORDER BY t.risk_score DESC
      LIMIT 100
    `);
    
    console.log('Fraud network records found:', result.records.length);
    if (result.records.length > 0) {
      result.records.forEach((rec, idx) => {
        const data = rec.get('fraudLink');
        console.log(`\n${idx + 1}. ${data.sourceCustomerName} -> ${data.targetCustomerName}`);
        console.log(`   Amount: ${data.transactionAmount} ${data.transactionCurrency}`);
        console.log(`   Risk: ${data.transactionRiskScore}`);
      });
    } else {
      console.log('No fraud network connections found');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    await session.close();
    await driver.close();
  }
}

test();
