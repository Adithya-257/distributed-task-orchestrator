import pool from '../db/db.js';

export const saveResult = async (jobId, result) => {
  await pool.query(
    `UPDATE jobs 
     SET status = 'done', result = $1, updated_at = NOW()
     WHERE id = $2`,
    [JSON.stringify({ output: result }), jobId]
  );
};

export const saveError = async (jobId, error) => {
  await pool.query(
    `UPDATE jobs 
     SET status = 'failed', error = $1, updated_at = NOW()
     WHERE id = $2`,
    [error.message, jobId]
  );
};

export const markProcessing = async (jobId) => {
  await pool.query(
    `UPDATE jobs 
     SET status = 'processing', updated_at = NOW()
     WHERE id = $1`,
    [jobId]
  );
};