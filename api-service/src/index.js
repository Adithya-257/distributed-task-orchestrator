import express from 'express';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import config from './config.js';
import pool from './db/db.js';
import jobRoutes from './routes/jobs.js';
import inferenceQueue from './queues/inferenceQueue.js';

const app = express();

// Middleware
app.use(express.json());

// Bull Board setup
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(inferenceQueue)],
  serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());

// Routes
app.use('/jobs', jobRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
const start = async () => {
  try {
    await pool.query('SELECT 1');
    console.log('Postgres connected');

    app.listen(config.port, () => {
      console.log(`API server running on port ${config.port}`);
      console.log(`Bull Board UI: http://localhost:${config.port}/admin/queues`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();