/**
 * Shared Database Pool Module
 *
 * Exports a singleton PostgreSQL connection pool that can be imported
 * by multiple API modules (impact-summary.mjs, annotations.mjs, etc.)
 */

import { Pool } from 'pg';

// Database connection pool
const pool = new Pool({
  host: process.env.DB_HOST || '10.0.0.205',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'maltanadirSRV0',
  max: 10, // Maximum pool size
  min: 2, // Minimum pool size
  idleTimeoutMillis: 10000, // Release idle connections after 10 seconds
  connectionTimeoutMillis: 5000, // Connection timeout
  idleInTransactionSessionTimeout: 60000, // Kill idle transactions after 60 seconds
  statement_timeout: 30000, // Kill queries running longer than 30 seconds
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, closing database pool...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, closing database pool...');
  await pool.end();
  process.exit(0);
});

export default pool;
