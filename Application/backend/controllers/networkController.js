const { driver } = require('../config/neo4j');
const queries = require('../queries/fraudDetection');

// Mock data for development/demo
const mockNetworkData = {
  nodes: [
    { id: 'ACC-12345', label: 'Account 12345', type: 'Account', riskLevel: 'High' },
    { id: 'ACC-67890', label: 'Account 67890', type: 'Account', riskLevel: 'High' },
    { id: 'ACC-11111', label: 'Account 11111', type: 'Account', riskLevel: 'Medium' },
    { id: 'ACC-22222', label: 'Account 22222', type: 'Account', riskLevel: 'Low' },
    { id: 'ACC-33333', label: 'Account 33333', type: 'Account', riskLevel: 'High' },
    { id: 'MER-Store001', label: 'Store 001 (NYC)', type: 'Merchant', riskLevel: 'Medium' },
    { id: 'MER-Store002', label: 'Store 002 (LA)', type: 'Merchant', riskLevel: 'High' },
    { id: 'MER-OnlineShop', label: 'Online Shop', type: 'Merchant', riskLevel: 'Low' },
    { id: 'MER-Casino', label: 'Casino (Vegas)', type: 'Merchant', riskLevel: 'High' },
    { id: 'MER-GasStation', label: 'Gas Station (TX)', type: 'Merchant', riskLevel: 'Low' },
  ],
  edges: [
    { id: 'ACC-12345-MER-Store001', source: 'ACC-12345', target: 'MER-Store001', label: '$250.50', riskLevel: 'Low' },
    { id: 'ACC-67890-MER-Store002', source: 'ACC-67890', target: 'MER-Store002', label: '$15000.00', riskLevel: 'High' },
    { id: 'ACC-11111-MER-OnlineShop', source: 'ACC-11111', target: 'MER-OnlineShop', label: '$1200.75', riskLevel: 'Medium' },
    { id: 'ACC-22222-MER-GasStation', source: 'ACC-22222', target: 'MER-GasStation', label: '$65.00', riskLevel: 'Low' },
    { id: 'ACC-33333-MER-Casino', source: 'ACC-33333', target: 'MER-Casino', label: '$50000.00', riskLevel: 'High' },
    { id: 'ACC-12345-MER-Casino', source: 'ACC-12345', target: 'MER-Casino', label: '$35000.00', riskLevel: 'High' },
    { id: 'ACC-67890-MER-OnlineShop', source: 'ACC-67890', target: 'MER-OnlineShop', label: '$2500.00', riskLevel: 'Medium' },
  ],
};

const networkController = {
  // Get fraud network graph
  getFraudNetwork: async (req, res) => {
    const session = driver.session();
    try {
      const result = await session.run(queries.getFraudNetwork);
      
      // If no results from query, use mock data
      if (result.records.length === 0) {
        return res.json(mockNetworkData);
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
          label: `$${transaction.properties.amount?.toString() || 'N/A'}`,
          riskLevel: (transaction.properties.riskLevel?.toString() || 'Unknown'),
        });
      });

      res.json({ nodes, edges });
    } catch (error) {
      console.error('Error fetching fraud network:', error);
      // Return mock data as fallback
      res.json(mockNetworkData);
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
      // Return mock data as fallback
      const mockConnections = mockNetworkData.edges
        .filter(e => e.source === accountId)
        .map(e => ({
          account: e.source,
          merchant: e.target,
        }));
      if (mockConnections.length > 0) {
        return res.json(mockConnections);
      }
      res.json([]);
    } finally {
      await session.close();
    }
  },
};

module.exports = networkController;
