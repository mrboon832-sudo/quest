const { driver } = require('../config/neo4j');
const queries = require('../queries/fraudDetection');

const networkController = {
  getFraudNetwork: async (req, res) => {
    const session = driver.session();
    try {
      const result = await session.run(queries.getFraudNetwork);
      
      const nodes = [];
      const edges = [];
      const nodeIds = new Set();

      result.records.forEach(record => {
        const sName = record.get('senderName');
        const sId = record.get('senderId');
        const rName = record.get('receiverName');
        const rId = record.get('receiverId');
        const amount = record.get('amount');
        const risk = record.get('risk');

        // Add Sender Node
        if (!nodeIds.has(sId)) {
          nodes.push({
            id: sId,
            label: `${sName} (${sId})`, // Actual name from DB
            type: 'Account',
            riskLevel: risk > 0.7 ? 'High' : risk > 0.4 ? 'Medium' : 'Low',
          });
          nodeIds.add(sId);
        }

        // Add Receiver Node
        if (!nodeIds.has(rId)) {
          nodes.push({
            id: rId,
            label: `${rName} (${rId})`, // Actual name from DB
            type: 'Account',
            riskLevel: risk > 0.7 ? 'High' : risk > 0.4 ? 'Medium' : 'Low',
          });
          nodeIds.add(rId);
        }

        // Add Edge (The Transaction)
        edges.push({
          id: `${sId}-${rId}-${Date.now()}`,
          source: sId,
          target: rId,
          label: `$${amount.toFloat()}`,
          riskLevel: risk > 0.7 ? 'High' : risk > 0.4 ? 'Medium' : 'Low',
        });
      });

      res.json({ nodes, edges });
    } catch (error) {
      console.error('Network View Error:', error);
      res.status(500).json({ error: 'Failed to fetch real-time network data' });
    } finally {
      await session.close();
    }
  },

  getAccountConnections: async (req, res) => {
    const session = driver.session();
    const { accountId } = req.params;
    try {
      const result = await session.run(
        `MATCH (a:Account {account_id: $accountId})-[:SENT_TRANSACTION|RECEIVED_TRANSACTION]-(t:Transaction)-[:SENT_TRANSACTION|RECEIVED_TRANSACTION]-(other:Account)
         WHERE a <> other
         RETURN other.account_id AS otherId`,
        { accountId }
      );
      
      const connections = result.records.map(record => ({
        account: record.get('otherId'),
      }));
      res.json(connections);
    } catch (error) {
      console.error('Connections Error:', error);
      res.status(500).json({ error: 'Failed to fetch connections' });
    } finally {
      await session.close();
    }
  },
};

module.exports = networkController;
