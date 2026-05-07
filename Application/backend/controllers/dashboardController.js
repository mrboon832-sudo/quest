const { driver } = require('../config/neo4j');
const queries = require('../queries/fraudDetection');

const dashboardController = {
  // Get dashboard statistics
  getStats: async (req, res) => {
    const session = driver.session();
    try {
      const result = await session.run(queries.getDashboardStats);
      if (result.records.length === 0) {
        return res.json({
          totalAccounts: 0,
          totalTransactions: 0,
          totalVolume: 0,
          highRiskTransactions: 0,
        });
      }
      const stats = result.records[0];
      res.json({
      totalAccounts: stats.get('totalAccounts').toInt(),
      totalTransactions: stats.get('totalTransactions').toInt(),
      totalVolume: parseFloat(stats.get('totalVolume')),
      highRiskTransactions: stats.get('flaggedTransactions').toInt(),
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
      const result = await session.run(queries.getRiskDistribution);
      if (result.records.length === 0) {
        return res.json([]);
      }
      const distribution = result.records.map(record => ({
        risk: record.get('risk'),
        count: record.get('count').toInt(),
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
      const result = await session.run(queries.getTransactionTrend);
      if (result.records.length === 0) {
        return res.json([]);
      }
      const trend = result.records.map(record => ({
        year: record.get('year').toInt(),
        month: record.get('month').toInt(),
        normal: record.get('normal').toInt(),
        flagged: record.get('flagged').toInt(),
      }));
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
