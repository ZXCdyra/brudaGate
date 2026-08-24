// webhook.service.ts — Сервис для настройки вебхууков
import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Merchant } from '../merchant/entities/merchant.entity';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @InjectRepository(Merchant)
    private readonly merchantRepo: Repository<Merchant>,
    @Optional() @InjectQueue('webhook') private webhookQueue?: Queue,
  ) {}

  /**
   * Получить webhook URL для мерчанта
   */
  async getWebhookUrl(merchantId: string): Promise<string> {
    const merchant = await this.merchantRepo.findOne({ where: { id: merchantId } });
    return merchant?.webhook_url || '';
  }

  /**
   * Отправить вебхук к мерчанту (в очередь)
   */
  async queueWebhook(
    merchantId: string,
    payload: Record<string, any>,
  ): Promise<void> {
    if (this.webhookQueue) {
      await this.webhookQueue.add('webhook', {
        merchant_id: merchantId,
        ...payload,
      });
    } else {
      this.logger.warn('Webhook queue not available — skipping queueWebhook');
    }
  }

  /**
   * Обновить webhook URL мерчанта
   */
  async updateWebhookUrl(merchantId: string, url: string): Promise<Merchant> {
    await this.merchantRepo.update(merchantId, { webhook_url: url });
    return this.merchantRepo.findOne({ where: { id: merchantId } });
  }
}
