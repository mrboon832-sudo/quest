// Cypher queries for fraud detection

const fraudDetectionQueries = {
  // Find suspicious accounts with high transaction velocity
  findSuspiciousAccounts: `
    MATCH (a:Account)-[t:TRANSACTED_WITH]->(m:Merchant)
    WHERE t.amount > 10000 AND t.timestamp > datetime() - duration({days: 7})
    RETURN a.accountId AS accountId, 
           count(t) AS transactionCount, 
           sum(t.amount) AS totalAmount,
           collect(DISTINCT m.merchantId) AS merchants
    ORDER BY totalAmount DESC
    LIMIT 20
  `,

  // Find potential money laundering rings (circular transactions)
  findMoneyLaunderingRings: `
    MATCH path = (a1:Account)-[:TRANSACTED_WITH*3..5]->(a1)
    WHERE all(r IN relationships(path) WHERE r.timestamp > datetime() - duration({days: 30}))
    RETURN path
    LIMIT 10
  `,

  // Find accounts sharing the same IP/device (potential fraud network)
  findSharedDeviceAccounts: `
    MATCH (a1:Account)-[:USES]->(d:Device)<-[:USES]-(a2:Account)
    WHERE a1 <> a2
    WITH a1, a2, count(d) AS sharedDevices
    WHERE sharedDevices > 2
    RETURN a1.accountId AS account1, a2.accountId AS account2, sharedDevices
    ORDER BY sharedDevices DESC
  `,

  // Get account risk score
  getAccountRiskScore: `
    MATCH (a:Account {accountId: $accountId})
    OPTIONAL MATCH (a)-[t:TRANSACTED_WITH]->()
    WITH a, 
         count(t) AS totalTransactions,
         sum(t.amount) AS totalAmount,
         avg(t.amount) AS avgAmount,
         count(CASE WHEN t.amount > 10000 THEN 1 END) AS highValueTransactions
    RETURN a.accountId AS accountId,
           (CASE 
             WHEN highValueTransactions > 5 THEN 80
             WHEN highValueTransactions > 2 THEN 50
             ELSE 20
           END) + 
           (CASE 
             WHEN totalAmount > 100000 THEN 20
             WHEN totalAmount > 50000 THEN 10
             ELSE 0
           END) AS riskScore
  `,

  // Get fraud network for visualization
  getFraudNetwork: `
    MATCH (a:Account)-[t:TRANSACTED_WITH]->(m:Merchant)
    WHERE t.riskLevel = 'High' OR t.riskLevel = 'Medium'
    RETURN a, t, m
    LIMIT 100
  `,

  // Get transaction history for an account
  getAccountTransactions: `
    MATCH (a:Account {accountId: $accountId})-[t:TRANSACTED_WITH]->(m:Merchant)
    RETURN t.transactionId AS transactionId,
           t.amount AS amount,
           t.timestamp AS timestamp,
           t.riskLevel AS riskLevel,
           m.merchantId AS merchantId
    ORDER BY t.timestamp DESC
    LIMIT 50
  `,

  // Get dashboard statistics
  getDashboardStats: `
    MATCH (a:Account)
    OPTIONAL MATCH (a)-[t:TRANSACTED_WITH]->()
    RETURN count(DISTINCT a) AS totalAccounts,
           count(t) AS totalTransactions,
           sum(t.amount) AS totalVolume,
           count(CASE WHEN t.riskLevel = 'High' THEN 1 END) AS highRiskTransactions
  `,

  // Get risk distribution
  getRiskDistribution: `
    MATCH (a:Account)-[t:TRANSACTED_WITH]->()
    WITH t.riskLevel AS risk, count(t) AS count
    RETURN risk, count
    ORDER BY 
      CASE risk 
        WHEN 'High' THEN 1 
        WHEN 'Medium' THEN 2 
        WHEN 'Low' THEN 3 
      END
  `,

  // Get transaction trend (monthly)
  getTransactionTrend: `
    MATCH (t:Transaction)
    WITH t, datetime(t.timestamp) AS dt
    RETURN dt.month AS month, 
           count(CASE WHEN t.riskLevel = 'Normal' THEN 1 END) AS normal,
           count(CASE WHEN t.riskLevel IN ['High', 'Medium'] THEN 1 END) AS flagged
    ORDER BY month
  `,
};

module.exports = fraudDetectionQueries;
