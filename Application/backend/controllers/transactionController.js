const { driver } = require('../config/neo4j');

const transactionController = {
  createTransaction: async (req, res) => {
    const session = driver.session();
    const { fromAccountId, toAccountId, amount, deviceId, locationId } = req.body;

    if (!fromAccountId || !toAccountId || amount === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const txId = `TXN-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      const createTxCypher = `
        MATCH (src:Account {account_id: $fromAccountId})
        MATCH (dst:Account {account_id: $toAccountId})
        CREATE (t:Transaction {
          transaction_id: $txId,
          amount: $amount,
          currency: 'USD',
          timestamp: datetime($timestamp),
          status: 'Completed',
          is_flagged: false,
          risk_score: 0.2
        })
        CREATE (src)-[:SENT_TRANSACTION]->(t)
        CREATE (dst)-[:RECEIVED_TRANSACTION]->(t)
        
        FOREACH (ignore IN CASE WHEN $deviceId IS NOT NULL THEN [1] ELSE [] END |
          MERGE (d:Device {device_id: $deviceId})
          // Note: Schema says Customer uses device, but for the TX we track it here if needed
          // or link to Customer via the Account
          MATCH (src)<-[:OWNS_ACCOUNT]-(c:Customer)
          MERGE (c)-[:USES_DEVICE]->(d)
        )
        FOREACH (ignore IN CASE WHEN $locationId IS NOT NULL THEN [1] ELSE [] END |
          MERGE (l:Location {location_id: $locationId})
          CREATE (t)-[:OCCURRED_AT]->(l)
        )
        RETURN t`;

      await session.run(createTxCypher, {
        fromAccountId, toAccountId, amount: parseFloat(amount),
        txId, timestamp, deviceId: deviceId || null, locationId: locationId || null,
      });

      // Fraud Rule: High Value
      await session.run(
        `MATCH (t:Transaction {transaction_id: $txId})
         WHERE t.amount > 3000
         SET t.is_flagged = true, t.risk_score = 0.8`, { txId }
      );

      res.status(201).json({ success: true, transactionId: txId });
    } catch (err) {
      res.status(500).json({ error: 'Transaction failed', details: err.message });
    } finally {
      await session.close();
    }
  },

  getAll: async (req, res) => {
    const session = driver.session();
    try {
      const result = await session.run(`
        MATCH (src:Account)-[:SENT_TRANSACTION]->(t:Transaction)<-[:RECEIVED_TRANSACTION]-(dst:Account)
        RETURN t.transaction_id AS transaction_id,
               src.account_id AS fromAccount,
               dst.account_id AS toAccount,
               t.amount AS amount,
               COALESCE(t.currency, 'USD') AS currency,
               t.timestamp AS timestamp,
               t.status AS status,
               COALESCE(t.is_flagged, false) AS is_flagged,
               COALESCE(t.risk_score, 0.0) AS risk_score
        ORDER BY t.timestamp DESC
      `);

      const transactions = result.records.map(record => {
        const transactionId = record.get('transaction_id');
        const amountValue = record.get('amount');
        const riskScoreValue = record.get('risk_score');
        const timestampValue = record.get('timestamp');
        const isFlaggedValue = record.get('is_flagged');
        const riskScore = riskScoreValue && typeof riskScoreValue.toNumber === 'function'
          ? riskScoreValue.toNumber()
          : parseFloat(riskScoreValue || 0);

        return {
          // Schema-aligned fields
          transaction_id: transactionId,
          fromAccount: record.get('fromAccount'),
          toAccount: record.get('toAccount'),
          amount: amountValue && typeof amountValue.toNumber === 'function' ? amountValue.toNumber() : parseFloat(amountValue || 0),
          currency: record.get('currency') || 'USD',
          timestamp: timestampValue ? timestampValue.toString() : null,
          status: record.get('status'),
          is_flagged: typeof isFlaggedValue === 'boolean' ? isFlaggedValue : String(isFlaggedValue) === 'true',
          risk_score: riskScore,

          // Backward-compatible aliases
          id: transactionId,
          date: timestampValue ? timestampValue.toString() : null,
          risk: riskScore > 0.7 ? 'High' : riskScore > 0.4 ? 'Medium' : 'Low',
        };
      });
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch transactions' });
    } finally {
      await session.close();
    }
  },

  getById: async (req, res) => {
    const { id } = req.params;
    const session = driver.session();
    try {
      const result = await session.run(`
        MATCH (t:Transaction {transaction_id: $id})
        RETURN t.transaction_id AS transaction_id,
               t.amount AS amount,
               COALESCE(t.currency, 'USD') AS currency,
               t.timestamp AS timestamp,
               t.status AS status,
               COALESCE(t.is_flagged, false) AS is_flagged,
               COALESCE(t.risk_score, 0.0) AS risk_score
      `, { id });

      if (result.records.length === 0) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      const record = result.records[0];
      const amountValue = record.get('amount');
      const riskScoreValue = record.get('risk_score');
      const timestampValue = record.get('timestamp');
      const isFlaggedValue = record.get('is_flagged');
      const riskScore = riskScoreValue && typeof riskScoreValue.toNumber === 'function'
        ? riskScoreValue.toNumber()
        : parseFloat(riskScoreValue || 0);

      res.json({
        // Schema-aligned fields
        transaction_id: record.get('transaction_id'),
        amount: amountValue && typeof amountValue.toNumber === 'function' ? amountValue.toNumber() : parseFloat(amountValue || 0),
        currency: record.get('currency') || 'USD',
        timestamp: timestampValue ? timestampValue.toString() : null,
        status: record.get('status'),
        is_flagged: typeof isFlaggedValue === 'boolean' ? isFlaggedValue : String(isFlaggedValue) === 'true',
        risk_score: riskScore,

        // Backward-compatible aliases
        id: record.get('transaction_id'),
        date: timestampValue ? timestampValue.toString() : null,
        flagged: typeof isFlaggedValue === 'boolean' ? isFlaggedValue : String(isFlaggedValue) === 'true',
        risk: riskScore,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch transaction', details: error.message });
    } finally {
      await session.close();
    }
  },

  flagTransaction: async (req, res) => {
    const { id } = req.params;
    const session = driver.session();
    try {
      const result = await session.run(`
        MATCH (t:Transaction {transaction_id: $id})
        SET t.is_flagged = true, t.risk_score = 0.95
        RETURN t.transaction_id AS id
      `, { id });

      if (result.records.length === 0) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      res.json({ success: true, transactionId: id });
    } catch (error) {
      res.status(500).json({ error: 'Failed to flag transaction', details: error.message });
    } finally {
      await session.close();
    }
  }
};

module.exports = transactionController;
