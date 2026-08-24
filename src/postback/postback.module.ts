// postback.module.ts — Модуль обработки postback
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PostbackController } from './postback.controller';
import { PostbackProcessor } from './processors/postback.processor';
import { TransactionService } from '../traffic/services/transaction.service';
import { TrafficModule } from '../traffic/traffic.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'postback',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    }),
    TrafficModule,
  ],
  controllers: [PostbackController],
  providers: [PostbackProcessor],
  exports: [],
})
export class PostbackModule {}
