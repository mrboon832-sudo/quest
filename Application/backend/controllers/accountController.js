// accountController.js - Updated version

const { driver } = require('../config/neo4j');
const neo4j = require('neo4j-driver');

// Helper to prevent .toFloat() or .toNumber() crashes on null values
const safeFloat = (val) => {
  if (val === null || val === undefined) return 0.0;
  if (typeof val === 'object' && val !== null) {
    if (typeof val.toFloat === 'function') return val.toFloat();
    if (typeof val.toNumber === 'function') return val.toNumber();
  }
  return parseFloat(val) || 0.0;
};

const accountController = {
  // 1. Get Balance - FIXED: Better error handling
  getBalance: async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'User not authenticated' });

    const session = driver.session();
    try {
      const result = await session.run(
        `MATCH (c:Customer {customer_id: $userId})-[:OWNS_ACCOUNT]->(a:Account)
         RETURN COALESCE(a.balance, 0.0) AS balance, a.account_id AS accountId`,
        { userId }
      );

      if (result.records.length === 0) {
        return res.status(404).json({ error: 'Account not found' });
      }

      const account = result.records[0];
      res.json({
        balance: safeFloat(account.get('balance')),
        accountId: account.get('accountId'),
      });
    } catch (err) {
      console.error('Balance Error:', err);
      res.status(500).json({ error: 'Failed to fetch balance', details: err.message });
    } finally {
      await session.close();
    }
  },

  // 2. Get Recent Transactions - FIXED: Safer query
  getRecentTransactions: async (req, res) => {
    const userId = req.user?.userId;
    const limit = parseInt(req.query.limit) || 5;

    if (!userId) return res.status(401).json({ error: 'User not authenticated' });

    const session = driver.session();
    try {
      const result = await session.run(
        `
        MATCH (c:Customer {customer_id: $userId})-[:OWNS_ACCOUNT]->(a:Account)
        OPTIONAL MATCH (a)-[r:SENT_TRANSACTION]->(t:Transaction)
        RETURN t.transaction_id AS id,
               COALESCE(t.amount, 0.0) AS amount,
               t.timestamp AS date,
               COALESCE(t.status, 'Completed') AS status,
               'Withdrawal' AS type,
               COALESCE(t.risk_score, 0.0) AS risk
        ORDER BY t.timestamp DESC
        LIMIT $limit
        `,
        { userId, limit: neo4j.int(limit) }
      );

      const transactions = result.records
        .filter(record => record.get('id') !== null) // Only include transactions that exist
        .map(record => ({
          id: record.get('id'),
          amount: safeFloat(record.get('amount')),
          date: record.get('date')?.toString() || new Date().toISOString(),
          status: record.get('status'),
          type: record.get('type'),
          risk: safeFloat(record.get('risk')),
          description: record.get('type') === 'Withdrawal' ? 'Withdrawal from account' : '',
        }));

      res.json({ transactions, count: transactions.length });
    } catch (err) {
      console.error('Recent Transactions Error:', err);
      res.status(500).json({ error: 'Failed to fetch transactions', details: err.message });
    } finally {
      await session.close();
    }
  },

  // 3. Deposit - FIXED: Better balance handling
  deposit: async (req, res) => {
    const userId = req.user?.userId;
    const { amount } = req.body;
    
    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const session = driver.session();
    try {
      const result = await session.run(
        `MATCH (c:Customer {customer_id: $userId})-[:OWNS_ACCOUNT]->(a:Account)
         RETURN a.account_id AS accountId, COALESCE(a.balance, 0.0) AS currentBalance`,
        { userId }
      );
      
      if (result.records.length === 0) {
        return res.status(404).json({ error: 'Account not found' });
      }

      const currentBalance = safeFloat(result.records[0].get('currentBalance'));
      const newBalance = currentBalance + parseFloat(amount);
      const accountId = result.records[0].get('accountId');

      // Update balance
      await session.run(
        `MATCH (a:Account {account_id: $accountId})
         SET a.balance = $newBalance`,
        { accountId, newBalance }
      );

      // Create transaction record
      const txId = `DEP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      await session.run(
        `MATCH (a:Account {account_id: $accountId})
         CREATE (t:Transaction {
           transaction_id: $txId,
           amount: $amount,
           timestamp: datetime(),
           status: 'Completed',
           is_flagged: false,
           risk_score: 0.0,
           type: 'Deposit'
         })
         CREATE (a)-[:RECEIVED_TRANSACTION]->(t)`,
        { accountId, txId, amount: parseFloat(amount) }
      );

      res.json({ 
        success: true, 
        newBalance,
        transactionId: txId
      });
    } catch (err) {
      console.error('Deposit Error:', err);
      res.status(500).json({ error: 'Deposit failed', details: err.message });
    } finally {
      await session.close();
    }
  },

  // 4. Withdraw - FIXED: Better balance handling
  withdraw: async (req, res) => {
    const userId = req.user?.userId;
    const { amount } = req.body;
    
    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const session = driver.session();
    try {
      const result = await session.run(
        `MATCH (c:Customer {customer_id: $userId})-[:OWNS_ACCOUNT]->(a:Account)
         RETURN a.account_id AS accountId, COALESCE(a.balance, 0.0) AS currentBalance`,
        { userId }
      );
      
      if (result.records.length === 0) {
        return res.status(404).json({ error: 'Account not found' });
      }

      const currentBalance = safeFloat(result.records[0].get('currentBalance'));
      const amountNum = parseFloat(amount);
      
      if (currentBalance < amountNum) {
        return res.status(400).json({ error: 'Insufficient funds' });
      }

      const newBalance = currentBalance - amountNum;
      const accountId = result.records[0].get('accountId');

      // Update balance
      await session.run(
        `MATCH (a:Account {account_id: $accountId})
         SET a.balance = $newBalance`,
        { accountId, newBalance }
      );

      // Create transaction record
      const txId = `WTH-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      await session.run(
        `MATCH (a:Account {account_id: $accountId})
         CREATE (t:Transaction {
           transaction_id: $txId,
           amount: $amount,
           timestamp: datetime(),
           status: 'Completed',
           is_flagged: false,
           risk_score: 0.0,
           type: 'Withdrawal'
         })
         CREATE (a)-[:SENT_TRANSACTION]->(t)`,
        { accountId, txId, amount: amountNum }
      );

      res.json({ success: true, newBalance, transactionId: txId });
    } catch (err) {
      console.error('Withdrawal Error:', err);
      res.status(500).json({ error: 'Withdrawal failed', details: err.message });
    } finally {
      await session.close();
    }
  },

  // 5. Transfer - FIXED: Better validation and error messages
  transfer: async (req, res) => {
    const userId = req.user?.userId;
    const { toAccountId, amount } = req.body;
    
    // Validate input
    if (!toAccountId) {
      return res.status(400).json({ error: 'Recipient account ID is required' });
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const amountNum = parseFloat(amount);
    const session = driver.session();
    const txId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    try {
      // Get sender account info
      const senderResult = await session.run(
        `MATCH (c:Customer {customer_id: $userId})-[:OWNS_ACCOUNT]->(src:Account)
         RETURN src.account_id AS accountId, COALESCE(src.balance, 0.0) AS balance`,
        { userId }
      );
      
      if (senderResult.records.length === 0) {
        return res.status(404).json({ error: 'Sender account not found' });
      }

      const senderBalance = safeFloat(senderResult.records[0].get('balance'));
      
      if (senderBalance < amountNum) {
        return res.status(400).json({ error: 'Insufficient funds for transfer' });
      }

      // Check if recipient exists
      const recipientResult = await session.run(
        `MATCH (dst:Account {account_id: $toAccountId})
         RETURN dst.account_id AS accountId, COALESCE(dst.balance, 0.0) AS balance`,
        { toAccountId }
      );
      
      if (recipientResult.records.length === 0) {
        return res.status(404).json({ error: 'Recipient account not found' });
      }

      const senderAccountId = senderResult.records[0].get('accountId');
      const recipientAccountId = recipientResult.records[0].get('accountId');
      const recipientBalance = safeFloat(recipientResult.records[0].get('balance'));

      // Perform transfer
      await session.run(
        `
        MATCH (src:Account {account_id: $senderAccountId})
        MATCH (dst:Account {account_id: $recipientAccountId})
        
        SET src.balance = src.balance - $amount
        SET dst.balance = COALESCE(dst.balance, 0.0) + $amount
        
        CREATE (t:Transaction {
          transaction_id: $txId,
          amount: $amount,
          timestamp: datetime(),
          status: 'Completed',
          is_flagged: false,
          risk_score: 0.2,
          type: 'Transfer'
        })
        CREATE (src)-[:SENT_TRANSACTION]->(t)
        CREATE (dst)-[:RECEIVED_TRANSACTION]->(t)
        
        RETURN src.balance AS newBalance
        `,
        { senderAccountId, recipientAccountId, amount: amountNum, txId }
      );

      const newBalance = senderBalance - amountNum;

      res.json({ 
        success: true, 
        newBalance, 
        transactionId: txId,
        recipientAccount: recipientAccountId
      });
    } catch (err) {
      console.error('Transfer Error:', err);
      res.status(500).json({ error: 'Transfer failed', details: err.message });
    } finally {
      await session.close();
    }
  }
};

module.exports = accountController;