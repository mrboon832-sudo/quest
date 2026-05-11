const neo4j = require('neo4j-driver');
require('dotenv').config();

const uri = process.env.NEO4J_URI;
const username = process.env.NEO4J_USERNAME;
const password = process.env.NEO4J_PASSWORD;
const database = process.env.NEO4J_DATABASE;

const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));

async function checkDatabase() {
  const session = driver.session({ database });

  try {
    const accountResult = await session.run('MATCH (a:Account) RETURN COUNT(a) AS count');
    const transactionResult = await session.run('MATCH (t:Transaction) RETURN COUNT(t) AS count');
    
    const accountCount = accountResult.records[0]?.get('count').toInt() || 0;
    const transactionCount = transactionResult.records[0]?.get('count').toInt() || 0;
    
    console.log(`✅ Database Status:`);
    console.log(`   Accounts: ${accountCount}`);
    console.log(`   Transactions: ${transactionCount}`);
    
    if (accountCount > 0) {
      const accsResult = await session.run('MATCH (a:Account) RETURN a.account_id AS id, a.customer_name AS name LIMIT 5');
      console.log(`\n📝 Sample Accounts:`);
      accsResult.records.forEach(record => {
        console.log(`   - ${record.get('id')}: ${record.get('name')}`);
      });
    }
    
    if (transactionCount > 0) {
      const txnsResult = await session.run('MATCH (t:Transaction) RETURN t.transaction_id AS id, t.amount AS amount LIMIT 5');
      console.log(`\n💳 Sample Transactions:`);
      txnsResult.records.forEach(record => {
        console.log(`   - ${record.get('id')}: $${record.get('amount')}`);
      });
    }
  } catch (error) {
    console.error('❌ Error querying database:', error.message);
  } finally {
    await session.close();
    await driver.close();
  }
}

checkDatabase();
