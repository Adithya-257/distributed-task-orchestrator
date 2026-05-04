import { Worker } from 'bullmq';
import connection from '../queues/queueConnection.js';
import jobProcessor from './jobProcessor.js';
import config from '../config.js';

const worker = new Worker('inference', jobProcessor, {
  connection,
  concurrency: config.worker.concurrency,
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 50 },
});

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed with error: ${err.message}`);
});

worker.on('error', (err) => {
  console.error('Worker error:', err);
});

export default worker;