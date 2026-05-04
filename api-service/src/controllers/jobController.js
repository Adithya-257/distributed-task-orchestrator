import inferenceQueue from '../queues/inferenceQueue.js';
import pool from '../db/db.js';

export const submitJob = async (req, res) => {
  try {
    const { type, payload, priority = 0 } = req.body;

    if (!type || !payload) {
      return res.status(400).json({ error: 'type and payload are required' });
    }

    // Insert job record into Postgres first
    const result = await pool.query(
      `INSERT INTO jobs (type, status, payload, priority)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [type, 'pending', JSON.stringify(payload), priority]
    );

    const jobId = result.rows[0].id;

    // Add job to BullMQ queue
    await inferenceQueue.add(type, { jobId, type, payload }, { priority });

    return res.status(201).json({ jobId, status: 'pending' });
  } catch (err) {
    console.error('submitJob error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getJob = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, type, status, payload, result, error, priority, created_at, updated_at
       FROM jobs WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('getJob error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAllJobs = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, type, status, payload, result, error, priority, created_at, updated_at
       FROM jobs
       ORDER BY created_at DESC
       LIMIT 50`
    );
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('getAllJobs error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `DELETE FROM jobs WHERE id = $1 RETURNING id`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }
    return res.status(200).json({ deleted: true });
  } catch (err) {
    console.error('deleteJob error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};