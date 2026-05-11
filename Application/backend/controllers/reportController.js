const { driver } = require('../config/neo4j');
const neo4j = require('neo4j-driver'); 
const queries = require('../queries/fraudDetection');
const crypto = require('crypto');

// Helper to safely convert Neo4j values to JS numbers
const safeInt = (val) => {
  if (val === null || val === undefined) return 0;
  if (typeof val.toInt === 'function') return val.toInt();
  return parseInt(val, 10) || 0;
};

// Helper to safely convert to string
const safeStr = (val) => (val ? val.toString() : '');

const generateReportId = () => crypto.randomUUID ? crypto.randomUUID() : 'report-' + Date.now();

const reportController = {
  // 1. Generate a report
  generateReport: async (req, res) => {
    const session = driver.session();
    const { type = 'fraud_detection' } = req.body;
    const reportId = generateReportId();
    const generatedAt = new Date().toISOString();
    
    try {
      let findingsCount = 0;
      let summary = [];

      try {
        // Query 1: Suspicious accounts
        console.log('Running suspicious accounts query...');
        const suspiciousResult = await session.run(queries.findSuspiciousAccounts);
        const suspiciousCount = suspiciousResult.records.length;
        findingsCount += suspiciousCount;
        if (suspiciousCount > 0) {
          summary.push(`Found ${suspiciousCount} suspicious high-value accounts`);
        }
      } catch (e) {
        console.warn('Suspicious accounts query failed:', e.message);
      }

      try {
        // Query 2: Money laundering rings
        console.log('Running money laundering rings query...');
        const mlResult = await session.run(queries.findMoneyLaunderingRings);
        const mlCount = mlResult.records.length;
        findingsCount += mlCount;
        if (mlCount > 0) {
          summary.push(`Detected ${mlCount} potential money laundering patterns`);
        }
      } catch (e) {
        console.warn('Money laundering query failed:', e.message);
      }

      try {
        // Query 3: Shared device fraud
        console.log('Running shared device accounts query...');
        const deviceResult = await session.run(queries.findSharedDeviceAccounts);
        const deviceCount = deviceResult.records.length;
        findingsCount += deviceCount;
        if (deviceCount > 0) {
          summary.push(`Identified ${deviceCount} account pairs sharing devices`);
        }
      } catch (e) {
        console.warn('Shared device query failed:', e.message);
      }

      try {
        // Query 4: High-risk transactions
        console.log('Running risk distribution query...');
        const riskDist = await session.run(queries.getRiskDistribution);
        let highRiskCount = 0;
        riskDist.records.forEach(record => {
          const dist = record.get('distribution');
          if (dist && dist.riskLevel === 'High') {
            highRiskCount += safeInt(dist.transactionCount);
          }
        });
        findingsCount += highRiskCount;
        if (highRiskCount > 0) {
          summary.push(`${highRiskCount} high-risk transactions identified`);
        }
      } catch (e) {
        console.warn('Risk distribution query failed:', e.message);
      }

      console.log('Creating report node with findings count:', findingsCount);

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
        RETURN r.reportId AS reportId
      `;

      await session.run(createReportQuery, {
        reportId,
        generatedAt,
        type,
        findingsCount: neo4j.int(findingsCount),
        summary: summary.length > 0 ? summary.join(' | ') : 'Report generated with no fraud indicators detected',
      });

      console.log('Report created successfully:', reportId);

      res.json({
        reportId,
        generatedAt,
        type,
        findingsCount,
        summary: summary.length > 0 ? summary.join(' | ') : 'Report generated with no fraud indicators detected',
        status: 'Completed',
      });
    } catch (error) {
      console.error('Error generating report:', error);
      res.status(500).json({ 
        error: 'Failed to generate report', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    } finally {
      await session.close();
    }
  },

  // 2. GET REPORT HISTORY (FIXED potential .toInt() crash)
  getReportHistory: async (req, res) => {
    const session = driver.session();
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    try {
      const result = await session.run(
        `
        MATCH (r:Report)
        RETURN r.reportId    AS reportId,
               r.generatedAt AS generatedAt,
               r.summary     AS summary,
               r.type        AS type,
               r.status      AS status,
               r.findingsCount AS findingsCount
        ORDER BY r.generatedAt DESC
        SKIP $offset
        LIMIT $limit
        `,
        { 
          offset: neo4j.int(offset), 
          limit: neo4j.int(limit) 
        }
      );

      const reports = result.records.map(rec => ({
        id: rec.get('reportId'),
        reportId: rec.get('reportId'),
        generatedAt: safeStr(rec.get('generatedAt')),
        summary: rec.get('summary'),
        type: rec.get('type') || 'fraud_detection',
        status: rec.get('status') || 'Completed',
        findingsCount: safeInt(rec.get('findingsCount')),
      }));

      res.json(reports);
    } catch (err) {
      console.error('Error fetching report history:', err);
      res.status(500).json({ error: 'Failed to fetch report history', details: err.message });
    } finally {
      await session.close();
    }
  },

  // 3. Download report
  downloadReport: async (req, res) => {
    const session = driver.session();
    const { id } = req.params;
    const { format = 'csv' } = req.query;

    try {
      const result = await session.run(
        `MATCH (r:Report {reportId: $reportId})
         RETURN r`,
        { reportId: id }
      );

      if (result.records.length === 0) {
        return res.status(404).json({ error: 'Report not found' });
      }

      const report = result.records[0].get('r').properties;
      const data = {
        reportId: report.reportId,
        generatedAt: safeStr(report.generatedAt),
        summary: report.summary,
        type: report.type,
        status: report.status,
        findingsCount: safeInt(report.findingsCount),
      };

      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        return res.json(data);
      }

      // Default to CSV
      const csv = `Report ID,Generated At,Type,Status,Findings Count\n"${data.reportId}","${data.generatedAt}","${data.type}","${data.status}",${data.findingsCount}\n\nSummary:\n"${data.summary}"`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="report-${id}.csv"`);
      res.send(csv);
    } catch (e) {
      console.error('Download report error:', e);
      res.status(500).json({ error: 'Failed to download report' });
    } finally {
      await session.close();
    }
  },
};

module.exports = reportController;
