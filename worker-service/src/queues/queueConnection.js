import { default as IORedis } from 'ioredis';
import config from '../config.js';

const connection = new IORedis({
  host: config.redis.host,
  port: config.redis.port,
  maxRetriesPerRequest: null,
});

connection.on('connect', () => {
  console.log('Redis connected');
});

connection.on('error', (err) => {
  console.error('Redis connection error:', err);
});

export default connection;