import { QueueEvents } from 'bullmq';
import connection from './queueConnection.js';
import pool from '../db/db.js';

const queueEvents = new QueueEvents('inference', { connection });

queueEvents.on('failed', async ({ jobId, failedReason }) => {
  console.error(`DLQ: Job ${jobId} permanently failed: ${failedReason}`);

  try {
    await pool.query(
      `UPDATE jobs 
       SET status = 'failed', error = $1, updated_at = NOW()
       WHERE id = $2`,
      [failedReason, jobId]
    );
    console.log(`DLQ: Job ${jobId} marked as failed in Postgres`);
  } catch (err) {
    console.error(`DLQ: Failed to update Postgres for job ${jobId}:`, err.message);
  }
});

queueEvents.on('completed', async ({ jobId }) => {
  console.log(`DLQ: Job ${jobId} completed successfully`);
});

export default queueEvents;