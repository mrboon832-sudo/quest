const { driver } = require('../config/neo4j');
const queries = require('../queries/fraudDetection');

const dashboardController = {
  // Get dashboard statistics
  getStats: async (req, res) => {
    const session = driver.session();
    try {
      const result = await session.run(queries.getDashboardStats);
      const stats = result.records[0];
      res.json({
        totalAccounts: stats.totalAccounts.toInt(),
        totalTransactions: stats.totalTransactions.toInt(),
        totalVolume: stats.totalVolume.toInt(),
        highRiskTransactions: stats.highRiskTransactions.toInt(),
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
    } finally {
      await session.close();
    }
  },

  // Get risk distribution
  getRiskDistribution: async (req, res) => {
    const session = driver.session();
    try {
      const result = await session.run(queries.getRiskDistribution);
      const distribution = result.records.map(record => ({
        risk: record.risk,
        count: record.count.toInt(),
      }));
      res.json(distribution);
    } catch (error) {
      console.error('Error fetching risk distribution:', error);
      res.status(500).json({ error: 'Failed to fetch risk distribution' });
    } finally {
      await session.close();
    }
  },

  // Get transaction trend
  getTransactionTrend: async (req, res) => {
    const session = driver.session();
    try {
      const result = await session.run(queries.getTransactionTrend);
      const trend = result.records.map(record => ({
        month: record.month.toInt(),
        normal: record.normal.toInt(),
        flagged: record.flagged.toInt(),
      }));
      res.json(trend);
    } catch (error) {
      console.error('Error fetching transaction trend:', error);
      res.status(500).json({ error: 'Failed to fetch transaction trend' });
    } finally {
      await session.close();
    }
  },
};

module.exports = dashboardController;
