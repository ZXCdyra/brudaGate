// bull.module.ts — BullMQ queues configuration
import { Module, Logger } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';

const logger = new Logger('BullMQModule');

@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');
        const redisHost = config.get<string>('redis.host');
        const redisPort = config.get<number>('redis.port');

        // Check if Redis is available
        if (!redisUrl && !redisHost) {
          logger.warn('No Redis configured. Queues will be disabled.');
          return {
            connection: undefined,
          };
        }

        // Parse REDIS_URL if available: redis://:password@host:port
        if (redisUrl) {
          try {
            const url = new URL(redisUrl);
            logger.log(`Redis connected via URL: ${url.hostname}:${url.port}`);
            return {
              connection: {
                host: url.hostname,
                port: parseInt(url.port, 10) || 6379,
                password: url.password || undefined,
                maxRetriesPerRequest: null,
              },
            };
          } catch (e) {
            logger.error('Invalid REDIS_URL format', e);
          }
        }

        // Use individual config vars
        logger.log(`Redis connected: ${redisHost}:${redisPort}`);
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
    // Queues
    BullModule.registerQueue({ name: 'webhook' }),
    BullModule.registerQueue({ name: 'postback' }),
    BullModule.registerQueue({ name: 'statistics' }),
  ],
})
export class BullMQModule {}
