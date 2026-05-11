require('dotenv').config();

const neo4j = require('neo4j-driver');

/**
 * Neo4j Driver Configuration
 * Credentials loaded from .env:
 * - NEO4J_URI: neo4j+s://7ade6b99.databases.neo4j.io
 * - NEO4J_USERNAME: 7ade6b99
 * - NEO4J_PASSWORD: FZCY7zedpT7mftFjqegWbWq-yLq_44Vu62qMko_LUlw
 * - NEO4J_DATABASE: 7ade6b99 (default Aura instance database)
 */

const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
const user = process.env.NEO4J_USERNAME || 'neo4j';
const password = process.env.NEO4J_PASSWORD || 'password';
const database = process.env.NEO4J_DATABASE || 'neo4j';

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
  maxConnectionPoolSize: 50,
  connectionTimeoutMs: 10000,
  encryptionLevel: 'ENCRYPTION_ON',
});

/**
 * Test Neo4j connection and verify database connectivity
 * Returns true if connection successful, false otherwise
 */
const testConnection = async () => {
  let session;
  try {
    session = driver.session({ database });
    const result = await session.run('RETURN 1 AS test');
    console.log('✓ Neo4j connection successful');
    console.log(`  URI: ${uri}`);
    console.log(`  Database: ${database}`);
    return true;
  } catch (error) {
    console.error('✗ Neo4j connection error:', error.message);
    console.error(`  URI: ${uri}`);
    console.error(`  Database: ${database}`);
    return false;
  } finally {
    if (session) {
      await session.close();
    }
  }
};

/**
 * Execute a Cypher query with the specified database
 * @param {string} query - Cypher query to execute
 * @param {object} params - Query parameters
 * @returns {Promise<object>} Query result
 */
const executeQuery = async (query, params = {}) => {
  let session;
  try {
    session = driver.session({ database });
    const result = await session.run(query, params);
    return result;
  } catch (error) {
    console.error('Query execution error:', error.message);
    throw error;
  } finally {
    if (session) {
      await session.close();
    }
  }
};

module.exports = { driver, testConnection, executeQuery, database };
