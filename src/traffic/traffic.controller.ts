// traffic.controller.ts — API для приёма трафика и проверки статуса
import { Controller, Get, Post, Headers, Query, Body, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { RoutingService } from './services/routing.service';
import { TransactionService } from './services/transaction.service';

@Controller()
export class TrafficController {
  constructor(
    private readonly routingService: RoutingService,
    private readonly transactionService: TransactionService,
  ) {}

  /**
   * Приём трафика через редирект
   * Пример: GET /click?api_key=XXX&sub_id=YYY&geo=RU
   */
  @Get('click')
  async handleRedirect(
    @Query('api_key') api_key: string,
    @Query('sub_id') sub_id: string,
    @Query('geo') geo: string,
    @Query('device') device: string,
    @Query('source') source: string,
    @Query('amount') amount: number,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const result = await this.routingService.routeTraffic({
      api_key,
      sub_id,
      geo,
      device: device || this.detectDevice(req),
      source,
      amount,
      ip: req.ip,
      user_agent: req.headers['user-agent'] as string,
      referrer: req.headers.referer,
    });

    // Редирект к провайдеру
    res.redirect(302, result.redirect_url);
  }

  /**
   * Приём трафика через API
   */
  @Post('v1/traffic')
  async handleApiTraffic(
    @Headers('x-api-key') api_key: string,
    @Body() body: Record<string, any>,
  ) {
    return this.routingService.routeTraffic({
      api_key,
      sub_id: body.sub_id,
      geo: body.geo,
      device: body.device,
      source: body.source,
      amount: body.amount,
    });
  }

  /**
   * Проверка статуса сделки по click_id
   */
  @Get('v1/click/:click_id/status')
  async getClickStatus(@Query('click_id') click_id: string) {
    return this.transactionService.findByClickId(click_id);
  }

  /**
   * Проверка статуса сделки по transaction_id
   */
  @Get('v1/transaction/:transaction_id/status')
  async getTransactionStatus(@Query('transaction_id') transaction_id: string) {
    return this.transactionService.findByTransactionId(transaction_id);
  }

  /**
   * Автоопределение устройства
   */
  private detectDevice(req: Request): string {
    const ua = req.headers['user-agent'] || '';
    if (/mobile|android|iphone|ipad/i.test(ua)) {
      return 'mobile';
    }
    if (/tablet|ipad/i.test(ua)) {
      return 'tablet';
    }
    return 'desktop';
  }
}
