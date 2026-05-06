const { driver } = require('../config/neo4j');
const queries = require('../queries/fraudDetection');

// Mock data for development/demo
const mockTransactions = [
  {
    id: 'TXN001',
    fromAccount: 'ACC-12345',
    toAccount: 'MER-Store001',
    amount: 250.50,
    date: new Date(Date.now() - 86400000).toISOString(),
    risk: 'Low',
    status: 'Cleared',
  },
  {
    id: 'TXN002',
    fromAccount: 'ACC-67890',
    toAccount: 'MER-Store002',
    amount: 15000.00,
    date: new Date(Date.now() - 172800000).toISOString(),
    risk: 'High',
    status: 'Flagged',
  },
  {
    id: 'TXN003',
    fromAccount: 'ACC-11111',
    toAccount: 'MER-OnlineShop',
    amount: 1200.75,
    date: new Date(Date.now() - 259200000).toISOString(),
    risk: 'Medium',
    status: 'Cleared',
  },
  {
    id: 'TXN004',
    fromAccount: 'ACC-22222',
    toAccount: 'MER-GasStation',
    amount: 65.00,
    date: new Date(Date.now() - 345600000).toISOString(),
    risk: 'Low',
    status: 'Cleared',
  },
  {
    id: 'TXN005',
    fromAccount: 'ACC-33333',
    toAccount: 'MER-Casino',
    amount: 50000.00,
    date: new Date(Date.now() - 432000000).toISOString(),
    risk: 'High',
    status: 'Flagged',
  },
  {
    id: 'TXN006',
    fromAccount: 'ACC-44444',
    toAccount: 'MER-Grocery',
    amount: 125.30,
    date: new Date(Date.now() - 518400000).toISOString(),
    risk: 'Low',
    status: 'Cleared',
  },
  {
    id: 'TXN007',
    fromAccount: 'ACC-55555',
    toAccount: 'MER-Electronics',
    amount: 2999.99,
    date: new Date(Date.now() - 604800000).toISOString(),
    risk: 'Medium',
    status: 'Cleared',
  },
  {
    id: 'TXN008',
    fromAccount: 'ACC-12345',
    toAccount: 'MER-Restaurant',
    amount: 89.50,
    date: new Date(Date.now() - 691200000).toISOString(),
    risk: 'Low',
    status: 'Cleared',
  },
];

const transactionController = {
  // Get all transactions
  getAll: async (req, res) => {
    const session = driver.session();
    const { riskLevel, limit = 50, skip = 0 } = req.query;
    try {
      let query = `
        MATCH (a:Account)-[t:TRANSACTED_WITH]->(m:Merchant)
      `;
      const params = { limit: parseInt(limit) || 50, skip: parseInt(skip) || 0 };
      
      // Add risk filter if provided
      if (riskLevel) {
        query += `
        WHERE t.riskLevel = $riskLevel
        `;
        params.riskLevel = riskLevel;
      }
      
      query += `
        RETURN t.transactionId AS id, a.accountId AS fromAccount, 
               m.merchantId AS toAccount, t.amount AS amount, 
               t.timestamp AS date, t.riskLevel AS risk, t.status AS status
        ORDER BY t.timestamp DESC
        SKIP toInteger($skip)
        LIMIT toInteger($limit)
      `;
      const result = await session.run(query, params);
      
      // If no results from query, use mock data
      if (result.records.length === 0) {
        let mockData = mockTransactions;
        if (riskLevel) {
          mockData = mockData.filter(t => t.risk === riskLevel);
        }
        const paginatedData = mockData.slice(skip, skip + limit);
        return res.json(paginatedData);
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
      // Return mock data as fallback on error
      let mockData = mockTransactions;
      if (riskLevel) {
        mockData = mockData.filter(t => t.risk === riskLevel);
      }
      const paginatedData = mockData.slice(skip, skip + limit);
      res.json(paginatedData);
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
      // Return mock data as fallback
      const mockTx = mockTransactions.find(t => t.id === id);
      if (mockTx) {
        return res.json(mockTx);
      }
      res.status(404).json({ error: 'Transaction not found' });
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
