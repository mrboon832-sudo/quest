const { driver } = require('../config/neo4j');
const queries = require('../queries/fraudDetection');
const crypto = require('crypto');

// Generate unique ID without uuid dependency
const generateReportId = () => crypto.randomUUID ? crypto.randomUUID() : 'report-' + Date.now();

const reportController = {
  // Generate a report
  generateReport: async (req, res) => {
    const session = driver.session();
    const { type = 'fraud_detection' } = req.body;
    const reportId = generateReportId();
    const generatedAt = new Date().toISOString();
    
    try {
      // Run fraud detection queries to gather findings
      let findingsCount = 0;
      let summary = [];

      // Query 1: Suspicious accounts
      const suspiciousResult = await session.run(queries.findSuspiciousAccounts);
      const suspiciousCount = suspiciousResult.records.length;
      findingsCount += suspiciousCount;
      if (suspiciousCount > 0) {
        summary.push(`Found ${suspiciousCount} suspicious high-value accounts`);
      }

      // Query 2: Money laundering rings
      const mlResult = await session.run(queries.findMoneyLaunderingRings);
      const mlCount = mlResult.records.length;
      findingsCount += mlCount;
      if (mlCount > 0) {
        summary.push(`Detected ${mlCount} potential money laundering patterns`);
      }

      // Query 3: Shared device fraud
      const deviceResult = await session.run(queries.findSharedDeviceAccounts);
      const deviceCount = deviceResult.records.length;
      findingsCount += deviceCount;
      if (deviceCount > 0) {
        summary.push(`Identified ${deviceCount} account pairs sharing devices`);
      }

      // Query 4: High-risk transactions
      const riskDist = await session.run(queries.getRiskDistribution);
      let highRiskCount = 0;
      riskDist.records.forEach(record => {
        if (record.get('risk') === 'High') {
          highRiskCount = record.get('count').toInt();
        }
      });
      findingsCount += highRiskCount;
      if (highRiskCount > 0) {
        summary.push(`${highRiskCount} high-risk transactions identified`);
      }

      // Save report to database
      const createReportQuery = `
        CREATE (r:Report {
          reportId: $reportId,
          generatedAt: $generatedAt,
          type: $type,
          findingsCount: $findingsCount,
          summary: $summary,
          status: 'Completed'
        })
        RETURN r.reportId AS reportId, r.generatedAt AS date
      `;

      const reportResult = await session.run(createReportQuery, {
        reportId,
        generatedAt,
        type,
        findingsCount,
        summary: summary.join(' | '),
      });

      res.json({
        reportId,
        generatedAt,
        type,
        findingsCount,
        summary: summary.join(' | '),
        status: 'Completed',
      });
    } catch (error) {
      console.error('Error generating report:', error);
      res.status(500).json({ error: 'Failed to generate report', details: error.message });
    } finally {
      await session.close();
    }
  },

  // Get report history
  getReportHistory: async (req, res) => {
    const session = driver.session();
    try {
      const result = await session.run(`
        MATCH (r:Report)
        RETURN r.reportId AS reportId, r.generatedAt AS generatedAt, r.summary AS summary,
               r.type AS type, r.status AS status
        ORDER BY r.generatedAt DESC
      `);
      const reports = result.records.map(record => ({
        reportId: record.get('reportId'),
        generatedAt: record.get('generatedAt')?.toString() || new Date().toISOString(),
        summary: record.get('summary'),
        type: record.get('type') || 'fraud_detection',
        status: record.get('status') || 'Completed',
      }));
      res.json(reports);
    } catch (error) {
      console.error('Error fetching report history:', error);
      res.status(500).json({ error: 'Failed to fetch report history' });
    } finally {
      await session.close();
    }
  },
};

module.exports = reportController;
