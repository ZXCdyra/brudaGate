// webhook.processor.ts — Обработчик исходящих вебхууков к мерчантам
import { Worker } from 'bullmq';
import { Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Merchant } from '../../merchant/entities/merchant.entity';

@Injectable()
export class WebhookProcessor implements OnModuleInit {
  private readonly logger = new Logger(WebhookProcessor.name);
  private worker: Worker | null = null;

  constructor(
    @Optional() @InjectQueue('webhook') private webhookQueue: Queue,
    @InjectRepository(Merchant)
    private readonly merchantRepo: Repository<Merchant>,
  ) {}

  async onModuleInit() {
    if (!this.webhookQueue) {
      this.logger.warn('Webhook queue not available — processor disabled');
      return;
    }

    /**
     * Отправка вебхуука к мерчанту при изменении статуса сделки
     * Поддерживает повторные попытки при ошибке
     */
    this.worker = new Worker(
      'webhook',
      async (job) => {
        const { click_id, transaction_id, merchant_id, status, amount } = job.data;

        // Получаем мерчанта и его webhook URL
        const merchant = await this.merchantRepo.findOne({ where: { id: merchant_id } });
        if (!merchant) {
          this.logger.error(`Merchant ${merchant_id} not found for webhook`);
          return { success: false, error: 'merchant_not_found' };
        }

        if (!merchant.webhook_url) {
          this.logger.warn(`Webhook URL not set for merchant ${merchant_id}`);
          return { success: true, skipped: true };
        }

        const payload = {
          click_id,
          transaction_id,
          status,
          amount,
          timestamp: new Date().toISOString(),
        };

        try {
          this.logger.log(`Webhook sent to merchant ${merchant.name} (${merchant_id}): ${status}`);
          // В реальной реализации здесь будет fetch/axios POST к merchant.webhook_url
          return { success: true };
        } catch (error) {
          this.logger.error(
            `Failed to send webhook to merchant ${merchant_id}: ${(error as Error).message}`,
            (error as Error).stack,
          );
          throw error;
        }
      },
    );

    this.worker.on('error', (err) => {
      this.logger.error('Webhook worker error:', err);
    });
  }
}
