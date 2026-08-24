// webhook.module.ts — Модуль вебхууков
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { WebhookService } from './webhook.service';
import { WebhookController } from './webhook.controller';
import { WebhookProcessor } from './processors/webhook.processor';
import { Merchant } from '../merchant/entities/merchant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Merchant]),
    BullModule.registerQueue({
      name: 'webhook',
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
  ],
  providers: [WebhookService, WebhookProcessor],
  controllers: [WebhookController],
  exports: [WebhookService],
})
export class WebhookModule {}
