const { driver } = require('../config/neo4j');
const queries = require('../queries/fraudDetection');

const transactionController = {
  // Get all transactions
  getAll: async (req, res) => {
    const session = driver.session();
    const { riskLevel, limit = 50 } = req.query;
    try {
      let query = `
        MATCH (a:Account)-[t:TRANSACTED_WITH]->(m:Merchant)
        RETURN t.transactionId AS id, a.accountId AS fromAccount, 
               m.merchantId AS toAccount, t.amount AS amount, 
               t.timestamp AS date, t.riskLevel AS risk, t.status AS status
        ORDER BY t.timestamp DESC
        LIMIT toInteger($limit)
      `;
      const result = await session.run(query, { limit: parseInt(limit) });
      const transactions = result.records.map(record => ({
        id: record.id,
        fromAccount: record.fromAccount,
        toAccount: record.toAccount,
        amount: record.amount.toFloat(),
        date: record.date.toString(),
        risk: record.risk,
        status: record.status || 'Cleared',
      }));
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    } finally {
      await session.close();
    }
  },

  // Get transaction by ID
  getById: async (req, res) => {
    const session = driver.session();
    const { id } = req.params;
    try {
      const result = await session.run(
        `MATCH (a:Account)-[t:TRANSACTED_WITH {transactionId: $id}]->(m:Merchant)
         RETURN t, a, m`,
        { id }
      );
      if (result.records.length === 0) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      const record = result.records[0];
      res.json({
        id: record.t.properties.transactionId,
        fromAccount: record.a.properties.accountId,
        toAccount: record.m.properties.merchantId,
        amount: record.t.properties.amount,
        date: record.t.properties.timestamp,
        risk: record.t.properties.riskLevel,
        status: record.t.properties.status || 'Cleared',
      });
    } catch (error) {
      console.error('Error fetching transaction:', error);
      res.status(500).json({ error: 'Failed to fetch transaction' });
    } finally {
      await session.close();
    }
  },

  // Flag a transaction
  flagTransaction: async (req, res) => {
    const session = driver.session();
    const { id } = req.params;
    try {
      const result = await session.run(
        `MATCH (a:Account)-[t:TRANSACTED_WITH {transactionId: $id}]->(m:Merchant)
         SET t.status = 'Flagged', t.riskLevel = 'High'
         RETURN t`,
        { id }
      );
      if (result.records.length === 0) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      res.json({ message: 'Transaction flagged successfully' });
    } catch (error) {
      console.error('Error flagging transaction:', error);
      res.status(500).json({ error: 'Failed to flag transaction' });
    } finally {
      await session.close();
    }
  },
};

module.exports = transactionController;
