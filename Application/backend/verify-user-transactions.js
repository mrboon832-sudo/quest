const neo4j = require('neo4j-driver');
require('dotenv').config();

const uri = process.env.NEO4J_URI;
const username = process.env.NEO4J_USERNAME;
const password = process.env.NEO4J_PASSWORD;
const database = process.env.NEO4J_DATABASE;

const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));

async function verifyTransaction() {
  const session = driver.session({ database });

  try {
    console.log('\n📊 VERIFYING DATABASE TRANSACTION RECORDS\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Get customer and account info
    const customerResult = await session.run(`
      MATCH (c:Customer {email: 'testuser@example.com'})-[:OWNS_ACCOUNT]->(a:Account)
      RETURN c.customer_id AS customerId, c.name AS name, c.email AS email, 
             a.account_id AS accountId, a.balance AS balance, a.status AS status
    `);

    if (customerResult.records.length === 0) {
      console.log('❌ Customer not found\n');
      return;
    }

    const customer = customerResult.records[0];
    console.log('👤 CUSTOMER:');
    console.log(`   Name: ${customer.get('name')}`);
    console.log(`   Email: ${customer.get('email')}`);
    console.log(`   Customer ID: ${customer.get('customerId')}\n`);

    console.log('💼 ACCOUNT:');
    const accountId = customer.get('accountId');
    const balance = customer.get('balance');
    console.log(`   Account ID: ${accountId}`);
    console.log(`   Balance: ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} (M)`);
    console.log(`   Status: ${customer.get('status')}\n`);

    // Get all transactions for this account
    const txnResult = await session.run(`
      MATCH (a:Account {account_id: $accountId})-[r:SENT_TRANSACTION|RECEIVED_TRANSACTION]->(t:Transaction)
      RETURN t.transaction_id AS txnId, t.amount AS amount, t.type AS type, 
             t.timestamp AS timestamp, t.status AS status, 
             type(r) AS relationType, a.account_id AS accountId
      ORDER BY t.timestamp DESC
    `, { accountId });

    console.log('💳 TRANSACTIONS:');
    if (txnResult.records.length === 0) {
      console.log('   ⚠️  No transactions found\n');
    } else {
      txnResult.records.forEach((record, idx) => {
        console.log(`   ${idx + 1}. Transaction ID: ${record.get('txnId')}`);
        console.log(`      Amount: ${record.get('amount').toLocaleString('en-US', { minimumFractionDigits: 2 })} (M)`);
        console.log(`      Type: ${record.get('type')}`);
        console.log(`      Status: ${record.get('status')}`);
        console.log(`      Direction: ${record.get('relationType')}`);
        console.log(`      Timestamp: ${record.get('timestamp')}\n`);
      });
    }

    // Get account balance history
    const balanceResult = await session.run(`
      MATCH (a:Account {account_id: $accountId})
      RETURN a.balance AS balance, a.opened_date AS openedDate, a.currency AS currency
    `, { accountId });

    if (balanceResult.records.length > 0) {
      const balRec = balanceResult.records[0];
      console.log('📈 ACCOUNT BALANCE:');
      console.log(`   Current Balance: ${balRec.get('balance').toLocaleString('en-US', { minimumFractionDigits: 2 })} (M)`);
      console.log(`   Opened: ${balRec.get('openedDate')}\n`);
    }

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ Database verification complete!');
    console.log('\n📋 Summary:');
    console.log(`   - Customer registered: ✓`);
    console.log(`   - Account created: ✓ (${accountId})`);
    console.log(`   - Account balance: ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} (M)`);
    console.log(`   - Transactions recorded: ${txnResult.records.length > 0 ? '✓' : '⚠️ None yet'}\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await session.close();
    await driver.close();
  }
}

verifyTransaction();
