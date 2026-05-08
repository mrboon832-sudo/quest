const { driver } = require('../config/neo4j');
const queries = require('../queries/fraudDetection');

const dashboardController = {
  // Get dashboard statistics
  getStats: async (req, res) => {
    const session = driver.session();
    try {
      // First, get all transactions
      const transactionsResult = await session.run(`
        MATCH (src:Account)-[:SENT_TRANSACTION]->(t:Transaction)<-[:RECEIVED_TRANSACTION]-(dst:Account)
        RETURN t.transaction_id AS id,
               src.account_id AS fromAccount,
               dst.account_id AS toAccount,
               t.amount AS amount,
               t.timestamp AS date,
               CASE WHEN t.risk_score > 0.7 THEN 'High' WHEN t.risk_score > 0.4 THEN 'Medium' ELSE 'Low' END AS risk,
               t.status AS status,
               t.is_flagged AS flagged
        ORDER BY t.timestamp DESC
      `);

      const transactions = transactionsResult.records.map(record => ({
        id: record.get('id'),
        fromAccount: record.get('fromAccount'),
        toAccount: record.get('toAccount'),
        amount: parseFloat(record.get('amount')) || 0,
        date: record.get('date'),
        risk: record.get('risk'),
        status: record.get('status'),
        flagged: record.get('flagged'),
      }));

      // Calculate stats from transactions
      const totalTransactions = transactions.length;
      const totalVolume = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      const flaggedCount = transactions.filter(t => t.flagged === true).length;

      // Get total accounts
      const accountsResult = await session.run('MATCH (a:Account) RETURN count(DISTINCT a) AS count');
      const totalAccounts = accountsResult.records[0]?.get('count').toInt() || 0;

      res.json({
        totalAccounts,
        totalTransactions,
        totalVolume,
        highRiskTransactions: flaggedCount,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard statistics', details: error.message });
    } finally {
      await session.close();
    }
  },

  // Get risk distribution
  getRiskDistribution: async (req, res) => {
    const session = driver.session();
    try {
      // Fetch all transactions
      const result = await session.run(`
        MATCH (src:Account)-[:SENT_TRANSACTION]->(t:Transaction)<-[:RECEIVED_TRANSACTION]-(dst:Account)
        RETURN t.risk_score AS riskScore
      `);

      // Count by risk level
      const riskCounts = {
        'High': 0,
        'Medium': 0,
        'Low': 0,
      };

      result.records.forEach(record => {
        const riskScore = parseFloat(record.get('riskScore')) || 0;
        if (riskScore > 0.7) {
          riskCounts['High']++;
        } else if (riskScore > 0.4) {
          riskCounts['Medium']++;
        } else {
          riskCounts['Low']++;
        }
      });

      const distribution = Object.entries(riskCounts).map(([risk, count]) => ({
        risk,
        count,
      }));

      res.json(distribution);
    } catch (error) {
      console.error('Error fetching risk distribution:', error);
      res.status(500).json({ error: 'Failed to fetch risk distribution', details: error.message });
    } finally {
      await session.close();
    }
  },

  // Get transaction trend
  getTransactionTrend: async (req, res) => {
    const session = driver.session();
    try {
      // Fetch all transactions with timestamps
      const result = await session.run(`
        MATCH (src:Account)-[:SENT_TRANSACTION]->(t:Transaction)<-[:RECEIVED_TRANSACTION]-(dst:Account)
        RETURN t.timestamp AS timestamp, t.is_flagged AS flagged
      `);

      // Group by month
      const trendMap = {};
      result.records.forEach(record => {
        const timestamp = record.get('timestamp');
        const flagged = record.get('flagged');
        
        // Extract year and month (assuming timestamps are in ISO format or similar)
        let year = 2026;
        let month = 4;
        
        if (timestamp) {
          try {
            const dateStr = typeof timestamp === 'string' ? timestamp : timestamp.toString();
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
              year = date.getFullYear();
              month = date.getMonth() + 1;
            }
          } catch (e) {
            // Keep default values
          }
        }

        const key = `${year}-${String(month).padStart(2, '0')}`;
        if (!trendMap[key]) {
          trendMap[key] = { year, month, normal: 0, flagged: 0 };
        }

        if (flagged === true) {
          trendMap[key].flagged++;
        } else {
          trendMap[key].normal++;
        }
      });

      const trend = Object.values(trendMap).sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      });

      res.json(trend);
    } catch (error) {
      console.error('Error fetching transaction trend:', error);
      res.status(500).json({ error: 'Failed to fetch transaction trend', details: error.message });
    } finally {
      await session.close();
    }
  },
};

module.exports = dashboardController;
