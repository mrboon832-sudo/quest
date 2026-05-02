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
      const result = await session.run(query, { limit: parseInt(limit) || 50 });
      if (result.records.length === 0) {
        return res.json([]);
      }
      const transactions = result.records.map(record => ({
        id: record.get('id'),
        fromAccount: record.get('fromAccount'),
        toAccount: record.get('toAccount'),
        amount: record.get('amount').toFloat(),
        date: record.get('date').toString(),
        risk: record.get('risk'),
        status: record.get('status') || 'Cleared',
      }));
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ error: 'Failed to fetch transactions', details: error.message });
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
      const t = record.get('t');
      const a = record.get('a');
      const m = record.get('m');
      res.json({
        id: t.properties.transactionId,
        fromAccount: a.properties.accountId,
        toAccount: m.properties.merchantId,
        amount: t.properties.amount,
        date: t.properties.timestamp,
        risk: t.properties.riskLevel,
        status: t.properties.status || 'Cleared',
      });
    } catch (error) {
      console.error('Error fetching transaction:', error);
      res.status(500).json({ error: 'Failed to fetch transaction', details: error.message });
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
      res.json({ message: 'Transaction flagged successfully', transactionId: id });
    } catch (error) {
      console.error('Error flagging transaction:', error);
      res.status(500).json({ error: 'Failed to flag transaction', details: error.message });
    } finally {
      await session.close();
    }
  },
};

module.exports = transactionController;
