// transaction.service.ts — Сервис для работы с транзакциями
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../entities/transaction.entity';
import { Click } from '../entities/click.entity';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(Click)
    private readonly clickRepo: Repository<Click>,
    @InjectQueue('postback') private postbackQueue: Queue,
    @InjectQueue('webhook') private webhookQueue: Queue,
  ) {}

  /**
   * Создаёт или обновляет транзакцию по click_id
   */
  async createOrUpdateTransaction(
    click_id: string,
    payload: {
      transaction_id?: string;
      merchant_id?: string;
      provider_id?: string;
      amount?: number;
      status?: string;
      metadata?: Record<string, any>;
    },
  ): Promise<Transaction> {
    const transaction_id = payload.transaction_id || click_id;
    let transaction = await this.transactionRepo.findOne({
      where: { click_id },
    });

    if (transaction) {
      // Обновляем существующую
      await this.transactionRepo.update(transaction.id, {
        status: payload.status || transaction.status,
        amount: payload.amount || transaction.amount,
        merchant_id: payload.merchant_id || transaction.merchant_id,
        provider_id: payload.provider_id || transaction.provider_id,
        metadata: { ...transaction.metadata, ...payload.metadata },
        transaction_id: payload.transaction_id || transaction.transaction_id,
        retry_count: 0,
        updated_at: new Date(),
      });
      transaction = await this.transactionRepo.findOne({ where: { click_id } });
    } else {
      // Создаём новую
      transaction = this.transactionRepo.create({
        transaction_id,
        click_id,
        merchant_id: payload.merchant_id,
        provider_id: payload.provider_id,
        amount: payload.amount || 0,
        status: payload.status || 'pending',
        metadata: payload.metadata || {},
      });
      transaction = await this.transactionRepo.save(transaction);
    }

    // Обновляем статус клика
    await this.clickRepo.update(
      { click_id },
      { status: payload.status || 'pending' },
    );

    // Если статус изменился на success — отправляем webhook и postback
    if (payload.status === 'success') {
      // Отправляем входящий postback к провайдеру (если нужно)
      await this.postbackQueue.add('postback', {
        click_id,
        transaction_id,
        status: 'success',
      });

      // Отправляем исходящий webhook к мерчанту
      await this.webhookQueue.add('webhook', {
        click_id,
        transaction_id,
        merchant_id: payload.merchant_id,
        status: 'success',
        amount: payload.amount,
      });
    }

    return transaction as Transaction;
  }

  /**
   * Поиск транзакции по click_id
   */
  async findByClickId(click_id: string): Promise<Transaction> {
    const transaction = await this.transactionRepo.findOne({
      where: { click_id },
      relations: ['merchant', 'provider'],
    });
    if (!transaction) {
      throw new NotFoundException(`Transaction for click_id "${click_id}" not found`);
    }
    return transaction;
  }

  /**
   * Поиск транзакции по transaction_id
   */
  async findByTransactionId(transaction_id: string): Promise<Transaction> {
    const transaction = await this.transactionRepo.findOne({
      where: { transaction_id },
      relations: ['merchant', 'provider'],
    });
    if (!transaction) {
      throw new NotFoundException(`Transaction with id "${transaction_id}" not found`);
    }
    return transaction;
  }

  /**
   * Обновление статуса транзакции по provider_transaction_id
   */
  async updateByProviderTransactionId(
    provider_transaction_id: string,
    status: string,
    metadata?: Record<string, any>,
  ): Promise<Transaction> {
    const transaction = await this.transactionRepo.findOne({
      where: { provider_transaction_id },
    });
    if (!transaction) {
      throw new NotFoundException(`Transaction with provider_transaction_id "${provider_transaction_id}" not found`);
    }

    await this.transactionRepo.update(transaction.id, {
      status,
      metadata: { ...transaction.metadata, ...metadata },
      retry_count: transaction.retry_count + 1,
      updated_at: new Date(),
      processed_at: new Date(),
    });

    // Отправляем webhook к мерчанту
    await this.webhookQueue.add('webhook', {
      click_id: transaction.click_id,
      transaction_id: transaction.transaction_id,
      merchant_id: transaction.merchant_id,
      status,
      amount: transaction.amount,
    });

    const updated = await this.transactionRepo.findOne({ where: { id: transaction.id } });
    return updated as Transaction;
  }
}
