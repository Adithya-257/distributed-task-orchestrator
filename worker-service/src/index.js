import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env FIRST before any other imports
dotenv.config({ path: join(__dirname, '../.env') });

const { default: worker } = await import('./workers/inferenceWorker.js');
const { default: connection } = await import('./queues/queueConnection.js');
const { default: pool } = await import('./db/db.js');
const { default: queueEvents } = await import('./queues/dlqHandler.js');

console.log('Worker service starting...');

const shutdown = async (signal) => {
  console.log(`${signal} received, shutting down gracefully...`);
  await worker.close();
  await connection.quit();
  await pool.end();
  console.log('Worker shut down cleanly');
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

worker.on('ready', () => {
  console.log('Worker is ready and listening for jobs');
});