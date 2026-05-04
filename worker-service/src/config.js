const config = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
  },
  postgres: {
    connectionString: process.env.POSTGRES_URL,
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY,
  },
  worker: {
    concurrency: parseInt(process.env.WORKER_CONCURRENCY) || 5,
  },
};

const required = ['POSTGRES_URL', 'GROQ_API_KEY'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export default config;