const fraudDetectionQueries = {
  findSuspiciousAccounts: `
    MATCH (a:Account)-[:SENT_TRANSACTION]->(t:Transaction)
    WHERE t.amount > 10000
      AND t.timestamp > datetime() - duration({days: 7})
    RETURN a.account_id                AS accountId,
           count(t)                   AS transactionCount,
           sum(t.amount)              AS totalAmount,
           collect(t.transaction_id)  AS transactions
    ORDER BY totalAmount DESC
    LIMIT 20
  `,

  findMoneyLaunderingRings: `
    MATCH path = (a:Account)-[:SENT_TRANSACTION]->(t1:Transaction)<-[:RECEIVED_TRANSACTION]-(b:Account)-[:SENT_TRANSACTION]->(t2:Transaction)<-[:RECEIVED_TRANSACTION]-(a)
    RETURN path
    LIMIT 10
  `,

  findSharedDeviceAccounts: `
    MATCH (c1:Customer)-[:USES_DEVICE]->(d:Device)<-[:USES_DEVICE]-(c2:Customer)
    WHERE c1.customer_id <> c2.customer_id
    RETURN c1.customer_id AS account1,
           c2.customer_id AS account2,
           count(d) AS sharedDevices
    ORDER BY sharedDevices DESC
  `,

    // Updated to fetch actual Customer names and Account IDs
  getFraudNetwork: `
    MATCH (c1:Customer)-[:OWNS_ACCOUNT]->(a:Account)-[:SENT_TRANSACTION]->(t:Transaction)<-[:RECEIVED_TRANSACTION]-(b:Account)<-[:OWNS_ACCOUNT]-(c2:Customer)
    WHERE t.risk_score > 0.6 OR t.is_flagged = true
    RETURN 
      c1.name AS senderName, a.account_id AS senderId, 
      t.amount AS amount, t.risk_score AS risk, 
      c2.name AS receiverName, b.account_id AS receiverId
    LIMIT 100
  `,

  // Truly dynamic trend query
  getTransactionTrend: `
    MATCH (t:Transaction)
    WITH t.timestamp.year AS year, t.timestamp.month AS month, t.is_flagged AS flagged
    RETURN year, 
           month, 
           count(CASE WHEN flagged = false THEN 1 END) AS normal, 
           count(CASE WHEN flagged = true THEN 1 END) AS flagged
    ORDER BY year, month
  `,

  getDashboardStats: `
    MATCH (a:Account)
    WITH count(DISTINCT a) AS totalAccounts
    MATCH (t:Transaction)
    RETURN totalAccounts,
           count(t) AS totalTransactions,
           COALESCE(sum(CASE WHEN t.amount IS NOT NULL THEN t.amount ELSE 0 END), 0) AS totalVolume,
           count(CASE WHEN t.is_flagged = true THEN 1 END) AS flaggedTransactions
  `,

  adminSummary: `
    MATCH (c:Customer)
    OPTIONAL MATCH (c)-[:OWNS_ACCOUNT]->(a:Account)
    RETURN
      count(DISTINCT c) AS totalCustomers,
      count(DISTINCT a) AS totalAccounts,
      count(CASE WHEN a.status = 'Flagged' OR a.status = 'Suspended' THEN 1 END) AS flaggedAccounts,
      count(CASE WHEN c.risk_score > 0.5 THEN 1 END) AS highRiskCustomers
  `,

  getRiskDistribution: `
    MATCH (t:Transaction)
    RETURN CASE 
             WHEN t.risk_score > 0.7 THEN 'High' 
             WHEN t.risk_score > 0.4 THEN 'Medium' 
             ELSE 'Low' 
           END AS risk,
           count(*) AS count
    ORDER BY count DESC
  `,

  getTransactionTrend: `
    MATCH (t:Transaction)
    RETURN 2026 AS year,
           4 AS month,
           count(CASE WHEN t.is_flagged <> true THEN 1 END) AS normal,
           count(CASE WHEN t.is_flagged = true THEN 1 END) AS flagged
  `,
};

module.exports = fraudDetectionQueries;
