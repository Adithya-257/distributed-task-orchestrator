import pg from 'pg';
import config from '../config.js';

const { Pool } = pg;

const pool = new Pool({
  connectionString: config.postgres.connectionString,
});

pool.on('error', (err) => {
  console.error('Unexpected Postgres error:', err);
  process.exit(1);
});

export default pool;