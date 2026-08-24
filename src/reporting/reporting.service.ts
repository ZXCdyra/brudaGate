// reporting.service.ts — Сервис отчётов и статистики
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual, Not } from 'typeorm';
import { Transaction } from '../traffic/entities/transaction.entity';
import { Click } from '../traffic/entities/click.entity';

@Injectable()
export class ReportingService {
  private readonly logger = new Logger(ReportingService.name);

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(Click)
    private readonly clickRepo: Repository<Click>,
  ) {}

  /**
   * Статистика по мерчанту
   */
  async merchantStats(
    merchantId: string,
    from: Date,
    to: Date,
    limit: number = 10,
  ) {
    const clicksTotal = await this.clickRepo.count({
      where: {
        merchant_id: merchantId,
        created_at: Between(from, to),
      },
    });

    const transactionsTotal = await this.transactionRepo.count({
      where: {
        merchant_id: merchantId,
        created_at: Between(from, to),
      },
    });

    const transactionsSuccess = await this.transactionRepo.count({
      where: {
        merchant_id: merchantId,
        status: 'success',
        created_at: Between(from, to),
      },
    });

    const totalAmount = await this.transactionRepo
      .createQueryBuilder('tx')
      .where('tx.merchant_id = :merchantId', { merchantId })
      .andWhere('tx.status = :status', { status: 'success' })
      .andWhere('tx.created_at BETWEEN :from AND :to', { from, to })
      .select('SUM(tx.amount)', 'total')
      .getRawOne();

    return {
      merchant_id: merchantId,
      clicks: clicksTotal,
      transactions: {
        total: transactionsTotal,
        success: transactionsSuccess,
        success_rate: transactionsTotal > 0 ? (transactionsSuccess / transactionsTotal) * 100 : 0,
      },
      total_amount: totalAmount?.total || 0,
      period: { from, to },
      limit,
    };
  }

  /**
   * Статистика по провайдеру
   */
  async providerStats(providerId: string, from: Date, to: Date) {
    const clicksTotal = await this.clickRepo.count({
      where: {
        provider_id: providerId,
        created_at: Between(from, to),
      },
    });

    const transactionsSuccess = await this.transactionRepo.count({
      where: {
        provider_id: providerId,
        status: 'success',
        created_at: Between(from, to),
      },
    });

    return {
      provider_id: providerId,
      clicks: clicksTotal,
      conversions: transactionsSuccess,
      conversion_rate: clicksTotal > 0 ? (transactionsSuccess / clicksTotal) * 100 : 0,
      period: { from, to },
    };
  }

  /**
   * Top провайдеры по количеству кликов
   */
  async topProviders(from: Date, to: Date) {
    const stats = await this.clickRepo
      .createQueryBuilder('click')
      .select([
        'click.provider_id',
        'COUNT(*) as clicks',
      ])
      .where('click.created_at BETWEEN :from AND :to', { from, to })
      .groupBy('click.provider_id')
      .orderBy('clicks', 'DESC')
      .limit(10)
      .getRawMany();

    return stats.map((stat) => ({
      provider_id: stat.provider_id,
      clicks: parseInt(stat.clicks, 10),
    }));
  }

  /**
   * Последние транзакции
   */
  async recentTransactions(limit: number = 10): Promise<Transaction[]> {
    return this.transactionRepo.find({
      order: { created_at: 'DESC' },
      take: limit,
      relations: ['merchant', 'provider'],
    });
  }
}
