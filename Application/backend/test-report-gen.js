const { generateReportId } = require('crypto');
const neo4j = require('neo4j-driver');
require('dotenv').config();

const uri = process.env.NEO4J_URI;
const username = process.env.NEO4J_USERNAME;
const password = process.env.NEO4J_PASSWORD;
const database = process.env.NEO4J_DATABASE;

const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
const queries = require('./queries/fraudDetection');

const safeInt = (val) => {
  if (val === null || val === undefined) return 0;
  if (typeof val.toInt === 'function') return val.toInt();
  return parseInt(val, 10) || 0;
};

async function testReportGeneration() {
  const session = driver.session({ database });
  const reportId = 'TEST-' + Date.now();
  const generatedAt = new Date().toISOString();

  try {
    let findingsCount = 0;
    let summary = [];

    console.log('🔍 Testing Fraud Detection Queries...\n');

    try {
      console.log('1️⃣  Running suspicious accounts query...');
      const suspiciousResult = await session.run(queries.findSuspiciousAccounts);
      const suspiciousCount = suspiciousResult.records.length;
      findingsCount += suspiciousCount;
      console.log(`   Found ${suspiciousCount} suspicious accounts`);
      if (suspiciousCount > 0) {
        summary.push(`Found ${suspiciousCount} suspicious high-value accounts`);
      }
    } catch (e) {
      console.warn('   ⚠️  Query failed:', e.message.split('\n')[0]);
    }

    try {
      console.log('\n2️⃣  Running money laundering rings query...');
      const mlResult = await session.run(queries.findMoneyLaunderingRings);
      const mlCount = mlResult.records.length;
      findingsCount += mlCount;
      console.log(`   Found ${mlCount} money laundering patterns`);
      if (mlCount > 0) {
        summary.push(`Detected ${mlCount} potential money laundering patterns`);
      }
    } catch (e) {
      console.warn('   ⚠️  Query failed:', e.message.split('\n')[0]);
    }

    try {
      console.log('\n3️⃣  Running shared device accounts query...');
      const deviceResult = await session.run(queries.findSharedDeviceAccounts);
      const deviceCount = deviceResult.records.length;
      findingsCount += deviceCount;
      console.log(`   Found ${deviceCount} shared device accounts`);
      if (deviceCount > 0) {
        summary.push(`Identified ${deviceCount} account pairs sharing devices`);
      }
    } catch (e) {
      console.warn('   ⚠️  Query failed:', e.message.split('\n')[0]);
    }

    try {
      console.log('\n4️⃣  Running risk distribution query...');
      const riskDist = await session.run(queries.getRiskDistribution);
      let highRiskCount = 0;
      riskDist.records.forEach(record => {
        const dist = record.get('distribution');
        if (dist && dist.riskLevel === 'High') {
          highRiskCount += safeInt(dist.transactionCount);
        }
      });
      findingsCount += highRiskCount;
      console.log(`   Found ${highRiskCount} high-risk transactions`);
      if (highRiskCount > 0) {
        summary.push(`${highRiskCount} high-risk transactions identified`);
      }
    } catch (e) {
      console.warn('   ⚠️  Query failed:', e.message.split('\n')[0]);
    }

    console.log('\n' + '='.repeat(50));
    console.log(`\n📊 REPORT SUMMARY:`);
    console.log(`   Report ID: ${reportId}`);
    console.log(`   Total Findings: ${findingsCount}`);
    console.log(`   Summary: ${summary.length > 0 ? summary.join(' | ') : 'No fraudulent findings detected'}`);
    console.log('\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await session.close();
    await driver.close();
  }
}

testReportGeneration();
