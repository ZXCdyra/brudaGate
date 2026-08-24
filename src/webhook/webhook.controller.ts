// webhook.controller.ts — API для настройки и отправки вебхууков
import { Controller, Post, Get, Param, Body, Headers } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { Merchant } from '../merchant/entities/merchant.entity';

@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  /**
   * Установить webhook URL для мерчанта
   */
  @Post('merchant/:merchantId/url')
  async setWebhookUrl(
    @Param('merchantId') merchantId: string,
    @Body('url') url: string,
  ): Promise<Merchant> {
    return this.webhookService.updateWebhookUrl(merchantId, url);
  }

  /**
   * Получить текущий webhook URL мерчанта
   */
  @Get('merchant/:merchantId/url')
  async getWebhookUrl(@Param('merchantId') merchantId: string): Promise<{ url: string }> {
    const url = await this.webhookService.getWebhookUrl(merchantId);
    return { url };
  }

  /**
   * Входящий webhook от мерчанта для проверки статуса
   */
  @Post('merchant/:merchantId/status')
  async handleMerchantStatus(
    @Param('merchantId') merchantId: string,
    @Headers('x-signature') signature: string,
    @Body() body: Record<string, any>,
  ) {
    // Здесь можно добавить проверку подписи
    return { received: true, body };
  }
}
