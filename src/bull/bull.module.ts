// bull.module.ts — BullMQ queues configuration
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';

@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: config.get('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),
    // Queues
    BullModule.registerQueue({
      name: 'webhook',
    }),
    BullModule.registerQueue({
      name: 'postback',
    }),
    BullModule.registerQueue({
      name: 'statistics',
    }),
  ],
  exports: [
    // Export queues for injection
  ],
})
export class BullMQModule {}
