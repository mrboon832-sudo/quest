require('dotenv').config();

const neo4j = require('neo4j-driver');

const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
const user = process.env.NEO4J_USER || 'neo4j';
const password = process.env.NEO4J_PASSWORD || 'password';

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

const testConnection = async () => {
  try {
    const session = driver.session();
    const result = await session.run('RETURN 1 AS test');
    console.log('Neo4j connection successful');
    await session.close();
    return true;
  } catch (error) {
    console.error('Neo4j connection error:', error.message);
    return false;
  }
};

module.exports = { driver, testConnection };
