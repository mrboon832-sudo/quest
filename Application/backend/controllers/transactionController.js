const { driver } = require('../config/neo4j');

const transactionController = {
  // GET: Fetch all transactions (admins see all, customers see their own)
  getAll: async (req, res) => {
    const session = driver.session();
    try {
      const userRole = req.user.role;

      // Admins see all transactions, customers initially see empty list
      // (Can be enhanced later to show customer-specific transactions)
      if (userRole !== 'admin') {
        return res.json([]);
      }

      const result = await session.run(`
        MATCH (t:Transaction)
        OPTIONAL MATCH (src:Account)-[:SENT_TRANSACTION]->(t)
        OPTIONAL MATCH (dst:Account)-[:RECEIVED_TRANSACTION]->(t)
        RETURN t.transaction_id AS id, src.account_id AS fromAccount, dst.account_id AS toAccount, 
               t.amount AS amount, t.timestamp AS date, t.status AS status, 
               t.is_flagged AS flagged, t.risk_score AS risk_score
        ORDER BY t.timestamp DESC
      `);

      const transactions = result.records.map(rec => ({
        id: rec.get('id'),
        fromAccount: rec.get('fromAccount'),
        toAccount: rec.get('toAccount'),
        amount: parseFloat(rec.get('amount')),
        date: rec.get('date')?.toString(),
        status: rec.get('status'),
        risk: rec.get('risk_score') > 0.7 ? 'High' : rec.get('risk_score') > 0.4 ? 'Medium' : 'Low',
      }));
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    } finally {
      await session.close();
    }
  },

  // GET: Fetch single transaction
  getById: async (req, res) => {
    const session = driver.session();
    try {
      const result = await session.run(`MATCH (t:Transaction {transaction_id: $id}) RETURN t`, { id: req.params.id });
      if (result.records.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(result.records[0].get('t').properties);
    } finally {
      await session.close();
    }
  },

  // GET: Real-time Graph Analysis for Risk Page
  getTransactionAnalysis: async (req, res) => {
    const session = driver.session();
    try {
      const result = await session.run(`
        MATCH (t:Transaction {transaction_id: $id})
        OPTIONAL MATCH (t)-[:OCCURRED_AT]->(l:Location)
        OPTIONAL MATCH (d:Device)-[:USED_FOR]->(t)
        RETURN t, l, d
      `, { id: req.params.id });

      if (result.records.length === 0) return res.status(404).json({ error: 'Transaction not found' });

      const record = result.records[0];
      const t = record.get('t').properties;
      
      res.json({
        id: t.transaction_id,
        amount: t.amount,
        status: t.status,
        date: t.timestamp?.toString() || 'N/A',
        risk: (t.risk_score || 0) * 100,
        account: 'Graph Linked Account',
        auditLogs: [
          { timestamp: new Date().toISOString(), action: 'Graph Analysis', details: `Risk score ${t.risk_score} verified by Neo4j` }
        ],
        timelineEvents: [
          { status: 'success', title: 'Neo4j Verified', description: 'Transaction relationship mapped' }
        ]
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal Server Error' });
    } finally {
      await session.close();
    }
  },

  // POST: Create Transaction
  createTransaction: async (req, res) => {
    const session = driver.session();
    let { fromAccountId, toAccountId, amount, deviceId, locationId, recipientEmail } = req.body;

    if (recipientEmail && !toAccountId) {
      toAccountId = recipientEmail.match(/^ACC\d+$/) ? recipientEmail : `ACC_${recipientEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
    }
    if (!fromAccountId) fromAccountId = 'ACC001';

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return res.status(400).json({ error: 'Invalid amount' });

    const txId = `TXN-${Date.now()}`;
    const timestamp = new Date().toISOString();

    try {
      await session.executeWrite(async tx => {
        const senderRes = await tx.run(
          `MATCH (a:Account {account_id: $id}) WHERE a.balance >= $amt SET a.balance = a.balance - $amt RETURN a.balance`, 
          { id: fromAccountId, amt: amountNum }
        );
        if (senderRes.records.length === 0) throw new Error('Insufficient funds');

        await tx.run(
          `MERGE (a:Account {account_id: $id}) ON CREATE SET a.balance = 0.0, a.status = 'Active' SET a.balance = a.balance + $amt`, 
          { id: toAccountId, amt: amountNum }
        );

        const riskScore = amountNum > 10000 ? 0.85 : 0.2;
        await tx.run(`
          MATCH (src:Account {account_id: $fromId})
          MATCH (dst:Account {account_id: $toId})
          CREATE (t:Transaction {
            transaction_id: $txId, amount: $amount, timestamp: datetime($ts),
            status: 'Completed', is_flagged: $flagged, risk_score: $risk
          })
          CREATE (src)-[:SENT_TRANSACTION]->(t)
          CREATE (dst)-[:RECEIVED_TRANSACTION]->(t)
          WITH t
          MERGE (d:Device {device_id: $devId}) CREATE (d)-[:USED_FOR]->(t)
          WITH t
          MERGE (l:Location {location_id: $locId}) CREATE (t)-[:OCCURRED_AT]->(l)
        `, { 
          fromId: fromAccountId, toId: toAccountId, txId, 
          amount: amountNum, ts: timestamp, flagged: amountNum > 10000, 
          risk: riskScore, devId: deviceId || 'UNKNOWN_DEV', locId: locationId || 'UNKNOWN_LOC' 
        });
      });
      res.status(201).json({ success: true, transactionId: txId });
    } catch (err) {
      res.status(500).json({ error: 'Transaction failed', details: err.message });
    } finally {
      await session.close();
    }
  },

  // PUT: Flag Transaction
  flagTransaction: async (req, res) => {
    const session = driver.session();
    try {
      await session.run(`MATCH (t:Transaction {transaction_id: $id}) SET t.is_flagged = true, t.risk_score = 0.95`, { id: req.params.id });
      res.json({ success: true });
    } finally {
      await session.close();
    }
  }
};

module.exports = transactionController;
