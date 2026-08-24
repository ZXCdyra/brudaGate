// configuration.ts — Configuration factory
import { registerAs } from '@nestjs/config';

export default () => ({
  app: {
    port: parseInt(process.env.APP_PORT || '3000', 10),
    name: process.env.APP_NAME || 'brudagate',
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'brudagate',
    password: process.env.DB_PASS || 'brudagate',
    database: process.env.DB_NAME || 'brudagate',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  webhook: {
    retry: {
      attempts: parseInt(process.env.WEBHOOK_RETRY_ATTEMPTS || '5', 10),
      delay: parseInt(process.env.WEBHOOK_RETRY_DELAY || '1000', 10),
    },
  },
});
