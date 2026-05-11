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
        const fraudLink = record.get('fraudLink');
        const sName = fraudLink.sourceCustomerName;
        const sId = fraudLink.sourceCustomerId;
        const rName = fraudLink.targetCustomerName;
        const rId = fraudLink.targetCustomerId;
        const amount = fraudLink.transactionAmount;
        const risk = fraudLink.transactionRiskScore;
        const sourceDevices = fraudLink.sourceDevices || [];
        const targetDevices = fraudLink.targetDevices || [];
        const sourceAccount = fraudLink.sourceAccountId;
        const targetAccount = fraudLink.targetAccountId;

        // Add Sender Node with account and device info
        if (!nodeIds.has(sId)) {
          const deviceInfo = sourceDevices
            .filter(d => d.deviceId)
            .map(d => `${d.deviceType} (${d.os})`)
            .join(', ') || 'No devices';
          
          nodes.push({
            id: sId,
            label: `${sName}\n(${sId})\nAccount: ${sourceAccount}\nDevices: ${deviceInfo}`,
            type: 'Customer',
            riskLevel: risk > 0.7 ? 'High' : risk > 0.4 ? 'Medium' : 'Low',
            account: sourceAccount,
            devices: sourceDevices,
          });
          nodeIds.add(sId);
        }

        // Add Receiver Node with account and device info
        if (!nodeIds.has(rId)) {
          const deviceInfo = targetDevices
            .filter(d => d.deviceId)
            .map(d => `${d.deviceType} (${d.os})`)
            .join(', ') || 'No devices';
          
          nodes.push({
            id: rId,
            label: `${rName}\n(${rId})\nAccount: ${targetAccount}\nDevices: ${deviceInfo}`,
            type: 'Customer',
            riskLevel: risk > 0.7 ? 'High' : risk > 0.4 ? 'Medium' : 'Low',
            account: targetAccount,
            devices: targetDevices,
          });
          nodeIds.add(rId);
        }

        // Add Edge (The Transaction) with detailed information
        const transactionLabel = `$${amount}\n(Risk: ${(risk * 100).toFixed(0)}%)\nAccount: ${sourceAccount}→${targetAccount}`;
        edges.push({
          id: `${sId}-${rId}-${fraudLink.transactionId}`,
          source: sId,
          target: rId,
          label: transactionLabel,
          riskLevel: risk > 0.7 ? 'High' : risk > 0.4 ? 'Medium' : 'Low',
          transactionId: fraudLink.transactionId,
          amount: amount,
          currency: fraudLink.transactionCurrency,
          riskScore: risk,
          isFlagged: fraudLink.transactionFlagged,
          timestamp: fraudLink.transactionTimestamp,
          sourceAccount: sourceAccount,
          targetAccount: targetAccount,
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
