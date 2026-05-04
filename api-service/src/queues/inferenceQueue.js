import { Queue } from 'bullmq';
import config from '../config.js';

const connection = {
  host: config.redis.host,
  port: config.redis.port,
};

const inferenceQueue = new Queue('inference', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

export default inferenceQueue;