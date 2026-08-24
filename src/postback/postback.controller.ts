// postback.controller.ts — Входящие endpoint для postback от провайдеров
import { Controller, Post, Body, Headers, Query, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Controller('postback')
export class PostbackController {
  private readonly logger = new Logger(PostbackController.name);

  constructor(@InjectQueue('postback') private postbackQueue: Queue) {}

  /**
   * Входящий postback от провайдера
   * Пример: POST /postback/provider?provider=p1
   * Тело: { click_id, status, transaction_id, amount }
   */
  @Post('provider')
  async handlePostback(
    @Query('provider') provider: string,
    @Headers('x-api-key') apiKey: string,
    @Body() body: Record<string, any>,
  ) {
    const { click_id, transaction_id, status, provider_transaction_id, amount, metadata } = body;

    this.logger.log(`Received postback from provider ${provider}: click_id=${click_id}, status=${status}`);

    // Валидация обязательных полей
    if (!click_id || !status) {
      return { error: 'click_id and status are required' };
    }

    // Добавляем в очередь для обработки
    await this.postbackQueue.add('postback', {
      click_id,
      transaction_id,
      status,
      provider_transaction_id,
      amount,
      provider,
      metadata,
    });

    return { received: true };
  }

  /**
   * Callback URL для провайдера (удобнее для некоторых)
   */
  @Post('callback')
  async handleCallback(
    @Body() body: Record<string, any>,
    @Query('provider') provider: string,
  ) {
    const { click_id, transaction_id, status, provider_transaction_id, amount, metadata } = body;

    this.logger.log(`Received callback from provider ${provider}: click_id=${click_id}, status=${status}`);

    await this.postbackQueue.add('postback', {
      click_id,
      transaction_id,
      status,
      provider_transaction_id,
      amount,
      provider,
      metadata,
    });

    return { received: true };
  }
}
