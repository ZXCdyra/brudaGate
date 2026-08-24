// configuration.ts — Configuration factory
import { registerAs } from '@nestjs/config';

export default () => {
  // Railway provides DATABASE_URL for PostgreSQL and REDIS_URL for Redis
  const databaseUrl = process.env.DATABASE_URL;

  return {
    app: {
      port: parseInt(process.env.APP_PORT || process.env.PORT || '3000', 10),
      name: process.env.APP_NAME || 'brudagate',
    },
    database: {
      host: databaseUrl ? undefined : (process.env.DB_HOST || process.env.PGHOST || 'localhost'),
      port: databaseUrl
        ? undefined
        : parseInt(process.env.DB_PORT || process.env.PGPORT || '5432', 10),
      username: databaseUrl ? undefined : (process.env.DB_USER || process.env.PGUSER || 'brudagate'),
      password: databaseUrl ? undefined : (process.env.DB_PASS || process.env.PGPASSWORD || 'brudagate'),
      database: databaseUrl ? undefined : (process.env.DB_NAME || process.env.PGDATABASE || 'brudagate'),
      url: databaseUrl || undefined,
    },
    redis: {
      host: process.env.REDIS_HOST || process.env.CACHE_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || process.env.CACHE_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || process.env.CACHE_PASSWORD || undefined,
    },
    webhook: {
      retry: {
        attempts: parseInt(process.env.WEBHOOK_RETRY_ATTEMPTS || '5', 10),
        delay: parseInt(process.env.WEBHOOK_RETRY_DELAY || '1000', 10),
      },
    },
  };
};
