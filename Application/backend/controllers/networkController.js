const { driver } = require('../config/neo4j');
const queries = require('../queries/fraudDetection');

const networkController = {
  // Get fraud network graph
  getFraudNetwork: async (req, res) => {
    const session = driver.session();
    try {
      const result = await session.run(queries.getFraudNetwork);
      if (result.records.length === 0) {
        return res.json({ nodes: [], edges: [] });
      }
      const nodes = [];
      const edges = [];
      const nodeIds = new Set();

      result.records.forEach(record => {
        const account = record.get('a');
        const transaction = record.get('t');
        const merchant = record.get('m');

        const accountId = account.properties.accountId;
        const merchantId = merchant.properties.merchantId;

        if (!nodeIds.has(accountId)) {
          nodes.push({
            id: accountId,
            label: accountId,
            type: 'Account',
            riskLevel: account.properties.riskLevel || 'Unknown',
          });
          nodeIds.add(accountId);
        }

        if (!nodeIds.has(merchantId)) {
          nodes.push({
            id: merchantId,
            label: merchantId,
            type: 'Merchant',
          });
          nodeIds.add(merchantId);
        }

        edges.push({
          id: `${accountId}-${merchantId}`,
          source: accountId,
          target: merchantId,
          label: `$${transaction.properties.amount}`,
          riskLevel: transaction.properties.riskLevel,
        });
      });

      res.json({ nodes, edges });
    } catch (error) {
      console.error('Error fetching fraud network:', error);
      res.status(500).json({ error: 'Failed to fetch fraud network', details: error.message });
    } finally {
      await session.close();
    }
  },

  // Get account connections
  getAccountConnections: async (req, res) => {
    const session = driver.session();
    const { accountId } = req.params;
    try {
      const result = await session.run(
        `MATCH (a:Account {accountId: $accountId})-[:TRANSACTED_WITH]->(m:Merchant)
         RETURN a, m`,
        { accountId }
      );
      if (result.records.length === 0) {
        return res.json([]);
      }
      const connections = result.records.map(record => ({
        account: record.get('a').properties.accountId,
        merchant: record.get('m').properties.merchantId,
      }));
      res.json(connections);
    } catch (error) {
      console.error('Error fetching account connections:', error);
      res.status(500).json({ error: 'Failed to fetch account connections', details: error.message });
    } finally {
      await session.close();
    }
  },
};

module.exports = networkController;
