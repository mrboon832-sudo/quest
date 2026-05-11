/**
 * Fraud Detection Queries for Neo4j Database
 * Schema: Customer - OWNS_ACCOUNT -> Account - SENT/RECEIVED_TRANSACTION -> Transaction - OCCURRED_AT -> Location
 *         Customer - USES_DEVICE -> Device - USED_AT -> Location
 * Neo4j Connection: neo4j+s://7ade6b99.databases.neo4j.io
 */

const fraudDetectionQueries = {
  /**
   * Find accounts with large transactions in the last 30 days (or any recent high-value transaction)
   * Pattern: (Account)-[:SENT_TRANSACTION]->(Transaction)
   */
  findSuspiciousAccounts: `
    MATCH (a:Account)-[:SENT_TRANSACTION]->(t:Transaction)
    WHERE t.amount > 5000
    WITH a, t, t.amount AS amount
    WHERE amount IS NOT NULL
    RETURN DISTINCT a.account_id AS accountId,
           a.status AS accountStatus,
           a.risk_level AS riskLevel,
           count(t) AS transactionCount,
           sum(t.amount) AS totalAmount,
           max(t.timestamp) AS lastTransaction,
           collect({id: t.transaction_id, amount: t.amount, risk: t.risk_score}) AS transactions
    ORDER BY totalAmount DESC
    LIMIT 20
  `,

  /**
   * Detect money laundering rings - circular transaction patterns
   * Pattern: (Account)-[:SENT_TRANSACTION]->(Transaction)<-[:RECEIVED_TRANSACTION]-(Account)
   */
  findMoneyLaunderingRings: `
    MATCH (a:Account)-[:SENT_TRANSACTION]->(t1:Transaction)<-[:RECEIVED_TRANSACTION]-(b:Account)
    WHERE a.account_id <> b.account_id
    RETURN DISTINCT a.account_id AS account1Id,
           b.account_id AS account2Id,
           t1.amount AS transaction1Amount,
           t1.risk_score AS transaction1Risk,
           t1.timestamp AS timestamp,
           count(DISTINCT t1) AS pairCount
    ORDER BY pairCount DESC, transaction1Amount DESC
    LIMIT 50
  `,

  /**
   * Find customers sharing suspicious devices
   * Pattern: (Customer)-[:USES_DEVICE]->(Device)<-[:USES_DEVICE]-(Customer)
   */
  findSharedDeviceAccounts: `
    MATCH (c1:Customer)-[r1:USES_DEVICE]->(d:Device)<-[r2:USES_DEVICE]-(c2:Customer)
    RETURN DISTINCT c1.customer_id AS customer1Id,
           c1.customer_name AS customer1Name,
           c2.customer_id AS customer2Id,
           c2.customer_name AS customer2Name,
           d.device_id AS deviceId,
           d.device_type AS deviceType
    LIMIT 50
  `,

  /**
   * Build fraud network - connected accounts through transactions
   * Pattern: (Customer)-[:OWNS_ACCOUNT]->(Account)-[:SENT_TRANSACTION]->(Transaction)<-[:RECEIVED_TRANSACTION]-(Account)<-[:OWNS_ACCOUNT]-(Customer)
   */
  getFraudNetwork: `
    MATCH (c1:Customer)-[:OWNS_ACCOUNT]->(a1:Account)-[:SENT_TRANSACTION]->(t:Transaction)<-[:RECEIVED_TRANSACTION]-(a2:Account)<-[:OWNS_ACCOUNT]-(c2:Customer)
    WHERE c1.customer_id <> c2.customer_id
    RETURN {
      sourceCustomerId: c1.customer_id,
      sourceCustomerName: c1.name,
      sourceRiskScore: c1.risk_score,
      sourceAccountId: a1.account_id,
      sourceAccountStatus: a1.status,
      transactionId: t.transaction_id,
      transactionAmount: t.amount,
      transactionCurrency: t.currency,
      transactionRiskScore: t.risk_score,
      transactionFlagged: t.is_flagged,
      targetAccountId: a2.account_id,
      targetAccountStatus: a2.status,
      targetCustomerId: c2.customer_id,
      targetCustomerName: c2.name,
      targetRiskScore: c2.risk_score,
      transactionTimestamp: t.timestamp
    } AS fraudLink
    ORDER BY t.risk_score DESC
    LIMIT 100
  `,

  /**
   * Get transaction trend over time - monthly flagged vs normal
   * Aggregates by year and month
   */
  getTransactionTrend: `
    MATCH (t:Transaction)
    WITH t.timestamp.year AS year, t.timestamp.month AS month, t.is_flagged AS flagged, count(*) AS count
    RETURN {
      year: year,
      month: month,
      normalCount: sum(CASE WHEN flagged = false THEN count ELSE 0 END),
      flaggedCount: sum(CASE WHEN flagged = true THEN count ELSE 0 END),
      totalCount: sum(count),
      flaggedPercentage: round(100.0 * sum(CASE WHEN flagged = true THEN count ELSE 0 END) / sum(count), 2)
    } AS trend
    ORDER BY year, month
  `,

  /**
   * Dashboard statistics - total accounts, transactions, volume, and flagged count
   */
  getDashboardStats: `
    MATCH (a:Account)
    WITH count(DISTINCT a) AS totalAccounts
    MATCH (t:Transaction)
    WITH totalAccounts,
         count(DISTINCT t) AS totalTransactions,
         sum(t.amount) AS totalVolume,
         count(CASE WHEN t.is_flagged = true THEN 1 END) AS flaggedTransactions
    MATCH (c:Customer)
    RETURN {
      totalAccounts: totalAccounts,
      totalCustomers: count(DISTINCT c),
      totalTransactions: totalTransactions,
      totalVolume: COALESCE(totalVolume, 0),
      flaggedTransactions: flaggedTransactions,
      flagPercentage: round(100.0 * flaggedTransactions / totalTransactions, 2)
    } AS stats
  `,

  /**
   * Admin summary - customers, accounts, flagged/suspended accounts, and high-risk customers
   * Pattern: (Customer)-[:OWNS_ACCOUNT]->(Account)
   */
  adminSummary: `
    MATCH (c:Customer)
    OPTIONAL MATCH (c)-[:OWNS_ACCOUNT]->(a:Account)
    RETURN {
      totalCustomers: count(DISTINCT c),
      totalAccounts: count(DISTINCT a),
      flaggedAccounts: count(CASE WHEN a.status IN ['Flagged', 'Suspended'] THEN 1 END),
      activeAccounts: count(CASE WHEN a.status = 'Active' THEN 1 END),
      highRiskCustomers: count(CASE WHEN c.risk_score > 0.5 THEN 1 END),
      mediumRiskCustomers: count(CASE WHEN c.risk_score > 0.3 AND c.risk_score <= 0.5 THEN 1 END),
      lowRiskCustomers: count(CASE WHEN c.risk_score <= 0.3 THEN 1 END)
    } AS summary
  `,

  /**
   * Risk distribution - categorize transactions by risk level
   */
  getRiskDistribution: `
    MATCH (t:Transaction)
    WITH COUNT(t) AS totalCount
    MATCH (t:Transaction)
    WITH CASE 
           WHEN t.risk_score > 0.7 THEN 'High' 
           WHEN t.risk_score > 0.4 THEN 'Medium' 
           ELSE 'Low' 
         END AS riskCategory,
         count(*) AS count,
         sum(t.amount) AS totalAmount,
         totalCount
    RETURN {
      riskLevel: riskCategory,
      transactionCount: count,
      totalAmount: totalAmount,
      avgAmount: round(totalAmount / count, 2),
      percentage: round(100.0 * count / totalCount, 2)
    } AS distribution
    ORDER BY count DESC
  `,

  /**
   * Find high-risk transactions with location data
   * Pattern: (Transaction)-[:OCCURRED_AT]->(Location)
   */
  getHighRiskTransactions: `
    MATCH (t:Transaction)-[:OCCURRED_AT]->(loc:Location)
    WHERE t.risk_score > 0.6 OR t.is_flagged = true
    RETURN {
      transactionId: t.transaction_id,
      amount: t.amount,
      currency: t.currency,
      riskScore: t.risk_score,
      flagged: t.is_flagged,
      status: t.status,
      timestamp: t.timestamp,
      city: loc.city,
      country: loc.country,
      isHighRiskLocation: loc.is_high_risk,
      latitude: loc.latitude,
      longitude: loc.longitude
    } AS transaction
    ORDER BY t.risk_score DESC
    LIMIT 50
  `,

  /**
   * Account risk assessment - check all risk factors
   * Pattern: (Customer)-[:OWNS_ACCOUNT]->(Account)-[:SENT_TRANSACTION]->(Transaction)
   */
  getAccountRiskAssessment: `
    MATCH (c:Customer)-[:OWNS_ACCOUNT]->(a:Account)
    OPTIONAL MATCH (a)-[:SENT_TRANSACTION]->(t:Transaction)
    RETURN a.account_id AS accountId,
           a.account_type AS accountType,
           a.status AS status,
           a.risk_level AS riskLevel,
           a.balance AS balance,
           c.customer_id AS customerId,
           c.name AS customerName,
           c.risk_score AS customerRiskScore,
           c.email AS customerEmail,
           count(DISTINCT t) AS transactionCount,
           count(CASE WHEN t.is_flagged = true THEN 1 END) AS flaggedTransactions,
           sum(CASE WHEN t.is_flagged = false THEN t.amount ELSE 0 END) AS normalTransactionTotal,
           sum(CASE WHEN t.is_flagged = true THEN t.amount ELSE 0 END) AS flaggedTransactionTotal,
           max(t.timestamp) AS lastTransactionTime
    ORDER BY a.risk_level DESC, c.risk_score DESC
    LIMIT 100
  `
};

module.exports = fraudDetectionQueries;
