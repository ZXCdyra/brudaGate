// webhook.module.ts — Модуль вебхууков
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookService } from './webhook.service';
import { WebhookController } from './webhook.controller';
import { WebhookProcessor } from './processors/webhook.processor';
import { Merchant } from '../merchant/entities/merchant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Merchant]),
  ],
  providers: [WebhookService, WebhookProcessor],
  controllers: [WebhookController],
  exports: [WebhookService],
})
export class WebhookModule {}
