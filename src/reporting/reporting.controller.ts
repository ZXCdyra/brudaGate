// reporting/reporting.controller.ts — API статистики и отчётов
import { Controller, Get, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { ReportingService } from './reporting.service';
import { Transaction } from '../traffic/entities/transaction.entity';
import { Click } from '../traffic/entities/click.entity';

@Controller('reports')
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  /**
   * Статистика по мерчанту
   * GET /reports/merchant/:merchantId/stats
   */
  @Get('merchant/:merchantId/stats')
  async merchantStats(
    @Query('merchantId') merchantId: string,
    @Query('from', new DefaultValuePipe(new Date(Date.now() - 86400000))) from: Date,
    @Query('to', new DefaultValuePipe(new Date())) to: Date,
    @Query('limit', new DefaultValuePipe(10)) limit: number,
  ) {
    return this.reportingService.merchantStats(merchantId, from, to, limit);
  }

  /**
   * Статистика по провайдеру
   * GET /reports/provider/:providerId/stats
   */
  @Get('provider/:providerId/stats')
  async providerStats(
    @Query('providerId') providerId: string,
    @Query('from', new DefaultValuePipe(new Date(Date.now() - 86400000))) from: Date,
    @Query('to', new DefaultValuePipe(new Date())) to: Date,
  ) {
    return this.reportingService.providerStats(providerId, from, to);
  }

  /**
   * Top провайдеры по количеству кликов/транзакций
   * GET /reports/top-providers
   */
  @Get('top-providers')
  async topProviders(
    @Query('from', new DefaultValuePipe(new Date(Date.now() - 86400000))) from: Date,
    @Query('to', new DefaultValuePipe(new Date())) to: Date,
  ) {
    return this.reportingService.topProviders(from, to);
  }

  /**
   * Последние транзакции
   */
  @Get('transactions')
  async recentTransactions(
    @Query('limit', new DefaultValuePipe(10)) limit: number,
  ): Promise<Transaction[]> {
    return this.reportingService.recentTransactions(limit);
  }
}
