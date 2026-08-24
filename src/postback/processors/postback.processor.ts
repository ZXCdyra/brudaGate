// postback.processor.ts — Процессор входящих postback от провайдеров
import { Worker } from 'bullmq';
import { Logger, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { TransactionService } from '../../traffic/services/transaction.service';

@Injectable()
export class PostbackProcessor implements OnModuleInit {
  private readonly logger = new Logger(PostbackProcessor.name);

  constructor(
    @InjectQueue('postback') private postbackQueue: Queue,
    private readonly transactionService: TransactionService,
  ) {}

  async onModuleInit() {
    /**
     * Обработка входящего postback от провайдера
     * Обновляет статус транзакции
     */
    const worker = new Worker(
      'postback',
      async (job) => {
        const { click_id, transaction_id, status, provider_transaction_id, amount, metadata } = job.data;

        try {
          this.logger.log(`Processing postback for click_id: ${click_id}, status: ${status}`);

          const transaction = await this.transactionService.updateByProviderTransactionId(
            provider_transaction_id || transaction_id,
            status,
            metadata,
          );

          this.logger.log(`Transaction ${transaction.transaction_id} updated to status: ${status}`);
          return { success: true, transaction_id: transaction.transaction_id };
        } catch (error) {
          this.logger.error(`Failed to process postback: ${(error as Error).message}`, (error as Error).stack);
          throw error;
        }
      },
    );

    worker.on('error', (err) => {
      this.logger.error('Postback worker error:', err);
    });
  }
}
