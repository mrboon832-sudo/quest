const { driver } = require('../config/neo4j');
const queries = require('../queries/fraudDetection');

module.exports = {
  // GET /api/admin/summary
  getSummary: async (req, res) => {
    const session = driver.session();
    try {
      const result = await session.run(queries.adminSummary);
      const r = result.records[0];
      res.json({
        totalCustomers: r.get('totalCustomers').toInt(),
        totalAccounts:   r.get('totalAccounts').toInt(),
        flaggedAccounts: r.get('flaggedAccounts').toInt(),
        highRiskCustomers: r.get('highRiskCustomers').toInt(),
      });
    } catch (e) {
      console.error('Admin summary error:', e);
      res.status(500).json({ error: 'Failed to fetch admin summary' });
    } finally {
      await session.close();
    }
  },
};
