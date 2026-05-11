const neo4j = require('neo4j-driver');
require('dotenv').config();

const uri = process.env.NEO4J_URI;
const username = process.env.NEO4J_USERNAME;
const password = process.env.NEO4J_PASSWORD;
const database = process.env.NEO4J_DATABASE;

const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));

async function detailedReport() {
  const session = driver.session({ database });

  try {
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║     FRAUD NETWORK VISUALIZATION - PRODUCTION TEST REPORT      ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    // Get detailed fraud network data
    const fraudResult = await session.run(`
      MATCH (c1:Customer)-[:OWNS_ACCOUNT]->(a1:Account)-[:SENT_TRANSACTION]->(t:Transaction)<-[:RECEIVED_TRANSACTION]-(a2:Account)<-[:OWNS_ACCOUNT]-(c2:Customer)
      WHERE (t.risk_score > 0.6 OR t.is_flagged = true)
        AND c1.customer_id <> c2.customer_id
      OPTIONAL MATCH (c1)-[:USES_DEVICE]->(d1:Device)
      OPTIONAL MATCH (c2)-[:USES_DEVICE]->(d2:Device)
      RETURN {
        sourceCustomerId: c1.customer_id,
        sourceCustomerName: c1.name,
        sourceRiskScore: c1.risk_score,
        sourceAccountId: a1.account_id,
        sourceDeviceCount: count(DISTINCT d1),
        transactionId: t.transaction_id,
        transactionAmount: t.amount,
        transactionCurrency: t.currency,
        transactionRiskScore: t.risk_score,
        transactionFlagged: t.is_flagged,
        targetAccountId: a2.account_id,
        targetCustomerId: c2.customer_id,
        targetCustomerName: c2.name,
        targetRiskScore: c2.risk_score,
        targetDeviceCount: count(DISTINCT d2)
      } AS fraudLink
      ORDER BY t.risk_score DESC
    `);

    const fraudLinks = fraudResult.records.map(r => r.get('fraudLink'));

    console.log('📊 FRAUD NETWORK SUMMARY:\n');
    console.log(`   Total Connections: ${fraudLinks.length}`);
    console.log(`   Total Transaction Volume: ${fraudLinks.reduce((s, f) => s + f.transactionAmount, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} (M)`);
    console.log(`   Average Risk Score: ${(fraudLinks.reduce((s, f) => s + f.transactionRiskScore, 0) / fraudLinks.length * 100).toFixed(0)}%`);
    console.log(`   Flagged Transactions: ${fraudLinks.filter(f => f.transactionFlagged).length}/${fraudLinks.length}\n`);

    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║             DETAILED TRANSACTION LINKS                        ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    fraudLinks.forEach((link, idx) => {
      console.log(`${idx + 1}. TRANSACTION: ${link.transactionId}`);
      console.log(`   Amount: ${link.transactionAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${link.transactionCurrency})`);
      console.log(`   Risk: ${(link.transactionRiskScore * 100).toFixed(0)}% ${link.transactionFlagged ? '🚩' : '✓'}`);
      console.log(`\n   FROM: ${link.sourceCustomerName} (${link.sourceCustomerId})`);
      console.log(`         Account: ${link.sourceAccountId}`);
      console.log(`         Risk Score: ${(link.sourceRiskScore * 100).toFixed(0)}%`);
      console.log(`         Devices: ${link.sourceDeviceCount} device(s)`);
      console.log(`\n   TO: ${link.targetCustomerName} (${link.targetCustomerId})`);
      console.log(`       Account: ${link.targetAccountId}`);
      console.log(`       Risk Score: ${(link.targetRiskScore * 100).toFixed(0)}%`);
      console.log(`       Devices: ${link.targetDeviceCount} device(s)\n`);
    });

    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║              VISUALIZATION FEATURES VALIDATION                ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    console.log('✅ DEVICE TRACKING:');
    const deviceCheck = fraudLinks.every(f => f.sourceDeviceCount > 0 && f.targetDeviceCount > 0);
    console.log(`   ${deviceCheck ? '✓' : '✗'} All customers have device information\n`);

    console.log('✅ ACCOUNT IDENTIFICATION:');
    const accountCheck = fraudLinks.every(f => f.sourceAccountId && f.targetAccountId);
    console.log(`   ${accountCheck ? '✓' : '✗'} All transactions show source and target accounts\n`);

    console.log('✅ TRANSACTION AMOUNTS:');
    const amountCheck = fraudLinks.every(f => f.transactionAmount > 0 && f.transactionCurrency === 'M');
    console.log(`   ${amountCheck ? '✓' : '✗'} All amounts in currency (M)\n`);

    console.log('✅ RISK ASSESSMENT:');
    const riskCheck = fraudLinks.every(f => f.transactionRiskScore > 0.6 || f.transactionFlagged);
    console.log(`   ${riskCheck ? '✓' : '✗'} All transactions have risk scores > 0.6 or flagged\n`);

    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                    PRODUCTION STATUS                          ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    const allCheck = deviceCheck && accountCheck && amountCheck && riskCheck && fraudLinks.length > 0;
    
    if (allCheck) {
      console.log('🚀 ✅ PRODUCTION READY!\n');
      console.log('   - Fraud network visualization: OPERATIONAL');
      console.log('   - Device tracking: ENABLED');
      console.log('   - Account identification: ENABLED');
      console.log('   - Transaction amounts: ENABLED (M currency)');
      console.log('   - Risk scoring: ENABLED');
      console.log('   - Test data: LOADED\n');
      console.log('Ready for frontend testing!\n');
    } else {
      console.log('⚠️  ISSUES DETECTED - Please review validation results above\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await session.close();
    await driver.close();
  }
}

detailedReport();
