// bull.module.ts — BullMQ queues configuration
import { Module, Logger } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';

const logger = new Logger('BullMQModule');

@Module({
  imports: dynamicImports(),
  exports: [],
})
export class BullMQModule {}

export function dynamicImports(): any[] {
  const redisUrl = process.env.REDIS_URL;
  const redisHost = process.env.REDIS_HOST;
  const redisPort = process.env.REDIS_PORT;

  // No Redis available — skip BullMQ entirely
  if (!redisUrl && !redisHost && !redisPort) {
    logger.warn('No Redis configured. Queue processing is disabled.');
    return [];
  }

  // Parse REDIS_URL if available
  if (redisUrl) {
    try {
      const url = new URL(redisUrl);
      logger.log(`Redis connected via URL: ${url.hostname}:${url.port}`);
    } catch (e) {
      logger.error('Invalid REDIS_URL format', e);
    }
  }

  return [
    BullModule.forRootAsync({
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');
        const redisHost = config.get<string>('redis.host');
        const redisPort = config.get<number>('redis.port');

        if (redisUrl) {
          const url = new URL(redisUrl);
          return {
            connection: {
              host: url.hostname,
              port: parseInt(url.port, 10) || 6379,
              password: url.password || undefined,
              maxRetriesPerRequest: null,
            },
          };
        }

        return {
          connection: {
            host: redisHost,
            port: redisPort,
            password: config.get<string>('redis.password') || undefined,
            maxRetriesPerRequest: null,
          },
        };
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue({ name: 'webhook' }),
    BullModule.registerQueue({ name: 'postback' }),
    BullModule.registerQueue({ name: 'statistics' }),
  ];
}
