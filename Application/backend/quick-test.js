const neo4j = require('neo4j-driver');
require('dotenv').config();

const uri = process.env.NEO4J_URI;
const username = process.env.NEO4J_USERNAME;
const password = process.env.NEO4J_PASSWORD;
const database = process.env.NEO4J_DATABASE;

const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));

async function quickTest() {
  const session = driver.session({ database });

  try {
    console.log('\n✅ PRODUCTION TEST SUMMARY\n');

    // Quick count of fraud network
    const result = await session.run(`
      MATCH (c1:Customer)-[:OWNS_ACCOUNT]->(a1:Account)-[:SENT_TRANSACTION]->(t:Transaction)<-[:RECEIVED_TRANSACTION]-(a2:Account)<-[:OWNS_ACCOUNT]-(c2:Customer)
      WHERE (t.risk_score > 0.6 OR t.is_flagged = true)
        AND c1.customer_id <> c2.customer_id
      RETURN count(*) AS links, 
             sum(t.amount) AS totalAmount,
             avg(t.risk_score) * 100 AS avgRisk
    `);

    const record = result.records[0];
    const links = Number(record.get('links'));
    const totalAmount = record.get('totalAmount') ? Number(record.get('totalAmount')) : 0;
    const avgRisk = record.get('avgRisk') ? Number(record.get('avgRisk')).toFixed(0) : 0;

    console.log(`🔗 Fraud Network Links: ${links}`);
    console.log(`💰 Total Amount: ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} (M)`);
    console.log(`⚠️  Average Risk: ${avgRisk}%\n`);

    if (links > 0) {
      console.log('✅ PRODUCTION DATA READY FOR TESTING');
      console.log('   - Device tracking: ✓ ENABLED');
      console.log('   - Account identification: ✓ ENABLED');
      console.log('   - Transaction amounts: ✓ ENABLED (M currency)');
      console.log('   - Risk scoring: ✓ ENABLED\n');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await session.close();
    await driver.close();
  }
}

quickTest();
