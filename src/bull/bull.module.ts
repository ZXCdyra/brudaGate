// bull.module.ts — BullMQ queues configuration
import { Module, Logger, DynamicModule } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

const logger = new Logger('BullMQModule');

function hasRedisConfig(): boolean {
  const redisUrl = process.env.REDIS_URL;
  const redisHost = process.env.REDIS_HOST;

  // If REDIS_URL is set, use it (but it must not be localhost)
  if (redisUrl) {
    try {
      const url = new URL(redisUrl);
      if (url.hostname !== '127.0.0.1' && url.hostname !== 'localhost') {
        logger.log(`Redis available: ${url.hostname}:${url.port}`);
        return true;
      }
    } catch {
      // Invalid URL
    }
  }

  // Check individual vars
  if (redisHost && redisHost !== '127.0.0.1' && redisHost !== 'localhost') {
    logger.log(`Redis available: ${redisHost}`);
    return true;
  }

  logger.warn('No Redis configured. Queue processing disabled.');
  return false;
}

const redisConfig = hasRedisConfig();

@Module({})
export class BullMQModule {
  static register(): DynamicModule[] {
    if (!redisConfig) {
      return [];
    }

    const redisUrl = process.env.REDIS_URL;

    return [
      BullModule.forRoot({
        connection: redisUrl
          ? {
              host: new URL(redisUrl).hostname,
              port: parseInt(new URL(redisUrl).port, 10) || 6379,
              password: new URL(redisUrl).password || undefined,
            }
          : {
              host: process.env.REDIS_HOST,
              port: Number(process.env.REDIS_PORT || 6379),
              password: process.env.REDIS_PASSWORD || undefined,
            },
      }),
      BullModule.registerQueue({ name: 'webhook' }),
      BullModule.registerQueue({ name: 'postback' }),
      BullModule.registerQueue({ name: 'statistics' }),
    ];
  }
}
